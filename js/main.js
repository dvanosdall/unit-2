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
            // Some of the data is less then 0 or 0 so I filtered those out.
            const top100Features = data.features.filter(feature => feature.properties.mag > 0).slice(0, 100);
            const minMag = Math.min(...top100Features.map(feature => feature.properties.mag));
            // console.log('Top 100 features:', top100Features);  FOR DEBUG
            addGeoJSONLayer(mymap, top100Features, minMag);
            var attributes = processData(top100Features);
            createSequenceControls();
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

function processData(top100Features){
    //get the magnitude values
    var magnitudes = top100Features.map(feature => feature.properties.mag);

    //calculate the quantiles
    var quantiles = [];
    for (var i = 1; i <= 8; i++) {
        quantiles.push(percentile(magnitudes, i / 8 * 100));
    }

    //create the bins
    var bins = [];
    for (var i = 0; i < 8; i++) {
        bins.push({
            min: quantiles[i],
            max: quantiles[i + 1] || Infinity,
            values: []
        });
    }

    //assign the data to the bins
    magnitudes.forEach(magnitude => {
        for (var i = 0; i < 8; i++) {
            if (magnitude >= bins[i].min && magnitude < bins[i].max) {
                bins[i].values.push(magnitude);
                break;
            }
        }
    });

    //check result
    console.log(bins);

    return bins;
}

//calculate the percentile
function percentile(arr, p) {
    arr.sort((a, b) => a - b);
    var index = (arr.length - 1) * p / 100;
    var lower = Math.floor(index);
    var upper = Math.ceil(index);
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
            const radius = Math.max(1.0083 * Math.pow(mag/minMag, 0.5715), 5);
            //console.log('radius:', radius); FOR DEBUG
            const color = mag > 5 ? 'red' : mag > 3 ? 'orange' : 'yellow';
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
                        offset: new L.Point(0, -layer.options.radius/3)
                    }
                );
            }
        }
    }).addTo(mymap);
}

function createSequenceControls() {
    // Add event listener to slider
    var sliderElement = document.querySelector(".range-slider");
    sliderElement.max = 8;
    sliderElement.min = 0;
    sliderElement.value = 0;
    sliderElement.step = 1;

    sliderElement.addEventListener("input", function() {
      // Update the map based on the slider value
      var value = this.value;
      console.log("Slider value:", value);
      // TO DO: update the map based on the slider value
    });
  
    // Add event listener to step backward button
    var leftArrowElement = document.querySelector("#leftArrow");
    leftArrowElement.addEventListener("click", function() {
      var currentValue = sliderElement.value;
      sliderElement.value = parseInt(currentValue) - 1;
      console.log("Slider value:", sliderElement.value);
      // TO DO: update the map based on the slider value
    });
  
    // Add event listener to step forward button
    var rightArrowElement = document.querySelector("#rightArrow");
    rightArrowElement.addEventListener("click", function() {
      var currentValue = sliderElement.value;
      sliderElement.value = parseInt(currentValue) + 1;
      console.log("Slider value:", sliderElement.value);
      // TO DO: update the map based on the slider value
    });
  }