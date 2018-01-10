//DEFAULT VALUE OF operandNo SHOULD ALWAYS BE 0 (ZERO)
export function treeToFormula(formulaTree, operandNo){
	//base cases
	if(!("children" in formulaTree)){ //if a literal
		return formulaTree["name"];
	}else if(formulaTree["name"] === "~"){ //only 1 child but is an operator (~)
		return "~" + treeToFormula(formulaTree["children"][0], operandNo);
	}
	
	operandNo++;
	
	//index 1 is left most child in tree
	var result = treeToFormula(formulaTree["children"][1], operandNo) 
				+ formulaTree["name"]
				+ treeToFormula(formulaTree["children"][0], operandNo);
		
	if(operandNo === 1) //this ensures that no redundant surrounding brackets occur
		return result;
	return "(" + result + ")";
}