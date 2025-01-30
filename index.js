//dependencies
const server = require('./lib/server');
const worker = require('./lib/worker');

//app object
const app = {};

app.init = () => {
    //start the server
    server.init();

    //start the workers
    worker.init();
}

app.init();

//export the app
module.exports = app;