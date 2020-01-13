<?php  
function getProductJSON(){
      $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
      if($contentType === "plain/text")
      {
        $content = trim(file_get_contents("php://input"));
        $array = explode(" ", $content);
        $id = $array[0];
        $authToken = $array[1];
        $authorization = "Authorization: Bearer " . $authToken;
        $url = "https://hallam.sci-toolset.com/discover/api/v1/products/" . $id;
        $curl = curl_init($url);      
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        $authorization,
        'Accept : */*'
        ]);
        $response = curl_exec($curl);
        curl_close($curl);
        $data = json_decode($response);
        $datemodified =date ('Y-m-d H:i:s', $data->product->result->datemodified/1000);
        $datecreated =date ('Y-m-d H:i:s', $data->product->result->datecreated/1000);
        
        $jsonData = array(
          "type" => "Feature",
          "properties" => array(
            "missionid" =>  $data->product->result->missionid,
            "documentType" =>  $data->product->result->documentType,
            "area" => "NaN",
            "percentage" => "NaN",
            "id" =>  $id,
            "centre" =>  $data->product->result->centre,
            "datemodified" => $datemodified,
            "datecreated" => $datecreated
          ),
          "geometry" => $data->product->result->footprint
        );
        $test = json_decode($jsonData);
        $test1 = json_encode($jsonData);
        echo $test1;
      }
      else{
          echo "You get not allowed to GET this function";
        }
}
getProductJSON();
?>