const areaOfUk = 242495;
var areaData = [];
var imageData = [];
var layerData =[];
let map;
var authenication;
let authToken;
var markerGroup = L.layerGroup(); 
var activeSearch = false; 

function authenticate(){
    data = new FormData();
    data.set('grant_type', 'password');
    data.set('username', 'Hallam1');
    data.set('password', 'dn2-fJSL');
    const postBody = "grant_type=password&username=Hallam1&password=dn2-fJSL";
    let request = new XMLHttpRequest();
    request.open('POST','https://hallam.sci-toolset.com/api/v1/token', true);
    request.send(data);
    request.onreadystatechange = function() {
        if (request.readyState === 4  && request.status === 200){
            var json = JSON.parse(request.responseText);
            authenication = {
                "access_token" : json.access_token,
                "refresh_token" : json.refresh_token,
                "expires_in" : json.expires_in

            };
            authToken = 'Bearer ' + authenication.access_token;
            getProducts();
            }
        }
}
function initMap(){
    console.log("init");

  map = L.map('map').setView([54.3138, -2.169], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 9,
    minZoom: 6
  }).addTo(map);
  addCountiesToMap();
  authenticate();
}
function addCountiesToMap(){
    console.log("adding");

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
}
function getProducts() {
    const postBody = "{\"size\":100, \"keywords\":\"\"}";//, \"strings\":[{\"field\":\"sceneimagery\",\"value\":[\"*\"],\"operator\":\"or\"}]}";
    let request = new XMLHttpRequest();
    request.open('POST','https://hallam.sci-toolset.com/discover/api/v1/products/search',true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', authToken);
    request.setRequestHeader('Accept', '*/*');
    request.send(postBody);
    request.onreadystatechange = function() {
        if (request.readyState === 4  && request.status === 200){
            var json = JSON.parse(request.responseText);
            console.log(json.results.searchresults.length);
           
            for(var x = 0; x < json.results.searchresults.length; x++){
                getGeoJson(json.results.searchresults[x].id,function(geoJSONdata){
                    console.log(x);
                addToMap(geoJSONdata);

            
                imageData.push(geoJSONdata)
                });
            }
        }
    }
}
function getMissionById(id){
    activeSearch = true; 
    for(var x = 0; x < layerData.length; x++){
        map.removeLayer(layerData[x]);
    }
    addCountiesToMap();

    var searchQ = [];
    missionIDfound = false;
    console.log(imageData); 
    //Check if the missionID is given, if so display all polygons with that ID
    /*
    for(var x = 0; x < missionDict.length; x++){
        if(id == missionDict[x].missionid){
            missionIDfound = true; 
            searchQ.push(missionDict[x].searchid);
        }
    }*/

    for(var x = 0; x < imageData.length; x++){
        if(id == imageData[x].properties.missionid){
            missionIDfound = true; 
            console.log(imageData[x].properties.missionid);
            searchQ.push(imageData[x].properties.id); 
        }
    } 

    if(missionIDfound){
        for(var x = 0; x < searchQ.length; x++){
            getGeoJson(searchQ[x], function(geoJSONdata){
                addToMap(geoJSONdata);
                var mapLocation = geoJSONdata.properties.centre.split(",");
        
                marker = L.marker({lat : mapLocation[0], lng : mapLocation[1]});
                marker.addTo(markerGroup); 
                marker.addTo(map);
            });
        }
        //zoom out to see all missions
        var zoomScale = map.getZoom(); 
        if(zoomScale > 6) map.zoomOut(6);
        map.setView([54.3138, -2.169], 6);

        if(searchQ.length > 1) document.getElementById("results").textContent = searchQ.length + " Results found";
        else document.getElementById("results").textContent = searchQ.length + " Result found";
        

        //PUT POLYGON ID'S IN TABLE
        var tabBody = document.getElementsByTagName("tbody").item(0);

        for(var x = 0; x < searchQ.length; x++){
            var row = document.createElement("tr");
            var cell1 = document.createElement("td");
            var cell2 = document.createElement("td"); 

            var textnode = document.createTextNode(searchQ[x]);
            var buttonnode = document.createElement("button");
            
            buttonnode.innerHTML = "View"; 
            //buttonnode.setAttribute( "onClick", "getMissionById(searchQ[x]);" )
            cell1.appendChild(textnode);
            cell2.appendChild(buttonnode); 

            row.appendChild(cell1);
            row.appendChild(cell2);
            tabBody.appendChild(row); 
       
        }
        document.getElementById("polyIDtable").hidden = false; 
    }else{
    getGeoJson(id, function(geoJSONdata){
        addToMap(geoJSONdata);
        var mapLocation = geoJSONdata.properties.centre.split(",");
         markerGroup.eachLayer(function(layer){
            map.removeLayer(layer); 
        });
        marker = L.marker({lat : mapLocation[0], lng : mapLocation[1]});
        marker.addTo(markerGroup);
        marker.addTo(map);
        map.flyTo({lat: mapLocation[0], lng: mapLocation[1]});
        
        sleep(700).then(() => {
        map.zoomIn(4);
        })
        document.getElementById("polyIDtable").hidden = true; 
    });
    }
}
function getGeoJson(id, callback){
    //console.log(id);
    let request = new XMLHttpRequest();
    request.open('GET','https://hallam.sci-toolset.com/discover/api/v1/products/' + id, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', authToken);
    request.setRequestHeader('Accept', '*/*');
    request.send(null);
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200){
            var json = JSON.parse(request.responseText);
            var area = turf.area(turf.polygon(json.product.result.footprint.coordinates));
            area = ((area/1000000));
            areaData.push(area);
            var percentage = (area/areaOfUk)*100;
            var geojson = 
            {
                "type": "Feature",
                "properties" : {
                     "missionid" : json.product.result.missionid,
                     "documentType" : json.product.result.documentType,
                     "area" : area,
                     "percentage": percentage,
                     "id" : id,
                     "centre": json.product.result.centre
                },
                "geometry" : json.product.result.footprint
            };
            callback(geojson);
        }
    }
}
function addToMap(data){
    L.geoJSON(data, {
        onEachFeature: function(feature, layer) {
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
    // using d3.js
    // graph dimensions
    var margin = {top:10, right: 30, bottom: 30, left: 40 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var x = d3.scaleLinear()
    .domain([0,1000])
    .range([0,width]);

    var y = d3.scaleLinear()
    .range([height,0])
    y.domain([0, height]);

    
    var histogram = d3.histogram()
    .value(function(d) { return d.price; })
    .domain(x.domain())
    .thresholds(x.ticks(70));

    var svg = d3.select("#histogramDisplay").append("svg")
        .attr("width",width + margin.left + margin.right)
        .attr("height",height + margin.top + margin.bottom)
        .append("g")
        .attr("transform","translate("+ margin.left + "," + margin.top + ")");

    d3.csv("http://192.168.17.1:8887/data/areadata.csv").then(function(data){
        for(var i = 0; i < data.length; i++){
            console.log(data[i])
        }

    var bins = histogram(data);


    svg.selectAll("rect")
    .data(bins)
    .enter().append("rect")
        .attr("x",1)
        .attr("transform", function(d) {return "translate(" +x(d.x0) + "," + y(d.length) + ")";})
        .attr("width", function(d) {return x(d.x1) - x(d.x0) - 1;})
        .attr("height", function(d) {return height - y(d.length);})
        .style("fill", "#000000")
    })
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
    .call(d3.axisLeft(y));
}
var specElement = document.getElementById("searchbar");
var sidebar = document.getElementById("sidebar");




//REFRESH MISSIONS AFTER SEARCH WHEN SEARCH BAR IS CLICKED 
document.addEventListener('click', function(event){
    var isClickInside = specElement.contains(event.target);    
    if(isClickInside && activeSearch){
        specElement.value = '';

        markerGroup.eachLayer(function(layer){
            map.removeLayer(layer); 
        });

        for(var x = 0; x < layerData.length; x++){
            map.removeLayer(layerData[x]);
        }
        activeSearch = false; 
        imageData = [];
        document.getElementById("results").textContent = "0 Result found";
        document.getElementById("polyIDtable").hidden = true; 

        getProducts(); 
    }

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