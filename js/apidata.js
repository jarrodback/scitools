const areaOfUk = 242495;
var areaData = [];
var imageData = [];
var layerData =[];
let map;
var markerGroup = L.layerGroup(); 
var activeSearch = false; 
var searchQ = [];
var missionsLoaded = false; 
var graphClicked = false;

///////////////////INIT MAP AND ADD POLYGONS/COUNTY///////////////////
function initMap(){
  map = L.map('map').setView([54.3138, -2.169], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 9,
    minZoom: 6
  }).addTo(map);
  addCountiesToMap();
  getProductGeoJSONPHP();
  setTimeout(function(){ 
    for(var x = 0; x < imageData.length; x++){
        imageData[x].properties.area = (turf.area(turf.polygon(imageData[x].geometry.coordinates))/1000000);
        imageData[x].properties.percentage = (imageData[x].properties.area / areaOfUk) * 100;
        addToMap(imageData[x]);
    }
    document.getElementById('loadingScreen').style.display = "none";
    console.log("All missions have been added to map");
    missionsLoaded = true; 
    miss
}, 15000);
}

function getAreaColour(feature){
    if(feature.properties.area < 100){
        return {fillColor: '#FED976', color: '#FED976'};
    }
    else if( feature.properties.area < 200){
        return {fillColor: '#FEB24C', color: '#FEB24C'};

    }
    else if (feature.properties.area < 300){
        return {fillColor: '#FC4E2A', color: '#FC4E2A'};

    }
    else if (feature.properties.area < 400){
        return {fillColor: '#E31A1C', color: '#E31A1C'};
    }
    else if (feature.properties.area < 500){
        return {fillColor: '#BD0026', color: '#BD0026'};
    }
    else{
        return {fillColor: '#800026', color: '#800026'};
    }
}
function addCountiesToMap(){
    var myStyle = {
        "stroke": true,
        "color": "blue",
        "weight": 1,
        "fill": true,
        "fillOpacity": 0,
        "opacity": 1
    };
    var geojsonLayer = new L.GeoJSON.AJAX("data/ukcounties.geojson", {
        style:myStyle, 
        onEachFeature: function onEachFeature(feature, layer){
            layer.bindPopup("Region: " + feature.properties.name);
        }
    });
    geojsonLayer.addTo(map);
    console.log("Regional data has been added to the map");
}
function addToMap(data){
    var mystyle = getAreaColour(data);
    L.geoJSON(data, 
        {style:mystyle, 
        onEachFeature: function(feature, layer){ 
            layerData.push(layer);
            layer.bindPopup("Mission ID: " + feature.properties.missionid
            + '<br>Area: ' + parseFloat(feature.properties.area.toFixed(2)) + "km²" 
            + '<br>Percentage Covered: ' + parseFloat(feature.properties.percentage.toFixed(6)) + "%"
            + '<br>ID: ' + feature.properties.id
            + '<br><a href="#" class="popupSearchMissionId">Search this Mission</a>'
            + '<br><a href="#" class="popupSearchPolygonId">Search this ID</a>');
        }
    }).addTo(map);
}
function repopulateMap(){
    for(var x = 0; x < imageData.length; x++){
        addToMap(imageData[x]);
    }
}
///////////////////API CALLS///////////////////
function getTokenPHP(){
    return fetch('api/token/', {
        method: 'get',
        headers : new Headers({
            'token' : true
        })
    })
    .then(function(response){
        return response.text().then(function(text){
            return text;
        });
    });
}
function getProductSearchPHP(){
    //    // result is api key
        return fetch('api/productsearch/', {
            method: 'POST',
            mode: "same-origin",
            credentials: "same-origin",
            headers : new Headers({
                'Content-Type' : 'plain/text'
            })
           // body: result
        })
        .then(function(response){
            return response.text();
                //text is array of ids
        });
}
function getProductGeoJSONPHP(){
    //     //result is api key
         getProductSearchPHP().then(function(idarray){
            //idarray is array of ids
            var json = JSON.parse(idarray);
            for(var x=0; x < json.length; x++){
                var body = json[x].id;
                 fetch('api/productinfo/', {
                    method: 'POST',
                    mode: "same-origin",
                    credentials: "same-origin",
                    headers : new Headers({
                        'Content-Type' : 'plain/text'
                    }),
                    body: body
                })
                .then(function(response){
                    response.json().then(function(json){
                        imageData.push(json);
                    });
                })
                .then(function(response){
                    document.querySelector('.loadingScreen p').innerHTML = ("Loading " + imageData.length + "/61");
                });
            }
        });
}
function getProductByIDPHP(id, callback){
        fetch('api/productinfo/', {
        method: 'POST',
        mode: "same-origin",
        credentials: "same-origin",
        headers : new Headers({
            'Content-Type' : 'plain/text'
        }),
        body: id
    })
    .then(function(response){
        response.json().then(function(json){
            console.log("The getproductbyidphp result: " + json);
            callback(json);
        });
    })
}
function getProductFromImageData(id, callback){
    for(var x=0; x<imageData.length; x++){
        if(imageData[x].properties.id == id){
            callback(imageData[x]);
        }
    }
}
///////////////////HISTOGRAM///////////////////
function dataSort(){
    if (graphClicked == false){
    for (var x = 0; x < imageData.length; x++) {
        areaData.push(imageData[x].properties.area);
    }
    //sorting the areas in ascending order
    areaData.sort(function(a,b){return a-b});
    console.log("Data Sorted "+ x + " records processed");
    console.log("Sorted!");
    getHistogram();
     graphClicked = true;
    }
}

function getHistogram() {
    // using plot.ly
    var trace = {
        x: areaData,
        type: 'histogram',
        marker: {
            color: '#0D3B66'
        }
    };
    Plotly.newPlot('histogramDisplay', [trace], {
        plot_bgcolor: '#F95738',
        paper_bgcolor: '#F95738',
      })
      .then(() => {
        return Plotly.toImage({setBackground: setBackground})
      });
}
///////////////////SEARCH BAR///////////////////
function getMissionType(id){
    //check if the page is loading 
    markerGroup.eachLayer(function(layer){
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
    for(var x = 0; x < imageData.length; x++){
        if(id == imageData[x].properties.missionid){
            //set mission id to found and push all polygons into searchQ
            missionIDfound = true; 
            searchQ.push(imageData[x].properties.id); 
        }else if(id == imageData[x].properties.id){
            //search for specific polygon 
            searchPolygonID(id);
            break; 
        }
    } 
    if(missionIDfound) getMissionById(searchQ);  
};

function getMissionById(id){
    //remove all map layers and add back counties 
    for(var x = 0; x < layerData.length; x++){
        map.removeLayer(layerData[x]);
    }
    addCountiesToMap();
    //qArea for calculating mission total area
    var qArea = []; 
    var currentMission;
    for(var x = 0; x < searchQ.length; x++){
        getProductFromImageData(searchQ[x], function(geoJSONdata){
            //add geoJSONdata to the map
            addToMap(geoJSONdata);
            //add marker to center of polygon
            var mapLocation = geoJSONdata.properties.centre.split(",");
            marker = L.marker({lat : mapLocation[0], lng : mapLocation[1]});
            marker.addTo(markerGroup); 
            marker.addTo(map);
            currentMission = geoJSONdata; 
            //push current ploygon area to qArea array
            qArea.push(geoJSONdata.properties.area); 
        });
    }
    //when all id's added zooms the map out to default view 
    var zoomScale = map.getZoom(); 
    if(zoomScale > 6) map.zoomOut(6);
    map.setView([54.3138, -2.169], 6);
    //calculates the total area of the missions polygons
    var areaTotal = 0; 
    for(var p = 0; p < qArea.length; p++){
        areaTotal += qArea[p];
    }; 
    //rounds the total up
    areaTotal = parseFloat(areaTotal.toFixed(2)); 
    //updating meta data
    document.getElementById('metadata').hidden = false; 
    document.getElementById('metaMissionID').textContent = 'Current Mission ID: ' + currentMission.properties.missionid;
    document.getElementById('metaTotalArea').textContent = 'Total Mission Area: ' + areaTotal + "km²";
    document.getElementById('metaAreaCovered').textContent = 'Mission UK Coverage: ' + ((areaTotal/areaOfUk)*100).toFixed(6) + '%';
    document.getElementById('metaDateCreated').textContent = 'Date Created: ' + currentMission.properties.datecreated;
    //display ammount of results found from search
    if(searchQ.length > 1) document.getElementById("results").innerHTML = "&#8618; " + searchQ.length + " Results found";
    else document.getElementById("results").innerHTML = "&#8618; " + searchQ.length + " Result found";      
    //adds each element in searchQ to the IDsearch table
    var tabBody = document.getElementsByTagName("tbody").item(0);
    for(var x = 0; x < searchQ.length; x++){
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
        buttonnode.id = 'idQsearch' + x; 
        //append newly created rows and cells to the table
        cell1.appendChild(textnode);
        cell2.appendChild(buttonnode); 
        row.appendChild(cell1);
        row.appendChild(cell2);
        tabBody.appendChild(row); 
    }
    //displays the IDsearch table once all the id's have been loaded in
    document.getElementById("polyIDtable").hidden = false; 
}; 

function searchPolygonID(id){
    var currPoly;
    //clear poly data
    document.getElementById('polyMetadata').hidden = true; 
    var polyMeta = document.getElementsByClassName('polymetaTag');
    for(var x = 0; x < polyMeta.length; x++){
        polyMeta[x].textContent = null;
    }
    //remove all map layers but add back counties 
    for(var x = 0; x < layerData.length; x++){
        map.removeLayer(layerData[x]);
    }
    addCountiesToMap();
    //hide polyIDtable from panel 
    document.getElementById("polyIDtable").hidden = true;
    //change results found 
    document.getElementById("results").innerHTML = "&#8618; " + "1 Results found";
    getProductFromImageData(id, function(geoJSONdata){
        addToMap(geoJSONdata);
        currPoly = geoJSONdata; 
        var mapLocation = geoJSONdata.properties.centre.split(",");
        markerGroup.eachLayer(function(layer){
            map.removeLayer(layer);   
        });
        //add marker and pan map over to the polygon 
        marker = L.marker({lat : mapLocation[0], lng : mapLocation[1]});
        marker.addTo(markerGroup);
        marker.addTo(map);
        map.flyTo({lat: mapLocation[0], lng: mapLocation[1]});   
        sleep(700).then(() => {
            map.zoomIn(4);
        }) 
    });
    //update meta data
    document.getElementById('metadata').hidden = false; 
    var metaText = document.getElementsByClassName('metaTag');
    metaText[0].textContent = 'Polygon ID: ' + currPoly.properties.id; 
    metaText[1].textContent = 'Polygon UK Coverage: ' + currPoly.properties.percentage.toFixed(6) + '%';; 
    metaText[2].textContent = 'Polygon Area: ' + currPoly.properties.area; 
    metaText[3].textContent = 'Date Created: ' + currPoly.properties.datecreated; 
};

function resetData(){
    //reset map view, clear markers and clear searchQ
    map.setView([54.3138, -2.169], 6);
    specElement.value = '';
    searchQ = []; 
    markerGroup.eachLayer(function(layer){
        map.removeLayer(layer); 
    });
    for(var x = 0; x < layerData.length; x++){
        map.removeLayer(layerData[x]);
    }
    //reset imageData and change result's found to 0 
    activeSearch = false; 
    document.getElementById("results").innerHTML = "&#8618; " + "0 Result found";
    document.getElementById("polyIDtable").hidden = true; 
    //clear meta data
    document.getElementById('metadata').hidden = true; 
    var metaText = document.getElementsByClassName('metaTag');
    for(var x = 0; x < metaText.length; x++){
        metaText[x].textContent = null; 
    }
    //clear poly data
    document.getElementById('polyMetadata').hidden = true; 
    var polyMeta = document.getElementsByClassName('polymetaTag');
    for(var x = 0; x < polyMeta.length; x++){
        polyMeta[x].textContent = null; 
    }
};

var specElement = document.getElementById("searchbar");
var sidebar = document.getElementById("sidebar");
document.addEventListener('click', function(event){
    //checks if search is being cancelled by clicking inside the search bar
    var isClickInside = specElement.contains(event.target);    
    if(isClickInside && activeSearch){
        resetData();
        //reload products 
        repopulateMap();
    }
    //if the event clicked is a idQsearch button 
    if(event.target.className == 'idQsearch'){
        //finds the correct button and corresponding polygon ID
        for(var x = 0; x < searchQ.length; x++){
            //if found set marker on polygon
            if(event.target.id == 'idQsearch' + x){
                var mapLocation;
                getProductFromImageData(searchQ[x], function(geoJSONdata){
                    mapLocation = geoJSONdata.properties.centre.split(",");
                    markerGroup.eachLayer(function(layer){
                        map.removeLayer(layer); 
                        //ADD META DATA FOR EACH POLYGON 
                        document.getElementById('polyMetadata').hidden = false; 
                        var polyMeta = document.getElementsByClassName('polymetaTag');
                        polyMeta[0].textContent = 'Selected Polygon ID: ' + geoJSONdata.properties.id; 
                        polyMeta[1].textContent = 'Polygon UK Coverage: ' + geoJSONdata.properties.percentage.toFixed(6) + '%';
                        polyMeta[2].textContent = 'Polygon Area: ' + geoJSONdata.properties.area.toFixed(2) + 'km²'; 
                        polyMeta[3].textContent = 'Date Created: ' + geoJSONdata.properties.datecreated; 
                    }); 
                    //add markers to polygon target
                    marker = L.marker({lat : mapLocation[0], lng : mapLocation[1]});
                    marker.addTo(markerGroup);
                    marker.addTo(map);
                });
                var panel = document.getElementsByClassName('panel')[0];
            panel.style.maxHeight = panel.scrollHeight +"px";
            };
        }
      
    };
});

function missionsInCounties() {           //Function that calculates the percentage of missions inside of a county divided by the total amount of missions
    for (var u = 0; u < imageData.length; u++) {
        console.log("Loading");
        missionGeoJSON = imageData[u];
        if (arrcreated == false) {          // if the array has been created dont create a new one
            for (var i = 0; i < regionsData.features.length; i++) {            //create a array the size of the amount of countys
                counties.push({ name: regionsData.features[i].properties.name, missionsInside: 0 });       //push starting values to the array
            }
            arrcreated = true;      //after the array has been created make it unable to create another
        }
        missionGeoJSON = turf.simplify(turf.cleanCoords(missionGeoJSON), { tolerance: 0.0001 }).geometry

        for (var o = 0, size2 = countiesData.features.length; o < size2; o++) {

            for (var p = 0, size = countiesData.features[o].geometry.coordinates.length; p < size; p++) {

                var currentSegement = turf.polygon(countiesData.features[o].geometry.coordinates[p]);
                var intersectarea = turf.intersect(currentSegement, missionGeoJSON);

                if (intersectarea != undefined) {
                    intersectarea.properties = imageData[u].properties;
                    intersectarea.properties.area= turf.area(intersectarea)/1000000;
                    intersectarea.properties.percentage = ((intersectarea.properties.area/areaOfUk) *100);
                    missionsInUk.push({ coords: intersectarea });
                }
            }
        }


        for (var i = 0; i < regionsData.features.length; i++) {   //For the amount of counties loop
            for (var j = 0; j < missionGeoJSON.coordinates[0].length; j = j + 60) {         //for the amount of coordinates in the mission GEOjson loop
                if (d3.geoContains(regionsData.features[i], missionGeoJSON.coordinates[0][j])) {     // d3 check to see if it is in a county
                    for (var p = 0; p < counties.length - 1; p++) {     //loop for the amount of counties there are minus international waters
                        if (regionsData.features[i].properties.name === counties[p].name) {    //if it is in a county add 1 to the county mission counter
                            counties[p].missionsInside++;
                            totalmissions++;
                        }
                    }
                }
            }


        }
    }
    var finalmissions = [];
    aftr_loadtime = new Date().getTime();       //code to work out total load time (testing)
    pgloadtime = (aftr_loadtime - before_load) / 1000
    console.log(pgloadtime);
    for (var q = 0; q < counties.length; q++) { // loop calculates the percentage that each mission uses to 2 decimal places
        console.log(counties[q].name + " has " + (((counties[q].missionsInside / totalmissions) * 100).toFixed(1)) + "% missions in it")
    }
    console.log("loaded DATA successfully");
    for (var i = 0; i < missionsInUk.length; i++) {
        var intersects = false;
        var intersectsAt = 0;
         for (var j = 0; j < missionsInUk.length; i++) {
             if (j = i) {
                 j++;
             }
             if (finalmissions != undefined) {
                 intersects = true
                 intersectsAt = j;
                 missionsInUk[i] = turf.intersect(missionsInUk[i].coords, missionsInUk[j].coords);
                 missionsInUk.slice[j];
            }

         }
        addToMap(missionsInUk[i].coords);
    }
}














function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
initMap();

map.on('popupopen', function(feature){
    var missionid = feature.popup._source.feature.properties.missionid;
    var id = feature.popup._source.feature.properties.id;
    $('.popupSearchMissionId').click(function(){
        document.getElementById("searchbar").value = missionid;
        getMissionType(document.getElementById('searchbar').value);
    });
    $('.popupSearchPolygonId').click(function(){
        document.getElementById("searchbar").value = id;
        getMissionType(document.getElementById('searchbar').value);
    });
    
    var acc = document.getElementsByClassName("popupSearchMissionId");
    var i;
    for(i = 0; i< acc.length;i++){
    acc[i].addEventListener("click", function(){
        var panel = document.getElementsByClassName('panel')[0];
        panel.style.maxHeight = panel.scrollHeight +"px";
    });
    }
    var acc1 = document.getElementsByClassName("popupSearchPolygonId");
    var i2;
    for(i2 = 0; i2< acc.length;i2++){
    acc1[i2].addEventListener("click", function(){
        var panel = document.getElementsByClassName('panel')[0];
        panel.style.maxHeight = panel.scrollHeight +"px";
    });
}
});

var legend = L.control({position: 'topright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = ['#FED976','#FEB24C','#FC4E2A','#BD0026','#800026'];
    div.innerHTML += "<h4>Land Coverage (km²)</h4>";
    div.innerHTML += '<i style="background: #FED976"></i><span><100</span><br>';
    div.innerHTML += '<i style="background: #FEB24C"></i><span>100-199</span><br>';
    div.innerHTML += '<i style="background: #FC4E2A"></i><span>200-299</span><br>';
    div.innerHTML += '<i style="background: #E31A1C"></i><span>300-399</span><br>';
    div.innerHTML += '<i style="background: #BD0026"></i><span>400-499</span><br>';
    div.innerHTML += '<i style="background: #800026"></i><span>500+</span><br>';
    return div;
};
legend.addTo(map);

