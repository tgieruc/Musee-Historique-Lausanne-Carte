// Initialize the map
var map = L.map('map').setView([46.522935, 6.6322734], 13);
map.zoomControl.setPosition('bottomright');

// L.tileLayer.provider('Stadia.StamenWatercolor').addTo(map);

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

// }).addTo(map);
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
}).addTo(map);

// Add the geolocation control
L.control.locate({
    position: 'topright', // Position of the locate button
    strings: {
        title: "Show me where I am" // Text for the locate button
    },
    flyTo: true // Fly to the user location with animation
}).addTo(map);

// Year Range Slider Initialization
let maxYear = 2009;
let minYear = 1808;

window.onload = function() {
    let slider = document.getElementById("slider");
    noUiSlider.create(slider, {
        start: [minYear, maxYear],
        connect: true,
        step: 1,
        tooltips: [
            wNumb({decimals: 0}),
            wNumb({decimals: 0}),
        ],
        range: {
            min: 1808,
            max: 2009
        }
    });

    min_element = document.getElementById("min");
    max_element = document.getElementById("max");

    // Update map when the slider values change
    slider.noUiSlider.on("update", function (values, handle) {
        let slider_values = slider.noUiSlider.get();
        minYear = parseInt(slider_values[0]);
        maxYear = parseInt(slider_values[1]);

        // Automatically update the map based on the new year range
        update_map();
    });
};

// Function to update the map based on the year range
function update_map() {
    markers.clearLayers();
    json.forEach(createMarker);
    map.addLayer(markers);
    map.invalidateSize();
}

// Initialize marker cluster
var markers = L.markerClusterGroup();
json.forEach(createMarker);
map.addLayer(markers);

// Function to create a marker
function createMarker(value) {
    var marker = L.marker(new L.LatLng(value.latitude, value.longitude), { title: value.title });
    var yearOptions = '';
    var galleryContentByYear = {};

    value.years.forEach(year_elem => {
        if (year_elem.year >= minYear && year_elem.year <= maxYear) {
            yearOptions += `<option value="${year_elem.year}">${year_elem.year}</option>`;
            galleryContentByYear[year_elem.year] = '';

            year_elem.images.forEach(img => {
                galleryContentByYear[year_elem.year] += `
                    <div class="image">
                        <img src="${img.url}" alt="Image" class="img_gallery" style="max-width: 100%; margin-bottom: 10px;">
                        <div class="caption"><strong>${img.id}</strong><br>${img.description}</div>
                    </div>`;
            });
        }
    });

    if (yearOptions) {
        marker.on('click', function() {
            // Update the gallery panel with the year selector and images
            document.getElementById("gallery").innerHTML = `
                <div>
                    <label for="year-select">Select Year:</label>
                    <select id="year-select" onchange="updateGalleryContent('${value.title}')">
                        ${yearOptions}
                    </select>
                </div>
                <div id="year-gallery"></div>
            `;

            // Show the gallery content for the initially selected year
            document.getElementById("year-gallery").innerHTML = galleryContentByYear[document.getElementById("year-select").value];

            // Store the content by year for easy access during year change
            window.galleryContentByYear = galleryContentByYear;
        });

        markers.addLayer(marker);
    }
}

// Function to update gallery content when a year is selected
function updateGalleryContent(markerTitle) {
    const selectedYear = document.getElementById("year-select").value;
    document.getElementById("year-gallery").innerHTML = window.galleryContentByYear[selectedYear];
}

// Adjust the map to fit all markers
map.fitBounds(markers.getBounds());
