<?php 

global $authToken;

function getToken(){

      $url = "https://hallam.sci-toolset.com/api/v1/token";
      $data = "grant_type=password&username=Hallam1&password=dn2-fJSL";
      $curl = curl_init($url);
      //RETURNTRANSFER -> force string return
      curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
      //POST -> set post call
      curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
      curl_setopt($curl, CURLOPT_POST, true);
      curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
      curl_setopt($curl, CURLOPT_HTTPHEADER, [
       'Content-Type : application/x-www-urlencoded',
       'Accept : */*'
      ]);
      $response = curl_exec($curl);
      curl_close($curl);
      $auth = json_decode($response);
      $GLOBALS['authToken'] = $auth->access_token;
}
getToken();
?>