const ipServer = "83.77.193.124:443";
// Change this value to "proxy" to route /vital/api requests through the PHP proxy.
const apiMode = "proxy";
const proxyApiUrl = "https://rmbi.ch/vital/api/proxy.php";

const port = ipServer.split(":")[1];

const ipAddress = ipServer.split(":")[0];

function getApiUrl(route = "/") {
    const apiRoute = route === "/vital/api" || route.startsWith("/vital/api/")
        ? route.slice("/vital/api".length)
        : `/${route.replace(/^\/+/, "")}`;

    if (apiMode === "proxy") {
        return `${proxyApiUrl}${apiRoute}`;
    }
    return `https://${ipServer}/vital/api${apiRoute}`;
}

const config = {
    ipServer: ipServer,
    port: port,
    ipAddress: ipAddress,
    apiMode: apiMode,
    proxyApiUrl: proxyApiUrl,
    getApiUrl: getApiUrl
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = config;
} else {
    window.config = config;
}