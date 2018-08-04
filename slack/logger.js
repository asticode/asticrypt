const {ipcMain, ipcRenderer} = require('electron')
const consts = {
    events: {
        new: "astislack.logger.new",
    },
    maxEntries: 1000,
    severities: {
        debug: 0,
        info: 1,
        warning: 2,
        error: 3,
    }
}

function Logger(type) {
    const self = this
    this.startAt = new Date()
    this.type = type
    if (type === "main") {
        this.entries = []
        ipcMain.on(consts.events.new, function(event, arg) {
            self.log(arg.severity, arg.msg)
        })
        this.info("logger initialized at " + this.startAt)
    }
}

Logger.prototype.debug = function(msg) {
    this.log("debug", msg)
}

Logger.prototype.info = function(msg) {
    this.log("info", msg)
}

Logger.prototype.warning = function(msg) {
    this.log("warning", msg)
}

Logger.prototype.error = function(msg) {
    this.log("error", msg)
}

Logger.prototype.log = function(severity, msg) {
    // Create item
    const i = {
        date: new Date(),
        msg: msg,
        severity: severity,
    }

    // Process item
    if (this.type === "main") {
        console.info("astislack[" + ((i.date.getTime() - this.startAt.getTime()) / 1000).toFixed(3) + "][" + i.severity + "]: " + i.msg)
        this.entries.push(i)
        if (this.entries.length > consts.maxEntries) {
            this.entries.shift()
        }
    } else {
        ipcRenderer.send(consts.events.new, i)
    }
}

module.exports = Logger