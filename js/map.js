// Initialize the map
var map = L.map('map').setView([46.522935, 6.6322734], 13);
map.zoomControl.setPosition('bottomright');

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

function createMarker(value) {
    var marker = L.marker(new L.LatLng(value.latitude, value.longitude), { title: value.title });
    var yearOptions = '';
    var galleryContentByYear = {};

    value.years.forEach(year_elem => {
        if (year_elem.year >= minYear && year_elem.year <= maxYear) {
            yearOptions += `<option value="${year_elem.year}">${year_elem.year}</option>`;
            galleryContentByYear[year_elem.year] = '';

            year_elem.images.forEach(img => {
                // Extract the ID from the img.url
                var imgIdMatch = img.url.match(/id=(\d+)/);
                var imgId = imgIdMatch ? imgIdMatch[1] : null;

                if (imgId) {
                    galleryContentByYear[year_elem.year] += `
                        <div class="image"  style="text-align: center;">
                            <img src="${img.url}" alt="Image" class="img_gallery" style="max-width: 100%; margin-bottom: 10px;">
                            <div class="caption">
                                <a href="https://museris.lausanne.ch/SGCM/Consultation.aspx?id=${imgId}&Source=search_result.aspx" target="_blank" class="more-info-link">
                                    More information
                                </a>
                                <br>${img.description}
                            </div>
                        </div>`;
                }
            });
        }
    });

    if (yearOptions) {
        marker.on('click', function() {
            // Show the overlay
            document.getElementById("overlay").style.display = "block";

            // Update the overlay content with the year selector and images
            document.getElementById("overlay-gallery").innerHTML = `
                <div>
                    <label for="year-select">Choisir l'anné:</label>
                    <select id="year-select" onchange="updateOverlayGalleryContent('${value.title}')">
                        ${yearOptions}
                    </select>
                </div>
                <div id="overlay-year-gallery"></div>
            `;

            // Show the gallery content for the initially selected year
            document.getElementById("overlay-year-gallery").innerHTML = galleryContentByYear[document.getElementById("year-select").value];

            // Store the content by year for easy access during year change
            window.galleryContentByYear = galleryContentByYear;
        });

        markers.addLayer(marker);
    }
}



// Function to update overlay gallery content when a year is selected
function updateOverlayGalleryContent(markerTitle) {
    const selectedYear = document.getElementById("year-select").value;
    document.getElementById("overlay-year-gallery").innerHTML = window.galleryContentByYear[selectedYear];
}

// Close the overlay when the close button is clicked
document.getElementById("close-overlay").onclick = function() {
    document.getElementById("overlay").style.display = "none";
};

// Adjust the map to fit all markers
map.fitBounds(markers.getBounds());

// Function to close the overlay
function closeOverlay() {
    document.getElementById("overlay").style.display = "none";
}

// Close the overlay when the close button is clicked
document.getElementById("close-overlay").onclick = function() {
    closeOverlay();
};

// Close the overlay when clicking outside of the overlay content
document.getElementById("overlay").onclick = function(event) {
    if (event.target === document.getElementById("overlay")) {
        closeOverlay();
    }
};

// Close the overlay when pressing the Esc key
document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeOverlay();
    }
});
