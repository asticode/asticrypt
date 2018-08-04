const consts = {
    default: "default"
}

function Storage(sharer) {
    this.channels = []
    this.domain = consts.default
    this.sharer = sharer
    this.userID = consts.default
}

let init = function(s) {
    // Get list of channels
    const cs = s.getChannels()
    if (!cs) return
    s.channels = cs

    // Loop through channels
    for (let idx = 0; idx < cs.length; idx++) {
        const c = s.getChannel(cs[idx])
        if (!c) continue
        s.sharer.setChannel(cs[idx], c)
    }

    // Let everybody know it's initialized
    s.initialized = true
}

Storage.prototype.setDomain = function(domain) {
    this.domain = domain
    if (!this.initialized && this.userID !== consts.default) {
        init(this)
    }
}

Storage.prototype.setUserID = function(userID) {
    this.userID = userID
    if (!this.initialized && this.domain !== consts.default) {
        init(this)
    }
}

Storage.prototype.disableChannel = function(id) {
    localStorage.removeItem(this.keyChannel(id))
    this.sharer.removeChannel(id)
    for (let idx = 0; idx < this.channels.length; idx++) {
        if (this.channels[idx] === id) {
            this.channels.splice(idx, 1)
            idx--
        }
    }
    this.setChannels()
}

Storage.prototype.enableChannel = function(id, key) {
    const c = {key: key}
    localStorage.setItem(this.keyChannel(id), JSON.stringify(c))
    this.sharer.setChannel(id, c)
    this.channels.push(id)
    this.setChannels()
}

Storage.prototype.setChannels = function() {
    localStorage.setItem(this.keyChannels(), JSON.stringify(this.channels))
}

Storage.prototype.getChannels = function() {
    const i = localStorage.getItem(this.keyChannels())
    if (!i) return
    return JSON.parse(i)
}

Storage.prototype.getChannel = function(id) {
    const i = localStorage.getItem(this.keyChannel(id))
    if (!i) return false
    return JSON.parse(i)
}

Storage.prototype.keyChannel = function(id) {
    return this.keyChannels() + "." + id
}

Storage.prototype.keyChannels = function() {
    return "astislack.users." + this.userID + ".channels." + this.domain
}

module.exports = Storage