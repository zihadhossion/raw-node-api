//dependencies
const data = require('../../lib/data');
const { hash, parseJSON } = require('../../helpers/utilities');
const tokenHandler = require("./tokenHandler");

//module scaffolding
const handler = {};

handler.userHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];

    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._users[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
}

handler._users = {};

handler._users.post = (requestProperties, callback) => {
    const firstName = typeof (requestProperties.body.firstName) === "string" && requestProperties.body.firstName.trim().length > 0 ? requestProperties.body.firstName : false;
    const lastName = typeof (requestProperties.body.lastName) === "string" && requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;
    const phone = typeof (requestProperties.body.phone) === "string" && requestProperties.body.phone.trim().length === 11 ? requestProperties.body.phone : false;
    const password = typeof (requestProperties.body.password) === "string" && requestProperties.body.password.trim().length > 0 ? requestProperties.body.password : false;
    const toAgreement = typeof (requestProperties.body.toAgreement) === "boolean" && requestProperties.body.toAgreement ? requestProperties.body.toAgreement : false;

    if (firstName && lastName && phone && password && toAgreement) {
        //make sure that the user doesn't already exists
        data.read('users', phone, (err) => {
            if (err) {
                let userObject = {
                    firstName,
                    lastName,
                    phone,
                    password: hash(password),
                    toAgreement
                }
                //store user to db
                data.create('users', phone, userObject, (err) => {
                    if (!err) {
                        callback(200, {
                            message: "User was created successfully!"
                        });
                    } else {
                        callback(500, { 'error': 'Could not create user!' })
                    }
                })
            } else {
                callback(500, {
                    error: "There was a problem in server side!"
                });
            }
        })
    } else {
        callback(400, {
            error: "You have a problem in your request!"
        });
    }
}

handler._users.get = (requestProperties, callback) => {
    //check the phone number if valid
    const phone = typeof requestProperties.queryStringObject.phone === 'string' && requestProperties.queryStringObject.phone.trim().length === 11 ?
        requestProperties.queryStringObject.phone : false;

    if (phone) {
        //verify token
        const token = typeof requestProperties.headersObject.token === "string" ? requestProperties.headersObject.token : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                //lookup the user
                data.read('users', phone, (err, user) => {
                    const userData = { ...parseJSON(user) };

                    if (!err && userData) {
                        delete userData.password;
                        callback(200, userData);
                    } else {
                        callback(404, {
                            error: 'Requested user was not found!'
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
        callback(404, {
            error: 'Requested user was not found!'
        });
    }
}

handler._users.put = (requestProperties, callback) => {
    //check the phone number if valid
    const phone = typeof (requestProperties.body.phone) === "string" && requestProperties.body.phone.trim().length === 11 ? requestProperties.body.phone : false;

    //check other value
    const firstName = typeof (requestProperties.body.firstName) === "string" && requestProperties.body.firstName.trim().length > 0 ? requestProperties.body.firstName : false;
    const lastName = typeof (requestProperties.body.lastName) === "string" && requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;
    const password = typeof (requestProperties.body.password) === "string" && requestProperties.body.password.trim().length > 0 ? requestProperties.body.password : false;

    if (phone) {
        if (firstName || lastName || password) {
            //verify token
            const token = typeof requestProperties.headersObject.token === "string" ? requestProperties.headersObject.token : false;

            tokenHandler._token.verify(token, phone, (tokenId) => {
                if (tokenId) {
                    //lookup the user
                    data.read('users', phone, (err, user) => {
                        const userData = { ...parseJSON(user) };

                        if (!err && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.password = hash(password);
                            }

                            //store to database
                            data.update('users', phone, userData, (err) => {
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
                            callback(400, {
                                error: 'You have a problem in your request!'
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
                error: 'You have a problem in your request!'
            });
        }
    } else {
        callback(400, {
            error: 'Requested user was not found!'
        });
    }
}

handler._users.delete = (requestProperties, callback) => {
    //check the phone number if valid
    const phone = typeof requestProperties.queryStringObject.phone === 'string' && requestProperties.queryStringObject.phone.trim().length === 11 ?
        requestProperties.queryStringObject.phone : false;

    if (phone) {
        //verify token
        const token = typeof requestProperties.headersObject.token === "string" ? requestProperties.headersObject.token : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                //delete the user
                data.delete('users', phone, (err) => {
                    if (!err) {
                        callback(200, {
                            message: "User was deleted!"
                        });
                    } else {
                        callback(500, {
                            error: "There was a problem in server side!"
                        })
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
            error: 'You have a problem in your request!'
        });
    }
}

module.exports = handler;