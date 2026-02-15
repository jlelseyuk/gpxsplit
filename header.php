<header>
    <a href="/" class="title">
        <h1>GPX Route Splitter</h1>
        <img src="logo.png" alt="GPX Route Splitter" loading="eager">
    </a>
    <p class="intro">
        <?php
        date_default_timezone_set('Europe/London');
        $hour = date("H");

        if ($hour >= 2 && $hour < 12) {
            $greeting = "Good morning! ";
        } elseif ($hour >= 12 && $hour < 17) {
            $greeting = "Good afternoon! ";
        } else {
            $greeting = "Good evening! ";
        }

        echo '<strong>' . $greeting . '</strong>';
        ?>
        Upload your GPX file and choose up to 10 split points. The file will then be split into sequential parts,
        ready for individual download.
    </p>
</header>
