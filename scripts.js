document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([0, 0], 2);

    let routeLayer;
    let routePoints = [];
    let startMarker = null;
    let endMarker = null;
    let splitMarkers = [];

    let hasExported = false;
    let downloadCounter = 1;

    const startIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    const splitIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    const endIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    function setStatus(text) {
        document.getElementById('status').textContent = text;
    }

    function setStep(stage) {
        const fill = document.getElementById('stepFill');
        let width = '0%';
        let statusText = '';

        switch (stage) {
            case 0:
                width = '10%';
                statusText = '<strong>Step 1:</strong> Ready to upload a GPX file.';
                break;
            case 1:
                width = '40%';
                statusText = '<strong>Step 2:</strong> GPX uploaded. Click on the map to add up to 3 split points.';
                break;
            case 2:
                width = '70%';
                statusText = '<strong>Step 3:</strong> Split point(s) added. Ready to export!';
                break;
            case 3:
                width = '100%';
                statusText = '<strong>Step 4:</strong> Export complete. Download your split files below!';
                break;
        }

        fill.style.width = width;
        document.getElementById('status').innerHTML = statusText;

        fill.classList.remove('flash');
        void fill.offsetWidth;
        fill.classList.add('flash');
    }

    function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        document.querySelector('.file-upload-text').textContent = file.name;

        splitMarkers.forEach(m => map.removeLayer(m));
        splitMarkers = [];
        if (startMarker) map.removeLayer(startMarker);
        if (endMarker) map.removeLayer(endMarker);
        if (routeLayer) map.removeLayer(routeLayer);

        document.getElementById('exportBtn').disabled = true;
        setStep(0);

        const reader = new FileReader();
        reader.onload = () => parseGPX(reader.result);
        reader.readAsText(file);
    }

    function parseGPX(text) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');
        const trkpts = [...xml.getElementsByTagName('trkpt')];

        routePoints = trkpts.map(pt => [
            parseFloat(pt.getAttribute('lat')),
            parseFloat(pt.getAttribute('lon'))
        ]);

        routeLayer = L.polyline(routePoints, {color: 'blue'}).addTo(map);
        startMarker = L.marker(routePoints[0], {icon: startIcon}).addTo(map).bindPopup('Start');
        endMarker = L.marker(routePoints[routePoints.length - 1], {icon: endIcon}).addTo(map).bindPopup('End');

        map.fitBounds(routeLayer.getBounds());
        map.on('click', handleSplitClick);

        setStep(1);
    }

    function updateStepBar() {
        if (splitMarkers.length === 0) {
            setStep(1);
        } else {
            setStep(2);
        }
    }

    if (splitMarkers.length > 0) {
        setStatus('Step 3: Split point(s) added. Ready to export!');
    }

    function handleSplitClick(e) {
        if (splitMarkers.length >= 3) return;

        const nearestIndex = findNearestPointIndex(e.latlng);
        const nearestPoint = routePoints[nearestIndex];

        const marker = L.marker(nearestPoint, {icon: splitIcon, draggable: false})
            .addTo(map)
            .bindPopup(`Split ${splitMarkers.length + 1}`)
            .openPopup();
        marker._routeIndex = nearestIndex;

        marker.on('click', () => {
            map.removeLayer(marker);
            splitMarkers = splitMarkers.filter(m => m !== marker);

            hasExported = false;
            document.getElementById('downloadSection').style.display = 'none';

            updateStepBar();

            document.getElementById('exportBtn').disabled = splitMarkers.length === 0;
        });

        splitMarkers.push(marker);

        hasExported = false;
        document.getElementById('exportBtn').disabled = false;
        document.getElementById('downloadSection').style.display = 'none';

        updateStepBar();

        document.getElementById('exportBtn').disabled = false;
    }

    function findNearestPointIndex(latlng) {
        let minDist = Infinity;
        let idx = 0;
        routePoints.forEach((pt, i) => {
            const d = map.distance(latlng, L.latLng(pt));
            if (d < minDist) {
                minDist = d;
                idx = i;
            }
        });
        return idx;
    }

    function exportGPX(e) {
        e.preventDefault();

        if (splitMarkers.length === 0 || hasExported) return;

        const originalFile = document.getElementById('gpxInput').files[0];
        if (!originalFile) return;

        const baseName = originalFile.name.replace(/\.gpx$/i, '');
        const downloadList = document.getElementById('downloadList');
        const downloadSection = document.getElementById('downloadSection');

        downloadList.innerHTML = '';
        downloadSection.style.display = 'block';

        const indexes = splitMarkers.map(m => m._routeIndex).sort((a, b) => a - b);

        const segments = [];
        let startIdx = 0;

        indexes.forEach(idx => {
            segments.push(routePoints.slice(startIdx, idx + 1));
            startIdx = idx;
        });
        segments.push(routePoints.slice(startIdx));

        segments.forEach((pts, i) => {
            const filename = `Part ${downloadCounter}: ${baseName}_part${downloadCounter}.gpx`;
            downloadCounter++;
            const blob = generateGPXBlob(pts);
            const url = URL.createObjectURL(blob);
            const sizeKB = (blob.size / 1024).toFixed(1);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            link.innerHTML = `
                <span>${filename}</span>
                <span class="filesize">${sizeKB} KB</span>
            `;

            downloadList.appendChild(link);
        });

        hasExported = true;
        document.getElementById('exportBtn').disabled = true;

        setStep(3);
    }

    function generateGPXBlob(points) {
        const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="GPX Route Splitter"><trk><trkseg>${points.map(p => `<trkpt lat="${p[0]}" lon="${p[1]}"></trkpt>`).join('\n')}</trkseg></trk></gpx>`;

        return new Blob([gpx], {type: 'application/gpx+xml'});
    }

    function resetApp() {
        if (routeLayer) map.removeLayer(routeLayer);
        splitMarkers.forEach(m => map.removeLayer(m));
        if (startMarker) map.removeLayer(startMarker);
        if (endMarker) map.removeLayer(endMarker);

        splitMarkers = [];
        routePoints = [];
        routeLayer = null;
        startMarker = null;
        endMarker = null;

        document.getElementById('gpxInput').value = '';
        document.querySelector('.file-upload-text').textContent = 'No file chosen...';
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('downloadSection').style.display = 'none';

        hasExported = false;

        map.off('click', handleSplitClick);
        map.setView([0, 0], 2);

        setStep(0);
    }

    if (!hasExported && splitMarkers.length === 0) {
        setStep(1);
    }

    document.getElementById('gpxInput').addEventListener('change', handleFile);
    document.getElementById('exportBtn').addEventListener('click', exportGPX);
    document.getElementById('resetBtn').addEventListener('click', resetApp);

    setStep(0);
});
