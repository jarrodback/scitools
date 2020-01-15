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


function getHistogram1() {
    // using plot.ly
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

function getHistogram() {
    // using plot.ly
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

function getHistogram2() {
    // using plot.ly
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

    myPlot.on('plotly_click', function(data){
        var pts = '';
        for(var i=0; i < data.points.length; i++){
            pts = data.points[i].x;
        }

        //X axis values of histogram bars increasing 50 each time; 
        //add hover over 

        var histoBarPts = []; 
        histoBarPts.push(25);
        histoBarPts.push(75);
        histoBarPts.push(125); 
        histoBarPts.push(175);
        histoBarPts.push(225); 
        histoBarPts.push(275);
        histoBarPts.push(325); 
        histoBarPts.push(375);
        histoBarPts.push(425);
        histoBarPts.push(475); 
        histoBarPts.push(525);
        histoBarPts.push(575); 

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
                        if(imageData[x].properties.area < 50){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    }
                    break;
                }
                case 2: {
                    //range 50 - 100 
                    console.log("range 50-100")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area > 50 && imageData[x].properties.area < 100){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    }
                    break;
                }
                case 3: {
                    //range 100 - 150  
                    console.log("range 100-150")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area > 100 && imageData[x].properties.area < 150){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    }
                    break;
                }
                case 4: {
                    //range 150 - 200  
                    console.log("range 150-200")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area > 150 && imageData[x].properties.area < 200){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                    }
                    break; 
                }
                case 5: {
                    //range 200 - 250
                    console.log("range 200-250")
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area > 200 && imageData[x].properties.area < 250){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                        break;
                    }
                };
                case 6: {
                    //range 250 - 300  
                    for(var x = 0; x < imageData.length; x++){
                        if(imageData[x].properties.area > 250 && imageData[x].properties.area < 300){
                            areaSearchQ.push(imageData[x].properties.id); 
                        }
                        break;
                    }
                };
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                case 12:
        }
    console.log(areaSearchQ);
    
    for(var x = 0; x < layerData.length; x++){
        map.removeLayer(layerData[x]);
    }
    markerGroup.eachLayer(function(layer){
        map.removeLayer(layer);
    });
    addCountiesToMap();
    
    for(var p = 0; p < areaSearchQ.length; p++){
        getProductFromImageData(areaSearchQ[p], function(geoJSONdata){
            //add geoJSONdata to the map
            console.log(geoJSONdata);
            addToMap(geoJSONdata);

            var mapLocation = geoJSONdata.properties.centre.split(",");
            marker = L.marker({lat : mapLocation[0], lng : mapLocation[1]});
            marker.addTo(markerGroup); 
            marker.addTo(map);
            
        })
    }
    });
}
//Add More histograms here !!

