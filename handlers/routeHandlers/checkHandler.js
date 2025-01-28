//dependencies
const data = require('../../lib/data');
const { parseJSON, createRandomString } = require('../../helpers/utilities');
const tokenHandler = require("./tokenHandler");
const { maxChecks } = require('../../helpers/environments');

//module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];

    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
}

handler._check = {};

handler._check.post = (requestProperties, callback) => {
    //validate inputs
    let protocol = typeof (requestProperties.body.protocol) === "string" && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;

    let url = typeof (requestProperties.body.url) === "string" && requestProperties.body.url.trim().length > 0 ?
        requestProperties.body.url : false;

    let method = typeof (requestProperties.body.method) === "string" &&
        ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
        ? requestProperties.body.method : false;
    let successCodes = typeof (requestProperties.body.successCodes) === "object" && requestProperties.body.successCodes instanceof Array ? requestProperties.body.successCodes : false;

    let timeoutSeconds = typeof (requestProperties.body.timeoutSeconds) === "number" && requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 && requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.successCodes : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        //verify token
        const token = typeof requestProperties.headersObject.token === "string" ? requestProperties.headersObject.token : false;

        //lookup the user phone by reading the token
        data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                let userPhone = parseJSON(tokenData).phone;

                //lookup the user data
                data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        tokenHandler._token.verify(token, userPhone, (isTokenValid) => {
                            if (isTokenValid) {
                                let userObject = parseJSON(userData);
                                let userChecks = typeof (userObject.checks) === 'object' && userObject.checks instanceof Array ?
                                    userObject.checks : [];

                                if (userChecks.length < maxChecks) {
                                    const checkId = createRandomString(20);
                                    const checkObject = {
                                        id: checkId,
                                        phone: userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds
                                    }

                                    //save the object
                                    data.create('checks', checkId, checkObject, (err) => {
                                        if (!err) {
                                            //add check id to the user's object
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);

                                            //save the new user data
                                            data.update('users', userPhone, userObject, (err) => {
                                                if (!err) {
                                                    //return the data about the new check
                                                    callback(200, checkObject);
                                                } else {
                                                    callback(500, {
                                                        error: "There was a problem in server side!"
                                                    })
                                                }
                                            })
                                        } else {
                                            callback(500, {
                                                error: "There was a problem in server side!"
                                            })
                                        }
                                    })
                                } else {
                                    callback(401, {
                                        error: 'User has already reached max check limit!'
                                    });
                                }
                            }
                        })
                    } else {
                        callback(403, {
                            error: 'User not found!'
                        });
                    }
                })
            } else {
                callback(403, {
                    error: 'Authenticaton failed!'
                });
            }
        })
    } else {
        callback(400, {
            error: "You have a problem in your request!"
        });
    }
}

handler._check.get = (requestProperties, callback) => {
    //check the id if valid
    const id = typeof requestProperties.queryStringObject.id === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ?
        requestProperties.queryStringObject.id : false;

    if (id) {
        //lookup the token
        data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                //verify token
                const token = typeof requestProperties.headersObject.token === "string" ? requestProperties.headersObject.token : false;

                tokenHandler._token.verify(token, parseJSON(checkData).phone, (isTokenValid) => {
                    if (isTokenValid) {
                        callback(200, checkData);
                    } else {
                        callback(403, {
                            error: 'Authentication failed!'
                        });
                    }
                })
            } else {
                callback(404, {
                    error: 'Requested token was not found!'
                });
            }
        })
    } else {
        callback(404, {
            error: 'Requested check was not found!'
        });
    }
}

handler._check.put = (requestProperties, callback) => {
    //check the id if valid
    const id = typeof requestProperties.body.id === 'string' && requestProperties.body.id.trim().length === 20 ?
        requestProperties.body.id : false;

    //validate inputs
    let protocol = typeof (requestProperties.body.protocol) === "string" && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;

    let url = typeof (requestProperties.body.url) === "string" && requestProperties.body.url.trim().length > 0 ?
        requestProperties.body.url : false;

    let method = typeof (requestProperties.body.method) === "string" &&
        ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
        ? requestProperties.body.method : false;
    let successCodes = typeof (requestProperties.body.successCodes) === "object" && requestProperties.body.successCodes instanceof Array ? requestProperties.body.successCodes : false;

    let timeoutSeconds = typeof (requestProperties.body.timeoutSeconds) === "number" && requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 && requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.successCodes : false;

    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    const checkObject = parseJSON(checkData);
                    //verify token
                    const token = typeof requestProperties.headersObject.token === "string" ? requestProperties.headersObject.token : false;

                    tokenHandler._token.verify(token, checkObject.phone, (isTokenValid) => {
                        console.log(checkData);

                        if (isTokenValid) {
                            if (protocol) {
                                checkObject.protocol = protocol;
                            }
                            if (url) {
                                checkObject.url = url;
                            }
                            if (method) {
                                checkObject.method = method;
                            }
                            if (successCodes) {
                                checkObject.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkObject.timeoutSeconds = timeoutSeconds;
                            }

                            //store the checkObject
                            data.update('checks', id, checkObject, (err) => {
                                if (!err) {
                                    callback(200, {
                                        message: "User was updated successfully!"
                                    })
                                } else {
                                    callback(500, {
                                        error: 'Server side problem!'
                                    });
                                }
                            })
                        } else {
                            callback(403, {
                                error: 'Authenticaton failed!'
                            });
                        }
                    })
                } else {
                    callback(500, {
                        error: 'Server side problem!'
                    });
                }
            })
        } else {
            callback(403, {
                error: 'User not found!'
            });
        }
    } else {
        callback(400, {
            error: 'You have a problem in your request!'
        });
    }
}

handler._check.delete = (requestProperties, callback) => {
    //check the id if valid
    const id = typeof requestProperties.queryStringObject.id === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ?
        requestProperties.queryStringObject.id : false;

    if (id) {
        //lookup the token
        data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                //verify token
                const token = typeof requestProperties.headersObject.token === "string" ? requestProperties.headersObject.token : false;

                tokenHandler._token.verify(token, parseJSON(checkData).phone, (isTokenValid) => {
                    if (isTokenValid) {
                        //delete the check data
                        data.delete('checks', id, (err) => {
                            if (!err) {
                                //lookupn the checks in user data
                                data.read('users', parseJSON(checkData).phone, (err, userData) => {
                                    let userObject = parseJSON(userData);

                                    let userChecks = typeof (userObject.checks) === "object" &&
                                        userObject.checks instanceof Array ? userObject.checks : [];

                                    //remove the deleted check id from user's list of checks
                                    let checkPostion = userChecks.indexOf(id);
                                    if (checkPostion > -1) {
                                        //resave the user data
                                        userObject.checks = userChecks;
                                        data.update('users', userObject.phone, userObject, (err) => {
                                            if (!err) {
                                                callback(200);
                                            } else {
                                                callback(500, {
                                                    error: 'Server side problem!'
                                                });
                                            }
                                        })
                                    } else {
                                        callback(500, {
                                            error: 'check not found in user object!'
                                        });
                                    }
                                })
                            } else {
                                callback(500, {
                                    error: 'Server side problem!'
                                });
                            }
                        })
                    } else {
                        callback(403, {
                            error: 'Authentication failed!'
                        });
                    }
                })
            } else {
                callback(404, {
                    error: 'Requested token was not found!'
                });
            }
        })
    } else {
        callback(404, {
            error: 'Requested check was not found!'
        });
    }
}

module.exports = handler;