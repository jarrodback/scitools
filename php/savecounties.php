<?php
    $data = $_POST['raw'];
    chmod ("../data/counties.json", 0777);
    $file = "../data/counties.json";
    $handle = fopen($file, "w") or die ("Cannot open file: " . $file);
    fwrite($handle, $data);
    fclose($handle);

?>