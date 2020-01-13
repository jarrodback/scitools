const areaOfUk = 242495;
var imageData = [];
var layerData = [];
var counties = [];
let map;
var intWaters = 0;
var authenication;
let authToken;
var searchInAction = false;
var arrcreated = false;
var before_load = new Date().getTime();
var aftr_loadtime
var countiesLength = 0;
var feaytslength = 0;
var totalmissions = 0;
var countiesData;
var ukbordersData;
var TempJank = [];

fetch('data/ukcounties.geojson')
    .then(Response => Response.text())
    .then((data) => {
        countiesData = JSON.parse(data);
    }
    )



fetch('data/ukBorders.geojson')
    .then(Response => Response.text())
    .then((data) => {
        ukbordersData = JSON.parse(data);
    }
    )

function authenticate() {
    data = new FormData();
    data.set('grant_type', 'password');
    data.set('username', 'Hallam1');
    data.set('password', 'dn2-fJSL');
    const postBody = "grant_type=password&username=Hallam1&password=dn2-fJSL";
    let request = new XMLHttpRequest();
    request.open('POST', 'https://hallam.sci-toolset.com/api/v1/token', true);
    request.send(data);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            var json = JSON.parse(request.responseText);
            authenication = {
                "access_token": json.access_token,
                "refresh_token": json.refresh_token,
                "expires_in": json.expires_in

            };
            authToken = 'Bearer ' + authenication.access_token;
            getProducts();
        }
    }

}
function initMap() {
    //console.log("init");

    map = L.map('map').setView([54.3138, -2.169], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    }).addTo(map);
    addCountiesToMap();
    authenticate();
}
function addCountiesToMap() {
    //console.log("adding");

    var myStyle = {
        "stroke": true,
        "color": "#ff0000",
        "weight": 1,
        "fill": true,
        "fillOpacity": 0,
        "opacity": 1
    };
    var geojsonLayer = new L.GeoJSON.AJAX("data/ukcounties.geojson", {
        style: myStyle,
        onEachFeature: function onEachFeature(feature, layer) {
            layer.bindPopup("Region: " + feature.properties.name);
        }
    });
    geojsonLayer.addTo(map);
}
function getProducts() {

    const postBody = "{\"size\":100, \"keywords\":\"\"}";//, \"strings\":[{\"field\":\"sceneimagery\",\"value\":[\"*\"],\"operator\":\"or\"}]}";
    let request = new XMLHttpRequest();
    request.open('POST', 'https://hallam.sci-toolset.com/discover/api/v1/products/search', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', authToken);
    request.setRequestHeader('Accept', '*/*');
    request.send(postBody);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            var json = JSON.parse(request.responseText);
            for (var x = 0; x < json.results.searchresults.length; x++) {
                getGeoJson(json.results.searchresults[x].id, function (geoJSONdata) {
                    //addToMap(geoJSONdata);
                    imageData.push(geoJSONdata)
                    missionsInCounties(geoJSONdata);

                });

            }

        }
    }


}
function getMissionById(id) {
    searchInAction = true;
    map.eachLayer(function (layer) {
        map.removeLayer(layer);
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
    }).addTo(map);
    addCountiesToMap();

    getGeoJson(id, function (geoJSONdata) {
        //addToMap(geoJSONdata);
        var mapLocation = geoJSONdata.properties.centre.split(",");
        map.flyTo({ lat: mapLocation[0], lng: mapLocation[1] });
        document.getElementById("currentMissionID").textContent = 'Mission ID: ' + geoJSONdata.properties.missionid;
        document.getElementById("currentArea").textContent = 'Mission Area: ' + geoJSONdata.properties.area;
        document.getElementById("currentCoverage").textContent = 'UK Coverage: ' + geoJSONdata.properties.percentage + '%';
        document.getElementById("currentID").textContent = 'ID: ' + geoJSONdata.properties.id;
    });

}
function getGeoJson(id, callback) {
    //console.log(id);
    let request = new XMLHttpRequest();
    request.open('GET', 'https://hallam.sci-toolset.com/discover/api/v1/products/' + id, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', authToken);
    request.setRequestHeader('Accept', '*/*');
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            var json = JSON.parse(request.responseText);
            var area = turf.area(turf.polygon(json.product.result.footprint.coordinates));
            area = ((area / 1000000));
            var percentage = (area / areaOfUk) * 100;
            var geojson =
                {
                    "type": "Feature",
                    "properties": {
                        "missionid": json.product.result.missionid,
                        "documentType": json.product.result.documentType,
                        "area": area,
                        "percentage": percentage,
                        "id": id,
                        "centre": json.product.result.centre
                    },
                    "geometry": json.product.result.footprint
                };
            callback(geojson);
        }
    }
}
function addToMap(data) {
    L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
            layerData.push(layer);
            //layer.bindPopup("Mission ID: " + feature.properties.missionid
            //    + '<br>Area: ' + parseFloat(feature.properties.area.toFixed(2)) + "km²"
            //    + '<br>Percentage Covered: ' + parseFloat(feature.properties.percentage.toFixed(6)) + "%"
            //    + '<br>ID: ' + feature.properties.id);
        }
    }).addTo(map);
}
var specElement = document.getElementById("searchbar");
var sidebar = document.getElementById("sidebar");

document.addEventListener('click', function (event) {
    var isClickInside = specElement.contains(event.target);
    var isSidebarInside = sidebar.contains(event.target);
    if (!isClickInside && !isSidebarInside && searchInAction == true) {
        getProducts();
        searchInAction = false;
    }
    if (isClickInside) {
        specElement.value = '';
    }
})
function missionsInCounties(missionGeoJSON) {           //Function that calculates the percentage of missions inside of a county divided by the total amount of missions
    //console.log(missionGeoJSON.geometry);
    if (arrcreated == false) {          // if the array has been created dont create a new one
        for (var i = 0; i < countiesData.features.length; i++) {            //create a array the size of the amount of countys
            counties.push({ name: countiesData.features[i].properties.name, missionsInside: 0, area: 0 });       //push starting values to the array
        }
        arrcreated = true;      //after the array has been created make it unable to create another
    }



    for (var o = 0; o < countiesData.features.length; o++) {

        for (var p = 0; p < countiesData.features[o].geometry.coordinates.length; p++) {

            //console.log(countiesData.features[i].geometry.coordinates[j][0].length);
            if (countiesData.features[o].geometry.coordinates[p][0].length >= 4) {

                if (countiesData.features[o].geometry.coordinates[p].length > 1) {

                    for (var i = 0; i < countiesData.features[o].geometry.coordinates[p].length; i++) {
                            TempJank.push(countiesData.features[o].geometry.coordinates[p][i])
                            var currentSegement = turf.polygon(TempJank);
                            var intersectarea = turf.intersect(currentSegement, missionGeoJSON.geometry);
                            TempJank = [];
                            if (intersectarea != undefined) {
                                console.log("addedToMap");
                                addToMap(intersectarea);
                        }

                    }
                }
                else {

                    var currentSegement = turf.polygon(countiesData.features[o].geometry.coordinates[p]);
                    var intersectarea = turf.intersect(currentSegement, missionGeoJSON.geometry);
                    if (intersectarea != undefined) {
                        console.log("addedToMap");
                        addToMap(intersectarea);
                    }
                }

            }
            else {
                console.log(countiesData.features[o].geometry.coordinates[p][0]);
            }
        }
        //console.log(countiesData.features[i].geometry);
        //console.log(turf.intersect(countiesData.features[i].geometry, missionGeoJSON.geometry));

    }













    for (var i = 0; i < countiesData.features.length; i++) {   //For the amount of counties loop
        for (var j = 0; j < missionGeoJSON.geometry.coordinates[0].length; j = j + 400) {         //for the amount of coordinates in the mission GEOjson loop
            if (d3.geoContains(countiesData.features[i], missionGeoJSON.geometry.coordinates[0][j])) {     // d3 check to see if it is in a county
                for (var p = 0; p < counties.length - 1; p++) {     //loop for the amount of counties there are minus international waters
                    if (countiesData.features[i].properties.name === counties[p].name) {    //if it is in a county add 1 to the county mission counter
                        counties[p].missionsInside++;
                        totalmissions++;
                    }
                }
            }
        }

        aftr_loadtime = new Date().getTime();       //code to work out total load time (testing)
        pgloadtime = (aftr_loadtime - before_load) / 1000
        //console.log(pgloadtime);
        for (var q = 0; q < counties.length; q++) { // loop calculates the percentage that each mission uses to 2 decimal places
            //console.log(counties[q].name + " has " + (((counties[q].missionsInside / totalmissions) * 100).toFixed(1)) + "% missions in it")
        }
    }

}



initMap();
