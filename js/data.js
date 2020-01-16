//LOAD DATA FROM FILES IN
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
    console.log(areaOfUk);
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

///////////////////API CALLS///////////////////
//Call php token to get the api key
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
  //Get a list of ids from discover API
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
  //Get geoJSON data from discover API using every ID in array
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
  //Get geoJSON data from discover API using ID
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
  //Get geoJSON data from array using ID
  function getProductFromImageData(id, callback) {
    for (var x = 0; x < imageData.length; x++) {
      if (imageData[x].properties.id == id) {
        callback(imageData[x]);
      }
    }
}

//Save image data to image file using php ajax call
function saveFile(data) {
    var jsonString = JSON.stringify(data);
    $.ajax({
      url: "php/save.php",
      data: { jsonString: jsonString },
      type: "POST"
    });
  }
  //Save county data to image file using php ajax call
  function saveCounties(data) {
    var counties = JSON.stringify(data);
    $.ajax({
      url: "php/savecounties.php",
      data: { counties: counties },
      type: "POST"
    });
  }