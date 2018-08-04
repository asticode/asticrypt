function Transformer(crypter) {
    this.crypter = crypter
}

Transformer.prototype.transformMessage = function(msg, channel) {
    if (msg.text) msg.text = this.crypter.decrypt(msg.text, channel)
    if (msg.files) {
        for (let idxFile = 0; idxFile < msg.files.length; idxFile++) {
            msg.files[idxFile] = this.transformFile(msg.files[idxFile], channel)
        }
    }
    return msg
}

Transformer.prototype.transformFileInfo = function(msg, channel) {
    if (msg.file) msg.file = this.transformFile(msg.file, channel)
    return msg
}

Transformer.prototype.transformFile = function(msg, channel) {
    msg.name = this.crypter.decrypt(msg.name, channel)
    msg.title = this.crypter.decrypt(msg.title, channel)
    return msg
}

module.exports = Transformer