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
                    addToMap(geoJSONdata);
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
        addToMap(geoJSONdata);
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
            layer.bindPopup("Mission ID: " + feature.properties.missionid
                + '<br>Area: ' + parseFloat(feature.properties.area.toFixed(2)) + "km²"
                + '<br>Percentage Covered: ' + parseFloat(feature.properties.percentage.toFixed(6)) + "%"
                + '<br>ID: ' + feature.properties.id);
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
function missionsInCounties(missionGeoJSON) {
    fetch('data/ukcounties.geojson')
        .then(Response => Response.text())
        .then((data) => {
            feats = JSON.parse(data);
            fetch('data/ukBorders.geojson')
                .then(Response => Response.text())
                .then((data) => {
                    ukborder = JSON.parse(data);
                    if (arrcreated == false) {
                        for (var i = 0; i < feats.features.length; i++) {
                            counties.push({ name: feats.features[i].properties.name, missionsInside: 0 });
                            countiesLength = counties.length;
                            feaytslength = feats.features.length;
                        }
                    }

                    var missionlength = missionGeoJSON.geometry.coordinates[0].length;
                    arrcreated = true;
                    for (var i = 0; i < feaytslength; i++) {
                        for (var j = 0; j < missionlength; j = j + 144)
                            if (d3.geoContains(feats.features[i], missionGeoJSON.geometry.coordinates[0][j])) {
                                for (var p = 0; p < countiesLength; p++) {
                                    if (feats.features[i].properties.name === counties[p].name) {
                                        counties[p].missionsInside++;
                                    }
                                }
                                if (!d3.geoContains(ukborder.features, missionGeoJSON.geometry.coordinates[0][j])) {
                                    intWaters++;
                                }
                            }


                    }
                    aftr_loadtime = new Date().getTime();
                    pgloadtime = (aftr_loadtime - before_load) / 1000
                    console.log(pgloadtime);
                    var totalmissions = 0;
                    for (var i = 0; i < countiesLength; i++) {
                        totalmissions = totalmissions + counties[i].missionsInside;
                    }
                    totalmissions = totalmissions + intWaters;
                    for (var i = 0; i < countiesLength; i++) {
                        console.log(counties[i].name + " has " + (((counties[i].missionsInside/totalmissions)*100).toFixed(2)) + "% missions in it")
                    }
                    console.log("There are " + ((intWaters/totalmissions)*100).toFixed(2) + "% of Missions in international water")
                }
                )
        }
        )
}



initMap();
