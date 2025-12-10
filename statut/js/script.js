const apiUrl = "https://rmbi.ch/vital/api/proxy.php";;

async function fetchApiMessage() {
    const messageEl = document.getElementById('api-message');
    try {
        const start = performance.now();

        const res = await fetch(`${apiUrl}/`);

        const end = performance.now();
        const ping = (end - start).toFixed(2);

        const data = await res.json();
        messageEl.textContent = `${data.message} (Ping: ${ping} ms)`;

    } catch (err) {
        messageEl.textContent = "Erreur serveur : " + err;
    }
}

async function fetchStatus() {
    const uptimeEl = document.getElementById('uptime');
    const memoryEl = document.getElementById('memory');
    const cpuEl = document.getElementById('cpu');
    const diskEl = document.getElementById('disk');
    const timestampEl = document.getElementById('timestamp');
    const pingEl = document.getElementById('ping');

    try {
        const start = performance.now();

        const res = await fetch(`${apiUrl}/status`);

        const end = performance.now();
        const ping = (end - start).toFixed(2);

        const data = await res.json();

        uptimeEl.textContent = `${data.uptime}`;
        memoryEl.textContent = `Total ${data.memory.total}, Libre ${data.memory.free}, RSS ${data.memory.rss}, Heap ${data.memory.heapUsed}`;
        cpuEl.textContent = `${data.cpu.model} (${data.cpu.cores} cores, ${data.cpu.speed}), LoadAvg: [${data.cpu.loadAvg.join(', ')}]`;
        diskEl.textContent = `Total ${data.disk.total}, Libre ${data.disk.free}`;
        timestampEl.textContent = `${new Date(data.timestamp).toLocaleString()}`;
        pingEl.textContent = `${ping} ms`;
    } catch (err) {
        uptimeEl.textContent = "Erreur serveur";
        memoryEl.textContent = "";
        cpuEl.textContent = "";
        diskEl.textContent = "";
        timestampEl.textContent = "";
        pingEl.textContent = err;
    }
}

async function tick() {
  await Promise.all([
    fetchApiMessage(),
    fetchStatus()
  ]);
}

tick();

setInterval(tick, 10000);