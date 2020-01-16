///////////////////HISTOGRAM///////////////////
var testData = [];
function dataSort() {
    // storing mission area into array
    if (graphClicked == false) {
        for (var x = 0; x < imageData.length; x++) {
            areaData.push(imageData[x].properties.area, imageData[x].properties.missionid);
            testData.push(imageData[x].properties.area);
            testData.sort(function(a,b){return a-b});
            startDates.push(imageData[x].properties.startdate);
        }
        console.log( x + " records processed");
        getHistogram();
        getHistogram1();
        getHistogram2();
        graphClicked = true;
        var panel = document.getElementsByClassName('panel')[1];
        panel.style.maxHeight = panel.scrollHeight +"px";
    }
    // overwriting the values in array if button is repressed, this is to stop the data duplicating
    else
        {
        for (var x = 0; x < imageData.length; x= x+2){
            areaData[x] = imageData[x].properties.area;
        }
        for (var x = 0; x < imageData.length; x++){
            startDates[x] = imageData[x].properties.startdate;
        }
        x = 0;
         for (var y = 1; y < imageData.length; y = y+2){
                 areaData[y] = imageData[y].properties.missionid;
         }  
        getHistogram2();      
    }
}

function showRegionHistogram(){
    var data;
    var x = [];
    var y = [];
    for(var x1 = 0; x1 < counties.length; x1++)
    {
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

        plot_bgcolor: '#F95738',
        paper_bgcolor: '#F95738',

        title: {
            text: 'Number of missions per county',
            font: {
                family: 'Courier New, monospace',
                size: 24
            },
        },
        xaxis: {
            title: {
                text: 'Counties',
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
        }
    }
    Plotly.newPlot('countiesHistogram', data, layout);
    var panel = document.getElementsByClassName('panel')[1];
    panel.style.maxHeight = panel.scrollHeight +"px"; 
}

//covered per day (cumalative)
function getHistogram1() {
    // using plot.ly
    removeDups();
    var trace = {
        histfunc: "sum",
        x: startDates,
        y: areaData,
        type: 'histogram',
        cumulative:{enabled: true},
        marker: {
            color: '#0D3B66'
        },
    };
    var layout = {

        title: {
            text: 'Area covered per day(Cumalative)',
            font: {
                family: 'Courier New, monospace',
                size: 24
            },
        },

        xaxis: {
            title: {
                text: 'Mission Date',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#000000'
                }
            },
        },

        yaxis: {
            title: {
                text: 'Area km²',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#000000'
                }
            },
        },

        plot_bgcolor: '#F95738',
        paper_bgcolor: '#F95738'
    };

    Plotly.newPlot('areaGraph', [trace], layout);
}

//covered per day
function getHistogram() {
    // using plot.ly
    removeDups();
    var trace = {
        histfunc: "sum",
        x: startDates,
        y: areaData,
        type: 'histogram',
        marker: {
            color: '#0D3B66'
        },
    };
    var layout = {
        title: {
            text: 'Area covered per day',
            font: {
                family: 'Courier New, monospace',
                size: 24
            },
        },

        xaxis: {
            title: {
                text: 'Mission Date',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#000000'
                }
            },
        },

        yaxis: {
            title: {
                text: 'Area km²',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#000000'
                }
            },
        },

        plot_bgcolor: '#F95738',
        paper_bgcolor: '#F95738'
    };

    Plotly.newPlot('closestGraph', [trace], layout);
}

//area of missions
function getHistogram2() {
    // using plot.ly
    //remove duplicates from areaData

    var myPlot = document.getElementById('missionGraph')
        var trace = {
            x: areaData,
            type: 'histogram',
            marker: {
                color: '#0D3B66'
            }, 
        };
        var layout = {
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
                range: [0, 600]
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
        };
  
    Plotly.newPlot('missionGraph', [trace], layout);


    
    //SAM - I'll try and get this working but i'm not promising anything 
    /*
    myPlot.on('plotly_click', function(data){
        var pts = '';
        //gets point clicked on histogram
        for(var i=0; i < data.points.length; i++){
            pts = data.points[i].x;
            console.log(pts); 
        }
        //check if mission has been searched
        if(activeSearch){
            //only search through current missions
            var searchQdata = []; 
            for(var x = 0; x < searchQ.length; x++){
                getProductFromImageData(searchQ[x], function(geoJSONdata){
                    searchQdata.push(geoJSONdata);
                });
            } 
            
            //set search range
            var lowRange = null;
            var highRange = null;
            
            switch(pts){
                case 0: {
                    lowRange = -50;
                    highRange = 49; 
                    break; 
                }
                case 50: {
                    lowRange = 50;
                    highRange = 100; 
                    break; 
                }
                case 100: {
                    lowRange = 100;
                    highRange = 150;
                    break;
                }
                case 150: {
                    lowRange = 150;
                    highRange = 200;
                    break;
                }
                case 200: {
                    lowRange = 200;
                    highRange = 250;
                    break;
                }
                case 250: {
                    lowRange = 250;
                    highRange = 300;
                    break;
                }
                case 300: {
                    lowRange = 250;
                    highRange = 350;
                    break;
                }
                case 350: {
                    lowRange = 350;
                    highRange = 400;
                    break;
                }
                case 400: {
                    lowRange = 400;
                    highRange = 450;
                    break;
                }
                case 450: {
                    lowRange = 450;
                    highRange = 500;
                    break;
                }
                case 500: {
                    lowRange = 500;
                    highRange = 1000;
                    break;
                }
            }
            //reset markers 
            markerGroup.eachLayer(function(layer){
                map.removeLayer(layer); 
            });
            //search using high and low range
            console.log(searchQdata);
            for(var x = 0; x < searchQdata.length; x++){
                if(searchQdata[x].properties.area > lowRange && searchQdata[x].properties.area < highRange){
                    console.log(searchQdata[x]);
                    console.log('high range: ' + highRange + ' low range: ' + lowRange);
                    //add marker
                    var mapLocation = turf.centroid(searchQdata[x]);
                    marker = L.marker({lng: mapLocation.geometry.coordinates[0], lat: mapLocation.geometry.coordinates[1]});
                    marker.addTo(markerGroup);
                    marker.addTo(map);
                }
            };
            
        }

    });
    */
}
function missionSearchHistogram(searchQ){
    areaData = [];
    for(var x = 0; x < searchQ.length; x++){
        getProductFromImageData(searchQ[x], function(geoJSONdata){
            areaData.push(geoJSONdata.properties.area); 
        })
    } 
    console.log(areaData);
    activeSearch = true; 
    getHistogram2(); 
    getHistogram();
    getHistogram1();
};


function removeDups(){
    var UniqueArea = []; 
    for(var x = 0; x < areaData.length; x++){
        var dupFound = false; 
        var toPush = areaData[x]; 
        for(var p = 0; p < UniqueArea.length; p++){
            if(toPush == UniqueArea[p]){
                dupFound = true; 
            }
        }
        if(!dupFound) UniqueArea.push(toPush); 
    }
    areaData = UniqueArea; 
};



//Add More histograms here !!

