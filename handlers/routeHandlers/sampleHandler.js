const handler = {};

handler.sampleHandler = (requestProperties, callback) => {
    console.log("request property :", requestProperties);
    callback(200, {
        message: "This is a sample url"
    })
}

module.exports = handler;