<?php
include 'head.php';
include 'header.php';
?>

<main>
    <div class="container">
        <a href="/" class="back-button">Back to home</a>
        <h1>Privacy Notice</h1>
        <p><strong>GPX Route Splitter processes your GPX files entirely within your web browser.</strong></p>
        <ul>
            <li>
                <strong>No file uploads:</strong> Your GPX files are never uploaded to a server. All parsing, map
                interaction and splitting happens locally in your device's browser.
            </li>
            <li>
                <strong>No data storage:</strong> The app does not store your GPX files, routes, waypoints or location
                data. Once you close or refresh the page, all data is removed.
            </li>
            <li>
                <strong>No tracking or analytics:</strong> The app does not use cookies, analytics tools, trackers or
                advertising services.
            </li>
            <li>
                <strong>Map data:</strong> Map tiles are loaded from <a href="https://www.openstreetmap.org" target="_blank" rel="nofollow noopener" class="link">OpenStreetMap</a> (OSM), a free,
                editable and open-source map of the world. OSM may receive standard technical requests (such as your IP
                address) when tiles are loaded. This is normal browser and connection functionality.
            </li>
            <li>
                <strong>File downloads:</strong> Any split GPX files are generated locally in your browser and
                downloaded directly to your device. There is no caching or server-side storage.
            </li>
        </ul>
        <p>For more information please contact <a href="mailto:info@jameselsey.com" class="link">info@jameselsey.com</a>.</p>
    </div>
</main>

<?php
include 'footer.php';
include 'base.php';
?>
