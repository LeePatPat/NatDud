// import {treeToFormula} from '../js/treeToFormula.js';
// import ProofValidator from '../js/proofValidator.js';
// import ProofLine from '../js/proofLine.js'; //temp testing
var treeToFormula = require('./treeToFormula.js');
var ProofLine = require('./proofLine.js');
var tombstone = require('./tombstone.min.js');
var ProofValidator = require('./proofValidator.js');
var $ = require('jquery');
/*
 *	JQuery to manipulate elements and validations
 */
$(document).ready(function(){
	console.log("we get here");
	var formulaValid 	= false;
	var formulaString 	= "";
	var currentLine 	= 1; //current line of the proof
	var message 		= ""; //error message to be displayed
	
	//logic button actions
	$("#logic-imply").click(function(){
		if(!formulaValid){
			$("#formula").val($("#formula").val() + "⇒");
			$("#formula").focus();
		}else{
			$("#proof-formula-input").val($("#proof-formula-input").val() + "⇒");
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
			if(!isProvable( $("#formula").val())){ //CHANGE FOR FORMULA CHECKING
			
				//set input border to red and shake for 2 seconds when input is invalid
				$("#formula").css("border", "1px solid red");
				$("#error-message").html(message); //display error message
				$("#error-message").css("font-size", "1rem");
				$("#error-message").css("margin-left", "1rem");
				$("#error-message").css("margin-right", "1rem"); 
				setTimeout(function(){
					$("#formula").css("border", "1px solid #cccccc");
					$("#error-message").html("");
				} , 2000);
				
			}else{
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
				
				//add order-list to proof-area
				var $proofList = $(' <div id="proof-list"></div> ');
				$("#proof-area").append($proofList);
				$("#proof-list").css("padding-top" , "1%");
				
				//add inputs fields to proof-area
				var $proofFormulaInputGroup = $(' <div id="proof-formula-input-group" class="input-group form-group-sm"></div> '); //#div for containing the input buttons and fields
				var 	$lineDependenciesInput = $(' <input id="proof-dependencies-input" class="form-control" placeholder="Deps." title="Dependencies: e.g. 1,2"> '); //#input field for dependency numbers
				var 	$lineFormulaInput = $(' <input id="proof-formula-input" class="form-control" placeholder="Proof Line (use symbols & F for ⊥)" title="Proposition: use symbols above and F for falsum"> '); //#button for entering line of proof
				var 	$lineRuleInput = $(' <select id="proof-rule-input" class="selectpicker form-control"><option value="assume">assume</option><option value="andIntro">∧-intro</option><option value="andElim1">∧-elim1</option><option value="andElim2">∧-elim2</option><option value="impIntro">⇒-intro</option><option value="impElim">⇒-elim</option><option value="orIntro1">∨-intro1</option><option value="orIntro2">∨-intro2</option><option value="orElim">∨-elim</option><option value="notIntro">¬-intro</option><option value="notElim">¬-elim</option><option value="raa">RAA</option><option value="efq">⊥-elim</option></select>');
				var 	$lineRuleJustificationInput = $(' <input id="proof-rule-justification-input" class="form-control" placeholder="Justifications" title="Rule justifications: e.g. 1,2"> '); //#input field for justification numbers

				$("#proof-area").append($proofFormulaInputGroup);
				$("#proof-formula-input-group").append($lineDependenciesInput);
				$("#proof-formula-input-group").append($lineFormulaInput);
				$("#proof-formula-input-group").append($lineRuleInput);
				$("#proof-formula-input-group").append($lineRuleJustificationInput);
				$("#proof-dependencies-input").css("width","15%"); //CSS for input fields
				$("#proof-formula-input").css("width","50%");
				$("#proof-rule-input").css("width","20%");
				$("#proof-rule-justification-input").css("width","15%");
				$("#proof-formula-input-group").css("padding-left","5%");
				$("#proof-formula-input-group").css("padding-right","5%");
				$("#proof-formula-input-group").css("padding-bottom","1%");
				$("#proof-formula-input-group").css("display" , "inline-block");//this fixed overflowing problem
				
				//add proof buttons
				var $addButton = $(' <button id="proof-add" class="btn btn-info">add</button> '); //#button for adding line
				var $removeButton = $(' <button id="proof-remove" class="btn btn-info">remove</button> '); //button for last line added
				var $checkButton = $(' <button id="proof-check" class="btn btn-success">check</button> '); //button for sending proof for checking
				var $clearButton = $(' <button id="proof-clear" class="btn btn-danger">clear</button> '); //button for returning to the formula input
				$("#proof-buttons").append($addButton);
				$("#proof-buttons").append($removeButton);
				$("#proof-buttons").append($checkButton);
				$("#proof-buttons").append($clearButton);
				$("#proof-buttons").css("padding-left" , "1rem");
				$("#proof-buttons").css("padding-right" , "1rem");
				$("#proof-buttons").css("padding-top" , "1%");
				$("#proof-add").css("margin-right" , "1rem");
				$("#proof-remove").css("margin-right" , "1rem");
				$("#proof-clear").css("float" , "right");
			}
		}
	});
	
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
	
	
	///////////////////////////////////////////////////////////////////////////////
	////////////////FUNCTIONS//////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 *	A function to determine if a provided logic formula is provable by Natural Deduction (a tautology)
	 *	@param {String} formula - User's formula input
	 *	@return {boolean} - Returns whether or not the logic formula is a tautology
	 */
	function isProvable (formula) {
		//console.clear();
		//replace all special characters with something more relatable
		formula = formula.replace(new RegExp("⇒", "g"), "->");
		formula = formula.replace(new RegExp("∧", "g"), "&");
		formula = formula.replace(new RegExp("∨", "g"), "||");
		formula = formula.replace(new RegExp("¬", "g"), "~");
		formula = formula.replace(new RegExp("⊥", "g"), "F");
		formula = formula.replace(new RegExp("f", "g"), "F");
		
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
		// var pl = new ProofLine(1, 5, "(A||~A)=>(A||~A)", "impintro", 4);
		// console.log("pl test: " + pl.getLineAsString());

		// console.log(statement.table()); 
		// console.log(statement.symbols);
		// console.log(statement.variables);
		// console.log(statement.symbolsRPN);
		// console.log(statement.tree["tree"][0]);
		// console.log("Statement: " + statement.statement);
		// var f = treeToFormula(statement.tree["tree"][0], 0);
		// console.log(f);
		// console.log("Matches with original formula: " + (f===formula))
		// console.log(JSON.stringify(statement.tree));
		
		return true;
	}

	/**
	 *	function to check if statement is a tautology, only when (F)alsum is used
	 *	@param 	{Statement.Object} s  - statement object
	 *  @return {boolean} isTautology
	 */
	function falsumCheck(statement){
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







