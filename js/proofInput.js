/*
 *	JQuery to manipulate elements and validations
 */
$(document).ready(function(){
	var formulaValid = false;
	var currentLine = 1;
	var formulaString = "";
	
	//logic button actions
	$("#logic-imply").click(function(){
		if(!formulaValid) $("#formula").val($("#formula").val() + "⇒");
		else $("#proof-formula-input").val($("#proof-formula-input").val() + "⇒");
	});
	$("#logic-and").click(function(){
		if(!formulaValid) $("#formula").val($("#formula").val() + "∧");
		else $("#proof-formula-input").val($("#proof-formula-input").val() + "∧");
	});
	$("#logic-or").click(function(){
		if(!formulaValid) $("#formula").val($("#formula").val() + "∨");
		else $("#proof-formula-input").val($("#proof-formula-input").val() + "∨");
	});
	$("#logic-not").click(function(){
		if(!formulaValid) $("#formula").val($("#formula").val() + "¬");
		else $("#proof-formula-input").val($("#proof-formula-input").val() + "¬");
	});
	
	//bad input animation
	$("#logic-submit").click(function(){
		if(!formulaValid){
			if($("#formula").val() === "wrong"){ //CHANGE FOR FORMULA CHECKING
				//set input border to red and shake for 1 second when input is invalid
				$('#formula-input-area').effect("shake", {distance:5});
				$("#formula").css("border", "1px solid red");
				$("#error-message").html("Your formula is wrong.");
				setTimeout(function(){
					$("#formula").css("border", "1px solid #cccccc");
					$("#error-message").html("");
				} , 2000);
			}else{
				formulaValid = true;
				formulaString = $("#formula").val();
				$("#formula").prop("disabled", true); //disabled
				
				//input is valid, show input area for user's proof
				$("#proof-area").css("border-color" , "white");
				$("#proof-area").css("border-style" , "solid");
				$("#proof-area").css("border-width" , "1px");
				$("#proof-area").css("border-radius" , "1rem 1rem 1rem 1rem");			
				$("#proof-input-area").css("margin-left" , "15%");
				$("#proof-input-area").css("margin-right" , "15%");
				
				
				var $listDiv = $(' <div id="proof-list"></div> ');
				var $proofListOlObject= $(' <ol id="proof-list-ol-object"></ol> ');
				
				var $divLine = $(' <div id="proof-formula-input-group" class="input-group form-group-sm"></div> ');
					var $lineFormulaInput = $(' <input id="proof-formula-input" class="form-control" placeholder="Proof Line"> ');
					var $lineRuleInput = $(' <select id="proof-rule-input" class="selectpicker form-control"><option value="assume">assume</option><option value="andIntro">∧-intro</option><option value="andElim1">∧-elim1</option><option value="andElim2">∧-elim2</option><option value="impIntro">⇒-intro</option><option value="impElim">⇒-elim</option><option value="orIntro1">∨-intro1</option><option value="orIntro2">∨-intro2</option><option value="orElim">∨-elim</option><option value="notIntro">¬-intro</option><option value="notElim">¬-elim</option><option value="raa">RAA</option><option value="efq">⊥-elim</option></select>');
					var $lineDependencyInput = $(' <input id="proof-dependency-input" class="form-control" placeholder="Deps."> ');
				var $addButton = $(' <button id="proof-add" class="btn btn-info">add</button> ');
				var $removeButton = $(' <button id="proof-remove" class="btn btn-info">remove</button> ');
				var $clearButton = $(' <button id="proof-clear" class="btn btn-danger">clear</button> ');
				
				$("#proof-area").append($listDiv);
				$("#proof-list").append($proofListOlObject);
				$("#proof-area").append($divLine);
					$("#proof-formula-input-group").append($lineFormulaInput);
					$("#proof-formula-input-group").append($lineRuleInput);
					$("#proof-formula-input-group").append($lineDependencyInput);
					$("#proof-formula-input").css("width","20%");
					$("#proof-rule-input").css("width","25%");
					$("#proof-dependency-input").css("width","20%");
					$("#proof-formula-input-group").css("padding-left","10%");
					$("#proof-formula-input-group").css("padding-bottom","1%");
					$("#proof-formula-input-group").css("padding-top","1%");
				$("#proof-buttons").append($addButton);
				$("#proof-buttons").append($removeButton);
				$("#proof-buttons").append($clearButton);
				//$("#proof-buttons").css("padding-left" , "1rem");
				//$("#proof-buttons").css("padding-right" , "1rem");
				//$("#proof-add").css("margin-right" , "1rem");
				//$("#proof-remove").css("margin-right" , "1rem");
				//$("#proof-clear").css("float" , "right");
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
			//$("#span-proof-line-" + currentLine).css("" , "");
			//$("#span-proof-ruledep-" + currentLine).css("float" , "right");
			//$("#proof-list-ol-object").css("padding-right", "5%");
			//$("#proof-list-ol-object").css("padding-top", "5%");
			
			currentLine++;
		}
	});
	
	$("body").on("click", "#proof-remove", function(){
		var currentLineId = "proof-list-li-object-" + (currentLine-1);
		$("#" + currentLineId).remove();
		
		if(--currentLine == 0) currentLine = 1;
	});
	
	$("body").on("click", "#proof-clear", function(){
		console.log("we get here");
		
		currentLine = 1;
		formulaValid = false;
		$("#proof-input-area").empty();
	});
});







