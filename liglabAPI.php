<?php
//retrieve proof by proving first, then annotating, then retrieving annotated proof data

/*
	FIELDS
*/
$url = "http://teachinglogic.liglab.fr/DN/index.php";



/*
	FUNCTIONS
*/
//takes the annotated proof from liglab
function generateListedProof($formula){
	
}

//requests proof data from LigLab
function proveFormula($formula){
	global $url;
	
	//build post data for request
	$proofData = array("formula" => $formula,
					     "proof" => "",
						"action" => "Prove Formula");
	$postProofData = http_build_query($proofData);
	
	$ch = curl_init($url); //open connection
	
	//sort curl settings for request
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_POST, 3);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $postProofData);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //return as String 

	//obtain data from LigLab
	$result = curl_exec($ch);

	//finish connection	
	curl_close($ch);
	
	//get proof data
	$dom = new DOMDocument();
	@$dom->loadHTML($result);
	$proofText = $dom->getElementsByTagName('textarea')->item(1)->nodeValue;
	
	if(empty($proofText)){
		return "something went wrong during proof...";
	}else{
		return "<pre></br>" .
		     trim($proofText) .
		     "</br>" .
		     "</pre>";
	}
}
?>