import {treeToFormula} from '../js/treeToFormula.js';
import ProofValidator from '../js/proofValidator.js';
import ProofLine from '../js/proofLine.js'; //temp testing

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
				$('#formula-input-area').effect("shake", {distance:5});
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
				var $proofListOlObject = $(' <ol id="proof-list-ol-object"></ol> ');
				$("#proof-area").append($proofList);
				$("#proof-list").append($proofListOlObject);
				$("#proof-list").css("padding-top" , "1%");
				
				//add inputs fields to proof-area
				var $proofFormulaInputGroup = $(' <div id="proof-formula-input-group" class="input-group form-group-sm"></div> '); //#div for containing the input buttons and fields
				var 	$lineFormulaInput = $(' <input id="proof-formula-input" class="form-control" placeholder="Proof Line"> '); //#button for entering line of proof
				var 	$lineRuleInput = $(' <select id="proof-rule-input" class="selectpicker form-control"><option value="assume">assume</option><option value="andIntro">∧-intro</option><option value="andElim1">∧-elim1</option><option value="andElim2">∧-elim2</option><option value="impIntro">⇒-intro</option><option value="impElim">⇒-elim</option><option value="orIntro1">∨-intro1</option><option value="orIntro2">∨-intro2</option><option value="orElim">∨-elim</option><option value="notIntro">¬-intro</option><option value="notElim">¬-elim</option><option value="raa">RAA</option><option value="efq">⊥-elim</option></select>');
				var 	$lineDependencyInput = $(' <input id="proof-dependency-input" class="form-control" placeholder="Deps."> '); //#input field for dependency numbers
				$("#proof-area").append($proofFormulaInputGroup);
				$("#proof-formula-input-group").append($lineFormulaInput);
				$("#proof-formula-input-group").append($lineRuleInput);
				$("#proof-formula-input-group").append($lineDependencyInput);
				$("#proof-formula-input").css("width","50%"); //CSS for input fields
				$("#proof-rule-input").css("width","20%");
				$("#proof-dependency-input").css("width","20%");
				$("#proof-formula-input-group").css("padding-left","10%");
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
		if(!($("#proof-formula-input").val().trim().length == 0)){ //if logic inputbox is not empty
			var currentLineId = "proof-list-li-object-"+(currentLine);
			
			var $proofListLiObject = $(' <li id="'+currentLineId+'" style="padding-left: 5%"></li> ');
			$("#proof-list-ol-object").append($proofListLiObject);
			
			var proofLineInputValue = $("#proof-formula-input").val();
			var proofLineRuleDepValue = $("#proof-rule-input option:selected").text() + " " + $("#proof-dependency-input").val();
			var $objectToAddToList = $(' <span id="span-proof-line-'+currentLine+'">'+proofLineInputValue+'</span>' + 
									   ' <span id="span-proof-ruledep-'+currentLine+'">'+proofLineRuleDepValue+'</span>');
			
			$("#"+currentLineId).append($objectToAddToList);
			$("#span-proof-ruledep-" + currentLine).css("float" , "right");
			$("#proof-list-ol-object").css("padding-right", "5%");
			$("#proof-list-ol-object").css("padding-top", "5%");
			
			currentLine++;
		}
	});
	
	$("body").on("click", "#proof-remove", function(){
		var currentLineId = "proof-list-li-object-" + (currentLine-1);
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
	
	
	$.getScript("js/tombstone.min.js"); //preload tombstone logic library
	//$.getScript("js/proofGen.js"); //load proof scripts
	
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
		
		//convert results of truthtable string into actual array values for processing
		var rows = truthtable.split("\n");
		for(var i=2; i<rows.length; i++){
			var row = [];
			row = rows[i].split("|");
			if(row[row.length - 2].trim() === "false"){
				message = "Your formula is not a tautology, and is therefore not provable by Natural Deduction";
				return false;
			}
		}
		
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
		console.log(f);
		console.log("Matches with original formula: " + (f===formula))
		console.log(JSON.stringify(statement.tree));
		
		return true;
	}
});







