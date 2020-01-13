const areaOfUk = 242495;
var areaData = [];
var imageData = [];
var layerData =[];
let map;
var markerGroup = L.layerGroup(); 
var activeSearch = false; 
var searchQ = [];

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
    console.log("All missions have been added to map");
}, 10000);
}
function addCountiesToMap(){
    var myStyle = {
        "stroke": true,
        "color": "#ff0000",
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
    L.geoJSON(data, {
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
        console.log(imageData[x]);
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
    return getTokenPHP().then(function (result){
       // result is api key
        return fetch('api/productsearch/', {
            method: 'POST',
            mode: "same-origin",
            credentials: "same-origin",
            headers : new Headers({
                'Content-Type' : 'plain/text'
            }),
            body: result
        })
        .then(function(response){
            return response.text();
                //text is array of ids
        });
    });
}
function getProductGeoJSONPHP(){
     getTokenPHP().then(function(result){
        //result is api key
         getProductSearchPHP().then(function(idarray){
            //idarray is array of ids
            var json = JSON.parse(idarray);
            for(var x=0; x < json.length; x++){
                var body = json[x].id + " " + result;
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
            }
        });
    });
}
function getProductByIDPHP(id, callback){
    getTokenPHP().then(function(result){
        var body = id + " " + result;
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
            console.log("The getproductbyidphp result: " + json);
            callback(json);
        });
    })
    });
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
    //sorting the areas in ascending order
    areaData.sort(function(a,b){return a-b});
    /* for( var x = 0; x < areaData.length; x++){
        console.log(areaData[x]);
    }  */  
    window.alert("Data Sorted");
    console.log("Sorted!");
}
function saveToCSV(){
console.log("Downloading");
var csv = 'AREA\n';
areaData.forEach(function(row){
console.log(row);
csv += row;
csv += "\n";
});
console.log(csv);
var hidden = document.createElement('a');
hidden.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
hidden.target = '_blank';
hidden.download = 'areadata.csv';
hidden.click();  
}
function getHistogram(){
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
        return Plotly.toImage(gd, {setBackground: setBackground})
      })
      .then(src => {
        im.src = src
      });
}
///////////////////SEARCH BAR///////////////////
function getMissionById(id){
    markerGroup.eachLayer(function(layer){
        map.removeLayer(layer);
    });

    var mytbl = document.getElementById("polyIDtable");
    mytbl.getElementsByTagName("tbody")[0].innerHTML = mytbl.rows[0].innerHTML;


    //activeSearch set to true, to show search is in progress
    activeSearch = true; 
    //remove all map layers but add back counties 
    for(var x = 0; x < layerData.length; x++){
        map.removeLayer(layerData[x]);
    }
    addCountiesToMap();
    //searchQ array for missionID results 
    searchQ = [];
    //bool for is a missionID is found 
    missionIDfound = false;

    //searching for missionID, if found each poly id present in that mission will be pushed to searchQ
    for(var x = 0; x < imageData.length; x++){
        if(id == imageData[x].properties.missionid){
            missionIDfound = true; 
            searchQ.push(imageData[x].properties.id); 
        }
    } 
    if(missionIDfound){
        //gets the GeoJson data from each id in the searchQ, then adds them to the map along with a marker 
        for(var x = 0; x < searchQ.length; x++){
            getProductFromImageData(searchQ[x], function(geoJSONdata){
                addToMap(geoJSONdata);
                var mapLocation = geoJSONdata.properties.centre.split(",");
                marker = L.marker({lat : mapLocation[0], lng : mapLocation[1]});
                marker.addTo(markerGroup); 
                marker.addTo(map);
            });
        }
        //when all id's added zooms the map out to default view 
        var zoomScale = map.getZoom(); 
        if(zoomScale > 6) map.zoomOut(6);
        map.setView([54.3138, -2.169], 6);

        //displays the amount of id's present in searchQ to the user 
        if(searchQ.length > 1) document.getElementById("results").innerHTML = "&#8618; " + searchQ.length + " Results found";
        else document.getElementById("results").innerHTML = "&#8618; " + searchQ.length + " Result found";
        
        //adds each element in searchQ to the IDsearch table
        var tabBody = document.getElementsByTagName("tbody").item(0);
        for(var x = 0; x < searchQ.length; x++){
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

            cell1.appendChild(textnode);
            cell2.appendChild(buttonnode); 
            row.appendChild(cell1);
            row.appendChild(cell2);
            tabBody.appendChild(row); 
        }
        //displays the IDsearch table once all the id's have been loaded in
        document.getElementById("polyIDtable").hidden = false; 
    }else{
        //hides IDsearch table since only polygon ID is being loaded 
        document.getElementById("polyIDtable").hidden = true;
        getProductFromImageData(id, function(geoJSONdata){
            addToMap(geoJSONdata);
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
    }
}
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
        document.getElementById("results").textContent = "0 Result found";
        document.getElementById("polyIDtable").hidden = true; 
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
                       
                  }); 
                  marker = L.marker({lat : mapLocation[0], lng : mapLocation[1]});
                  marker.addTo(markerGroup);
                  marker.addTo(map);

            });
            };
        }
    };

})
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
initMap();

map.on('popupopen', function(feature){
    var missionid = feature.popup._source.feature.properties.missionid;
    var id = feature.popup._source.feature.properties.id;
    $('.popupSearchMissionId').click(function(){
        document.getElementById("searchbar").value = missionid;
        getMissionById(document.getElementById('searchbar').value);
    });
    $('.popupSearchPolygonId').click(function(){
        document.getElementById("searchbar").value = id;
        getMissionById(document.getElementById('searchbar').value);
    });
});
