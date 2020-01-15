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

fetch("data/ukBorders.geojson")
  .then(Response => Response.text())
  .then(data => {
    countiesData = JSON.parse(data);
    ukbordersData = JSON.parse(data);
    for (var i = 0; i < countiesData.features.length; i++) {
      countiesData.features[i].geometry = turf.simplify(
        turf.cleanCoords(countiesData.features[i].geometry),
        { tolerance: 0.0001 }
      );
    }
    for (
      var i = 0;
      i < countiesData.features[0].geometry.coordinates.length;
      i++
    ) {
      areaOfUk =
        areaOfUk +
        turf.area(
          turf.polygon(countiesData.features[0].geometry.coordinates[i])
        ) /
          1000000;
    }
  });

fetch("data/ukcounties.geojson")
  .then(Response => Response.text())
  .then(data => {
    regionsData = JSON.parse(data);
    for (var i = 0; i < regionsData.features.length; i++) {
      regionsData.features[i].geometry = turf.simplify(
        turf.cleanCoords(regionsData.features[i].geometry),
        { tolerance: 0.0001 }
      );
    }
  });

///////////////////INIT MAP AND ADD POLYGONS/COUNTY///////////////////
function initMap() {
  map = L.map("map").setView([54.3138, -2.169], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 9,
    minZoom: 6
  }).addTo(map);
  //   addCountiesToMap();
  fetch("data/images.json")
    .then(response => response.text())
    .then(data => {
      imageData = JSON.parse(data);
      for (var x = 0; x < imageData.length; x++) {
        addToMap(imageData[x]);
      }
    })
    .catch(error => {
      console.log(error);
      getProductGeoJSONPHP();
      setTimeout(function() {
        for (var x = 0; x < imageData.length; x++) {
          imageData[x].properties.area =
            turf.area(turf.polygon(imageData[x].geometry.coordinates)) /
            1000000;
          imageData[x].properties.percentage =
            (imageData[x].properties.area / areaOfUk) * 100;
          addToMap(imageData[x]);
        }
        document.getElementById("loadingScreen").style.display = "none";
      }, 20000);
    });
}
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
    }
    document.getElementById("loadingScreen").style.display = "none";
  }, 20000);
}
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
function addCountiesToMap() {
  var myStyle = {
    stroke: true,
    color: "blue",
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
function addToMap(data) {
  var mystyle = getAreaColour(data);
  L.geoJSON(data, {
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
  }).addTo(map);
  dataSort();
}
function repopulateMap() {
  for (var x = 0; x < imageData.length; x++) {
    addToMap(imageData[x]);
  }
}
///////////////////API CALLS///////////////////
function getTokenPHP() {
  return fetch("api/token/", {
    method: "get",
    headers: new Headers({
      token: true
    })
  }).then(function(response) {
    return response.text().then(function(text) {
      return text;
    });
  });
}
function getProductSearchPHP() {
  //    // result is api key
  return fetch("api/productsearch/", {
    method: "POST",
    mode: "same-origin",
    credentials: "same-origin",
    headers: new Headers({
      "Content-Type": "plain/text"
    })
    // body: result
  }).then(function(response) {
    return response.text();
    //text is array of ids
  });
}
async function getProductGeoJSONPHP() {
  //     //result is api key
  document.getElementById("loadingScreen").style.display = "block";

  getProductSearchPHP().then(function(idarray) {
    //idarray is array of ids
    var json = JSON.parse(idarray);

    for (var x = 0; x < json.length; x++) {
      var body = json[x].id;

      fetch("api/productinfo/", {
        method: "POST",
        mode: "same-origin",
        credentials: "same-origin",
        headers: new Headers({
          "Content-Type": "plain/text"
        }),
        body: body
      }).then(function(response) {
        response.json().then(function(json) {
          imageData.push(json);
          document.querySelector(".loadingScreen p").innerHTML =
            "Loading " + imageData.length + "/61";
        });
      });
    }
  });
}
function getProductByIDPHP(id, callback) {
  fetch("api/productinfo/", {
    method: "POST",
    mode: "same-origin",
    credentials: "same-origin",
    headers: new Headers({
      "Content-Type": "plain/text"
    }),
    body: id
  }).then(function(response) {
    response.json().then(function(json) {
      console.log("The getproductbyidphp result: " + json);
      callback(json);
    });
  });
}
function getProductFromImageData(id, callback) {
  for (var x = 0; x < imageData.length; x++) {
    if (imageData[x].properties.id == id) {
      callback(imageData[x]);
    }
  }
}
///////////////////HISTOGRAM///////////////////
function dataSort() {
  // storing mission area into array
  if (graphClicked == false) {
    for (var x = 0; x < imageData.length; x++) {
      areaData.push(
        imageData[x].properties.area,
        imageData[x].properties.missionid
      );
      startDates.push(imageData[x].properties.startdate);
    }
    console.log(x + " records processed");
    getHistogram();
    graphClicked = true;
    var panel = document.getElementsByClassName("panel")[1];
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
  // overwriting the values in array if button is repressed, this is to stop the data duplicating
  else {
    for (var x = 0; x < imageData.length; x++) {
      areaData[x] = imageData[x].properties.area;
      startDates[x] = imageData[x].properties.startdate;
    }
    for (var y = 0; y < imageData.length; y++) {
      areaData[x][y] = imageData[y].properties.missionid;
    }
    getHistogram();
  }
}

function showCountyHistogram() {
  var data;
  var x = [];
  var y = [];
  for (var x1 = 0; x1 < counties.length; x1++) {
    x[x1] = counties[x1].name;
    y[x1] = counties[x1].missionsInside;
  }
  var data = [
    {
      histfunc: "sum",
      y: y,
      x: x,
      type: "histogram",
      name: "sum"
    }
  ];
  var layout = {
    plot_bgcolor: "#F95738",
    paper_bgcolor: "#F95738",

    title: {
      text: "Number of missions per county",
      font: {
        family: "Courier New, monospace",
        size: 24
      }
    },
    xaxis: {
      title: {
        text: "Counties",
        font: {
          family: "Courier New, monospace",
          size: 18,
          color: "#000000"
        }
      }
    },
    yaxis: {
      title: {
        text: "Number of Missions",
        font: {
          family: "Courier New, monospace",
          size: 18,
          color: "#000000"
        }
      }
    }
  };
  Plotly.newPlot("countiesHistogram", data, layout);
  var panel = document.getElementsByClassName("panel")[1];
  panel.style.maxHeight = panel.scrollHeight + "px";
}

function getHistogram1() {
  // using plot.ly
  var trace = {
    histfunc: "sum",
    x: startDates,
    y: areaData,
    type: "histogram",
    cumulative: { enabled: true },
    marker: {
      color: "#0D3B66"
    }
  };
  var layout = {
    title: {
      text: "Area covered per day(Cumalative)",
      font: {
        family: "Courier New, monospace",
        size: 24
      }
    },

    xaxis: {
      title: {
        text: "Mission Date",
        font: {
          family: "Courier New, monospace",
          size: 18,
          color: "#000000"
        }
      }
    },

    yaxis: {
      title: {
        text: "Area km²",
        font: {
          family: "Courier New, monospace",
          size: 18,
          color: "#000000"
        }
      }
    },

    plot_bgcolor: "#F95738",
    paper_bgcolor: "#F95738"
  };

  Plotly.newPlot("histogramDisplay", [trace], layout);
}

function getHistogram() {
    // using plot.ly
    var myPlot = document.getElementById('histogramDisplay'),
        trace = {
            x: areaData,
            type: 'histogram',
            marker: {
                color: '#0D3B66'
            }, 
        },
        layout = {
            title: {
              text: 'Area of Missions',
              font: {
                family: 'Courier New, monospace',
                size: 24
                }, 
            },

            hovermode: 'closest',
            
            xaxis: {
                title: {
                text: 'Area km²',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#000000'
                    }
                },
            },
            yaxis: {
                title: {
                    text: 'Number of Missions',
                    font: {
                        family: 'Courier New, monospace',
                        size: 18,
                        color: '#000000'
                    }
                },
            },  
        plot_bgcolor: '#F95738',
        paper_bgcolor: '#F95738'
        }
       
    Plotly.newPlot('histogramDisplay', [trace], layout);

    myPlot.on('plotly_click', function(data){
        var pts = '';
        for(var i=0; i < data.points.length; i++){
            pts = data.points[i].x;
            console.log(pts);
        }
        //X axis values of histogram bars increasing 50 each time; 
        //add hover over 

        var histoBarPts = []; 
        histoBarPts.push(0);
        histoBarPts.push(50);
        histoBarPts.push(100); 
        histoBarPts.push(150);
        histoBarPts.push(200); 
        histoBarPts.push(250);
        histoBarPts.push(300); 
        histoBarPts.push(350);
        histoBarPts.push(400);
        histoBarPts.push(450); 
        histoBarPts.push(500);
        histoBarPts.push(550); 

        for(var i=0; i < histoBarPts.length; i++){
            if(pts == histoBarPts[i]){
                console.log('Histogram bar ' + (i+1) + ' clicked!'); 
                var barClicked = (i+1);    
            }
        }

        //display approprate polygons for range
        var areaSearchQ = []; 
        switch(barClicked){
                case 1: {
                    //range 0 - 50 
                    console.log("range 0-50")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area <= 50){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    }
                    break;
                }
                case 2: {
                    //range 50 - 100 
                    console.log("range 50-100")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 50 && imageData[x].properties.area <= 100){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    }
                    break;
                }
                case 3: {
                    //range 100 - 150  
                    console.log("range 100-150")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 100 && imageData[x].properties.area <= 150){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    }
                    break;
                }
                case 4: {
                    //range 150 - 200  
                    console.log("range 150-200")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 150 && imageData[x].properties.area <= 200){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    }
                    break; 
                }
                case 5: {
                    //range 200 - 250
                    console.log("range 200-250")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 200 && imageData[x].properties.area <= 250){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                        
                    }
                    break;
                };
                case 6: {
                    console.log("range 250-300")  
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 250 && imageData[x].properties.area <= 300){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    
                    }
                    break;
                };
                case 7: {
                    console.log("range 300-350")  
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 300 && imageData[x].properties.area <= 350){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                      
                    }
                    break;
                };
                case 8: {
                    console.log("range 350-400")  
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 350 && imageData[x].properties.area <= 400){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                      
                    }
                    break;
                };
                case 9: {
                    console.log("range 400-450")  
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 400 && imageData[x].properties.area <= 450){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                        
                    }
                    break;
                };
                case 10: {
                    console.log("range 450-500")  
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 450 && imageData[x].properties.area <= 500){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                     
                    }
                break;
                };
            //REMOVE REPEATED CODE
                case 11: {
                    console.log("range 500-525")  
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 500){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    
                    }
                    break;
                };
                case 12: {
                    console.log("range 525+")  
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area >= 500){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                        
                    }
                    break;
                };
            }
        markerGroup.eachLayer(function(layer) {
            map.removeLayer(layer);
         });

        for (var x = 0; x < layerData.length; x++) {
            map.removeLayer(layerData[x]);
        }
        addCountiesToMap();
        console.log(areaSearchQ);


        for(x = 0; x < areaSearchQ.length; x++){
            getProductFromImageData(areaSearchQ[x], function(geoJSONdata) {
            //add geoJSONdata to the map
            addToMap(geoJSONdata);
            //add marker to center of polygon
            var mapLocation = geoJSONdata.properties.centre.split(",");
            marker = L.marker({ lat: mapLocation[0], lng: mapLocation[1] });
            marker.addTo(markerGroup);
            marker.addTo(map);

        });


        }
        
        });
}   


///////////////////SEARCH BAR///////////////////
function getMissionType(id) {
  //check if the page is loading
  markerGroup.eachLayer(function(layer) {
    map.removeLayer(layer);
  });
  //reset the table
  var mytbl = document.getElementById("polyIDtable");
  mytbl.getElementsByTagName("tbody")[0].innerHTML = mytbl.rows[0].innerHTML;
  //activeSearch set to true, to show search is in progress
  activeSearch = true;
  //searchQ array for missionID results
  searchQ = [];
  //bool for is a missionID is found or ID
  var polyIDfound = false;
  missionIDfound = false;
  //searching for missionID, if found each poly id present in that mission will be pushed to searchQ
  for (var x = 0; x < imageData.length; x++) {
    if (id == imageData[x].properties.missionid) {
      //set mission id to found and push all polygons into searchQ
      missionIDfound = true;
      searchQ.push(imageData[x].properties.id);
    } else if (id == imageData[x].properties.id) {
      //search for specific polygon
      searchPolygonID(id);
      break;
    }
  }
  if (missionIDfound) getMissionById(searchQ);
}

function getMissionById(id) {
  //remove all map layers and add back counties
  for (var x = 0; x < layerData.length; x++) {
    map.removeLayer(layerData[x]);
  }
  addCountiesToMap();
  //qArea for calculating mission total area
  var qArea = [];
  var currentMission;
  for (var x = 0; x < searchQ.length; x++) {
    getProductFromImageData(searchQ[x], function(geoJSONdata) {
      //add geoJSONdata to the map
      addToMap(geoJSONdata);
      //add marker to center of polygon
      var mapLocation = geoJSONdata.properties.centre.split(",");
      marker = L.marker({ lat: mapLocation[0], lng: mapLocation[1] });
      marker.addTo(markerGroup);
      marker.addTo(map);
      currentMission = geoJSONdata;
      //push current ploygon area to qArea array
      qArea.push(geoJSONdata.properties.area);
    });
  }
  //when all id's added zooms the map out to default view
  var zoomScale = map.getZoom();
  if (zoomScale > 6) map.zoomOut(6);
  map.setView([54.3138, -2.169], 6);
  //calculates the total area of the missions polygons
  var areaTotal = 0;
  for (var p = 0; p < qArea.length; p++) {
    areaTotal += qArea[p];
  }
  //rounds the total up
  areaTotal = parseFloat(areaTotal.toFixed(2));
  //updating meta data
  document.getElementById("metadata").hidden = false;
  document.getElementById("metaMissionID").innerHTML =
    "<b>Current Mission ID</b>: " + currentMission.properties.missionid;
  document.getElementById("metaTotalArea").innerHTML =
    "<b>Total Mission Area</b>: " + areaTotal + "km²";
  document.getElementById("metaAreaCovered").innerHTML =
    "<b>Mission UK Coverage</b>: " +
    ((areaTotal / areaOfUk) * 100).toFixed(6) +
    "%";
  document.getElementById("metaDateCreated").innerHTML =
    "<b>Mission Start Date</b>: " + currentMission.properties.startdate;
  //display ammount of results found from search
  if (searchQ.length > 1)
    document.getElementById("results").innerHTML =
      "&#8618; " + searchQ.length + " Results found";
  else
    document.getElementById("results").innerHTML =
      "&#8618; " + searchQ.length + " Result found";
  //adds each element in searchQ to the IDsearch table
  var tabBody = document.getElementsByTagName("tbody").item(0);
  for (var x = 0; x < searchQ.length; x++) {
    //create HTML table elements
    var row = document.createElement("tr");
    var cell1 = document.createElement("td");
    var cell2 = document.createElement("td");
    var textnode = document.createTextNode(searchQ[x]);
    //IDsearch button setup
    var buttonnode = document.createElement("button");
    buttonnode.innerHTML = "View";
    //IDsearch button identifiers: class 'idQsearch', id 'idQsearch' + numberOfButton
    buttonnode.className = "idQsearch";
    buttonnode.id = "idQsearch" + x;
    //append newly created rows and cells to the table
    cell1.appendChild(textnode);
    cell2.appendChild(buttonnode);
    row.appendChild(cell1);
    row.appendChild(cell2);
    tabBody.appendChild(row);
  }
  //displays the IDsearch table once all the id's have been loaded in
  document.getElementById("polyIDtable").hidden = false;
}

function searchPolygonID(id) {
  var currPoly;
  //clear poly data
  document.getElementById("polyMetadata").hidden = true;
  var polyMeta = document.getElementsByClassName("polymetaTag");
  for (var x = 0; x < polyMeta.length; x++) {
    polyMeta[x].innerHTML = null;
  }
  //remove all map layers but add back counties
  for (var x = 0; x < layerData.length; x++) {
    map.removeLayer(layerData[x]);
  }
  addCountiesToMap();
  //hide polyIDtable from panel
  document.getElementById("polyIDtable").hidden = true;
  //change results found
  document.getElementById("results").innerHTML = "&#8618; " + "1 Results found";
  getProductFromImageData(id, function(geoJSONdata) {
    addToMap(geoJSONdata);
    currPoly = geoJSONdata;
    var mapLocation = geoJSONdata.properties.centre.split(",");
    markerGroup.eachLayer(function(layer) {
      map.removeLayer(layer);
    });
    //add marker and pan map over to the polygon
    marker = L.marker({ lat: mapLocation[0], lng: mapLocation[1] });
    marker.addTo(markerGroup);
    marker.addTo(map);
    map.flyTo({ lat: mapLocation[0], lng: mapLocation[1] });
    sleep(700).then(() => {
      map.zoomIn(4);
    });
  });
  //update meta data
  document.getElementById("metadata").hidden = false;
  var metaText = document.getElementsByClassName("metaTag");
  metaText[0].innerHTML = "<b>Polygon ID</b>: " + currPoly.properties.id;
  metaText[1].innerHTML =
    "<b>Polygon UK Coverage</b>: " +
    currPoly.properties.percentage.toFixed(6) +
    "%";
  metaText[2].innerHTML = "<b>Polygon Area</b>: " + currPoly.properties.area;
  metaText[3].innerHTML =
    "<b>Mission Start Date</b>: " + currPoly.properties.startdate;
}

function resetData() {
  //reset map view, clear markers and clear searchQ
  map.setView([54.3138, -2.169], 6);
  specElement.value = "";
  searchQ = [];
  markerGroup.eachLayer(function(layer) {
    map.removeLayer(layer);
  });
  for (var x = 0; x < layerData.length; x++) {
    map.removeLayer(layerData[x]);
  }
  //reset imageData and change result's found to 0
  activeSearch = false;
  document.getElementById("results").innerHTML = "&#8618; " + "0 Result found";
  document.getElementById("polyIDtable").hidden = true;
  //clear meta data
  document.getElementById("metadata").hidden = true;
  var metaText = document.getElementsByClassName("metaTag");
  for (var x = 0; x < metaText.length; x++) {
    metaText[x].innerHTML = null;
  }
  //clear poly data
  document.getElementById("polyMetadata").hidden = true;
  var polyMeta = document.getElementsByClassName("polymetaTag");
  for (var x = 0; x < polyMeta.length; x++) {
    polyMeta[x].innerHTML = null;
  }
}

var specElement = document.getElementById("searchbar");
var sidebar = document.getElementById("sidebar");
document.addEventListener("click", function(event) {
  //checks if search is being cancelled by clicking inside the search bar
  var isClickInside = specElement.contains(event.target);
  if (isClickInside && activeSearch) {
    resetData();
    //reload products
    repopulateMap();
  }
  //if the event clicked is a idQsearch button
  if (event.target.className == "idQsearch") {
    //finds the correct button and corresponding polygon ID
    for (var x = 0; x < searchQ.length; x++) {
      //if found set marker on polygon
      if (event.target.id == "idQsearch" + x) {
        var mapLocation;
        getProductFromImageData(searchQ[x], function(geoJSONdata) {
          mapLocation = geoJSONdata.properties.centre.split(",");
          markerGroup.eachLayer(function(layer) {
            map.removeLayer(layer);
            //ADD META DATA FOR EACH POLYGON
            document.getElementById("polyMetadata").hidden = false;
            var polyMeta = document.getElementsByClassName("polymetaTag");
            polyMeta[0].innerHTML =
              "<b>Selected Polygon ID</b>: " + geoJSONdata.properties.id;
            polyMeta[1].innerHTML =
              "<b>Polygon UK Coverage</b>: " +
              geoJSONdata.properties.percentage.toFixed(6) +
              "%";
            polyMeta[2].innerHTML =
              "<b>Polygon Area</b>: " +
              geoJSONdata.properties.area.toFixed(2) +
              "km²";
            polyMeta[3].innerHTML =
              "<b>Mission Start Date</b>: " + geoJSONdata.properties.startdate;
          });
          //add markers to polygon target
          marker = L.marker({ lat: mapLocation[0], lng: mapLocation[1] });
          marker.addTo(markerGroup);
          marker.addTo(map);
        });
        var panel = document.getElementsByClassName("panel")[0];
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    }
  }
});

function missionsInCounties() {
  //Function that calculates the percentage of missions inside of a county divided by the total amount of missions
  var worker = new Worker("js/worker.js");
  for (var x = 0; x < layerData; x++) {
    map.removeLayer(layerData);
  } // turf simplify, turf cleancoords, turf polygon, turf intersect, turf area, d3 geocontains
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
    console.log(counties, missionsInUk);
    worker.terminate();
    for (var u = 0; u < imageData[0].length; u++) {
      missionGeoJSON = imageData[u];
      for (var i = 0; i < regionsData.length; i++) {
        //For the amount of counties loop
        for (var j = 0; j < missionGeoJSON.coordinates[0].length; j = j + 60) {
          //for the amount of coordinates in the mission GEOjson loop
          if (geoContains(regionsData[i], missionGeoJSON.coordinates[0][j])) {
            // d3 check to see if it is in a county
            for (var p = 0; p < counties.length - 1; p++) {
              //loop for the amount of counties there are minus international waters
              if (regionsData[i].properties.name === counties[p].name) {
                //if it is in a county add 1 to the county mission counter
                counties[p].missionsInside++;
                totalmissions++;
              }
            }
          }
        }
      }
    }
  };
}

function saveFile(data) {
  var jsonString = JSON.stringify(data);
  $.ajax({
    url: "php/save.php",
    data: { jsonString: jsonString },
    type: "POST"
  });
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
      var panel = document.getElementsByClassName("panel")[0];
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  }
  var acc1 = document.getElementsByClassName("popupSearchPolygonId");
  var i2;
  for (i2 = 0; i2 < acc.length; i2++) {
    acc1[i2].addEventListener("click", function() {
      var panel = document.getElementsByClassName("panel")[0];
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  }
});

var legend = L.control({ position: "topright" });
legend.onAdd = function(map) {
  var div = L.DomUtil.create("div", "info legend"),
    grades = ["#FED976", "#FEB24C", "#FC4E2A", "#BD0026", "#800026"];
  div.innerHTML += "<h4>Area Coverage (km²)</h4>";
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
