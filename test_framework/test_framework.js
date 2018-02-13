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
				$("#proofRuleJustifications").val($("#proofRuleJustifications").val() + "\n" + "-");
			$("#proofRules").val($("#proofRules").val() + "\n" + ruleText);
		}else{
			if(ruleText === "assume") //add "-" automatically
				$("#proofRuleJustifications").val("-");
			$("#proofRules").val(ruleText);
		}
	});

	$("#btnCheck").click(function(){
		let proofLineDepsString	= $("#proofLineDeps").val();
		let proofPropsString 	= $("#proofProps").val();
		let proofRulesString 	= $("#proofRules").val();
		let proofRuleJustificationsString = $("#proofRuleJustifications").val();


		if(proofLineDepsString==="" || proofPropsString==="" || proofRulesString==="" || proofRuleJustificationsString===""){
			$("#errorMsg").text("One or more textareas are empty");
			return false;
		}

		//get proof into arrays for adding to ProofLine object
		let proofLineDeps = proofLineDepsString.split('\n');
		let proofProps 	  = proofPropsString.split('\n');
		let proofRules 	  = proofRulesString.split('\n');
		let proofRuleJustifications = proofRuleJustificationsString.split('\n');

		if(proofLineDeps.length !== proofProps.length || proofProps.length !== proofRules.length || proofRules.length !== proofRuleJustifications.length){
			$("#errorMsg").text("Number of Lines are not equal for all input areas");
			return false;
		}

		//proof structure is now valid
		$("#errorMsg").text("");
		$('#btnValidateProof').prop('disabled', false);
		$('#btnValidateCancel').prop('disabled', false);

		$("#proofString").text(""); //clear proof string
		for(var i=0; i<proofProps.length; i++){
			let ruleDepsArray = [];
			let lineDepsArray = [];
			let currentRuleDeps = proofRuleJustifications[i];
			let currentLineDeps = proofLineDeps[i];

			ruleDepsArray = currentRuleDeps.replace('/\s/g', '').split(',').map(Number); //"1,2,3" = [1,2,3]
			lineDepsArray = currentLineDeps.replace('/\s/g', '').split(',').map(Number); //"1,2,3" = [1,2,3]
			if(ruleDepsArray[0] === 0)
				ruleDepsArray = [];
			if(lineDepsArray[0] === 0)
				lineDepsArray = [];

			if(i+1 === proofProps.length)
				proof.push(new ProofLine([], i+1, proofProps[i], proofRules[i], ruleDepsArray));
			else
				proof.push(new ProofLine(lineDepsArray, i+1, proofProps[i], proofRules[i], ruleDepsArray));

			$("#proofString").text($("#proofString").text() + proof[i].getLineAsString() + "\n");
		}

		//display as formula
		formula = proof[proof.length-1].getProposition();
		$("#proofString").text($("#proofString").text() + "\nFormula: " + formula);

		$("#btnCheck").prop("disabled", true);
		$("#btnAddRule").prop("disabled", true);
		$("#proofLineDeps").prop("disabled", true);
		$("#proofProps").prop("disabled", true);
		$("#proofRules").prop("disabled", true);
		$("#proofRuleJustifications").prop("disabled", true);
	});

	$("#btnValidateCancel").click(function(){
		//enable
		$("#btnCheck").prop("disabled", false);
		$("#btnAddRule").prop("disabled", false);
		$("#proofLineDeps").prop("disabled", false);
		$("#proofProps").prop("disabled", false);
		$("#proofRules").prop("disabled", false);
		$("#proofRuleJustifications").prop("disabled", false);

		//disable
		$('#btnValidateProof').prop('disabled', true);
		$('#btnValidateCancel').prop('disabled', true);

		//reset
		proof = [];
		formula = "";
		$("#proofString").text("{ Proof will appear here }");
		$("#feedback").text("{ Feedback will appear here }");
	});

	$("#btnValidateProof").click(function(){
		let statement = new tombstone.Statement(formula);
		let formulaTree = statement.tree["tree"][0];

		var proofValidator = new ProofValidator(formulaTree, proof, false);
		var isProofValid = proofValidator.isProofValid();
		var proofFeedback = proofValidator.getFeedback(); //array of feedback
		console.log(proofValidator.getAssumeList());
		console.log(proofFeedback);

		$("#feedback").text("");
		if(proofFeedback.length < 1){
			for(var i=0; i<proofFeedback.length; i++){
				$("#feedback").text($("#feedback").text() + proofFeedback[i] + "\n");
			}
		}
	});
});





