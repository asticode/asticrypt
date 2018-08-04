const {remote} = require('electron')
const path = require('path')
const consts = {
    headerStatuses: {
        enabled: "enabled",
        loading: "loading",
        notEnabled: "not.enabled",
    },
}
const Crypter = require(path.join(__dirname, 'crypter.js'))
const Loader = require(path.join(__dirname, 'loader.js'))
const Logger = require(path.join(__dirname, 'logger.js'))
const Sharer = require(path.join(__dirname, 'sharer.js'))
const Storage = require(path.join(__dirname, 'storage.js'))

const logger = new Logger()
const crypter = new Crypter(logger)
const loader = new Loader(logger, "remote")
const sharer = new Sharer(logger)
const storage = new Storage(sharer)

// astislack must be reachable by vendor scripts
window.astislack = {
    crypter: crypter,
    loader: loader,
    logger: logger,
    sharer: sharer,
    storage: storage,

    start: function() {
        document.addEventListener('DOMContentLoaded', function () {
            try {
                // TS is undefined
                if (!TS) throw "TS is undefined"

                // Update client UI on start callback
                const cc = TS.client.ui.onStart
                TS.client.ui.onStart = function() {
                    // Move client UI
                    astislack.moveClientUI()

                    // Add header
                    astislack.addHeader()

                    // Proxy model
                    astislack.proxyModel()

                    // Default callback
                    cc()
                }
            } catch(e) {
                astislack.logger.error("preload: " + e)
            }
        })
    },

    moveClientUI: function() {
        // Get client ui element
        const n = document.getElementById("client-ui")

        // Element not found
        if (!n) throw "client-ui not found"
        astislack.logger.info("preload: moving client-ui")

        // Create wrapper
        const w = document.createElement('div')
        w.style.height = "90%"
        w.style.width = "100%"
        document.body.insertBefore(w, document.body.childNodes[0])

        // Move element
        w.appendChild(n)
    },

    addHeader: function() {
        // Create table
        astislack.header = document.createElement('div')
        astislack.header.style.display = "table"
        astislack.header.style.height = "10%"
        astislack.header.style.textAlign = "center"
        astislack.header.style.width = "100%"

        // Create row
        const hr = document.createElement('div')
        hr.style.display = "table-row"
        hr.style.height = "100%"
        hr.style.width = "100%"
        astislack.header.appendChild(hr)

        // Create cell
        astislack.headerCell = document.createElement('div')
        astislack.headerCell.style.display = "table-cell"
        astislack.headerCell.style.height = "100%"
        astislack.headerCell.style.verticalAlign = "middle"
        astislack.headerCell.style.width = "100%"

        // Update header to the loading status
        astislack.updateHeader(consts.headerStatuses.loading)

        // Append cell
        hr.appendChild(astislack.headerCell)

        // Insert header
        document.body.insertBefore(astislack.header, document.body.childNodes[0])
    },

    updateHeader: function(status, val) {
        switch (status) {
            case consts.headerStatuses.enabled:
                // Update colors
                astislack.header.style.backgroundColor = "#dff0d8"
                astislack.header.style.borderBottom = "solid 1px #b2dba1"
                astislack.header.style.color = "#3c763d"

                // Add input
                astislack.addInputToHeader("Astislack is enabled on this channel", "Disable", "#d9534f", "#b92c28", function(b, i) {
                    i.style.display = "none"
                    b.addEventListener("click", function() {
                        astislack.storage.disableChannel(val.id)
                        remote.getCurrentWindow().reload()
                    })
                })
                break
            case consts.headerStatuses.loading:
                // Update colors
                astislack.header.style.backgroundColor = "#f0ad4e"
                astislack.header.style.borderBottom = "solid 1px #eea236"
                astislack.header.style.color = "#fff"
                astislack.headerCell.innerHTML = "Loading Astislack..."
                break
            case consts.headerStatuses.notEnabled:
                // Update colors
                astislack.header.style.backgroundColor = "#f2dede"
                astislack.header.style.borderBottom = "solid 1px #dca7a7"
                astislack.header.style.color = "#a94442"

                // Add input
                astislack.addInputToHeader("Astislack is disabled on this channel", "Enable", "#5cb85c", "#4cae4c", function(b, i) {
                    i.style.display = "inline"
                    i.onkeydown = function(e) { if (e.keyCode === 13) b.click() }
                    b.addEventListener("click", function() {
                        if (i.value === "") return
                        astislack.crypter.hash(i.value, function(key) {
                            astislack.storage.enableChannel(val.id, key)
                            remote.getCurrentWindow().reload()
                        })
                    })
                })
                break
        }
    },

    addInputToHeader: function(title, buttonLabel, buttonBackgroundColor, buttonBorderColor, callback) {
        // Reset
        astislack.headerCell.innerHTML = ""

        // Create title
        const t = document.createElement("div")
        t.innerText = title
        t.style.marginBottom = "0.35rem"
        astislack.headerCell.appendChild(t)

        // Create wrapper
        const w = document.createElement("div")
        astislack.headerCell.appendChild(w)

        // Create input
        const i = document.createElement("input")
        i.placeholder = "Key"
        i.style.display = "inline"
        i.style.fontSize = "1rem"
        i.style.marginBottom = "0"
        i.style.marginRight = "0.25rem"
        i.style.padding = "0.25rem"
        i.style.width = "50%"
        i.type = "text"
        w.appendChild(i)

        // Create button
        const b = document.createElement("button")
        b.innerText = buttonLabel
        b.style.display = "inline"
        b.style.backgroundColor = buttonBackgroundColor
        b.style.border = "solid 1px " + buttonBorderColor
        b.style.borderRadius = "4px"
        b.style.color = "#fff"
        w.appendChild(b)

        // Execute callback
        callback(b, i)
    },

    proxyModel: function() {
        // Update storage
        if (TS.model) {
            if (TS.model.last_team_domain) astislack.storage.setDomain(TS.model.last_team_domain)
            if (TS.model.user && TS.model.user.id) astislack.storage.setUserID(TS.model.user.id)
        }

        // Proxy model
        TS.model = new Proxy(TS.model, {
            set: function(obj, prop, value) {
                obj[prop] = value
                switch (prop) {
                    case "active_cid":
                        // Store information
                        astislack.logger.info("preload: channel id has changed to " + value)
                        astislack.activeChannelID = value

                        // Update channel
                        astislack.onChannelUpdate()
                        break
                    case "last_team_domain":
                        // Update storage
                        astislack.storage.setDomain(value)
                        break
                    case "user":
                        // Update storage
                        if (value.id) astislack.storage.setUserID(value.id)
                        break
                }
                return true
            }
        })
    },

    onChannelUpdate: function() {
        // Astislack is not loaded yet
        if (!astislack.loader.isLoaded()) return

        // Retrieve information
        const id = astislack.activeChannelID
        const c = astislack.storage.getChannel(id)

        // Update
        if (!c) {
            astislack.updateHeader(consts.headerStatuses.notEnabled, {id: id})
        } else {
            astislack.updateHeader(consts.headerStatuses.enabled, {id: id, channel: c})
        }
    },
}

astislack.start()