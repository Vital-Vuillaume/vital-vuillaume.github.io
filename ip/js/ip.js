function getIp() {
  fetch(`https://${window.config.ipServer}/sendIp`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('ipResult').innerText = data.ip;
  })
}

getIp();