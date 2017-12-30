/**
*	For a proof to be valid, we must discharge all assumptions
*	There are many strategies to do so.
*	1.	Proving an implication (A -> B) 	= Assume A, Deduce B, then use ->intro, discharging assumption A
*	2.	Proving a disjunction (A v B) for C	= Assume A, Deduce C, Assume B, Deduce C, then use v-elim, discharging assumptions
*	3.	Proving a negation (¬A) 			= Use ¬elim, so now you have to prove the implication A->_|_
*	4.	Proving something from nothing		= Use _|_elim, so now you have to prove a contradiciton
*	5.	If all else fails, to prove A		= Assume ¬A, deduce _|_, use RAA, discharging the assumption
*
*	Checklist:
*	[ ]	1.	Be able to construct a proof from an implication.
*/
//$.getScript("js/tombstone.min.js"); //preload tombstone logic library
const operators = ["~" , "&" , "||" , "->"];
var assumptions = []; //list of assumptions that need to be discharged
var dischargedAssumptions = []; //list of assumptions that have been discharged from the proof
var toProveStack = []; //a stack of propositions that are to be proven in the given subproof
var proofString = ""; //the proof text that will be constructed as this is processed
var currentLine = 0;

//takes in formula as a String
function prove(formula){
	var statement 		= new tombstone.Statement(formula);
	var formulaRPN 		= statement.symbolsRPN; //polish notation
	var formulaTree 	= statement.tree["tree"][0]; //formula as parse tree
	var formulaSymbols 	= statement.symbols; //symbols in order
	
	//**these conditions identify the strategies required to prove the given formula**//
	
	//assume the antecedent, attempt to deduce the consequent
	if(formulaRPN[formula.length - 1] === "->"){
		var antecedent = getAntecedent(statement.statement);
		var consequent = getConsequent(statement.statement);
		assume(treeToFormula(antecedent , 0));
		prove(treeToFormula(consequent , 0));///////////////////UNFINISHED!!
	}
}

/**
*	Adds assumption to assumption list and to proof string
*	Params: formula - string
*/
function assume(formula){
	let line = new ProofLine("", ++currentLine, formula, "assume", "");
	addLineToProof(line);
	assumptions.push(formula);
}

/**
*	Adds line to proof string in correct formatting
*	Params: line - ProofLine object
*/
function addLineToProof(line){
	proofString += "\n" + line.getLineAsString();
}

/**
*	Takes implication tree and returns antecedent in tree format
*	Note: not to be used as proof, but in order to identify the antecedent
*	Params: formulaTree - formula as implication (A->B) in parse tree form
*	Return: antecedent  - returns proposition A from (A->B)
*/
function getAntecedent(formulaTree){
	return formulaTree["children"][1];
}
/**
*	Takes implication tree and returns antecedent in tree format
*	Note: not to be used as proof, but in order to identify the antecedent
*	Params: formulaTree - formula as implication (A->B) in parse tree form
*	Return: consequent  - returns proposition B from (A->B) in parse tree form
*/
function getConsequent(formulaTree){
	return formulaTree["children"][0];
}

/**
*	Translates formula tree to infixed logic string
*	treeToFormula(formulaTree["tree"][0], 0, false) : usage
*	Params: formulaTree - formula in parse tree format
*			OperandNo	- should always be default 0
*	Return: formula - string
*/
function treeToFormula(formulaTree, operandNo){
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


/**
* A class to make writing proof lines a little more portable
* Constructor Params: ass deps, line num, proposition, rule used, rule dependencies - String
* 			 Methods: getters and setters, getLineAsString
*/
class ProofLine {
	constructor(dependencies, lineNum, proposition, rule, ruleDependencies){
		this.dependencies 		= dependencies;
		this.lineNum			= lineNum;
		this.proposition  		= proposition;
		this.rule         		= rule;
		this.ruleDependencies	= ruleDependencies;
	}
	
	getDependencies(){return this.dependencies;}
	getLineNum(){return this.lineNum;}
	getProposition(){return this.proposition;}
	getRule(){return this.rule;}
	getRuleDependencies(){return this.ruleDependencies;}

	setDependencies(dep){this.dependencies = dep;}
	setLineNum(l){this.lineNum = l;}
	setProposition(prop){this.proposition = prop;}
	setRule(r){this.rule = r;}
	setRuleDependencies(rDep){this.ruleDependencies = rDep;}
	
	getLineAsString(){
		return this.dependencies + " " + "("+lineNum.toString()+")" + " " + this.proposition + " " + this.rule + " " + this.ruleDependencies;
	}
}




















