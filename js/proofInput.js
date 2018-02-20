var treeToFormula = require('./treeToFormula.js');
var ProofLine = require('./proofLine.js');
var tombstone = require('./tombstone.min.js'); //new tombstone.Statement(formula);
var ProofValidator = require('./proofValidator.js');
var $ = require('jquery');

/*
 *	JQuery to manipulate elements and validations
 */
$(document).ready(function(){
	var formulaValid 	= false; //true is the formula has already been accepted
	var formulaString 	= "";
	var currentLine 	= 1; //current line of the proof
	var message 		= ""; //error message to be displayed
	var $lastFocus 		= null; //keeps last input 
	
	//logic button actions
	$("#logic-imply").click(function(e){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "→");
			$("#formula").focus();
		}else{
			if($lastFocus != null){
				$lastFocus.val( $lastFocus.val() + "→" );
				$lastFocus.focus();
			}
		}
	});
	$("#logic-and").click(function(){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "∧");
			$("#formula").focus();
		}else{
			if($lastFocus != null){
				$lastFocus.val( $lastFocus.val() + "∧" );
				$lastFocus.focus();
			}
		}
	});
	$("#logic-or").click(function(){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "∨");
			$("#formula").focus();
		}else{
			if($lastFocus != null){
				$lastFocus.val( $lastFocus.val() + "∨" );
				$lastFocus.focus();
			}
		}
	});
	$("#logic-not").click(function(){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "¬");
			$("#formula").focus();
		}else{
			if($lastFocus != null){
				$lastFocus.val( $lastFocus.val() + "¬" );
				$lastFocus.focus();
			}
		}
	});
	$("#logic-submit").click(function(){
		if(formulaValid == false){
			$("#formula").val( $("#formula").val().toUpperCase().replace(/\s/g,'') );
			formulaString = $("#formula").val();

			if(!isProvable( $("#formula").val())){ //if the formula is not a tautology
				displayErrorMessage(message, 2000);
			}
			else if(toNatdudString(to103wff(formulaString)) !== toNatdudString(formulaString)){ //if the formula is not a CS103 WFF
				message = "Your formula is not a WFF. Perhaps you meant: " + toNatdudString(to103wff(formulaString)) + " - remember to ensure parentheses are used correctly.";
				displayErrorMessage(message, 6000);
			}
			else{
				formulaValid = true;
				$("#formula").val(toNatdudString($("#formula").val()));
				formulaString = $("#formula").val();
				$("#formula").prop("disabled", true); //disabled
				$("#proof-input-area").show();
				
				//input is valid, show input area for user's proof
				$("#proof-area").css("border-color" , "white");
				$("#proof-area").css("border-style" , "solid");
				$("#proof-area").css("border-width" , "1px");
				$("#proof-area").css("border-radius" , "1rem 1rem 1rem 1rem");	
				$("#proof-area").css("overflow" , "hidden");
				$("#proof-input-area").css("margin-left" , "15%");
				$("#proof-input-area").css("margin-right" , "15%");
				

				//add table structure to proof area
				var $proofTable = $('<table id="proof-table" style="border: 1px"></table>');
				$("#proof-area").append($proofTable);

				//add final row of proof to proof-table
				var newRow = $("<tr>");
				var cols = "";
				cols += '<td style="width: 10%">		 <input name="dependencyInput" class="form-control input-sm" title="Cannot edit: the final line in the proof must have no line dependencies" value=" " disabled></td>';
				cols += '<td style="width: 3%">		 	 <p style="margin: 0" name="lineNum">(1)</p> </td>';
				cols += '<td style="width: 40%">		 <input name="proofLineInput" class="form-control input-sm" title="Cannot edit: the final line in the proof must be the original proposition" value="'+formulaString+'" disabled></td>';
				cols += '<td>							 <select name="ruleInput" class="selectpicker form-control input-sm"><option value="null" style="display: none"></option><option value="assume">assume</option><option value="andIntro">∧-intro</option><option value="andElim">∧-elim</option><option value="impIntro">→-intro</option><option value="impElim">→-elim</option><option value="orIntro">∨-intro</option><option value="orElim">∨-elim</option><option value="notIntro">¬-intro</option><option value="notElim">¬-elim</option><option value="raa">RAA</option><option value="efq">⊥-elim</option></select></td>';
				cols += '<td style="width: 10%">		 <input name="justificationInput" class="form-control input-sm" title="Rule justifications: e.g. 1,2"></td>';
				cols += '<td> 							 <button class="btn-success btn-sm btnCheckRow">?</button> </td>';
				cols += '<td style="visibility: hidden"> <button class="btn-danger btn-sm btnDelRow">x</button> </td>';
				cols += '<td> 							 <button class="btn-info btn-sm btnAddRowAbove">↑</button> </td>';
				cols += '<td style="visibility: hidden"> <button class="btn-info btn-sm btnAddRowBelow">↓</button> </td>';
				newRow.append(cols);
				$proofTable.append(newRow);

				
				//add proof buttons
				var $checkButton = $(' <button id="proof-check" class="btn btn-success">check</button> '); //button for sending proof for checking
				var $clearButton = $(' <button id="proof-clear" class="btn btn-danger">clear</button> ');  //button for returning to the formula input
				$("#proof-buttons").append($checkButton);
				$("#proof-buttons").append($clearButton);
				$("#proof-buttons").css("padding-left" , "1rem");
				$("#proof-buttons").css("padding-right" , "1rem");
				$("#proof-buttons").css("padding-top" , "1%");
				$("#proof-clear").css("float" , "right");
			}
		}
	});

	//on blur event listener. let's user add symbols to proof input box
	$("#proof-area").on("blur", "input[name='proofLineInput']", function(){
		$lastFocus = $(this).closest("input");
		////
	});

	//when user enters a key, it is checked for any chracters to change
	$("#formula").keyup(function(){
		$("#formula").val( toUserDisplayString($("#formula").val()) );
		////
	});
	$("#proof-area").on("keyup", "input[name='proofLineInput']", function(){
		$(this).closest("input").val( toUserDisplayString($(this).closest("input").val()) );
		////
	});

	//add, remove, check, clear button event listeners
	$("body").on("click", "#proof-add", function(){
		var formula = $("#proof-formula-input").val().toUpperCase();
		formula = formula.replace(new RegExp("→", "g"), "->");
		formula = formula.replace(new RegExp("∧", "g"), "&");
		formula = formula.replace(new RegExp("∨", "g"), "||");
		formula = formula.replace(new RegExp("¬", "g"), "~");
		formula = formula.replace(new RegExp("⊥", "g"), "F");
		formula = formula.replace(new RegExp("f", "g"), "F");

		var statement = null;
		try {
			statement = new tombstone.Statement( formula ); //check if attempted add on proof is wff
		}catch (e){
			return false;
		}

		if(!($("#proof-formula-input").val().trim().length === 0)){ //if logic inputbox is not empty && wff

			var currentLineIdDivString = "proof-line-number-"+currentLine;
			var currentLineDependencies = $('#proof-dependencies-input').val();
			var currentLineProposition  = $('#proof-formula-input').val();
			var currentLineRule 		= $('#proof-rule-input').val();
			var currentLineRuleJusts	= $('#proof-rule-justification-input').val();


			var $proofLine = $("<div id="+currentLineIdDivString+"></div>");
			var 	$proofLineDependenciesSpan = $("<span id='span-proof-dependencies-"+currentLine+"'>"+currentLineDependencies+"</span>");
			var 	$proofLineNumberSpan 	   = $("<span id='span-proof-number-"+currentLine+"'>("+currentLine+")</span>");
			var 	$proofLinePropositionSpan  = $("<span id='span-proof-proposition-"+currentLine+"'>"+currentLineProposition+"</span>");
			var 	$proofLineJustsSpan 	   = $("<span id='span-proof-justifications-"+currentLine+"'>"+currentLineRuleJusts+"</span>");
			var 	$proofLineRuleSpan 		   = $("<span id='span-proof-rule-"+currentLine+"'>"+currentLineRule+"</span>");

			$('#proof-list').append($proofLine);
			$("#"+currentLineIdDivString).append($proofLineDependenciesSpan);
			$("#"+currentLineIdDivString).append($proofLineNumberSpan);
			$("#"+currentLineIdDivString).append($proofLinePropositionSpan);
			$("#"+currentLineIdDivString).append($proofLineJustsSpan);
			$("#"+currentLineIdDivString).append($proofLineRuleSpan);
			$("#"+currentLineIdDivString).css("margin-right", "15%");

			$('#proof-list').css('padding-left', '2%');
			$('#proof-list').css('padding-right', '2%');

			$("#span-proof-dependencies-"+currentLine).css("padding-left", "8%");
			$("#span-proof-dependencies-"+currentLine).css("margin-right", "8%");

			$("#span-proof-number-"+currentLine).css("padding-right", "5%");

			//proposition in here, if need be

			$("#span-proof-rule-"+currentLine).css("float", "right");
			$("#span-proof-rule-"+currentLine).css("padding-right", "1%");

			$("#span-proof-justifications-"+currentLine).css("float", "right");
			
			currentLine++;
		}
	});
	$("body").on("click", "#proof-remove", function(){
		var currentLineId = "proof-line-number-" + (currentLine-1);
		$("#" + currentLineId).remove();
		
		if(--currentLine === 0) currentLine = 1;
	});
	$("body").on("click", "#proof-clear", function(){
		currentLine = 1;
		formulaValid = false;
		$("#proof-area").empty();
		$("#proof-buttons").empty();
		$("#feedback-area").hide();
		$("#proof-input-area").hide();
		$("#formula").prop("disabled", false); //disabled
	});
	$("body").on("click", "#proof-check", function(){
		//loop through each line of the proof table and display feedback
		var proofData = [], //array of ProofLine objects. Aka the proof.
			proofValid = true,
			counter = 1;

		var valid = true,
			invalidLineNum = -1,
			errorString = "";
		$("#proof-table tr").each(function(i, row){
			var $row   = $(row),
				$deps  = $row.find('input[name*="dependencyInput"]').val().replace(/\s/g,''),
				$line  = $row.find('input[name*="proofLineInput"]').val().toUpperCase().replace(/\s/g,''),
				$rule  = $row.find('select[name*="ruleInput"]').find(":selected").val().toLowerCase().replace(/\s/g,''),
				$just  = $row.find('input[name*="justificationInput"]').val().toUpperCase().replace(/\s/g,'');

			//check if current line is wff
			let currentTombstoneObject = null;
			let currentTombstoneString = null;
			try{
				currentTombstoneObject = new tombstone.Statement( toTombstoneString($line) );
				currentTombstoneString = toTombstoneString(currentTombstoneObject.statement);
			}catch(e){
				valid = false;
				invalidLineNum = i+1;
				errorString = "[Line " +invalidLineNum+"]: Formula syntax error.";
				return false; //break
			}

			if(currentTombstoneString !== to103wff(currentTombstoneString) ){
				valid = false;
				invalidLineNum = i+1;
				errorString = "[Line " +invalidLineNum+"]: Formula is not a wff. Perhaps you meant: " + toNatdudString(to103wff(currentTombstoneString));
				return false; //break
			}

			$row.find('input[name*="proofLineInput"]').val( toNatdudString($line) );
			$row.find('input[name*="dependencyInput"]').val( $deps );
			$row.find('input[name*="justificationInput"]').val( $just );

			$deps = clearEmptyStringsFromArray($deps.split(','));
			$line = toTombstoneString($line);
			$just = clearEmptyStringsFromArray($just.split(','));

			proofData.push(new ProofLine($deps, counter++, toTombstoneString($line), $rule, $just));
		});

		if(!valid){
			displayFeedback(errorString);
			return false;
		}

		var proof_validator = new ProofValidator(new tombstone.Statement(toTombstoneString(formulaString)).tree["tree"][0], proofData, true);

		if(!proof_validator.isProofValid())
			displayFeedback( proof_validator.getFeedback() );
		else
			displayValidFeedback( proof_validator.getFeedback() );
	});

	//row button actions (delete row, add above, add below)
	$("#proof-area").on("click", "#proof-table .btnDelRow", function(){
		if( $("#proof-table > tr").length > 1 ){
			$(this).closest("tr").remove(); //remove the closest row to the button
		}
		updateRowNumbers();
	});
	$("#proof-area").on("click", "#proof-table .btnAddRowAbove", function(){
		var newRow = $("<tr>");
		var cols = getCleanRow();
		newRow.append(cols);
		newRow.insertBefore($(this).parents().closest("tr")); //insert fresh row before current row
		updateRowNumbers();
	});
	$("#proof-area").on("click", "#proof-table .btnAddRowBelow", function(){
		var newRow = $("<tr>");
		var cols = getCleanRow();
		newRow.append(cols);
		newRow.insertAfter($(this).parent().closest("tr")); //insert fresh row after current row
		updateRowNumbers();
	});
	$("#proof-area").on("click", "#proof-table .btnCheckRow", function(){
		var $row     	= $(this).parent().parent();
		var currLineNum = $row.index()+1;
		var currLine 	= $row.find("input[name='proofLineInput']").val().replace(/\s/g,'').toUpperCase();


		//check if tombstone object is sensible
		let formulaTombstoneObject = null;
		let formulaTree = null;
		let partialProofData = []; //array of ProofLine objects
		try{
			formulaTombstoneObject = new tombstone.Statement( toTombstoneString(currLine) );
			formulaTree = formulaTombstoneObject.tree["tree"][0];
		}catch(e){
			displayFeedback("[Line " + currLineNum + "]: Formula syntax error.");
			return false;
		}



		//check if current line is a WFF
		let formulaStatementString = toTombstoneString(formulaTombstoneObject.statement);
		let statementStringWff = to103wff(formulaStatementString);
		if(formulaStatementString !== statementStringWff){
			displayFeedback("[Line " + currLineNum + "]: Formula is not a wff. Perhaps you meant: " + toNatdudString(statementStringWff));
			return false;
		}



		var currDeps    = $row.find("input[name='dependencyInput']").val().replace(/\s/g,'').split(',');
		var currRule 	= $row.find("select[name='ruleInput']").find(":selected").val().toLowerCase();
		var currJust 	= $row.find("input[name='justificationInput']").val().replace(/\s/g,'').split(',');
			currDeps 	= clearEmptyStringsFromArray(currDeps);
			currJust 	= clearEmptyStringsFromArray(currJust);

		//blank line and justification checking
		if(currLine === ""){ //line is blank
			displayFeedback("[Line " + currLineNum + "]: You cannot validate a blank line.");
			return false;
		}else if(currRule === "assume" && currJust.length !== 0){ //if rule is assume AND the number of justifications is not 0
			displayFeedback("[Line " + currLineNum + "]: Assume does not require any rule justifications.");
			return false;
		}else if(isOneJustificationRule(currRule) && currJust.length !== 1){ //if this is a one justification rule AND rule is not using exactly 1 justification
			displayFeedback("[Line " + currLineNum + "]: The rule you are attempting to use requires EXACTLY one rule justification.");
			return false;
		}else if(isTwoJustificationRule(currRule) && currJust.length !== 2){ //if this is a two justificationrule  AND rule is not using exactly 2 justifications
			displayFeedback("[Line " + currLineNum + "]: The rule you are attempting to use requires EXACTLY two rule justifications.");
			return false;
		}else if(currRule.toLowerCase() === "orelim" && currJust.length !== 5){ //if current rule is orelim AND rule does not use 5 justifications
			displayFeedback("[Line " + currLineNum + "]: Or-Elimination requires EXACTLY five rule justifications.");
			return false;
		}else if(currJust.length === 3 || currJust.length === 4 || currJust.length > 5){ //if three or four or more than five justifications are used
			displayFeedback("[Line " + currLineNum + "]: The number of rule justifications is incorrect.");
			return false;
		}


		var valid = true,
			invalidLineNum = -1,
			actualString = "";
		//loop through all table rows up until the row that wants to be checked
		$("#proof-table tr").each(function(i, row){	
			if(i+1 === currLineNum) return false; //we've reached the current line, break
			if( $.inArray( (i+1).toString(), currJust ) === -1 ) return true; //skip to next line if this line is not in the justifications

			let $row   = $(row),
				$deps  = $row.find('input[name*="dependencyInput"]').val().replace(/\s/g,''),
				$line  = $row.find('input[name*="proofLineInput"]').val().toUpperCase().replace(/\s/g,''),
				$rule  = $row.find('select[name*="ruleInput"]').find(":selected").val().toLowerCase().replace(/\s/g,''),
				$just  = $row.find('input[name*="justificationInput"]').val().toUpperCase().replace(/\s/g,'');

			//check if current line is wff
			let currentTombstoneObject = new tombstone.Statement( toTombstoneString($line) );
			let currentTombstoneString = toTombstoneString(currentTombstoneObject.statement);
			if(currentTombstoneString !== to103wff(currentTombstoneString) ){
				valid = false;
				invalidLineNum = i+1;
				actualString = to103wff(currentTombstoneString);
				return false; //break
			}


			$row.find('input[name*="proofLineInput"]').val( toNatdudString($line) );
			$row.find('input[name*="dependencyInput"]').val( $deps );
			$row.find('input[name*="justificationInput"]').val( $just );

			$deps = clearEmptyStringsFromArray($deps.split(','));
			$line = toTombstoneString($line);
			$just = clearEmptyStringsFromArray($just.split(','));

			partialProofData.push(new ProofLine($deps, (i+1).toString(), toTombstoneString($line), $rule, $just));
		});

		if(!valid){
			displayFeedback("[Line " +invalidLineNum+"]: This line is not a wff. Perhaps you meant: " + toNatdudString(actualString));
			return false;
		}

		partialProofData.push(new ProofLine(currDeps, currLineNum.toString(), toTombstoneString(currLine), currRule, currJust)); //final line
	
		for(var j=0; j<partialProofData.length; j++)		 //print debug code
			console.log(partialProofData[j].getLineAsString());



		let proof_line_validator = null;
		try{
			proof_line_validator = new ProofValidator(formulaTree, partialProofData, false); //partial validation only
		}catch(e){
			displayFeedback("[Line " +currLineNum+"]: This line is not valid. Perhaps check the line numbers used for justifying the rule usage.");
		}

		if(proof_line_validator!=null && proof_line_validator.isProofValid()){ //proof is valid
			displayValidFeedback("[Line " +currLineNum+"]: This line is currently valid. Rule usage is valid and line dependencies are correct.");
		}else if(proof_line_validator!=null && !proof_line_validator.isProofValid()){ //proof is not valid
			displayFeedback(proof_line_validator.getFeedback());
		}else{
			console.log("proof_line_validator is somehow null.");
		}
	});

	//when enter key is pressed on formula entry, trigger formula submission
	$("#formula").keypress(function(e) {
	    if(e.which == 13){
	    	$("#logic-submit").trigger("click");
	    }
	});


	///////////////////////////////////////////////////////////////////////////////
	////////////////FUNCTIONS//////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 *	A function that updates the line numbers for each line after a row is added or deleted
	 */
	function updateRowNumbers(){
		//for each row in proof-table
		$("#proof-table tr").each(function(i, row){
			let $row = $(row),
				$lineNum = $row.find('p[name*="lineNum"]'),
				newLineNum = i+1;

			$lineNum.text( "(" + newLineNum + ")" );
		});
	}

	/**
	 *	A function to check if the given rule string is a rule that requires exactly one justification
	 *	@param  {String}  rule - rule in the form of a string
	 *	@return {Boolean} newArr - true if rule uses exactly one justification
	 */
	function isOneJustificationRule(rule){
		rule = rule.toLowerCase();
		if(rule==="andelim" || rule==="orintro" || rule==="notintro" || rule==="notelim" || rule==="efq"){
			return true;
		}
		return false;
	}

	/**
	 *	A function to check if the given rule string is a rule that requires exactly two justifications
	 *	@param  {String}  rule - rule in the form of a string
	 *	@return {Boolean} newArr - true if rule uses exactly two justifications
	 */
	function isTwoJustificationRule(rule){
		rule = rule.toLowerCase();
		if(rule==="andintro" || rule==="impintro" || rule==="impelim" || rule==="raa"){
			return true;
		}
		return false;
	}

	/**
	 *	A function to clean an array of "" strings. Mainly for dependencies and justifications
	 *	@param  {Array.String}    arr - array that may contain "" elements
	 *	@return {Array.String} newArr - array with "" elements removed
	 */
	function clearEmptyStringsFromArray(arr){
		var newArr = [];
		for(var i=0; i<arr.length; i++)
			if(arr[i] !== "")
				newArr.push(arr[i]);
		return newArr;
	}

	/**
	 *	A function to display feedback about the proof for a certain amount of time
	 *	@param  {String}  feedback - string to display to the user
	 */
	function displayFeedback(feedback){
		$("#feedback-area").show();
		$("#feedback-area").css("border" , "1px solid red");
		$("#feedback-area").css("border-radius" , "1rem 1rem 1rem 1rem");	
		$("#feedback-area").css("overflow" , "hidden");
		$("#feedback-area").css("margin-left" , "15%");
		$("#feedback-area").css("margin-right" , "15%");
		$("#feedback-area").css("margin-top" , "2%");

		$("#feedback-string").text(feedback);
		$("#feedback-string").css("margin-top", "1%");
		$("#feedback-string").css("margin-bottom", "1%");
		$("#feedback-string").css("margin-left", "2%");
		$("#feedback-string").css("margin-right", "2%");
		$("#feedback-string").css("font-weight", "bold");
		$("#feedback-string").css("color", "#bb0000");
	}

	/**
	 *	A function to display that the proof is valid
	 *	@param  {String}  feedback - string to display to the user
	 */
	function displayValidFeedback(feedback){
		$("#feedback-area").show();
		$("#feedback-area").css("border" , "1px solid green");
		$("#feedback-area").css("border-radius" , "1rem 1rem 1rem 1rem");	
		$("#feedback-area").css("overflow" , "hidden");
		$("#feedback-area").css("margin-left" , "15%");
		$("#feedback-area").css("margin-right" , "15%");
		$("#feedback-area").css("margin-top" , "2%");

		$("#feedback-string").text(feedback);
		$("#feedback-string").css("margin-top", "1%");
		$("#feedback-string").css("margin-bottom", "1%");
		$("#feedback-string").css("margin-left", "2%");
		$("#feedback-string").css("margin-right", "2%");
		$("#feedback-string").css("font-weight", "bold");
		$("#feedback-string").css("color", "#009933");
	}

	/**
	 *	A function to change the given formula string to CS103's WFF standards
	 *	@param  {String}  formula    - formula to change to 103's WFF standards
	 *	@return {String}  newFormula - formula transformed to CS103 WFF
	 */
	function to103wff(formula){
		//convert to tombstone-compaitible formula string
		formula = toTombstoneString(formula); //A->A->A

		let statement  = new tombstone.Statement(formula);

		formula = treeToFormula(statement.tree["tree"][0], 0); //A->(A->A)

		return formula;
	}

	/**
	 *	A function to display an error message to the user for a certain amount of time
	 *	@param {String} errMessage - message to be displayed to the user
	 *	@param {Number} timing     - amount of time for the message to be displayed for
	 */
	function displayErrorMessage(errMessage, timing){
		//set input border to red and display message for 2 seconds when input is invalid
		$("#formula").css("border", "1px solid red");
		$("#error-message").html(errMessage); //display error message
		$("#error-message").css("font-size", "1rem");
		$("#error-message").css("margin-left", "1rem");
		$("#error-message").css("margin-right", "1rem"); 
		setTimeout(function(){
			$("#formula").css("border", "1px solid #cccccc");
			$("#error-message").html("");
		} , timing);
	}

	/**
	 *	A function to get a fresh row string for 
	 *	@return {String} - Returns a row of inputs for the user to use
	 */
	function getCleanRow(){
		var cols = "";
			cols += '<td style="width: 10%">	<input name="dependencyInput" class="form-control input-sm" title="Dependencies: e.g. 1,2"></td>';
			cols += '<td style="width: 3%">		<p style="margin: 0" name="lineNum"></p></td>';
			cols += '<td style="width: 40%">	<input name="proofLineInput" class="form-control input-sm" title="Proposition: use symbols above or F for falsum"></td>';
			cols += '<td>						<select name="ruleInput" class="selectpicker form-control input-sm"><option value="null" style="display: none"></option><option value="assume">assume</option><option value="andIntro">∧-intro</option><option value="andElim">∧-elim</option><option value="impIntro">→-intro</option><option value="impElim">→-elim</option><option value="orIntro">∨-intro</option><option value="orElim">∨-elim</option><option value="notIntro">¬-intro</option><option value="notElim">¬-elim</option><option value="raa">RAA</option><option value="efq">⊥-elim</option></select></td>';
			cols += '<td style="width: 10%">	<input name="justificationInput" class="form-control input-sm" title="Rule justifications: e.g. 1,2"></td>';
			cols += '<td> <button class="btn-success btn-sm btnCheckRow">?</button> </td>';
			cols += '<td> <button class="btn-danger btn-sm btnDelRow">x</button> </td>';
			cols += '<td> <button class="btn-info btn-sm btnAddRowAbove">↑</button> </td>';
			cols += '<td> <button class="btn-info btn-sm btnAddRowBelow">↓</button> </td>';
		return cols;
	}

	/**
	 *	A function that changes a formula with special symbols into a Tombstone-compatitible string
	 *	@param {String} formula 	- NatDud formula string
	 *	@return {String} newFormula - A tombstone-compatible string
	 */	
	function toTombstoneString(formula){
		formula = formula.toUpperCase();
		formula = formula.replace(new RegExp("→", "g"), "->");
		formula = formula.replace(new RegExp("∧", "g"), "&");
		formula = formula.replace(new RegExp("∨", "g"), "||");
		formula = formula.replace(new RegExp("¬", "g"), "~");
		formula = formula.replace(new RegExp("⊥", "g"), "F");
		formula = formula.replace(new RegExp("f", "g"), "F");
		return formula;
	}

	/**
	 *	A function that changes a formula with a tombstome-compatible string to a natdud format string
	 *	@param {String} formula 	- tombstone string
	 *	@return {String} newFormula - A tombstone-compatible string
	 */	
	function toNatdudString(formula){
		formula = formula.toUpperCase();
		formula = formula.replace(new RegExp("->", "g"), "→");
		formula = formula.replace(new RegExp("&", "g"), "∧");
		formula = formula.replace(new RegExp(/\|\|/, "g"), "∨");
		formula = formula.replace(new RegExp("~", "g"), "¬");
		formula = formula.replace(new RegExp("F", "g"), "⊥");
		formula = formula.replace(new RegExp("f", "g"), "⊥");
		return formula;
	}

	/**
	 *	A function that changes a formula on the fly for better interactiveness
	 *	@param {String} formula 	- formula string with > F ~ etc symbols
	 *	@return {String} newFormula - formula string with logic symbols
	 */	
	function toUserDisplayString(formula){
		formula = formula.toUpperCase();
		formula = formula.replace(new RegExp("->", "g"), "→");
		formula = formula.replace(new RegExp(">", "g"), "→");
		formula = formula.replace(new RegExp("&&", "g"), "∧");
		formula = formula.replace(new RegExp("&", "g"), "∧");
		formula = formula.replace(new RegExp(/\|\|/, "g"), "∨");
		formula = formula.replace(new RegExp(/\|/, "g"), "∨");
		formula = formula.replace(new RegExp("~", "g"), "¬");
		formula = formula.replace(new RegExp("F", "g"), "⊥");
		formula = formula.replace(new RegExp("f", "g"), "⊥");
		return formula;
	}

	/**
	 *	A function to determine if a provided logic formula is provable by Natural Deduction (a tautology)
	 *	@param {String} formula - User's formula input
	 *	@return {boolean} - Returns whether or not the logic formula is a tautology
	 */
	function isProvable (formula) {
		//convert to tombstone-compatible formula string
		formula = toTombstoneString(formula);

		var statement = null;
		var truthtable = null;
		try {
			statement = new tombstone.Statement(formula);
			truthtable = statement.table();
		}
		catch (e) {
			message = "Your formula is syntactically incorrect";
			return false;
		}

		var rows = [];
		if(statement.variables.indexOf("F") > -1){
			//if contains (F)alsum, carry out our own truth table generation
			if(!falsumCheck(statement)){
				message = "Your formula is not a tautology, and is therefore not provable by Natural Deduction";
				return false;
			}
		}else{
			//convert results of truthtable string into actual array values for processing
			rows = truthtable.split("\n");
			for(var i=2; i<rows.length; i++){
				var row = [];
				row = rows[i].split("|");
				if(row[row.length - 2].trim() === "false"){
					message = "Your formula is not a tautology, and is therefore not provable by Natural Deduction";
					return false;
				}
			}
		}
		

		//TESTING CODE

		//ProofLine test
		var pl = new ProofLine(1, 5, "(A||~A)=>(A||~A)", "impintro", 4);
		console.log("pl test: " + pl.getLineAsString());

		console.log(statement.table()); 
		console.log(statement.symbols);
		console.log(statement.variables);
		console.log(statement.symbolsRPN);
		console.log(statement.tree["tree"][0]);
		console.log("Statement: " + statement.statement);
		var f = treeToFormula(statement.tree["tree"][0], 0);
		console.log("formulaString: " + formulaString);
		console.log("New formula?: " + f);
		console.log("Matches with original formula: " + (f===formula));
		console.log("Matches with formulaString: " + (f===formulaString));
		console.log(JSON.stringify(statement.tree));

		return true;
	}

	/**
	 *	function to check if statement is a tautology, only when (F)alsum is used
	 *	@param 	{Statement.Object} s  - statement object
	 *  @return {boolean} isTautology
	 */
	function falsumCheck(statement) {
		var table = statementToTable(statement);

		for(var i=0; i < table['rows'].length; ++i){
			if(!table['rows'][i]['eval']){
				return false;
			}
		}
		return true;
	}

	/**
	 * Get all boolean input values for n variables.
	 *
	 * @example
	 * // [ [ true, true ], [ true, false ], [ false, true ], [ false, false ] ]
	 * getValues(2, [])
	 *
	 * @param   {Number} n - The number of variables.
	 * @param   {Array} t - The array to be recursively filled.
	 *
	 * @returns {Array} All possible input values.
	 */
	function getValues (n, t) {
	  if (t.length === n) {
	    return [t]
	  } else {
	    return getValues(n, t.concat(true)).concat(getValues(n, t.concat(false)))
	  }
	}

	/**
	 * Get all boolean values for each variable.
	 *
	 * @example
	 * // [ { P: true }, { P: false } ]
	 * getCases (['P'])
	 *
	 * @param   {Array} variables - All variables in a given statement.
	 *
	 * @returns {Array} - An array of objects mapping variables to their possible
	 *  values.
	 */
	function getCases (variables) {
	  var numVars = variables.length //3
	  var values = getValues(numVars, [])
	  var numRows = values.length
	  var rows = []
	  var row = {}

	  for (var i = 0; i < numRows; ++i) {
	    row = {}
	    for (var j = 0; j < numVars; ++j) {
	    	if(variables[j] === "F")//
	    		row[variables[j]] = false;//
	      	else//
	      		row[variables[j]] = values[i][j]
	    }
	    rows.push(row)
	  }

	  return rows
	}

	/**
	 * Convert a statement into an object representing the structure of a table.
	 *
	 * @param   {Object} s - The statement to be converted.
	 *
	 * @returns {Object} - The table representation.
	 */
	function statementToTable (s) {
	  var table = {}

	  table['statement'] = s.statement
	  table['variables'] = s.variables
	  table['rows'] = getCases(table['variables'])
	  for (var i = 0; i < table['rows'].length; ++i) {
	    table['rows'][i]['eval'] = s.evaluate(table['rows'][i])
	  }

	  return table
	}
});







