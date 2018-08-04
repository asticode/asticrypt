const {ipcRenderer} = require('electron')
const path = require('path')
const consts = require(path.join(__dirname, 'consts.js'))
const localConsts = {
    events: {
        http: "astislack.loader.events.http",
        ws: "astislack.loader.events.ws",
    },
    messages: {
        http: "astislack.loader.messages.http",
    },
}

function Loader(logger, type) {
    let self = this
    this.logger = logger
    if (type === "remote") {
        ipcRenderer.on(localConsts.events.ws, function() {
            self.wsConnected = true
        })
    }
}

Loader.prototype.setWindow = function(window) {
    this.window = window
}

Loader.prototype.handleWsConnection = function() {
    this.logger.info("loader: handling ws connection")
    this.window.webContents.send(localConsts.events.ws)
}

Loader.prototype.isLoaded = function() {
    return this.wsConnected
}

module.exports = Loader