//DEFAULT VALUE OF operandNo SHOULD ALWAYS BE 0 (ZERO)
function treeToFormula(formulaTree, operandNo){
	//base cases
	if(!("children" in formulaTree)) //if a literal
		return formulaTree["name"];
	else if(formulaTree["name"] === "~" && (formulaTree["children"][0]["name"] === "->" || formulaTree["children"][0]["name"] === "&" || formulaTree["children"][0]["name"] === "||" ) ) //child is operator
		return "~" + "(" + treeToFormula(formulaTree["children"][0], operandNo) + ")";
	else if(formulaTree["name"] === "~" && formulaTree["children"].length === 1) //child is ~ or literal
		return "~" + treeToFormula(formulaTree["children"][0], operandNo);
		
	operandNo++;
	
	//index 1 is left most child in tree
	var result = treeToFormula(formulaTree["children"][1], operandNo) 
				+ formulaTree["name"]
				+ treeToFormula(formulaTree["children"][0], operandNo);
		
	if(operandNo === 1) //this ensures that no redundant surrounding brackets occur
		return result;
	return "(" + result + ")";
}


//usage
//var t2f = require("./treeToFormula.js");
//t2f(tree, 0);
module.exports = treeToFormula;