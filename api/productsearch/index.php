<?php   
function getProducts(){

      $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
      if($contentType === "plain/text")
      {
        $content = trim(file_get_contents("php://input"));
        $url = "https://hallam.sci-toolset.com/discover/api/v1/products/search";
        $data = "{\"size\":100, \"keywords\":\"\"}";
        $curl = curl_init($url);
        $authorization = "Authorization: Bearer " . $content;
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        $authorization,
        'Accept : */*',
        'Host : hallam.sci-toolset.com'
        ]);
        $response = curl_exec($curl);
        curl_close($curl);      
        $data = json_decode($response);
        $data = $data->results->searchresults;
        echo json_encode($data);
      }
      else{
        echo "You get not allowed to GET this function";
      }
    }
    getProducts();
?>
