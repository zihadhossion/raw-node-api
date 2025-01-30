//dependencies
const http = require("http");
const querystring = require('querystring');
const { twilio } = require('./environments');


//module scaffolding
const notifications = {};

//send sms to user using twilio api 
notifications.sendTwilioSms = (phone, msg, callback) => {
    //input validation
    const userPhone = typeof (phone) === 'string' && phone.trim().length === 11 ? phone.trim() : false;
    const userMsg = typeof (msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

    if (userPhone && userMsg) {
        //configure the request payload
        const payload = {
            From: twilio.fromPhone,
            To: `+88${userPhone}`,
            Body: userMsg
        }

        //stringify the payload
        const payloadString = querystring.stringify(payload);

        //configure the request details
        const options = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            auth: `${twilio.accountSid}:${twilio.authToken}`,
            headers: {
                'Content-Type': 'applications/x-www-form-urlencoded'
            }
        };

        //instantiate the request object
        const req = http.request(options, (res) => {
            //get the status of the sent request
            const status = res.statusCode;
            //callback successfully if the request went through
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                callback(`Status code returned was ${status}`);
            }
        })

        req.on('error', (e) => {
            callback(e)
        })

        req.write(payloadString);
        req.end();
    } else {
        callback(400, {
            error: "Giving parameters were invalid!"
        });
    }
}

//export the module
module.exports = notifications;