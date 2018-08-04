const http = require('http')
const url = require('url')
const WebSocket = require('ws')

function ProxyWs(loader, logger, sharer, transformer) {
    let self = this
    this.hs = new http.createServer()
    this.loader = loader
    this.logger = logger
    this.s = new WebSocket.Server({
        server: this.hs,
    })
    this.s.on('connection', function (client, req) {
        // Let the loader know ws is connected
        let clientClosed = false
        self.loader.handleWsConnection()

        // Parse url
        const u = url.parse(self.sharer.getWsURL())

        // Create remote url
        const ru = u.protocol + "//" + u.host + req.url

        // Create remote headers
        let h = {}, ks = Object.keys(req.headers)
        for (let idx = 0; idx < ks.length; idx++) {
            h[ks[idx].sanitizeHeaderKey()] = req.headers[ks[idx]]
        }
        h["Host"] = u.host
        delete h["Sec-WebSocket-Version"]
        delete h["Sec-WebSocket-Key"]

        // Create remote client
        let remoteClosed = false
        const remote = new WebSocket(ru, null, {headers: h})

        // Handle remote open
        remote.on('open', function() {
            self.logger.info("proxy ws: remote open: " + ru)
        })

        // Handle remote close
        remote.on('close', function() {
            remoteClosed = true
            client.close(1000, "Normal closure")
            self.logger.info("proxy ws: remote close")
        })

        // Handle remote error
        remote.on('error', function(err) {
            self.logger.info("proxy ws: remote error: " + err)
        })

        // Handle remote message
        remote.on('message', function(message) {
            if (clientClosed) return
            let b = message, d = JSON.parse(message)
            if (d.type && d.type === "message" && d.channel) {
                d = self.transformer.transformMessage(d, d.channel)
                b = JSON.stringify(d)
            }
            client.send(b, function(err) {
                if (typeof err !== "undefined") self.logger.info("proxy ws: sending message to client failed: " + err)
            })
        })

        // Handle client message
        client.on("message", function(message) {
            if (remoteClosed) return
            remote.send(message, function(err) {
                if (typeof err !== "undefined") self.logger.info("proxy ws: sending message to remote failed: " + err)
            })
        })

        // Handle client close
        client.on("close", function() {
            clientClosed = true
            remote.close(1000, "Normal closure")
            self.logger.info("proxy ws: client close")
        })

        // Handle client error
        client.on('error', function(err) {
            self.logger.info("proxy ws: client error: " + err)
        })
    })
    this.sharer = sharer
    this.transformer = transformer
}

String.prototype.sanitizeHeaderKey = function() {
    return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
        return letter.toUpperCase();
    }).replace(/\s+/g, '').replace('Websocket', 'WebSocket');
}

ProxyWs.prototype.listen = function(port, host, callback) {
    this.hs.listen(port, host, callback)
}

ProxyWs.prototype.address = function() {
    return this.hs.address()
}

module.exports = ProxyWs