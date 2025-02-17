/* main file by Dave Vanosdall 2025 */
/*******************************************
 *  Activity 5: Leaflet Tutorials and Lab Dataset
 *  Dave Vanosdall 
 *  In the data folder in the readme file you will see the source of the data, 
 *  I will include here as well
 * * https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson
 * * Where I got the free image for the arrow(s) https://pngtree.com/freepng/vector-arrows--arrow-icon--arrow-vector-icon--arrow--arrows-vector-collection_4294132.html
 ******************************************/

// Wait until the webpage is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map
    const mymap = initializeMap();

    // Add tile layer from OpenStreetMap to the map
    addTileLayer(mymap);

    // Fetch GeoJSON data from the 'data' folder
    fetchGeoJSONData(mymap);
});

// Initialize the map
function initializeMap() {
    // Centered at the equator, zoom level 2
    // I went with this view since my earthquakes are all around the world
    return L.map('mymap').setView([20, 0], 2);
}

// Add tile layer from OpenStreetMap to the map
function addTileLayer(mymap) {
    // added this tileset https://leaflet-extras.github.io/leaflet-providers/preview/#filter=Stadia.AlidadeSmoothDark  
    // this helps make the eq's pop
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'png'
    }).addTo(mymap);
}

// Fetch GeoJSON data from the 'data' folder
function fetchGeoJSONData(mymap) {
    fetch('./data/all_month.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`A HTTP error has occurred - status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Some of the data is less than 0 or 0, so I filtered those out.
            const top100Features = data.features.filter(feature => feature.properties.mag > 0).slice(0, 100);
            const minMag = Math.min(...top100Features.map(feature => feature.properties.mag));
            // console.log('Top 100 features:', top100Features);  FOR DEBUG
            const attributes = processData(top100Features);
            createSequenceControls(mymap, top100Features, minMag, attributes);
        })
        .catch(error => {
            // Handle errors related to loading the GeoJSON file
            if (error instanceof SyntaxError) {
                console.error('An Error parsing the JSON data has occurred:', error);
            } else {
                console.error('An Error loading the GeoJSON data has occurred:', error);
            }
        });
}

function processData(top100Features) {
    //get the magnitude values
    const magnitudes = top100Features.map(feature => feature.properties.mag);

    //calculate the quantiles
    const quantiles = [];
    for (var i = 1; i <= 8; i++) {
        quantiles.push(percentile(magnitudes, i / 8 * 100));
    }

    //create the bins
    var magBins = [];
    for (var i = 0; i < 8; i++) {
        magBins.push({
            min: quantiles[i],
            max: quantiles[i + 1] || Infinity,
            values: []
        });
    }

    //assign the data to the mag bins
    magnitudes.forEach(magnitude => {
        for (var i = 0; i < 8; i++) {
            if (magnitude >= magBins[i].min && magnitude < magBins[i].max) {
                magBins[i].values.push(magnitude);
                break;
            }
        }
    });

    //check result
    console.log(magBins);

    return magBins;
}

//calculate the percentile
function percentile(arr, p) {
    arr.sort((a, b) => a - b);
    let index = (arr.length - 1) * p / 100;
    let lower = Math.floor(index);
    let upper = Math.ceil(index);
    if (upper - lower === 1) {
        return arr[lower];
    } else {
        return (arr[lower] + arr[upper]) / 2;
    }
}

// Add GeoJSON layer to the map
function addGeoJSONLayer(mymap, features, minMag) {
    L.geoJSON(features, {
        // Customize the point style based on earthquake magnitude
        pointToLayer: (feature, latlng) => {
            const mag = feature.properties.mag;
            //console.log('mag:', mag); FOR DEBUG
            //console.log('minMag:', minMag); FOR DEBUG
            const radius = Math.max(1.0083 * Math.pow(mag / minMag, 0.5715), 5);
            //console.log('radius:', radius); FOR DEBUG
            const color = mag > 5 ? 'darkred' : mag > 4 ? 'red' : mag > 3 ? 'orangered' : mag > 2 ? 'darkorange' : mag > 1 ? 'orange' : 'yellow';
            //console.log(radius); FOR DEBUG

            // Create a circle marker with properties based on the magnitude
            return L.circleMarker(latlng, {
                radius: radius,
                fillColor: color,
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        // Add popup to each feature showing earthquake details
        onEachFeature: (feature, layer) => {
            if (feature.properties) {
                layer.bindPopup(
                    `<strong>Location:</strong> ${feature.properties.place}<br>
                     <strong>Magnitude:</strong> ${feature.properties.mag}<br>
                     <strong>Depth:</strong> ${feature.geometry.coordinates[2]} km<br>
                     <strong>Time:</strong> ${new Date(feature.properties.time).toLocaleString()}<br>
                     <a href="${feature.properties.url}" target="_blank">More Info</a>`,
                    {
                        offset: new L.Point(0, -layer.options.radius / 3)
                    }
                );
            }
        }
    }).addTo(mymap);
}

// Create sequence controls for the map
function createSequenceControls(mymap, top100Features, minMag, attributes) {
    // Get the slider and bucket range elements
    const sliderElement = document.querySelector(".range-slider");
    const bucketRangeElement = document.querySelector(".magnituderange");
    const circleLayerGroup = L.layerGroup().addTo(mymap);
    const showAllEarthquakesCheckbox = document.querySelector("#showalleqs");

    // Initialize the slider
    initializeSlider(sliderElement, attributes);

    // Add event listeners to the slider and arrow buttons
    addEventListeners(sliderElement, circleLayerGroup, bucketRangeElement, top100Features, minMag, attributes);

    // Update the bucket range text initially
    updateMagnitudeRangeText(sliderElement, bucketRangeElement, attributes);

    // Add initial circle layers to the map
    const initialBin = attributes[0];
    const initialFilteredFeatures = top100Features.filter(feature => initialBin.values.includes(feature.properties.mag));
    addGeoJSONLayer(circleLayerGroup, initialFilteredFeatures, minMag);

    // Remove initial circle layers when slider is moved
    sliderElement.addEventListener("input", () => {
        if (!showAllEarthquakesCheckbox.checked) {
            circleLayerGroup.clearLayers();
            const value = sliderElement.value;
            const bin = attributes[value % attributes.length];
            const filteredFeatures = top100Features.filter(feature => bin.values.includes(feature.properties.mag));
            addGeoJSONLayer(circleLayerGroup, filteredFeatures, minMag);
        }
    });

    // Show all earthquakes when checkbox is checked
    showAllEarthquakesCheckbox.addEventListener("change", () => {
        if (showAllEarthquakesCheckbox.checked) {
            circleLayerGroup.clearLayers();
            addGeoJSONLayer(circleLayerGroup, top100Features, minMag);
        } else {
            circleLayerGroup.clearLayers();
            const value = sliderElement.value;
            const bin = attributes[value % attributes.length];
            const filteredFeatures = top100Features.filter(feature => bin.values.includes(feature.properties.mag));
            addGeoJSONLayer(circleLayerGroup, filteredFeatures, minMag);
        }
    });
}

// Initialize the slider element
function initializeSlider(sliderElement, attributes) {
    // Set the slider's max, min, value, and step
    sliderElement.max = attributes.length - 1;
    sliderElement.min = 0;
    sliderElement.value = 0;
    sliderElement.step = 1;
}

// Add event listeners to the slider and arrow buttons
function addEventListeners(sliderElement, circleLayerGroup, bucketRangeElement, top100Features, minMag, attributes) {
    // Add event listener to the slider
    sliderElement.addEventListener("input", () => {
        // Get the current slider value and corresponding bin
        const value = sliderElement.value;
        const bin = attributes[value % attributes.length];

        // Filter features based on the bin's values
        const filteredFeatures = top100Features.filter(feature => bin.values.includes(feature.properties.mag));

        // Clear the circle layer group and add new circle layers
        circleLayerGroup.clearLayers();
        addGeoJSONLayer(circleLayerGroup, filteredFeatures, minMag);

        // Update the bucket range text
        updateMagnitudeRangeText(sliderElement, bucketRangeElement, attributes);
    });

    // Add event listener to the left arrow button
    const leftArrowElement = document.querySelector("#leftArrow");
    leftArrowElement.addEventListener("click", () => {
        // Decrement the slider value and update the circle layers and bucket range text
        const currentValue = sliderElement.value;
        sliderElement.value = (parseInt(currentValue) - 1 + attributes.length) % attributes.length;
        const bin = attributes[sliderElement.value];
        const filteredFeatures = top100Features.filter(feature => bin.values.includes(feature.properties.mag));
        circleLayerGroup.clearLayers();
        addGeoJSONLayer(circleLayerGroup, filteredFeatures, minMag);
        updateMagnitudeRangeText(sliderElement, bucketRangeElement, attributes);
    });

    // Add event listener to the right arrow button
    const rightArrowElement = document.querySelector("#rightArrow");
    rightArrowElement.addEventListener("click", () => {
        // Increment the slider value and update the circle layers and bucket range text
        const currentValue = sliderElement.value;
        sliderElement.value = (parseInt(currentValue) + 1) % attributes.length;
        const bin = attributes[sliderElement.value];
        const filteredFeatures = top100Features.filter(feature => bin.values.includes(feature.properties.mag));
        circleLayerGroup.clearLayers();
        addGeoJSONLayer(circleLayerGroup, filteredFeatures, minMag);
        updateMagnitudeRangeText(sliderElement, bucketRangeElement, attributes);
    });
}

// Update the bucket range text element
function updateMagnitudeRangeText(sliderElement, bucketRangeElement, attributes) {
    // Get the current bin and update the bucket range text
    const bin = attributes[sliderElement.value];
    const rangeText = `Magnitude Range: ${bin.min} - ${bin.max === Infinity ? 10 : bin.max}`;
    bucketRangeElement.textContent = rangeText;
}

