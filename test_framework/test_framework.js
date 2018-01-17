var ProofValidator = require('../js/proofValidator.js');
var ProofLine = require('../js/proofLine.js');
var tombstone = require('../js/tombstone.min.js');
var $ = require('jquery');

/*
 *	JQuery to manipulate elements and validations
 */
$(document).ready(function(){
	/**GLOBALS*/
	var isFirstLine = function(){return $("#proofRules").val() === ""}
	var proof = [];
	var formula = "";

	$("#btnAddRule").click(function(){
		let ruleText = $('#proof-rule-dropdown').find(":selected").val();
		if(!isFirstLine()){
			if(ruleText === "assume") //add "-" automatically
				$("#proofRuleDeps").val($("#proofRuleDeps").val() + "\n" + "-");
			$("#proofRules").val($("#proofRules").val() + "\n" + ruleText);
		}else{
			if(ruleText === "assume") //add "-" automatically
				$("#proofRuleDeps").val("-");
			$("#proofRules").val(ruleText);
		}
	});

	$("#btnCheck").click(function(){
		let proofPropsString 	= $("#proofProps").val();
		let proofRulesString 	= $("#proofRules").val();
		let proofRuleDepsString = $("#proofRuleDeps").val();


		if(proofPropsString==="" || proofRulesString==="" || proofRuleDepsString===""){
			$("#errorMsg").text("One or more textareas are empty");
			return false;
		}

		//get proof into arrays for adding to ProofLine object
		let proofProps 	  = proofPropsString.split('\n');
		let proofRules 	  = proofRulesString.split('\n');
		let proofRuleDeps = proofRuleDepsString.split('\n');

		if(proofProps.length !== proofRules.length || proofRules.length !== proofRuleDeps.length){
			$("#errorMsg").text("Number of Lines are not equal for all input areas");
			return false;
		}

		//proof is now valid
		$("#errorMsg").text("");
		$('#btnValidateProof').prop('disabled', false);
		$('#btnValidateCancel').prop('disabled', false);

		$("#proofString").text(""); //clear proof string
		for(var i=0; i<proofProps.length; i++){
			let ruleDepsArray = [];
			let currentRuleDeps = proofRuleDeps[i];

			ruleDepsArray   = currentRuleDeps.replace('/\s/g', '').split(',').map(Number); //"1,2,3" = [1,2,3]

			proof.push(new ProofLine([], i+1, proofProps[i], proofRules[i], ruleDepsArray));
			$("#proofString").text($("#proofString").text() + proof[i].getLineAsString() + "\n");
		}

		//display as formula
		formula = proof[proof.length-1].getProposition();
		$("#proofString").text($("#proofString").text() + "\nFormula: " + formula);

		$("#btnCheck").prop("disabled", true);
		$("#btnAddRule").prop("disabled", true);
		$("#proofProps").prop("disabled", true);
		$("#proofRules").prop("disabled", true);
		$("#proofRuleDeps").prop("disabled", true);
	});

	$("#btnValidateCancel").click(function(){
		//enable
		$("#btnCheck").prop("disabled", false);
		$("#btnAddRule").prop("disabled", false);
		$("#proofProps").prop("disabled", false);
		$("#proofRules").prop("disabled", false);
		$("#proofRuleDeps").prop("disabled", false);

		//disable
		$('#btnValidateProof').prop('disabled', true);
		$('#btnValidateCancel').prop('disabled', true);

		//reset
		proof = [];
		formula = "";
		$("#proofString").text("{ Proof will appear here }");
	});

	$("#btnValidateProof").click(function(){
		let statement = new tombstone.Statement(formula);
		let formulaTree = statement.tree["tree"][0];

		var proofValidator = new ProofValidator(formulaTree, proof);
		var isProofValid = proofValidator.isProofValid();
		var proofFeedback = proofValidator.getFeedback(); //array of feedback
		console.log(proofFeedback);
	});
});

/* example to copy and paste
A
B
A&B
*/