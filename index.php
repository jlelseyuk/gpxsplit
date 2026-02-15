<?php
include 'head.php';
include 'header.php';
?>

<main>
    <div class="container">
        <div class="step-bar">
            <div id="stepFill" class="step-fill"></div>
        </div>

        <span id="status"></span>

        <form class="upload-form">
            <label class="file-upload">
                <input id="gpxInput" type="file" name="file" class="gpx-input-field">
                <span class="file-upload-button">Choose GPX File</span>
                <span class="file-upload-text">Choose a file...</span>
            </label>
            <button id="exportBtn" type="submit" class="submit-button" disabled>
                Export Split GPX Files
            </button>
        </form>

        <div id="splitSection" class="splits" style="display: none;">
            <h2>Split points added:</h2>

            <div id="splitList" class="split-list"></div>
        </div>

        <div id="downloadSection" class="download" style="display: none;">
            <h2>Download sequential split files:</h2>

            <div id="downloadList" class="download-list"></div>

            <a id="resetBtn" class="reset-button">
                Reset
            </a>
        </div>
    </div>

    <div id="map">
        <div class="custom-controls">
            <button id="waypointToggle" class="waypoint-toggle" style="display: none;">
                Waypoints: ON
            </button>
            <button id="unitToggle" class="unit-toggle">
                Units: km
            </button>
        </div>
    </div>
</main>

<?php include 'footer.php'; ?>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script src="/script.js?v=<?= filemtime('script.js') ?>"></script>

<?php include 'base.php'; ?>
