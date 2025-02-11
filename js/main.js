/* main file by Dave Vanosdall 2025 */
/*******************************************
 *  Activity 5: Leaflet Tutorials and Lab Dataset
 *  Dave Vanosdall 
 *  In the data folder in the readme file you will see the source of the data, 
 *  I will include here as well
 * * https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson
 ******************************************/

// Wait until the webpage is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map - Centered at the equator, zoom level 2
    // I went with this view since my earthquakes are all around the world
    const mymap = L.map('mymap').setView([20, 0], 2); 

    // Add tile layer from OpenStreetMap to the map
    // added this tileset https://leaflet-extras.github.io/leaflet-providers/preview/#filter=Stadia.AlidadeSmoothDark  
    // this helps make the eq's pop
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'png'
    }).addTo(mymap);

    // Fetch GeoJSON data from the 'data' folder
    fetch('./data/all_month.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`A HTTP error has occurred - status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const top100Features = data.features.slice(0, 100);
            console.log('Top 100 features:', top100Features);
            L.geoJSON(top100Features, {
                // Customize the point style based on earthquake magnitude
                pointToLayer: (feature, latlng) => {
                    const mag = feature.properties.mag;
                    const color = mag > 5 ? 'red' : mag > 3 ? 'orange' : 'yellow';

                    // Create a circle marker with properties based on the magnitude
                    return L.circleMarker(latlng, {
                        // Scale by magnitude
                        radius: mag * 2, 
                        // Color based on magnitude
                        fillColor: color,
                        // Border color
                        color: "#000",
                        // Border weight
                        weight: 1,
                        // Border opacity
                        opacity: 1,
                        // Fill opacity
                        fillOpacity: 0.8
                    });
                },
                // Add popup to each feature showing earthquake details
                // there is a bunch of info so we are going to dsiplay the important eq data 
                // the more info is really neat since the usgs has the url in teh data set
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        layer.bindPopup(
                           `<strong>Location:</strong> ${feature.properties.place}<br>
                             <strong>Magnitude:</strong> ${feature.properties.mag}<br>
                             <strong>Depth:</strong> ${feature.geometry.coordinates[2]} km<br>
                             <strong>Time:</strong> ${new Date(feature.properties.time).toLocaleString()}<br>
                             <a href="${feature.properties.url}" target="_blank">More Info</a>`
                        );
                    }
                }
                // Add the GeoJSON layer to the map
            }).addTo(mymap);
        })
        .catch(error => {
            // Handle errors related to loading the GeoJSON file
            if (error instanceof SyntaxError) {
                console.error('An Error parsing the JSON data has occurred:', error);
            } else {
                console.error('An Error loading the GeoJSON data has occurred:', error);
            }
        });
});
