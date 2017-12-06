<?php
//retrieve proof by proving first, then annotating, then retrieving annotated proof data

use JonnyW\PhantomJs\Client;

class LigLabApi {
	/*
		FIELDS
	*/
	public $url = "http://teachinglogic.liglab.fr/DN/index.php";
	public $client = Client::getInstance;
	
	
	public function pjstest(){
		$request = $client->getMessageFactory()->createRequest("http://jonnyw.me" , 'GET');
		$response = $client->getMessageFactory()->createResponse();
		$client->send($request, $response);
		if($response->getStatus() === 200) return $response->getContent();
	}
	
	
	
	
	/*
		FUNCTIONS
	*/
	//takes the annotated proof from liglab
	public function generateListedProof($formula){
		
	}

	
	
	
	
	
	
	
	//requests proof data from LigLab
	public function proveFormula($formula){
		$url = $this->url;
		
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
		
		if(!$result) return "something went wrong during proof...";
		
		//get proof data
		$dom = new DOMDocument();
		@$dom->loadHTML($result);
		$proofText = $dom->getElementsByTagName('textarea')->item(1)->nodeValue;
		
		if(empty($proofText)){
			return "something went wrong during proof...";
		}else{
			return "<pre>" .
				 trim($proofText) .
				 "</br>" .
				 "</pre>";
		}
	}
	
	//return liglab url
	public function getUrl() {
		return $url;
	}
}
?>