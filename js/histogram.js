///////////////////HISTOGRAM///////////////////
function dataSort() {
    // storing mission area into array
    if (graphClicked == false) {
        for (var x = 0; x < imageData.length; x++) {
            areaData.push(imageData[x].properties.area, imageData[x].properties.missionid);
            startDates.push(imageData[x].properties.startdate);
        }
        console.log( x + " records processed");
        getHistogram();
        graphClicked = true;
        var panel = document.getElementsByClassName('panel')[1];
        panel.style.maxHeight = panel.scrollHeight +"px";
    }
    // overwriting the values in array if button is repressed, this is to stop the data duplicating
    else
        {
        for (var x = 0; x < imageData.length; x++){
            areaData[x] = imageData[x].properties.area;
            startDates[x] = imageData[x].properties.startdate;
        }
        for (var y = 0; y < imageData.length; y++){
                areaData[x][y] = imageData[y].properties.missionid;
        }  
        getHistogram();      
    }
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

    Plotly.newPlot('histogramDisplay', [trace], layout)
        .then(() => {
            return Plotly.toImage({ setBackground: setBackground })
        });
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

    Plotly.newPlot('histogramDisplay', [trace], layout)
        .then(() => {
            return Plotly.toImage({ setBackground: setBackground })
        });
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

        xaxis: {
            title: {
                rangemode: 'tozero',
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

    Plotly.newPlot('histogramDisplay', [trace], layout)
        .then(() => {
            return Plotly.toImage({ setBackground: setBackground })
        });
}

//Add More histograms here !!