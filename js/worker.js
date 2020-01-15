onmessage = function (e) {
    self.importScripts('https://npmcdn.com/@turf/turf/turf.min.js');
    self.importScripts("https://d3js.org/d3.v5.js");
    console.log("here");
    var counties = [];
    var missionsInUk = [];
    arrcreated = e.data[1];
    regionsData = e.data[2];
    countiesData = e.data[3];
    areaOfUk = e.data[4];
    for (var u = 0; u < e.data[0].length; u++) {
        console.log("Loading");
        missionGeoJSON = e.data[0][u];
        if (arrcreated == false) {          // if the array has been created dont create a new one
            for (var i = 0; i < regionsData.length; i++) {            //create a array the size of the amount of countys
                counties.push({ name: regionsData[i].properties.name, missionsInside: 0 });       //push starting values to the array
            }
            arrcreated = true;      //after the array has been created make it unable to create another
        }
        missionGeoJSON = turf.simplify(turf.cleanCoords(missionGeoJSON), { tolerance: 0.0001 }).geometry

        for (var o = 0, size2 = countiesData.length; o < size2; o++) {

            for (var p = 0, size = countiesData[o].geometry.coordinates.length; p < size; p++) {

                var currentSegement = turf.polygon(countiesData[o].geometry.coordinates[p]);
                var intersectarea = turf.intersect(currentSegement, missionGeoJSON);

                if (intersectarea != undefined) {
                    intersectarea.properties = e.data[0][u].properties;
                    intersectarea.properties.area = turf.area(intersectarea) / 1000000;
                    intersectarea.properties.percentage = ((intersectarea.properties.area / areaOfUk) * 100);
                    missionsInUk.push(intersectarea);
                }
            }
        }
    }

    console.log("loaded DATA successfully");
    postMessage([counties, missionsInUk]);
}