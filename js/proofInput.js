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
	var $lastFocus 		= null; //keeps last input object
	var caretPosition   = 0; //keeps track of the cursor position
	
	//logic button actions
	$("#logic-imply").click(function(e){
		if(!formulaValid){
			caretPosition = $("#formula").prop("selectionStart");
			$("#formula").val( addSymbolToStringAtPosition( $("#formula").val(), caretPosition++, "→" ) );
			setCaretToPos($("#formula")[0], caretPosition);
		}else{
			if($lastFocus != null){
				caretPosition = $lastFocus.prop("selectionStart");
				$lastFocus.val( addSymbolToStringAtPosition( $lastFocus.val(), caretPosition++, "→" ) );
				setCaretToPos($lastFocus[0], caretPosition);
			}
		}
	});
	$("#logic-and").click(function(){
		if(!formulaValid){
			caretPosition = $("#formula").prop("selectionStart");
			$("#formula").val( addSymbolToStringAtPosition( $("#formula").val(), caretPosition++, "∧" ) );
			setCaretToPos($("#formula")[0], caretPosition);
		}else{
			if($lastFocus != null){
				caretPosition = $lastFocus.prop("selectionStart");
				$lastFocus.val( addSymbolToStringAtPosition( $lastFocus.val(), caretPosition++, "∧" ) );
				setCaretToPos($lastFocus[0], caretPosition);
			}
		}
	});
	$("#logic-or").click(function(){
		if(!formulaValid){
			caretPosition = $("#formula").prop("selectionStart");
			$("#formula").val( addSymbolToStringAtPosition( $("#formula").val(), caretPosition++, "∨" ) );
			setCaretToPos($("#formula")[0], caretPosition);
		}else{
			if($lastFocus != null){
				caretPosition = $lastFocus.prop("selectionStart");
				$lastFocus.val( addSymbolToStringAtPosition( $lastFocus.val(), caretPosition++, "∨" ) );
				setCaretToPos($lastFocus[0], caretPosition);
			}
		}
	});
	$("#logic-not").click(function(){
		if(!formulaValid){
			caretPosition = $("#formula").prop("selectionStart");
			$("#formula").val( addSymbolToStringAtPosition( $("#formula").val(), caretPosition++, "¬" ) );
			setCaretToPos($("#formula")[0], caretPosition);
		}else{
			if($lastFocus != null){
				caretPosition = $lastFocus.prop("selectionStart");
				$lastFocus.val( addSymbolToStringAtPosition( $lastFocus.val(), caretPosition++, "¬" ) );
				setCaretToPos($lastFocus[0], caretPosition);
			}
		}
	});
	$("#logic-falsum").click(function(){
		if(!formulaValid){
			caretPosition = $("#formula").prop("selectionStart");
			$("#formula").val( addSymbolToStringAtPosition( $("#formula").val(), caretPosition++, "⊥" ) );
			setCaretToPos($("#formula")[0], caretPosition);
		}else{
			if($lastFocus != null){
				caretPosition = $lastFocus.prop("selectionStart");
				$lastFocus.val( addSymbolToStringAtPosition( $lastFocus.val(), caretPosition++, "⊥" ) );
				setCaretToPos($lastFocus[0], caretPosition);
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

				//add proof table headers
				var newRow = $("<tr>");
				var cols   = "<th>Dependencies</th>";
					cols  += "<th></th>";
					cols  += "<th>Formula</th>";
					cols  += "<th>Justification</th>";
				newRow.append(cols);
				$proofTable.append(newRow);

				
				//add final row of proof to proof-table
				newRow = $("<tr>");
				cols = "";
				cols += '<td style="width: 10%">		 <input name="dependencyInput" class="form-control input-sm" title="Dependencies: e.g. 1,2"></td>';
				cols += '<td style="width: 3%">		 	 <p style="margin: 0" name="lineNum">(1)</p> </td>';
				cols += '<td style="width: 40%">		 <input name="proofLineInput" class="form-control input-sm" title="Cannot edit: the final line in the proof must be the original proposition" value="'+formulaString+'" disabled></td>';
				cols += '<td>							 <select name="ruleInput" class="selectpicker form-control input-sm"><option value="null" style="display: none"></option><option value="assume">assume</option><option value="andIntro">∧-intro</option><option value="andElim">∧-elim</option><option value="impIntro">→-intro</option><option value="impElim">→-elim</option><option value="orIntro">∨-intro</option><option value="orElim">∨-elim</option><option value="notIntro">¬-intro</option><option value="notElim">¬-elim</option><option value="raa">RAA</option></select></td>';//<option value="efq">⊥-elim</option>
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

	//check and clear button event listeners
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
			if(i===0) return true; //skip proof table headers

			var $row   = $(row),
				$deps  = $row.find('input[name*="dependencyInput"]').val().replace(/\s/g,''),
				$line  = $row.find('input[name*="proofLineInput"]').val().toUpperCase().replace(/\s/g,''),
				$rule  = $row.find('select[name*="ruleInput"]').find(":selected").val().toLowerCase().replace(/\s/g,''),
				$just  = $row.find('input[name*="justificationInput"]').val().toUpperCase().replace(/\s/g,'');

			if($deps==="" && $line==="" && $rule==="null" && $just===""){ //completely blank line
				proofData.push(new ProofLine([], counter++, "", "", []));
				return true;
			}

			//check if current line is wff
			let currentTombstoneObject = null;
			let currentTombstoneString = null;
			try{
				currentTombstoneObject = new tombstone.Statement( toTombstoneString($line) );
				currentTombstoneString = toTombstoneString(currentTombstoneObject.statement);
			}catch(e){
				valid = false;
				invalidLineNum = i;
				errorString = "[Line " +invalidLineNum+"]: Formula syntax error.";
				return false; //break
			}

			if(currentTombstoneString !== to103wff(currentTombstoneString) ){
				valid = false;
				invalidLineNum = i;
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

		console.log(proof_validator);
	});

	//row button actions (delete row, add above, add below)
	$("#proof-area").on("click", "#proof-table .btnDelRow", function(){
		removeRow($(this));
		/////
	});
	$("#proof-area").on("click", "#proof-table .btnAddRowAbove", function(){
		addRowAboveCurrentRow($(this));
		///
	});
	$("#proof-area").on("click", "#proof-table .btnAddRowBelow", function(){
		addRowBelowCurrentRow($(this));
		///
	});
	$("#proof-area").on("click", "#proof-table .btnCheckRow", function(){
		var $row     	 = $(this).parent().parent();
		var currLineNum  = $row.index();
		var currLine 	 = $row.find("input[name='proofLineInput']").val().replace(/\s/g,'').toUpperCase();
		var currLineDeps = $row.find("input[name='dependencyInput']").val().replace(/\s/g,'');
		var currRuleRefs = $row.find("input[name='justificationInput']").val().replace(/\s/g,'');
		var currRule 	 = $row.find("select[name='ruleInput']").find(":selected").val().toLowerCase().replace(/\s/g,'');

		//check if tombstone object is sensible
		let formulaTombstoneObject = null;
		let formulaTree = null;
		let partialProofData = []; //array of ProofLine objects

		if(currLine==="" && currLineDeps==="" && currRuleRefs==="" && currRule==="null"){ //accept blank lines
			displayValidFeedback("[Line " + currLineNum + "]: Completely blank lines are valid.");
			return true;
		}

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
			displayFeedback("[Line " + currLineNum + "]: Assumptions must not reference any proof lines.");
			return false;
		}else if(isOneJustificationRule(currRule) && currJust.length !== 1){ //if this is a one justification rule AND rule is not using exactly 1 justification
			displayFeedback("[Line " + currLineNum + "]: The rule you are attempting to use requires EXACTLY one line reference.");
			return false;
		}else if(isTwoJustificationRule(currRule) && currJust.length !== 2){ //if this is a two justification rule AND rule is not using exactly 2 justifications
			displayFeedback("[Line " + currLineNum + "]: The rule you are attempting to use requires EXACTLY two line references.");
			return false;
		}else if(currRule.toLowerCase() === "orelim" && currJust.length !== 5){ //if current rule is orelim AND rule does not use 5 justifications
			displayFeedback("[Line " + currLineNum + "]: Or-Elimination requires EXACTLY five line references.");
			return false;
		}else if(currJust.length === 3 || currJust.length === 4 || currJust.length > 5){ //if three or four or more than five justifications are used
			displayFeedback("[Line " + currLineNum + "]: The number of rule references is incorrect.");
			return false;
		}


		var valid = true,
			invalidLineNum = -1,
			actualString = "";
		//loop through all table rows up until the row that wants to be checked
		$("#proof-table tr").each(function(i, row){	
			if(i===0) return true; //skip proof table headers
			else if(i === currLineNum) return false; //we've reached the current line, break
			else if( $.inArray( i.toString(), currJust ) === -1 ) return true; //skip to next line if this line is not in the justifications

			let $row   = $(row),
				$deps  = $row.find('input[name*="dependencyInput"]').val().replace(/\s/g,''),
				$line  = $row.find('input[name*="proofLineInput"]').val().toUpperCase().replace(/\s/g,''),
				$rule  = $row.find('select[name*="ruleInput"]').find(":selected").val().toLowerCase().replace(/\s/g,''),
				$just  = $row.find('input[name*="justificationInput"]').val().toUpperCase().replace(/\s/g,'');

			//line is blank: add to proof and continue in the loop
			if($deps==="" && $line==="" && $rule==="null" && $just===""){
				partialProofData.push(new ProofLine([], i.toString(), "", "", []));
				return true;
			}

			//check if current line is wff
			let currentTombstoneObject = new tombstone.Statement( toTombstoneString($line) );
			let currentTombstoneString = toTombstoneString(currentTombstoneObject.statement);
			if(currentTombstoneString !== to103wff(currentTombstoneString) ){
				valid = false;
				invalidLineNum = i;
				actualString = to103wff(currentTombstoneString);
				return false; //break
			}


			$row.find('input[name*="proofLineInput"]').val( toNatdudString($line) );
			$row.find('input[name*="dependencyInput"]').val( $deps );
			$row.find('input[name*="justificationInput"]').val( $just );

			$deps = clearEmptyStringsFromArray($deps.split(','));
			$line = toTombstoneString($line);
			$just = clearEmptyStringsFromArray($just.split(','));

			partialProofData.push(new ProofLine($deps, i.toString(), toTombstoneString($line), $rule, $just));
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
			displayFeedback("[Line " +currLineNum+"]: This line is not valid. Perhaps check the rule reference line numbers.");
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
	 *	sets the cursor position in a given input object
	 *	@param {$.inputObject} input - input object to set the cursor position on
	 *	@param {number} pos - position to set the cursor to
	 */
	function setCaretToPos(input, pos){
   		input.focus();
    	input.setSelectionRange(pos, pos);
	}

	/**
	 *	Inserts a string into a given string at the given position
	 *	@param {String} origString - string to insert to
	 *	@param {Number} pos - position to insert at
	 *	@param {String} stringToAdd - string to be inserted
	 *	@returns {String}
	 */
	function addSymbolToStringAtPosition(origString, pos, stringToAdd){
		return [origString.slice(0,pos), stringToAdd, origString.slice(pos)].join('');
	}

	/**
	 * Removes the whole row where the button was clicked
	 * @param {Object.button} deleteRowButtonObject - delete row button that was clicked
	 */
	function removeRow(deleteRowButtonObject){
		let rowIndex = $(deleteRowButtonObject).parents().closest("tr").index(); //row deleted

		//update line deps and rule references
		$("#proof-table tr").each(function(i, row){
			if(i===0) return true; //skip the table headers
			let $row = $(row);
			let lineDeps = $row.find('input[name*="dependencyInput"]')[0].value.replace(/\s/g,''); //line deps of current line as string
			let ruleRefs = $row.find('input[name*="justificationInput"]')[0].value.replace(/\s/g,''); //rule references of current line as string

			if(lineDeps !== ""){
				let tempLineDeps = lineDeps.split(",").map(Number);
				for(var counter=0; counter<tempLineDeps.length; counter++){
					let currentValue = tempLineDeps[counter];
					if(tempLineDeps[counter] === rowIndex){ //remove value that refers to removed row
						tempLineDeps.splice(counter, 1);
						counter--; //we removed the current element from the array, so we have to accomodate for the loop's incrementation
					}else if(tempLineDeps[counter] > rowIndex){ //current value refers to before removed row
						tempLineDeps[counter]--;
					}
				}
				$row.find('input[name*="dependencyInput"]')[0].value = tempLineDeps.join(",");
			}

			if(ruleRefs !== ""){
				let tempRuleRefs = ruleRefs.split(",").map(Number);
				for(var counter=0; counter<tempRuleRefs.length; counter++){
					let currentValue = tempRuleRefs[counter];
					if(tempRuleRefs[counter] === rowIndex){ //remove value that refers to removed row
						tempRuleRefs.splice(counter, 1);
						counter--;
					}else if(tempRuleRefs[counter] > rowIndex){ //current line dep refers to a line after line added
						tempRuleRefs[counter]--;
					}
				}
				$row.find('input[name*="justificationInput"]')[0].value = tempRuleRefs.join(",");
			}
		});

		if( $("#proof-table > tr").length > 1 )
			$(deleteRowButtonObject).closest("tr").remove(); //remove the closest row to the button
		updateLineNumbers();
	}

	/**
	 *	Add new clean row to the proof table above the clicked button, while also updating the line dep and rule reference values
	 *	@param {Object.button} addAboveButtonObject - the button that was clicked
	 */
	function addRowAboveCurrentRow(addAboveButtonObject){
		var newRow = $("<tr>");
		var cols = getCleanRow();
		newRow.append(cols);

		let rowIndex = $(addAboveButtonObject).parents().closest("tr").index();

		//update line deps and rule references
		$("#proof-table tr").each(function(i, row){
			if(i===0) return true; //skip the table headers
			let $row = $(row);
			let lineDeps = $row.find('input[name*="dependencyInput"]')[0].value.replace(/\s/g,''); //line deps of current line as string
			let ruleRefs = $row.find('input[name*="justificationInput"]')[0].value.replace(/\s/g,'');; //rule references of current line as string

			if(lineDeps !== ""){
				let tempLineDeps = lineDeps.split(",").map(Number);
				for(var counter=0; counter<tempLineDeps.length; counter++){
					let currentValue = tempLineDeps[counter];
					if(tempLineDeps[counter] >= rowIndex) //current line dep refers to a line after line added
						tempLineDeps[counter]++
				}
				$row.find('input[name*="dependencyInput"]')[0].value = tempLineDeps.join(",");
			}

			if(ruleRefs !== ""){
				let tempRuleRefs = ruleRefs.split(",").map(Number);
				for(var counter=0; counter<tempRuleRefs.length; counter++){
					let currentValue = tempRuleRefs[counter];
					if(tempRuleRefs[counter] >= rowIndex)
						tempRuleRefs[counter]++;
				}
				$row.find('input[name*="justificationInput"]')[0].value = tempRuleRefs.join(",");
			}


		});

		newRow.insertBefore($(addAboveButtonObject).parents().closest("tr")); //insert fresh row before current row
		updateLineNumbers();
	}

	/**
	 *	Add new clean row to the proof table below the clicked button, while also updating the line dep and rule reference values
	 *	@param {Object.button} addBelowButtonObject - the button that was clicked
	 */
	function addRowBelowCurrentRow(addBelowButtonObject){
		var newRow = $("<tr>");
		var cols = getCleanRow();
		newRow.append(cols);

		let rowIndex = $(addBelowButtonObject).parents().closest("tr").index();

		//update line deps and rule references
		$("#proof-table tr").each(function(i, row){
			if(i===0) return true; //skip the table headers
			let $row = $(row);
			let lineDeps = $row.find('input[name*="dependencyInput"]')[0].value.replace(/\s/g,''); //line deps of current line as string
			let ruleRefs = $row.find('input[name*="justificationInput"]')[0].value.replace(/\s/g,'');; //rule references of current line as string

			if(lineDeps !== ""){
				let tempLineDeps = lineDeps.split(",").map(Number);
				for(var counter=0; counter<tempLineDeps.length; counter++){
					let currentValue = tempLineDeps[counter];
					if(tempLineDeps[counter] > rowIndex) //current line dep refers to a line after line added
						tempLineDeps[counter]++
				}
				$row.find('input[name*="dependencyInput"]')[0].value = tempLineDeps.join(",");
			}

			if(ruleRefs !== ""){
				let tempRuleRefs = ruleRefs.split(",").map(Number);
				for(var counter=0; counter<tempRuleRefs.length; counter++){
					let currentValue = tempRuleRefs[counter];
					if(tempRuleRefs[counter] > rowIndex)
						tempRuleRefs[counter]++;
				}
				$row.find('input[name*="justificationInput"]')[0].value = tempRuleRefs.join(",");
			}
		});

		newRow.insertAfter($(addBelowButtonObject).parent().closest("tr")); //insert fresh row after current row
		updateLineNumbers(); //updateRuleLineDeps(rowIndex);
	}

	/**
	 *	A function that updates the line numbers for each line after a row is added or deleted
	 */
	function updateLineNumbers(){
		//for each row in proof-table
		$("#proof-table tr").each(function(i, row){
			if(i===0) return true; //skip proof table headers
			let $row = $(row),
				$lineNum = $row.find('p[name*="lineNum"]');

			$lineNum.text( "(" + i + ")" );
		});
	}

	/**
	 *	A function to check if the given rule string is a rule that requires exactly one justification
	 *	@param  {String}  rule - rule in the form of a string
	 *	@returns {Boolean} newArr - true if rule uses exactly one justification
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
	 *	@returns {Boolean} newArr - true if rule uses exactly two justifications
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
	 *	@returns {Array.String} newArr - array with "" elements removed
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
	 *	@returns {String}  newFormula - formula transformed to CS103 WFF
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
	 *	@returns {String} - Returns a row of inputs for the user to use
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
	 *	@returns {String} newFormula - A tombstone-compatible string
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
	 *	@returns {String} newFormula - A tombstone-compatible string
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
	 *	@returns {String} newFormula - formula string with logic symbols
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
	 *	@returns {boolean} - Returns whether or not the logic formula is a tautology
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
	 *  @returns {boolean} isTautology
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
	 * @param   {Number} n - The number of variables.
	 * @param   {Array} t - The array to be recursively filled.
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
	 * @param   {Array} variables - All variables in a given statement.njojmmmmkmkmkmmmmmkkkjjillk,m   b   n     
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







