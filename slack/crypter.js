const scryptjs = require('scrypt-js')
const crypto = require('crypto')
const decodeHTML = require('decode-html')
const consts = {
    algorithm: 'aes-256-ctr',
    boundaries: {
        end: " ))}}]]>>",
        start: "<<[[{{(( ",
    }
}

function Crypter(logger, sharer) {
    this.logger = logger
    this.sharer = sharer
}

Crypter.prototype.hash = function(pwd, callback) {
    const self = this
    scryptjs(Buffer.from(pwd), Buffer.from(""), 1024, 8, 1, 32, function(err, progress, key) {
        if (err) {
            self.logger.error("crypter: hashing key failed: " + err)
        } else if (key) {
            callback(key)
        }
    })
}

Crypter.prototype.encrypt = function(msg, channelID) {
    // Get channel
    const c = this.sharer.getChannel(channelID)
    if (!c) return msg

    // Create cipher
    const cipher = crypto.createCipher(consts.algorithm, Buffer.from(c.key))

    // Encrypt
    let r = cipher.update(msg,'utf8','hex')
    r += cipher.final('hex')
    return consts.boundaries.start + r + consts.boundaries.end
}

Crypter.prototype.decrypt = function(msg, channelID) {
    // Decode HTML
    msg = decodeHTML(msg)

    // Check boundaries
    if (msg.substr(0, consts.boundaries.start.length) !== consts.boundaries.start ||
        msg.slice(-consts.boundaries.end.length) !== consts.boundaries.end) return msg

    // Get channel
    const c = this.sharer.getChannel(channelID)
    if (!c) return msg

    // Remove boundaries
    msg = msg.substr(consts.boundaries.start.length, msg.length - consts.boundaries.start.length - consts.boundaries.end.length)

    // Create decipher
    const decipher = crypto.createDecipher(consts.algorithm, Buffer.from(c.key))

    // Decrypt
    let r = decipher.update(msg,'hex','utf8')
    r += decipher.final('utf8');
    return r
}

module.exports = Crypter