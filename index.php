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

        <div id="downloadSection" class="download" style="display: none;">
            <h2>Download parts:</h2>

            <div id="downloadList" class="download-list"></div>

            <a id="resetBtn" class="reset-button">
                Reset
            </a>
        </div>
    </div>

    <div id="map">
        <button id="unitToggle" class="unit-toggle">
            Show km
        </button>
    </div>
</main>

<?php
include 'footer.php';
include 'base.php';
?>
