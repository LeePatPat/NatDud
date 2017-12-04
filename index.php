<?php

$formula = $_POST["formula"];
$proof = "";
$action = "Prove Formula"; //"Prove Formula" or "Annotate Formula"

if(!empty($formula)){
	//get liglab stuff
	/*
		$formula = $_POST['formula'];
		$proof   = $_POST['proof'];
		$action  = $_POST['action'];
	*/

	$url = "http://http://teachinglogic.liglab.fr/DN/index.php";
	
	//build post data for request
	$proofData = array("formula" => $formula,
					     "proof" => $proof,
						"action" => $action);
	$postProofData = http_build_query($proofData);
	
	$ch = curl_init(); //open connection

	//sort curl settings for request
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_POST, 3);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $postProofData);

	//obtain data from LigLab
	$result = curl_exec($ch);

	//finish connection	
	curl_close($ch);
	

	echo "forumla: " . $formula;
}

?>

<!DOCTYPE html>
<html>
    <head>
		<title>ND Tester</title>
    </head>
	<body>
		<form action="index.php" method="post">
			<input name="formula" type="text" placeholder="formula here">
			</br>
			<input name="submit" type="submit">
		</form>
    </body>     
</html>

<?php
	echo $result;
?>









