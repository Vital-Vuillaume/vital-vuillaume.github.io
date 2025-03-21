const ipServer = "192.168.1.107:3001";

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