const ipServer = "83.77.193.124:443";

const port = ipServer.split(":")[1];

//const ipAddress = ipServer.split(":")[0];

const config = {
    ipServer: ipServer,
    port: port
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = config;
} else {
    window.config = config;
}