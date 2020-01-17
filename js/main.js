var areaOfUk = 0;
var areaData = [];
var startDates = [];
var imageData = [];
var layerData = [];
let map;
var markerGroup = L.layerGroup();
var activeSearch = false;
var searchQ = [];
var graphClicked = false;
var counties = [];
var missionsInUk = [];
var before_load = new Date().getTime();
var aftr_loadtime;
var totalmissions = 0;
var countiesData;
var ukbordersData;
var regionsData;
var arrcreated = false;
var missionsLoaded = false;
var totalAreaCoveredUK = 0;
var ukAreaCovered = 0;

///////////////////INIT MAP AND ADD POLYGONS/COUNTY///////////////////
//Initalise the map and add data from file or api 
function initMap() {
  //Create map and set a default view
map = L.map("map").setView([54.3138, -2.169], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 9,
  minZoom: 6
}).addTo(map);
//If file is there, load up file and add it to map layer
fetch("data/images.json")
  .then(response => response.text())
  .then(data => {
    setTimeout(function() {
      imageData = JSON.parse(data);
      resetData();
      repopulateMap();
      missionsLoaded = true;
    }, 1500);
    addCountiesToMap();
  })
  //If file not there, call the api and calculate instead
  .catch(error => {
    console.log(error);
    getProductGeoJSONPHP();
    getNewData();
    // setTimeout(function() {
    //   for (var x = 0; x < imageData.length; x++) {
    //     imageData[x].properties.area =
    //       turf.area(turf.polygon(imageData[x].geometry.coordinates)) /
    //       1000000;
    //     imageData[x].properties.percentage =
    //       (imageData[x].properties.area / areaOfUk) * 100;
    //     addToMap(imageData[x]);
    //   }
    //   missionsLoaded = true;
    //   document.getElementById("loadingScreen").style.display = "none";
    // }, 20000);
  });
fetch("data/counties.json")
  .then(response => response.text())
  .then(data => {
    counties = JSON.parse(data);
    showRegionHistogram();
  });
}
//Refresh with new API CALL
function getNewData() {
imageData = [];
getProductGeoJSONPHP();
setTimeout(function() {
  for (var x = 0; x < imageData.length; x++) {
    imageData[x].properties.area =
      turf.area(turf.polygon(imageData[x].geometry.coordinates)) / 1000000;
    imageData[x].properties.percentage =
      (imageData[x].properties.area / areaOfUk) * 100;
    addToMap(imageData[x]);
    dataSort();
  }
  document.getElementById("loadingScreen").style.display = "none";
}, 20000);
}
//Return  afill colour based on area paramter
function getAreaColour(feature) {
if (feature.properties.area < 100) {
  return { fillColor: "#FED976", color: "#FED976" };
} else if (feature.properties.area < 200) {
  return { fillColor: "#FEB24C", color: "#FEB24C" };
} else if (feature.properties.area < 300) {
  return { fillColor: "#FC4E2A", color: "#FC4E2A" };
} else if (feature.properties.area < 400) {
  return { fillColor: "#E31A1C", color: "#E31A1C" };
} else if (feature.properties.area < 500) {
  return { fillColor: "#BD0026", color: "#BD0026" };
} else {
  return { fillColor: "#800026", color: "#800026" };
}
}
//Load in counties file and add it to the geojson layer using custom styling
function addCountiesToMap() {
var myStyle = {
  stroke: true,
  color: "red",
  weight: 1,
  fill: true,
  fillOpacity: 0,
  opacity: 1
};
var geojsonLayer = new L.GeoJSON.AJAX("data/ukcounties.geojson", {
  style: myStyle,
  onEachFeature: function onEachFeature(feature, layer) {
    layer.bindPopup("Region: " + feature.properties.name);
  }
});
geojsonLayer.addTo(map);
console.log("Regional data has been added to the map");
}
//Function to add to map. Used for polygons to add popup event
function addToMap(data) {
var mystyle = getAreaColour(data);
var polygonLayer = L.geoJSON(data, {
  style: mystyle,
  onEachFeature: function(feature, layer) {
    layerData.push(layer);
    layer.bindPopup(
      "Mission ID: " +
        feature.properties.missionid +
        "<br>Area: " +
        parseFloat(feature.properties.area.toFixed(2)) +
        "km²" +
        "<br>Percentage Covered: " +
        parseFloat(feature.properties.percentage.toFixed(6)) +
        "%" +
        "<br>ID: " +
        feature.properties.id +
        '<br><a href="#" class="popupSearchMissionId">Search this Mission</a>' +
        '<br><a href="#" class="popupSearchPolygonId">Search this ID</a>'
    );
  }
});
polygonLayer.addTo(map).bringToFront();
dataSort();
}
//Reset the map data to whats in image data
function repopulateMap() {
for (var x = 0; x < imageData.length; x++) {
  addToMap(imageData[x]);
}
}

function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}
initMap();

map.on("popupopen", function(feature) {
var missionid = feature.popup._source.feature.properties.missionid;
var id = feature.popup._source.feature.properties.id;
$(".popupSearchMissionId").click(function() {
  document.getElementById("searchbar").value = missionid;
  getMissionType(document.getElementById("searchbar").value);
});
$(".popupSearchPolygonId").click(function() {
  document.getElementById("searchbar").value = id;
  getMissionType(document.getElementById("searchbar").value);
});

var acc = document.getElementsByClassName("popupSearchMissionId");
var i;
for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    var panel = document.getElementsByClassName("panel")[1];
    panel.style.maxHeight = panel.scrollHeight + "px";
  });
}
var acc1 = document.getElementsByClassName("popupSearchPolygonId");
var i2;
for (i2 = 0; i2 < acc.length; i2++) {
  acc1[i2].addEventListener("click", function() {
    var panel = document.getElementsByClassName("panel")[1];
    panel.style.maxHeight = panel.scrollHeight + "px";
  });
}
});
//Go through every point and calculate interesctions. use worker to use in background.
function missionsInCounties() {
  //Function that calculates the percentage of missions inside of a county divided by the total amount of missions
  var worker = new Worker("js/worker.js");
  // turf simplify, turf cleancoords, turf polygon, turf intersect, turf area, d3 geocontains
  worker.postMessage([
    imageData,
    arrcreated,
    regionsData.features,
    countiesData.features,
    areaOfUk
  ]);

  worker.onmessage = function(e) {
    counties = e.data[0];
    missionsInUk = e.data[1];

    aftr_loadtime = new Date().getTime(); //code to work out total load time (testing)
    pgloadtime = (aftr_loadtime - before_load) / 1000;
    console.log(pgloadtime);
    console.log(counties, missionsInUk, JSON.stringify(counties));
    worker.terminate();
    for (var u = 0; u < imageData.length; u++) {
      missionGeoJSON = imageData[u];
      for (var i = 0; i < regionsData.features.length; i++) {
        //For the amount of counties loop
        for (
          var j = 0;
          j < missionGeoJSON.geometry.coordinates[0].length;
          j = j + 1
        ) {
          //for the amount of coordinates in the mission GEOjson loop
          if ( d3.geoContains(       regionsData.features[i],      missionGeoJSON.geometry.coordinates[0][j]       )
          ) { // d3 check to see if it is in a county
            for (var p = 0; p < counties.length; p++) {
              //loop for the amount of counties there are minus international waters
              if (
                regionsData.features[i].properties.name === counties[p].name
              ) {
                //if it is in a county add 1 to the county mission counter
                counties[p].missionsInside++;
                totalmissions++;
              }
            }
          }
        }
      }
    }
    for (var i = 0; i < missionsInUk.length; i++) {
      totalAreaCoveredUK += turf.area(missionsInUk[i]) / 1000000;
      for (var j = 0; j < missionsInUk.length; j++) {
        if (i == j) {
          j++;
        }
        if (j == missionsInUk.length) {
          break;
        }
        var tempcheck = turf.intersect(missionsInUk[i], missionsInUk[j]);
        if (tempcheck != undefined) {
          totalAreaCoveredUK =
            totalAreaCoveredUK - turf.area(tempcheck) / 1000000;
        }
      }
    }
    ukAreaCovered = parseFloat((totalAreaCoveredUK / areaOfUk) * 100).toFixed(
      2
    );
    console.log(ukAreaCovered + "% of the UK is covered");
    aftr_loadtime = new Date().getTime(); //code to work out total load time (testing)
    pgloadtime = (aftr_loadtime - before_load) / 1000;
    console.log(pgloadtime);
    console.log(counties, missionsInUk, JSON.stringify(counties));
    imageData = [];
    imageData = missionsInUk;

    resetData();
    repopulateMap();

    saveFile(imageData);
    saveCounties(counties);
    showRegionHistogram();
  };

  document.getElementById("loadingScreen").style.display = "none";
}

//LEGEND//
var legend = L.control({ position: "topright" });
legend.onAdd = function(map) {
  var div = L.DomUtil.create("div", "info legend"),
    grades = ["#FED976", "#FEB24C", "#FC4E2A", "#BD0026", "#800026"];
  div.innerHTML += "<h4>Land Coverage (km²)</h4>";
  div.innerHTML += '<i style="background: #FED976"></i><span><100</span><br>';
  div.innerHTML +=
    '<i style="background: #FEB24C"></i><span>100-199</span><br>';
  div.innerHTML +=
    '<i style="background: #FC4E2A"></i><span>200-299</span><br>';
  div.innerHTML +=
    '<i style="background: #E31A1C"></i><span>300-399</span><br>';
  div.innerHTML +=
    '<i style="background: #BD0026"></i><span>400-499</span><br>';
  div.innerHTML += '<i style="background: #800026"></i><span>500+</span><br>';
  return div;
};
legend.addTo(map);