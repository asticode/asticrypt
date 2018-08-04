const {ipcMain, ipcRenderer} = require('electron')
const consts = {
    events: {
        channelRemove: "astislack.sharer.channel.remove",
        channelSet: "astislack.sharer.channel.set",
        wsURLSet: "astislack.sharer.ws.url.set",
    }
}

function Sharer(logger, type) {
    const self = this
    this.channels = {}
    this.logger = logger
    if (type === "main") {
        ipcMain.on(consts.events.channelRemove, function(event, arg) {
            self.logger.info("sharer: removing channel " + arg.id)
            delete self.channels[arg.id]
        })
        ipcMain.on(consts.events.channelSet, function(event, arg) {
            self.logger.info("sharer: setting channel " + arg.id)
            self.channels[arg.id] = arg.c
        })
        ipcMain.on(consts.events.wsURLSet, function(event, arg) {
            self.logger.info("sharer: setting ws url")
            self.wsURL = arg.url
        })
    }
}

Sharer.prototype.getChannel = function(id) {
    return this.channels[id]
}

Sharer.prototype.removeChannel = function(id) {
    ipcRenderer.send(consts.events.channelRemove, {
        id: id,
    })
}

Sharer.prototype.setChannel = function(id, c) {
    ipcRenderer.send(consts.events.channelSet, {
        c: c,
        id: id,
    })
}

Sharer.prototype.getWsURL = function() {
    return this.wsURL
}

Sharer.prototype.setWsURL = function(url) {
    ipcRenderer.send(consts.events.wsURLSet, {
        url: url,
    })
}

module.exports = Sharer