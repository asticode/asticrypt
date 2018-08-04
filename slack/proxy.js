const url = require('url')
const querystring = require('querystring')
const path = require('path')
const consts = require(path.join(__dirname, 'consts.js'))
const ProxyHTTP = require(path.join(__dirname, 'proxy_http.js'))
const ProxyWs = require(path.join(__dirname, 'proxy_ws.js'))
const helpers = require(path.join(__dirname, 'helpers.js'))

function Proxy(crypter, loader, logger, sharer, transformer) {
    this.http = new ProxyHTTP(crypter, loader, logger, transformer)
    this.loader = loader
    this.logger = logger
    this.ws = new ProxyWs(loader, logger, sharer, transformer)
}

let host = function (s) {
    const r = s.address()
    return r.address + ":" + r.port
}

Proxy.prototype.listen = function (callback) {
    let self = this
    this.ws.listen(0, "127.0.0.1", function () {
        const h = host(self.ws)
        self.logger.info("proxy: ws server listening on " + h)
        self.http.setWsHost(h)
        self.http.listen(0, "127.0.0.1", function () {
            self.logger.info("proxy: http server listening on " + host(self.http))
            callback()
        })
    })
}

Proxy.prototype.isProxyRequest = function (u) {
    return u.host === host(this.http) || u.host === host(this.ws)
}

Proxy.prototype.handleWindow = function (window) {
    let self = this
    this.loader.setWindow(window)
    window.webContents.session.webRequest.onBeforeRequest(['*://*./*'], function (details, callback) {
        // TODO Chrome dev tools bug, this is a temporary fix
        if (details.url.indexOf('7accc8730b0f99b5e7c0702ea89d1fa7c17bfe33') !== -1) {
            callback({redirectURL: details.url.replace('7accc8730b0f99b5e7c0702ea89d1fa7c17bfe33', '57c9d07b416b5a2ea23d28247300e4af36329bdc')})
            return
        }

        // Parse url
        const u = url.parse(details.url)

        // Only process http/https/ws/wss request
        if (u.protocol !== "http:" && u.protocol !== "https:" && u.protocol !== "ws:" && u.protocol !== "wss:") {
            callback({cancel: false})
            return
        }

        // This is a proxy request, let it go through
        if (self.isProxyRequest(u)) {
            callback({cancel: false})
            return
        }

        // To make sure Slack's API has not changed and that we are encrypting messages indeed, we need to cancel requests
        // by default and only allow a whitelist of routes
        // TODO Add missing routes
        if (!self.isWhitelisted(u, details.method, [
            consts.routes.allStatic,
            consts.routes.signin,
            consts.routes.signinPost,
            consts.routes.homepagePost,
            consts.routes.checkCookie,
            consts.routes.signout,
            consts.routes.homepage,
            consts.routes.templates,
            consts.routes.messages,
            consts.routes.conversationsView,
            consts.routes.appsActionsList,
            consts.routes.commandsList,
            consts.routes.i18nTranslationsGet,
            consts.routes.emojiList,
            consts.routes.appsList,
            consts.routes.conversationsHistory,
            consts.routes.promoBanner,
            consts.routes.helpIssuesList,
            consts.routes.dndTeamInfo,
            consts.routes.usersCounts,
            consts.routes.slackEdge,
            consts.routes.chatPostMessage,
            consts.routes.filesInfo,
            consts.routes.filesUploadAsync,
            consts.routes.filesUploadAsyncOptions,
            consts.routes.filesUploadStatus,
            consts.routes.apiTest,
            consts.routes.subscriptionsThreadGet,
            consts.routes.subscriptionsThreadGetView,
            consts.routes.filesList,
        ])) {
            self.logger.info("proxy: cancelling " + details.method + " request to " + details.url)
            callback({cancel: true})
            return
        }

        // Since redirecting websocket requests is not possible, we need to get a little bit more hacky and modify
        // the function that creates the socket so that we can make it point to our own ws proxy instead.
        // This is obviously not ideal but it will have to do for now
        // To find the function, we look for "mpmulti-" which is the prefix of slack's ws host, and we look for the
        // function using it which is in modern.vendor.a36cf1b7c53e7cd162fe.min.js

        // Only process certain routes
        if (!self.isWhitelisted(u, details.method, [
                consts.routes.vendorJS,
                consts.routes.chatPostMessage,
                consts.routes.conversationsHistory,
                consts.routes.conversationsView,
                consts.routes.filesInfo,
                consts.routes.filesUploadAsync,
                consts.routes.filesUploadStatus,
                consts.routes.filesList,
        ])) {
            callback({cancel: false})
            return
        }

        // Redirect request
        callback({
            cancel: false,
            redirectURL: "http://" + host(self.http) + "?" + querystring.stringify({
                url: details.url
            }),
        })
    })
}

Proxy.prototype.isWhitelisted = function(url, method, whitelist) {
    for (let idx = 0; idx < whitelist.length; idx++) {
        if (!helpers.isRoute(whitelist[idx], url, method)) continue
        return true
    }
    return false
}

module.exports = Proxy