<?php
if(isset($_POST['raw']){
    $data = $_POST['raw'];
    chmod ("../data/images.json", 0777);
    $file = "../data/images.json";
    $handle = fopen($file, "w") or die ("Cannot open file: " . $file);
    fwrite($handle, $data);
    fclose($handle);
})
else if(isset($_POST['counties'])){
    $data = $_POST['counties'];
    chmod ("../data/counties.json", 0777);
    $file = "../data/counties.json";
    $handle = fopen($file, "w") or die ("Cannot open file: " . $file);
    fwrite($handle, $data);
    fclose($handle);
})

?>