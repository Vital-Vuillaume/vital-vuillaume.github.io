const ipServer = "178.195.51.162:3000";

const port = ipServer.split(":")[1];

const ipAddress = ipServer.split(":")[0];

const config = {
    ipServer: ipServer,
    ipAddress: ipAddress,
    port: port
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = config;
} else {
    window.config = config;
}
