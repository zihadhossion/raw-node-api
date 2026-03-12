const environments = {};

environments.staging = {
    port: 3000,
    envName: "staging",
    secretKey: process.env.STAGING_SECRET_KEY,
    maxChecks: 5,
    twilio: {
        fromPhone: process.env.STAGING_TWILIO_FROM_PHONE,
        accountSid: process.env.STAGING_TWILIO_ACCOUNT_SID,
        authToken: process.env.STAGING_TWILIO_AUTH_TOKEN
    }
}

environments.production = {
    port: 5000,
    envName: "production",
    secretKey: process.env.PRODUCTION_SECRET_KEY,
    maxChecks: 5,
    twilio: {
        fromPhone: process.env.PRODUCTION_TWILIO_FROM_PHONE,
        accountSid: process.env.PRODUCTION_TWILIO_ACCOUNT_SID,
        authToken: process.env.PRODUCTION_TWILIO_AUTH_TOKEN
    }
}

const currentEnvironment = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.trim() : 'staging';

const environmentToExport = typeof (environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;