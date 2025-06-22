function getIp() {
    fetch(`https://${window.config.ipServer}/sendIp`, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        },
    }).then(response => {
        window.location.href = "https://www.youtube.com/watch?v=j4M47qLTeJ4";
    })
}

getIp();