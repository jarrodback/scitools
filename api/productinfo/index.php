<?php  
  include('../token/index.php');
function getProductJSON(){
      $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
      if($contentType === "plain/text")
      {
        $content = trim(file_get_contents("php://input"));
        $authToken = $GLOBALS['authToken'];
        $authorization = "Authorization: Bearer " . $authToken;
        $url = "https://hallam.sci-toolset.com/discover/api/v1/products/" . $content;
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
        $startdate =date ('Y-m-d H:i:s', $data->product->result->objectstartdate/1000);
        $enddate =date ('Y-m-d H:i:s', $data->product->result->objectenddate/1000);
        
        $jsonData = array(
          "type" => "Feature",
          "properties" => array(
            "missionid" =>  $data->product->result->missionid,
            "documentType" =>  $data->product->result->documentType,
            "area" => "NaN",
            "percentage" => "NaN",
            "id" =>  $content,
            "centre" =>  $data->product->result->centre,
            "datemodified" => $datemodified,
            "datecreated" => $datecreated,
            "startdate" => $startdate,
            "enddate" => $enddate
          ),
          "geometry" => $data->product->result->footprint
        );
        $test1 = json_encode($jsonData);
        echo $test1;
      }
      else{
          echo "You get not allowed to GET this function";
        }
}
getProductJSON();
?>