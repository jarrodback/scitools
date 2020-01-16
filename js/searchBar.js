///////////////////LOAD IN GLOBAL META DATA///////////////////////////
//Calculate the area and percentage coverage
function loadGlobalMeta() {
    //numbers must match with graphs
    console.log("loading global meta data");
  
    //clear duplicates from imageData
    var imageDataU = [];
    for (var x = 0; x < imageData.length; x++) {
      var dupFound = false;
      var toPush = imageData[x];
      for (var p = 0; p < imageDataU.length; p++) {
        if (toPush.properties.id == imageDataU[p].properties.id) {
          dupFound = true;
        }
      }
      if (!dupFound) imageDataU.push(toPush);
    }
  
    var globalArea = 0;
    var globalCoverage = 0;
    for (var x = 0; x < imageDataU.length; x++) {
      globalArea += imageDataU[x].properties.area;
      globalCoverage += imageDataU[x].properties.percentage;
    }
  
    document.getElementsByClassName("globalData").hidden = false;
    document.getElementById("globalArea").visible = true;
    document.getElementById("globalCoverage").visible = true;
    document.getElementById("globalArea").innerHTML =
      "Global Polygon Area: " + parseFloat(globalArea.toFixed(2)) + "km²";
    document.getElementById("globalCoverage").innerHTML =
      "Global UK Coverage: " + parseFloat(globalCoverage.toFixed(2)) + "%";
}

///////////////////SEARCH BAR///////////////////
//Work out if search is for polygon or mission
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
  //Search for the mission by ID
  function getMissionById(id) {
    //remove all map layers and add back counties
    for (var x = 0; x < layerData.length; x++) {
      map.removeLayer(layerData[x]);
    }
    addCountiesToMap();
    //qArea for calculating mission total area
    var qArea = [];
    var currentMission;
    //remove dups from searchQ
    var searchQU = [];
    for (var x = 0; x < searchQ.length; x++) {
      var dupFound = false;
      var toPush = searchQ[x];
      for (var p = 0; p < searchQU.length; p++) {
        if (toPush == searchQU[p]) {
          dupFound = true;
        }
      }
      if (!dupFound) searchQU.push(toPush);
    }
    searchQ = searchQU;
  
    for (var x = 0; x < searchQ.length; x++) {
      getProductFromImageData(searchQ[x], function(geoJSONdata) {
        //add geoJSONdata to the maps
        addToMap(geoJSONdata);
        //add marker to center of polygon
        //var mapLocation = geoJSONdata.properties.centre.split(",");
        var mapLocation = turf.centroid(geoJSONdata);
        console.log(mapLocation);
  
        marker = L.marker({
          lng: mapLocation.geometry.coordinates[0],
          lat: mapLocation.geometry.coordinates[1]
        });
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
      ((areaTotal / areaOfUk) * 100).toFixed(2) +
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
  
    //change histogram data set
    missionSearchHistogram(searchQ);
  }
  //Search for the polygon by ID
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
  //Reset data for search clear
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
  //DOM CLICK LISTENER, reset search on click if not in panel area
  document.addEventListener("click", function(event) {
    loadGlobalMeta();
    //checks if search is being cancelled by clicking inside the search bar
    var isClickInside = specElement.contains(event.target);
    if (isClickInside && activeSearch) {
      resetData();
      //reload products
  
      repopulateMap();
      getHistogram2();
      getHistogram1();
      getHistogram();
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
          var panel = document.getElementsByClassName("panel")[1];
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      }
    }
    var filterClick = 0;
    if (event.target.id == "filter") {
      var panel2 = document.getElementById("filterPanel");
      document.getElementById("filterDiv").visible = true;
      if (panel2.style.maxHeight) {
        panel2.style.maxHeight = null;
      } else {
        panel2.style.maxHeight = panel2.scrollHeight + "px";
      }
    }
});

var slider = document.getElementById("myRange");

// Update the current slider value (each time you drag the slider handle)
///////////////////FILTER///////////////////////////
var filters = [];
var areaFilter;

slider.onchange = function() {
  areaFilter = this.value;
  var currentRange = document.getElementById("currentRange");
  console.log("slider change");
  for (var x = 0; x < layerData.length; x++) {
    map.removeLayer(layerData[x]);
  }

  //needs to work for when search is active
  if (activeSearch) {
    for (var p = 0; p < searchQ.length; p++) {
      getProductFromImageData(searchQ[p], function(geoJSONdata) {
        if (geoJSONdata.properties.area < areaFilter) {
          addToMap(geoJSONdata);
        }
      });
    }
  } else {
    for (var x = 0; x < imageData.length; x++) {
      if (imageData[x].properties.area < areaFilter) {
        addToMap(imageData[x]);
      }
    }
  }
};

slider.oninput = function() {
  currentRange.innerHTML = this.value + "km²";
};
