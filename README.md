# GPX Route Splitter

A web-based tool that lets you upload a GPX file, visualise the route on an interactive map, and split it into multiple sequential segments for download.

Built with JavaScript and Leaflet, it's designed for cyclists, runners and hikers who want to break long routes into manageable parts.

---

## Features

- Upload and parse GPX route files
- Visualise routes on an interactive map
- Click anywhere on the route to create up to 10 split points
- Automatically split GPX into sequential segments
- Download each segment as a separate GPX file
- Toggle:
  - Units (km / miles)
  - Waypoint visibility
- Displays:
  - Distance markers along the route
  - Elevation (when available)
  - Start / end markers
  - Waypoints from GPX files
- Step-based progress UI for workflow clarity

---

## Demo

Upload a `.gpx` file → click on map to add split points → export segments → download files.

---

## Tech Stack

- PHP (for simple templating and cache-busting assets)
- Vanilla JavaScript (no framework)
- Leaflet.js for mapping
- OpenStreetMap tiles

---

## Installation

Simply clone the respository and run it locally or publicly on your own server.

---

## Usage

- Click Choose GPX File
- Upload your `.gpx` route
- The route will appear on the map
- Click on the route to add split points (max 10)
- Click **Export Split GPX Files**
- Download generated segments

---

## How it works

### 1. GPX Parsing

The app parses:

- `<trkpt>` for route geometry
- `<wpt>` for waypoints

### 2. Map Rendering

The route is drawn as a polyline using Leaflet and OpenStreetMap tiles.

### 3. Split Logic

When you click the map:

- The nearest route point is found
- Its index is stored
- The route is sliced at those indices during export

### 4. Export

Each segment is converted back into valid GPX XML (`.gpx`) and make available as a downloadable file.

---

## Notes

- Maximum of 10 split points
- Splits are snapped to nearest track point
- No server-side processing (everything runs in your browser)
- Large route/tracks may reduce performance
- No data is saved to a server

---

## Credits

- Map data © [OpenStreetMap](https://www.openstreetmap.org) contributors
- [Leaflet](https://leafletjs.com)

---

## License

MIT

