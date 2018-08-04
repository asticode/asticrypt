const http = require('http')
const formidable = require('formidable')
const request = require('request')
const url = require('url')
const path = require('path')
const consts = require(path.join(__dirname, 'consts.js'))
const helpers = require(path.join(__dirname, 'helpers.js'))
const fs = require('fs')

function ProxyHTTP(crypter, loader, logger, transformer) {
    const self = this
    this.crypter = crypter
    this.s = http.createServer(function (req, resp) {
        // Handle OPTIONS requests
        if (handleOptionsRequests(req, resp)) return

        // Parse form
        let form = new formidable.IncomingForm()
        form.parse(req, function(err, fields, files) {
            // Check error
            if (err) {
                self.logger.error("proxy http: parsing form failed: ", err)
                return
            }

            // Parse form
            self.parseForm(req, resp, fields, files)
        })
    })
    this.loader = loader
    this.logger = logger
    this.transformer = transformer
}

let handleOptionsRequests = function(req, resp) {
    if (req.method !== "OPTIONS") return false
    let h = {"Access-Control-Allow-Origin": "*"}
    if (req.headers["access-control-request-headers"]) h["Access-Control-Allow-Headers"] = req.headers["access-control-request-headers"]
    if (req.headers["access-control-request-method"]) h["Access-Control-Allow-Method"] = req.headers["access-control-request-method"]
    resp.writeHead(200, h)
    resp.end()
    return true
}

ProxyHTTP.prototype.parseForm = function(clientReq, clientResp, fields, files) {
    // Parse url
    const self = this
    const u = url.parse(url.parse(clientReq.url, true).query.url)
    
    // Create form data
    let formData = fields

    // Encrypt file
    formData = this.encryptFile(formData, u, clientReq, files)

    // Encrypt message
    formData = this.encryptMessage(formData, u, clientReq)

    // Update headers
    clientReq.headers["host"] = u.host
    delete clientReq.headers["accept-encoding"]
    delete clientReq.headers["content-length"]

    // Send request
    request({
        headers: clientReq.headers,
        method: clientReq.method,
        url: u.href,
        formData: formData,
    }, function(err, resp) {
        // Check error
        if (err) {
            self.logger.error("proxy http: sending " + clientReq.method + " request to " + u.href + " failed: ", err)
            return
        }

        // Handle response
        self.handleResponse(u, clientReq, resp, clientResp, fields)
    })
}

ProxyHTTP.prototype.encryptFile = function(formData, u, clientReq, files) {
    if (!helpers.isRoute(consts.routes.filesUploadAsync, u, clientReq.method)) return formData
    if (!formData.channels) {
        this.logger.error("proxy http: no formData.channels when encrypting file")
        return formData
    }
    if (formData.filename) formData.filename = this.crypter.encrypt(formData.filename, formData.channels)
    if (formData.initial_comment) formData.initial_comment = this.crypter.encrypt(formData.initial_comment, formData.channels)
    if (formData.title) formData.title = this.crypter.encrypt(formData.title, formData.channels)
    if (files.file) formData.file = fs.createReadStream(files.file.path)
    return formData
}

ProxyHTTP.prototype.encryptMessage = function(formData, u, clientReq) {
    if (!helpers.isRoute(consts.routes.chatPostMessage, u, clientReq.method)) return formData
    if (!formData.channel) {
        this.logger.error("proxy http: no formData.channel when encrypting message")
        return formData
    }
    if (formData.text) formData.text = this.crypter.encrypt(formData.text, formData.channel)
    return formData
}

ProxyHTTP.prototype.handleResponse = function(u, clientReq, resp, clientResp, fields) {
    let body = resp.body
    if (helpers.isRoute(consts.routes.chatPostMessage, u, clientReq.method)) body = this.handleChatPostMessage(body, fields)
    else if (helpers.isRoute(consts.routes.conversationsHistory, u, clientReq.method)) body = this.handleConversationsHistory(body, fields)
    else if (helpers.isRoute(consts.routes.conversationsView, u, clientReq.method)) body = this.handleConversationsView(body)
    else if (helpers.isRoute(consts.routes.filesInfo, u, clientReq.method) || helpers.isRoute(consts.routes.filesUploadStatus, u, clientReq.method)) body = this.handleFileInfo(body)
    else if (helpers.isRoute(consts.routes.filesList, u, clientReq.method)) body = this.handleFilesList(body)
    else if (helpers.isRoute(consts.routes.vendorJS, u, clientReq.method)) {
        body = this.handleVendorJS(body)
        resp.headers["content-length"] = body.length
    }

    // Write response
    clientResp.writeHead(resp.statusCode, resp.headers)
    clientResp.write(body)
    clientResp.end()
}

ProxyHTTP.prototype.handleChatPostMessage = function(body, fields) {
    let d = JSON.parse(body)
    if (d.ok && d.message && d.message.text) {
        d.message.text = fields.text
    }
    return JSON.stringify(d)
}

ProxyHTTP.prototype.handleConversationsHistory = function(body, fields) {
    if (!fields.channel) {
        this.logger.error("proxy http: no fields.channel when handling conversations history")
        return body
    }
    let d = JSON.parse(body)
    if (d.ok && d.messages) {
        for (let idx = 0; idx < d.messages.length; idx++) {
            d.messages[idx] = this.transformer.transformMessage(d.messages[idx], fields.channel)
        }
    }
    return JSON.stringify(d)
}

ProxyHTTP.prototype.handleConversationsView = function(body) {
    let d = JSON.parse(body)
    if (d.ok && d.history && d.history.ok && d.history.messages) {
        // We need to empty this property since this call is made before the sharer has been initialized with all values
        // A call to conversations history will be made afterwards that will contain the proper values anyway
        d.history.messages = []
    }
    return JSON.stringify(d)
}

ProxyHTTP.prototype.handleFileInfo = function(body) {
    let d = JSON.parse(body)
    if (d.ok && d.file && d.file.ims && d.file.ims.length > 0) {
        d = this.transformer.transformFileInfo(d, d.file.ims[0])
    }
    return JSON.stringify(d)
}

ProxyHTTP.prototype.handleFilesList = function(body) {
    let d = JSON.parse(body)
    if (d.ok && d.files) {
        for (let idx = 0; idx < d.files.length; idx++) {
            if (!d.files[idx].ims || d.files[idx].ims.length === 0) continue
            d.files[idx] = this.transformer.transformFile(d.files[idx], d.files[idx].ims[0])
        }
    }
    return JSON.stringify(d)
}

ProxyHTTP.prototype.handleVendorJS = function(body) {
    const p1 = '{key:"_createSlackSocketWithUrl",value:function e(t){'
    const r1 = new RegExp(RegExp.escape(p1))
    let idx = body.search(r1)
    if (idx < 0) {
        this.logger.error("proxy http: vendor js _createSlackSocketWithUrl function not found")
        return body
    } else {
        idx += p1.length
        body = body.slice(0, idx) + 'astislack.sharer.setWsURL(t);t="ws://'+ this.wsHost + '";' + body.slice(idx)
        const p2 = ',"isValidSlackWebSocketUrl",function(){'
        const r2 = new RegExp(RegExp.escape(p2))
        idx = body.search(r2)
        if (idx < 0) {
            this.logger.error("proxy http: vendor js isValidSlackWebSocketUrl function not found")
            return body
        } else {
            idx += p2.length
            body = body.slice(0, idx) + "return Object(function(){ return true });" + body.slice(idx)
        }
    }
    return body
}

RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

ProxyHTTP.prototype.setWsHost = function(host) {
    this.wsHost = host
}

ProxyHTTP.prototype.listen = function(port, host, callback) {
    this.s.listen(port, host, callback)
}

ProxyHTTP.prototype.address = function() {
    return this.s.address()
}

module.exports = ProxyHTTP