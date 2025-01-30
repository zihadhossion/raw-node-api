const environments = {};

environments.staging = {
    port: 3000,
    envName: "staging",
    secretKey: 'jhfjkdvlersfhbbfddvgdf',
    maxChecks: 5,
    twilio: {
        fromPhone: "+18777804236",
        accountSid: "AC322a13efe7a0e998ad87dacf318a7b65",
        authToken: "a1fe27893431f58d98af0fbf66b961b5"
    }
}

environments.production = {
    port: 5000,
    envName: "production",
    secretKey: 'jrereiujgrsfhbbfddvgdf',
    maxChecks: 5,
    twilio: {
        fromPhone: "+18777804236",
        accountSid: "AC322a13efe7a0e998ad87dacf318a7b65",
        authToken: "a1fe27893431f58d98af0fbf66b961b5"
    }
}

const currentEnvironment = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.trim() : 'staging';

const environmentToExport = typeof (environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;