document.addEventListener('DOMContentLoaded', () => {
    // Init Leaflet map centered with zoom level
    const map = L.map('map', {
        center: [54.5, -3],
        zoom: 4
    });

    // Map layers and data storage
    let routeLayer;
    let routePoints = [];
    let startMarker = null;
    let endMarker = null;
    let splitMarkers = [];
    let waypoints = [];
    let hasExported = false;
    let waypointMarkers = [];
    let distanceMarkers = [];

    let useMiles = true;

    // Custom Leaflet icons for start, end and split points
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
    const waypointIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [18, 30],
        iconAnchor: [9, 30],
        popupAnchor: [1, -24],
        shadowSize: [30, 30]
    });

    // Add OpenStreetMap tiles to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Set status text below the map
    function setStatus(text) {
        document.getElementById('status').textContent = text;
    }

    // Prevent clicks from reaching the map (no accidental split points)
    const unitBtn = document.getElementById('unitToggle');
    L.DomEvent.on(unitBtn, 'click', L.DomEvent.stopPropagation);

    // Add your toggle logic
    unitBtn.addEventListener('click', () => {
        useMiles = !useMiles;
        unitBtn.textContent = useMiles ? 'Units: mi' : 'Units: km';
        if (routePoints.length > 0) {
            addDistanceMarkers(routePoints, map, 5000, useMiles);
        }
    });

    // Update the progress step bar
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
                statusText = '<strong>Step 2:</strong> GPX uploaded. Click on the map to add up to 10 split points.';
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

        // Trigger step bar animation
        fill.classList.remove('flash');
        void fill.offsetWidth;
        fill.classList.add('flash');
    }

    // Handle user selecting a GPX file
    function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        document.querySelector('.file-upload-text').textContent = file.name;

        // Clear any previous data from the map
        splitMarkers.forEach(m => map.removeLayer(m));
        splitMarkers = [];
        if (startMarker) map.removeLayer(startMarker);
        if (endMarker) map.removeLayer(endMarker);
        if (routeLayer) map.removeLayer(routeLayer);
        waypointMarkers.forEach(m => map.removeLayer(m));
        waypointMarkers = [];

        document.getElementById('exportBtn').disabled = true;
        setStep(0);

        // Read the GPX file as text and parse it
        const reader = new FileReader();
        reader.onload = () => parseGPX(reader.result);
        reader.readAsText(file);
    }

    // Parse GPX XML text into route points and waypoints
    function parseGPX(text) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');
        const trkpts = [...xml.getElementsByTagName('trkpt')];
        const wpts = [...xml.getElementsByTagName('wpt')];

        // Extract route points from <trkpt> elements
        routePoints = trkpts.map(pt => {
            const eleNode = pt.getElementsByTagName('ele')[0];

            return {
                lat: parseFloat(pt.getAttribute('lat')),
                lon: parseFloat(pt.getAttribute('lon')),
                ele: eleNode ? parseFloat(eleNode.textContent) : null
            };
        });

        // Extract waypoints from <wpt> elements
        waypoints = wpts.map(wpt => {
            const nameNode = wpt.getElementsByTagName('name')[0];
            const typeNode = wpt.getElementsByTagName('type')[0];
            const symNode  = wpt.getElementsByTagName('sym')[0];

            const lat = parseFloat(wpt.getAttribute('lat'));
            const lon = parseFloat(wpt.getAttribute('lon'));
            const ele = getNearestTrackElevation(lat, lon);

            return {
                lat,
                lon,
                ele: ele !== null ? Math.round(ele) : null,
                name: nameNode ? nameNode.textContent : 'Point',
                type: typeNode ? typeNode.textContent : 'Generic',
                sym: symNode ? symNode.textContent : 'Waypoint'
            };
        });

        // Draw the GPX track as a blue polyline
        routeLayer = L.polyline(routePoints.map(p => [p.lat, p.lon]), {
            color: '#0975dc',
            weight: 5,
            opacity: 1,
            interactive: false
        }).addTo(map);

        // Add start and end markers
        startMarker = L.marker(routePoints[0], {icon: startIcon}).addTo(map).bindPopup('Start');
        endMarker = L.marker(routePoints[routePoints.length - 1], {icon: endIcon}).addTo(map).bindPopup('End');

        waypoints.forEach(wpt => {
            const marker = L.marker([wpt.lat, wpt.lon], {
                icon: waypointIcon,
                interactive: true
            }).addTo(map).bindPopup(`<strong>${wpt.name}</strong><br>Type: ${wpt.type}<br>${wpt.ele !== null ? `Elevation: ${wpt.ele} m` : ''}`);

            waypointMarkers.push(marker);
        });

        map.fitBounds(routeLayer.getBounds());

        // Enable user to click on the map to add split points
        map.on('click', handleSplitClick);

        // Add distance markers every 5 km (change if needed)
        addDistanceMarkers(routePoints, map, 5000, useMiles);

        setStep(1);
    }

    // Update step bar based on split markers
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

    // Handle adding split points when the user clicks the map
    function handleSplitClick(e) {
        // Limit to 10 split points
        if (splitMarkers.length >= 10) return;

        const nearestIndex = findNearestPointIndex(e.latlng);
        const nearestPoint = routePoints[nearestIndex];

        // Add marker at nearest track point
        const marker = L.marker(nearestPoint, {icon: splitIcon, draggable: false}).addTo(map).bindPopup(`Split ${splitMarkers.length + 1}`).openPopup();

        // Store index for splitting GPX
        marker._routeIndex = nearestIndex;

        // Allow removing split point on marker click
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
    }

    // Adding distance markers to the map polyline
    function addDistanceMarkers(routePoints, map, stepMeters = 5000, useMiles = true) {
        distanceMarkers.forEach(m => map.removeLayer(m));
        distanceMarkers = [];

        let accumulatedDistance = 0;
        let totalDistance = 0;

        for (let i = 1; i < routePoints.length; i++) {
            const p1 = L.latLng(routePoints[i - 1].lat, routePoints[i - 1].lon);
            const p2 = L.latLng(routePoints[i].lat, routePoints[i].lon);

            const segmentDistance = p1.distanceTo(p2);
            accumulatedDistance += segmentDistance;
            totalDistance += segmentDistance;

            if (accumulatedDistance >= stepMeters) {
                const displayDistance = useMiles ? Math.round((totalDistance / 1000) * 0.621371) : Math.round(totalDistance / 1000);

                const marker = L.marker([p2.lat, p2.lng], {
                    interactive: false,
                    icon: L.divIcon({
                        className: 'distance-marker',
                        html: displayDistance,
                        iconSize: [null, 18],
                        iconAnchor: [15, 9]
                    })
                }).addTo(map);

                distanceMarkers.push(marker);
                accumulatedDistance = 0;
            }
        }
    }

    // Find the index of the nearest route point to a clicked lat/lng
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

    // Find nearest track elevation
    function getNearestTrackElevation(lat, lon) {
        let minDist = Infinity;
        let ele = null;

        routePoints.forEach(pt => {
            if (pt.ele === null) return;

            const d = map.distance(
                L.latLng(lat, lon),
                L.latLng(pt.lat, pt.lon)
            );

            if (d < minDist) {
                minDist = d;
                ele = pt.ele;
            }
        });

        return ele;
    }

    // Export the split GPX segments
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

        // Sort split points by index
        const indexes = splitMarkers.map(m => m._routeIndex).sort((a, b) => a - b);

        // Slice the track into segments based on split points
        const segments = [];
        let startIdx = 0;

        indexes.forEach(idx => {
            segments.push(routePoints.slice(startIdx, idx + 1));
            startIdx = idx;
        });
        segments.push(routePoints.slice(startIdx));

        // Generate GPX files for each segment
        segments.forEach((pts, i) => {
            const partNumber = i + 1;
            const filename = `${baseName}-Part-${partNumber}.gpx`;
            const blob = generateGPXBlob(pts, partNumber, baseName);
            const url = URL.createObjectURL(blob);
            const sizeKB = (blob.size / 1024).toFixed(1);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.innerHTML = `<span>Part ${partNumber}: ${filename}</span><span class="filesize">${sizeKB} KB</span>`;

            downloadList.appendChild(link);
        });

        hasExported = true;
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('gpxInput').disabled = true;
        document.querySelector('.file-upload').style.pointerEvents = 'none';

        setStep(3);
    }

    // Generate a GPX Blob for a given segment
    function generateGPXBlob(points, partNumber = 1, baseName) {
        // Track points
        const trkpts = points.map(p => `<trkpt lat="${p.lat}" lon="${p.lon}">${p.ele !== null ? `<ele>${p.ele}</ele>` : ``}</trkpt>`).join('');

        // Waypoints (optional) with name, type and symbol
        const wptStr = waypoints.map(wpt => `<wpt lat="${wpt.lat}" lon="${wpt.lon}">${wpt.ele !== null ? `<ele>${wpt.ele}</ele>` : ``}${wpt.name ? `<name>${wpt.name}</name>` : ``}${wpt.type ? `<type>${wpt.type}</type>` : ``}${wpt.sym ? `<sym>${wpt.sym}</sym>` : ``}</wpt>`).join('');

        // Assemble full GPX
        const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="GPX Route Splitter" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${baseName} - Part ${partNumber}</name></metadata>${wptStr}<trk><name>${baseName} - Part ${partNumber}</name><trkseg>${trkpts}</trkseg></trk></gpx>`;

        return new Blob([gpx], { type: 'application/gpx+xml' });
    }

    // Reset the app to initial state
    function resetApp() {
        if (routeLayer) map.removeLayer(routeLayer);
        splitMarkers.forEach(m => map.removeLayer(m));
        if (startMarker) map.removeLayer(startMarker);
        if (endMarker) map.removeLayer(endMarker);
        waypointMarkers.forEach(m => map.removeLayer(m));

        splitMarkers = [];
        routePoints = [];
        routeLayer = null;
        startMarker = null;
        endMarker = null;
        waypointMarkers = [];

        document.getElementById('gpxInput').value = '';
        document.getElementById('gpxInput').disabled = false;
        document.querySelector('.file-upload-text').textContent = 'No file chosen...';
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('downloadSection').style.display = 'none';
        document.querySelector('.file-upload').style.pointerEvents = 'auto';

        hasExported = false;

        map.off('click', handleSplitClick);
        map.setView([0, 0], 2);

        distanceMarkers.forEach(m => map.removeLayer(m));
        distanceMarkers = [];

        setStep(0);
    }

    // Init event listeners
    if (!hasExported && splitMarkers.length === 0) {
        setStep(1);
    }

    document.getElementById('gpxInput').addEventListener('change', handleFile);
    document.getElementById('exportBtn').addEventListener('click', exportGPX);
    document.getElementById('resetBtn').addEventListener('click', resetApp);

    setStep(0);
});
