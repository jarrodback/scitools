<?php
    $data = $_POST['raw'];
    chmod ("../data/images.json", 0777);
    $file = "../data/images.json";
    $handle = fopen($file, "w") or die ("Cannot open file: " . $file);
    fwrite($handle, $data);
    fclose($handle);

?>