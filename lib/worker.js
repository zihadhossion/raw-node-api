//dependencies
const url = require('url');
const http = require('http');
const https = require('https');
const data = require('./data');
const { parseJSON } = require('../helpers/utilities');
const { sendTwilioSms } = require('../helpers/notifications');

//worker object - module scaffolding
const worker = {};

//lookup all the checks
worker.gatherAllChecks = () => {
    //get all the checks
    data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach(check => {
                //read the checkdata
                data.read('checks', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        //pass the data to check validator
                        worker.validateCheckData(parseJSON(originalCheckData));
                    } else {
                        console.log("Error in reading one of the checks data!");
                    }
                })
            })
        } else {
            console.log("Error: Could not find any checks");
        }
    })
}

//validate individual check data
worker.validateCheckData = (originalCheckData) => {
    const originalData = originalCheckData;
    if (originalCheckData && originalCheckData.id) {
        originalData.state = typeof (originalCheckData.state) === 'string' &&
            ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';

        originalData.lastChecked = typeof (originalCheckData.lastChecked) === 'number' &&
            originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

        //pass the next process
        worker.performCheck(originalData);
    } else {
        console.log('Check was invalid!');
    }
}

//perform check
worker.performCheck = (originalCheckData) => {
    //prepare the initial check outcome
    let checkOutcome = {
        error: false,
        responseCode: false
    }

    //mark the outcome has not been sent yet
    let outcomeSent = false;

    //parse the hostname & full url from original data
    const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
    const hostName = parsedUrl.hostname;
    const { path } = parsedUrl;

    const timeout = typeof originalCheckData.timeoutSeconds === 'number' && originalCheckData.timeoutSeconds > 0
        ? originalCheckData.timeoutSeconds * 1000
        : 5000; // Default to 5 seconds if invalid

    //construct the request
    const requestDetails = {
        protocol: `${originalCheckData.protocol}:`,
        hostname: hostName,
        method: originalCheckData.method.toUpperCase(),
        path,
        timeout
        // timeout: originalCheckData.timeoutSeconds * 1000
    }

    const protocolToUse = originalCheckData.protocol === 'http' ? http : https;

    const req = protocolToUse.request(requestDetails, (res) => {
        //grab the  status of the response
        const status = res.statusCode;

        //update the check outcome and pass to the next response
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', (e) => {
        checkOutcome = {
            error: true,
            value: e,
        }
        //update the check outcome and pass to the next response
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', () => {
        checkOutcome = {
            error: true,
            value: 'timeout',
        }

        //update the check outcome and pass to the next response
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    })

    //req end
    req.end();
}

//save check outcome to database and send to next process
worker.processCheckOutcome = (originalCheckData, checkOutcome) => {
    //check if check outcome is up or down
    const state = !checkOutcome.error && checkOutcome.responseCode &&
        originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    //decide wheather we should alert the user or not
    const alertWanted = !!(originalCheckData.lastChecked && originalCheckData.state !== state);

    //update the check data
    let newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    //update the check to disk
    data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (alertWanted) {
                //send the checkdata next process
                worker.alertUserToStatusCode(newCheckData);
            } else {
                console.log("Alert is not needed as there is no state change!");
            }
        } else {
            console.log("Error trying to save check data");
        }
    })
}

//send notification sms to user if  state changes
worker.alertUserToStatusCode = (newCheckData) => {
    let msg = `Alert : Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;

    sendTwilioSms(newCheckData.phone, msg, (err) => {
        if (!err) {
            console.log(`User was alerted to  a status change via sms: ${msg}`);
        } else {
            console.log('error sending msg to user');
        }
    })
}

//timer to execute the worker process once per minute
worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks();
    }, 5000)
}

// start the worker
worker.init = () => {
    //execute all the checks
    worker.gatherAllChecks();

    //call the loop so that checks continue 
    worker.loop();
}

//export
module.exports = worker;