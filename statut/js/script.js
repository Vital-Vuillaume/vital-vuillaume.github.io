const apiUrl = window.config.getApiUrl('/vital/api');
const sampleLimit = 36;
const refreshInterval = 10000;
const chartHistory = { ping: [], load: [] };
let latestUpdate = null;
let requestInProgress = false;

async function readResponse(response) {
    const responseText = await response.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        throw new Error(responseText || `Réponse invalide (${response.status}).`);
    }
    if (!response.ok) {
        throw new Error(data.error || `La requête a échoué (${response.status}).`);
    }
    return data;
}

function parseSize(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const match = String(value || '').trim().match(/^([\d,.]+)\s*(B|KB|MB|GB|TB)?$/i);
    if (!match) return null;
    const amount = Number(match[1].replace(',', '.'));
    const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
    return Number.isFinite(amount) ? amount * (units[match[2]?.toUpperCase()] || 1) : null;
}

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toFixed(unit === 0 || value >= 100 ? 0 : 1)} ${units[unit]}`;
}

function setGauge(gaugeId, percentId, meterId, usedValue, totalValue) {
    const gauge = document.getElementById(gaugeId);
    const percentElement = document.getElementById(percentId);
    const meter = document.getElementById(meterId);
    if (!Number.isFinite(usedValue) || !Number.isFinite(totalValue) || totalValue <= 0) {
        percentElement.textContent = '—';
        gauge.setAttribute('aria-label', 'Valeur indisponible');
        meter.style.width = '0%';
        return null;
    }
    const percent = Math.min(100, Math.max(0, usedValue / totalValue * 100));
    const rounded = Math.round(percent);
    gauge.style.setProperty('--gauge-value', `${percent}%`);
    gauge.setAttribute('aria-label', `${rounded} % utilisé`);
    percentElement.textContent = `${rounded}%`;
    meter.style.width = `${percent}%`;
    return percent;
}

function appendSample(series, value) {
    if (!Number.isFinite(value)) return;
    series.push(value);
    if (series.length > sampleLimit) series.shift();
}

function drawLineChart(containerId, values, color, fillColor, suffix = '') {
    const container = document.getElementById(containerId);
    const width = 640;
    const height = 150;
    const padding = { top: 12, right: 12, bottom: 16, left: 12 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    container.replaceChildren();
    if (values.length < 2) {
        container.dataset.empty = 'true';
        return;
    }
    delete container.dataset.empty;
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(...values, minValue + 1);
    const range = maxValue - minValue || 1;
    const points = values.map((value, index) => ({
        x: padding.left + index / (values.length - 1) * plotWidth,
        y: padding.top + (maxValue - value) / range * plotHeight
    }));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    for (let index = 1; index <= 3; index += 1) {
        const line = document.createElementNS(svg.namespaceURI, 'line');
        const y = padding.top + plotHeight * index / 4;
        line.setAttribute('x1', String(padding.left));
        line.setAttribute('x2', String(width - padding.right));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        line.setAttribute('class', 'chart-gridline');
        svg.append(line);
    }
    const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
    const area = document.createElementNS(svg.namespaceURI, 'path');
    area.setAttribute('d', `${pathData} L${points.at(-1).x},${height - padding.bottom} L${points[0].x},${height - padding.bottom} Z`);
    area.setAttribute('fill', fillColor);
    svg.append(area);
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
    const lastPoint = points.at(-1);
    const marker = document.createElementNS(svg.namespaceURI, 'circle');
    marker.setAttribute('cx', String(lastPoint.x));
    marker.setAttribute('cy', String(lastPoint.y));
    marker.setAttribute('r', '5');
    marker.setAttribute('fill', color);
    marker.setAttribute('class', 'chart-marker');
    svg.append(marker);
    container.append(svg);
    container.setAttribute('aria-label', `Graphique des valeurs récentes : ${values.at(-1).toFixed(1)}${suffix}`);
}

function markServerUnavailable(error) {
    const indicator = document.getElementById('status-indicator');
    indicator.className = 'status-indicator is-offline';
    indicator.closest('.status-overview-service').classList.remove('is-online');
    indicator.closest('.status-overview-service').classList.add('is-offline');
    document.getElementById('api-message').textContent = 'API indisponible';
    document.getElementById('ping').textContent = '—';
    document.getElementById('ping-chart-current').textContent = '—';
    document.getElementById('ping-status').textContent = 'Hors ligne';
    document.getElementById('last-check').textContent = `Échec du relevé : ${error.message}`;
}

function markServerAvailable() {
    const indicator = document.getElementById('status-indicator');
    indicator.className = 'status-indicator is-online';
    indicator.closest('.status-overview-service').classList.remove('is-offline');
    indicator.closest('.status-overview-service').classList.add('is-online');
    document.getElementById('api-message').textContent = 'API disponible';
}

function updateStatus(data, pingMilliseconds) {
    const memoryTotal = parseSize(data.memory?.total);
    const memoryFree = parseSize(data.memory?.free);
    const memoryUsed = memoryTotal === null || memoryFree === null ? null : Math.max(0, memoryTotal - memoryFree);
    document.getElementById('memory-total').textContent = formatBytes(memoryTotal);
    document.getElementById('memory-free').textContent = formatBytes(memoryFree);
    document.getElementById('memory-used').textContent = formatBytes(memoryUsed);
    document.getElementById('memory-rss').textContent = data.memory?.rss || '—';
    setGauge('memory-gauge', 'memory-percent', 'memory-meter', memoryUsed, memoryTotal);

    const diskTotal = parseSize(data.disk?.total);
    const diskFree = parseSize(data.disk?.free);
    const diskUsed = diskTotal === null || diskFree === null ? null : Math.max(0, diskTotal - diskFree);
    document.getElementById('disk-total').textContent = formatBytes(diskTotal);
    document.getElementById('disk-free').textContent = formatBytes(diskFree);
    document.getElementById('disk-used').textContent = formatBytes(diskUsed);
    setGauge('disk-gauge', 'disk-percent', 'disk-meter', diskUsed, diskTotal);

    const loads = Array.isArray(data.cpu?.loadAvg) ? data.cpu.loadAvg.map(Number) : [];
    document.getElementById('cpu-model').textContent = data.cpu?.model || 'Modèle non disponible';
    document.getElementById('cpu-cores').textContent = `${data.cpu?.cores ?? '—'} cœurs · ${data.cpu?.speed || '—'}`;
    document.getElementById('load-1').textContent = Number.isFinite(loads[0]) ? loads[0].toFixed(2) : '—';
    document.getElementById('load-5').textContent = Number.isFinite(loads[1]) ? loads[1].toFixed(2) : '—';
    document.getElementById('load-15').textContent = Number.isFinite(loads[2]) ? loads[2].toFixed(2) : '—';
    appendSample(chartHistory.load, loads[0]);
    drawLineChart('load-chart', chartHistory.load, '#a78bfa', '#a78bfa20');

    appendSample(chartHistory.ping, pingMilliseconds);
    drawLineChart('ping-chart', chartHistory.ping, '#38bdf8', '#38bdf820', ' ms');
    document.getElementById('ping').textContent = `${Math.round(pingMilliseconds)} ms`;
    document.getElementById('ping-chart-current').textContent = String(Math.round(pingMilliseconds));
    document.getElementById('ping-status').textContent = pingMilliseconds < 150 ? 'Rapide' : pingMilliseconds < 500 ? 'Normal' : 'Lent';
    document.getElementById('uptime').textContent = data.uptime || '—';

    latestUpdate = data.timestamp ? new Date(data.timestamp) : new Date();
    document.getElementById('timestamp').textContent = latestUpdate.toLocaleTimeString('fr-CH');
    document.getElementById('timestamp-relative').textContent = `Relevé du ${latestUpdate.toLocaleDateString('fr-CH')}`;
    document.getElementById('last-check').textContent = `Dernier relevé réussi à ${latestUpdate.toLocaleTimeString('fr-CH')}`;
}

async function tick() {
    if (requestInProgress) return;
    requestInProgress = true;
    const startedAt = performance.now();
    try {
        const response = await fetch(`${apiUrl}/status`, { cache: 'no-store' });
        const data = await readResponse(response);
        const ping = performance.now() - startedAt;
        markServerAvailable();
        updateStatus(data, ping);
    } catch (error) {
        markServerUnavailable(error);
    } finally {
        requestInProgress = false;
    }
}

function updateRelativeTimestamp() {
    if (!latestUpdate) return;
    const seconds = Math.max(0, Math.floor((Date.now() - latestUpdate.getTime()) / 1000));
    document.getElementById('timestamp-relative').textContent =
        seconds < 5 ? 'À l’instant' : `Mis à jour il y a ${seconds} s`;
}

tick();
setInterval(tick, refreshInterval);
setInterval(updateRelativeTimestamp, 1000);
