const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
    callback(404, {
        message: "Your requested url not found!"
    })
}

module.exports = handler;