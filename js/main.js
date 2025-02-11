// Add all scripts to the JS folder
// Initialize the map
var mymap = L.map('mapid').setView([51.505, -0.09], 13);

// Add tile layer
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(mymap);