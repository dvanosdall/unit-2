

document.addEventListener("DOMContentLoaded", function () {
    const mymap = L.map('mymap').setView([20, 0], 2); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(mymap);

    fetch('./data/all_month.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const top25Features = data.features.slice(0, 100);
            console.log('Top 25 features:', top25Features);
            L.geoJSON(top25Features, {
                pointToLayer: (feature, latlng) => {
                    const mag = feature.properties.mag;
                    const color = mag > 5 ? 'red' : mag > 3 ? 'orange' : 'yellow';
                    return L.circleMarker(latlng, {
                        radius: mag * 2, // Scale by magnitude
                        fillColor: color,
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
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
            }).addTo(mymap);
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
        });
});
