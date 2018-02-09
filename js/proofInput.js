var treeToFormula = require('./treeToFormula.js');
var ProofLine = require('./proofLine.js');
var tombstone = require('./tombstone.min.js');
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
	
	//logic button actions
	$("#logic-imply").click(function(){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "→");
			$("#formula").focus();
		}else{
			$("#proof-formula-input").val($("#proof-formula-input").val() + "→");
			$("#proof-formula-input").focus();
		}
	});
	$("#logic-and").click(function(){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "∧");
			$("#formula").focus();
		}else{
			$("#proof-formula-input").val($("#proof-formula-input").val() + "∧");
			$("#proof-formula-input").focus();
		}
	});
	$("#logic-or").click(function(){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "∨");
			$("#formula").focus();
		}else{
			$("#proof-formula-input").val($("#proof-formula-input").val() + "∨");
			$("#proof-formula-input").focus();
		}
	});
	$("#logic-not").click(function(){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "¬");
			$("#formula").focus();
		}else{
			$("#proof-formula-input").val($("#proof-formula-input").val() + "¬");
			$("#proof-formula-input").focus();
		}
	});
	$("#logic-submit").click(function(){
		if(formulaValid == false){
			$("#formula").val( $("#formula").val().toUpperCase() );
			formulaString = $("#formula").val();

			if(!isProvable( $("#formula").val())){ //if the formula is not a tautology
				displayErrorMessage(message, 2000);
			}
			else if(to103wff(formulaString) !== formulaString){ //if the formula is not a CS103 WFF
				message = "Your formula is not a WFF. Perhaps you meant: " + toNatdudString(to103wff(formulaString)) + " - remember to ensure parentheses are used correctly.";
				displayErrorMessage(message, 6000);
			}
			else{
				formulaValid = true;
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
				cols += '<td style="width: 10%"><input class="form-control input-sm" placeholder="Deps." title="Cannot edit: the final line in the proof must have no line dependencies" value=" " disabled></td>';
				cols += '<td style="width: 40%"><input class="form-control input-sm" placeholder="Proof Line (use symbols & F for ⊥)" title="Cannot edit: the final line in the proof must be the original proposition" value="'+formulaString+'" disabled></td>';
				cols += '<td><select class="selectpicker form-control input-sm"><option disabled selected value>select rule</option><option value="assume">assume</option><option value="andIntro">∧-intro</option><option value="andElim1">∧-elim1</option><option value="andElim2">∧-elim2</option><option value="impIntro">→-intro</option><option value="impElim">→-elim</option><option value="orIntro1">∨-intro1</option><option value="orIntro2">∨-intro2</option><option value="orElim">∨-elim</option><option value="notIntro">¬-intro</option><option value="notElim">¬-elim</option><option value="raa">RAA</option><option value="efq">⊥-elim</option></select></td>';
				cols += '<td style="width: 10%"><input class="form-control input-sm" placeholder="Justifications" title="Rule justifications: e.g. 1,2"></td>';
				cols += '<td style="visibility: hidden"> <button class="btn-danger btn-sm btnDelRow">x</button> </td>';
				cols += '<td> <button class="btn-info btn-sm btnAddRowAbove">↑</button> </td>';
				cols += '<td style="visibility: hidden"> <button class="btn-info btn-sm btnAddRowBelow">↓</button> </td>';
				newRow.append(cols);
				//newRow.insertAfter($(this).parents().closest('tr')); //EXPERIMENT WITH THIS
				$proofTable.append(newRow);

				
				//add proof buttons
				var $checkButton = $(' <button id="proof-check" class="btn btn-success">check</button> '); //button for sending proof for checking
				var $clearButton = $(' <button id="proof-clear" class="btn btn-danger">clear</button> '); //button for returning to the formula input
				$("#proof-buttons").append($checkButton);
				$("#proof-buttons").append($clearButton);
				$("#proof-buttons").css("padding-left" , "1rem");
				$("#proof-buttons").css("padding-right" , "1rem");
				$("#proof-buttons").css("padding-top" , "1%");
				$("#proof-clear").css("float" , "right");
			}
		}
	});

	//add, remove, check, clear button event listeners
	$("body").on("click", "#proof-add", function(){
		var formula = $("#proof-formula-input").val().toUpperCase();
		formula = formula.replace(new RegExp("⇒", "g"), "->");
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
		$("#proof-input-area").hide();
		$("#formula").prop("disabled", false); //disabled
	});
	$("body").on("click", "#proof-check", function(){
		//collect up each line of proof and add to proofValidator
		//var pv = new ProofValidator(formulaTree, proof, true);
	});

	//row button actions (delete row, add above, add below)
	$("#proof-area").on("click", "#proof-table .btnDelRow", function(){
		console.log("remove row clicked");
		if( $("#proof-table > tr").length > 1 ){
			$(this).closest("tr").remove(); //remove the closest row to the button
		}
	});
	$("#proof-area").on("click", "#proof-table .btnAddRowAbove", function(){
		console.log("btnAddRowAbove clicked");
		var newRow = $("<tr>");
		var cols = getCleanRow();
		newRow.append(cols);
		newRow.insertBefore($(this).parents().closest("tr")); //insert fresh row before current row
	});
	$("#proof-area").on("click", "#proof-table .btnAddRowBelow", function(){
		console.log("btnAddRowBelow clicked");
		var newRow = $("<tr>");
		var cols = getCleanRow();
		newRow.append(cols);
		newRow.insertAfter($(this).parents().closest("tr")); //insert fresh row after current row
	});


	///////////////////////////////////////////////////////////////////////////////
	////////////////FUNCTIONS//////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

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
			cols += '<td style="width: 10%"><input class="form-control input-sm" placeholder="Deps." title="Dependencies: e.g. 1,2"></td>';
			cols += '<td style="width: 40%"><input class="form-control input-sm" placeholder="Proof Line (use symbols or F for ⊥)" title="Proposition: use symbols above or F for falsum"></td>';
			cols += '<td><select class="selectpicker form-control input-sm"><option style="display: none">select rule</option><option value="assume">assume</option><option value="andIntro">∧-intro</option><option value="andElim1">∧-elim1</option><option value="andElim2">∧-elim2</option><option value="impIntro">→-intro</option><option value="impElim">→-elim</option><option value="orIntro1">∨-intro1</option><option value="orIntro2">∨-intro2</option><option value="orElim">∨-elim</option><option value="notIntro">¬-intro</option><option value="notElim">¬-elim</option><option value="raa">RAA</option><option value="efq">⊥-elim</option></select></td>';
			cols += '<td style="width: 10%"><input class="form-control input-sm" placeholder="Justifications" title="Rule justifications: e.g. 1,2"></td>';
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
		formula = formula.replace(new RegExp("->", "g"), "→"); //yes
		formula = formula.replace(new RegExp("&", "g"), "∧"); //
		formula = formula.replace(new RegExp(/\|\|/, "g"), "∨"); //
		formula = formula.replace(new RegExp("~", "g"), "¬"); //
		formula = formula.replace(new RegExp("F", "g"), "⊥"); //
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







