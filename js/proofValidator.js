var treeToFormula = require('./treeToFormula.js');
var ProofLine = require('./proofLine.js');
var tombstone = require('../tombstoneLib/tombstone.min.js');


/** Class representing Proof Validator functionality */
class ProofValidator {
	/**
	 * construct validation of given proof a proof is valid iff all assumptions are discharged
     * @param {Array.Array+} proofTree  - Tree form of original logic formula
     * @param {Array.ProofLine} proof   - Proof as data where each line is of ProofLine class
	 */
    constructor(formulaTree, proof) {
        this.problemList = []; //list of wrong-doings in proof
        this.assumeList  = []; //list of assumptions to be discharged
        this.formulaTree = formulaTree; //tree["tree"][0]
        this.proof       = proof;
        this.isValid     = this._validate();
    }

    /**
     * function to return if proof is valid or not
     * @return {boolean} isValid
     */
    isProofValid() {
        return this.isValid;
    }

    /**
     * function to give advice to student
     * @return {array.String} feedback - array of problems that have occurred in the proof
     */
    getFeedback() {
        return this.problemList;
    }

    /**
     * returns the list of assumptions to be discharged
     * @return {array.Number} assumeList - array of line numbers that represent lines in the proof that have been assumed
     */
    getAssumeList() {
        return this.assumeList;
    }

    /**
     * single-use psuedo-private function to carry out validation of proof
     * @return {boolean} isValid
     */
    _validate() {
        //proof structure eg:
        //  proof[0].getRule() returns "assume" from first line of proof

        if(treeToFormula(this.formulaTree, 0) !== this.proof[this.proof.length-1].getProposition()){
            this.problemList.push("[Proof]: the last line does not match the given formula. The final conclusion of your proof must result in the given formula being proven.");
            return false;
        }

        for(var i = 0; i < this.proof.length; i++){ //checks if each line is being used validly
            var currentLine = this.proof[i];
            var currentLineProposition = currentLine.getProposition();
            var currentRule = currentLine.getRule().toLowerCase();
            var currentRuleJustification = currentLine.getRuleDependencies();

            if(currentRuleJustification <= 0){ //user has not entered any rule justifications E.g: 1 (2) AvB orIntro  [should be]   1 (2) AvB orIntro 1
                this._addProblemToProblemList(i, "you have not entered any rule justifications for this line. E.g. andIntro needs one justiciation to show you are using that line for and-Introduction");
                return false;
            }

            switch(currentRule){
                case "assume":
                    if(!this.assumeList.includes(i+1))
                        this.assumeList.push(i+1);
                    break;
                case "andintro":
                    if(!this._andIntroCheck(currentLine, i))
                        return false;
                    break;
                case "andelim1":
                    if(!this._andElim1Check(currentLine, i))
                        return false;
                    break;
                case "andelim2":
                    if(!this._andElim2Check(currentLine, i))
                        return false;
                    break;
                case "impintro": //discharges assumptions
                    if(!this._impIntroCheck(currentLine, i))
                        return false;
                    break;
                case "impelim":
                    if(!this._impElimCheck(currentLine, i))
                        return false;
                    break;
                case "orintro1":
                    if(!this._orIntro1Check(currentLine, i))
                        return false;
                    break;
                case "orintro2":
                    if(!this._orIntro2Check(currentLine, i))
                        return false;
                    break;
                case "orelim": //discharges assumptions
                    break;
                case "notintro":
                    if(!this._notIntroCheck(currentLine, i))
                        return false;
                    break;
                case "notelim":
                    if(!this._notElimCheck(currentLine, i))
                        return false;
                    break;
                case "raa": //discharges assumptions
                    break;
                case "efq":
                    if(!this._efqCheck(currentLine, i))
                        return false;
                    break;
                default:
                    console.error("Error in ProofValidator: undetermined case executed.");
                    return false;
            }
        }

        /**
         * TODO additional checking:
         *  - Check assumptions are discharged
         *  - Assumption dependencies on each line
         *  - Check for any unused lines in proof
         */

        return true; //all assumptions discharged, line dependencies are correct and use of rules are valid; proof is valid
    }

    //------------------------SEQUENT INFERENCE RULES------------------------------------//

    /**
     * psuedo-private function check use of impIntro. Takes assumption A and introduces B. This discharges the assumption A.
     * A must be an assumption and B must be the product of inference rule usage
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _impIntroCheck(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies();
        let prop = currentLine.getProposition();
        let tree = new tombstone.Statement(prop).tree["tree"][0];
        let mainOperation = tree["name"];

        if(mainOperation !== "->"){
            this._addProblemToProblemList(currentLineNumber, "you have used impIntro but have not introduced an implication. Rule usage: A  B | A->B");
            return false;
        }else if(deps.length > 2 || deps.length < 2){
            this._addProblemToProblemList(currentLineNumber, "impIntro must have exactly 2 rule justifications. Rule usage: A B | A->B");
            return false;
        }else if(deps[0] >= currentLineNumber+1  ||  deps[1] >= currentLineNumber+1){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }


        let antecedent = treeToFormula(tree["children"][1], 0); //"A"
        let consequent = treeToFormula(tree["children"][0], 0); //"B"
        let dep1line = this.proof[deps[0] - 1];
        let dep1prop = dep1line.getProposition();
        let dep1rule = dep1line.getRule();
        let dep2line = this.proof[deps[1] - 1];
        let dep2prop = dep2line.getProposition();
        let dep2rule = dep2line.getRule();

        if(antecedent !== dep1prop){ //(A)->B  !== A
            this._addProblemToProblemList(currentLineNumber, "justification values are not correct. The antecedent (left-side) of your implication does not correspond to the 1st justification line number you have given. E.g. '3,2' where 3 is the line number for the antecedent.");
            return false;
        }else if(consequent !== dep2prop){ //A->(B) !== B
            this._addProblemToProblemList(currentLineNumber, "justification values are not correct. The consequent (right-side) of your implication does not correspond to the 2nd justification line number you have given. E.g. '3,2' where 2 is the line number for the consequent.");
            return false;
        }else if(dep1rule !== "assume"){ //antecedent is not an assumption
            this._addProblemToProblemList(currentLineNumber, "the antecedent (left-side) of the implication you are trying to introduce must be an assumption. Ensure that you only use impIntro when using an assumption as the antecedent and a product of an inference rule as the consequent.");
            return false;
        }else if(dep2rule === "assume"){ //consequent is not an inference rule
            this._addProblemToProblemList(currentLineNumber, "the consequent (right-side) of the implication you are trying to introduce must be a product of an inference rule. Ensure that you only use impIntro when using an assumption as the antecedent and a product of an inference rule as the consequent.");
            return false;
        }

        //discharge the assumption (antecedent) used for the implication introduction - remove from assumeList
        const index = this.assumeList.indexOf(dep1line.getLineNum());
        if(index !== -1)
            this.assumeList.splice(index, 1);

        return true;
    }





    //------------------------NON-SEQUENT INFERENCE RULES--------------------------------//

    /**
     * psuedo-private function check use of falsum-elimination (efq):  F | A . Note: EFQ can produce ANY formula the prover desires.
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _efqCheck(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //4
        if(deps.length > 1 || deps.length < 1){ //too many or too little rule justifications
            this._addProblemToProblemList(currentLineNumber, "EFQ can only have 1 rule justification. Rule usage: F | A");
            return false;
        }else if(deps[0] >= currentLineNumber + 1){ //attempting to use justification that has not yet been proven
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }

        //check if justifcation is Falsum
        let depLine = this.proof[deps[0] - 1]; //F
        let depProp = depLine.getProposition();
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        if(depTree["name"] !== "F"){
            this._addProblemToProblemList(currentLineNumber, "you have attempted to use EFQ on a non-falsum symbol. On the NatDud application, the falsum system is represented by an 'F' character. Rule usage: F | A");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of notIntro rule is valid e.g. A->F | ¬A
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _notIntroCheck(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //3
        let prop = currentLine.getProposition(); //~A
        let tree = new tombstone.Statement(prop).tree["tree"][0];

        if(deps.length > 1 || deps.length < 1){ //too many or too little rule justifications
            this._addProblemToProblemList(currentLineNumber, "notIntro can only have 1 rule justification. Rule usage: A->F | ¬A");
            return false;
        }else if(deps[0] >= currentLineNumber+1){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else if(tree["name"] !== "~"){ //first operation is not a negation
            this._addProblemToProblemList(currentLineNumber, "you have attempted to use notIntroduction without introducing a negation. Rule usage: A->F | ¬A");
            return false;
        }

        let notProp = treeToFormula(tree["children"][0] , 0); //A


        let depLine = this.proof[deps[0]-1];
        let depProp = depLine.getProposition(); //"A->F"
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        let depOper = depTree["name"]; //"->"
        let depLeftProp  = treeToFormula(depTree["children"][1] , 0); //"A"
        let depRightProp = treeToFormula(depTree["children"][0] , 0); //"F"

        if(depOper !== "->"){ //justification proposition is not an implication
            this._addProblemToProblemList(currentLineNumber, "notIntro can only be used on an implication to falsum. E.g: A->F | ¬A");
            return false;
        }else if(depLeftProp !== notProp){ //(A)->F !== A
            this._addProblemToProblemList(currentLineNumber, "the antecedent (left of the arrow) of the implication used has to be the current line without the negation, i.e: A->F | ¬A , where A has to be the antecedent in the implication");
            return false;
        }else if(depRightProp !== "F"){    //A->(F) !== F
            this._addProblemToProblemList(currentLineNumber, "invalid use of notIntro: the justification you are attempting to use does not contain Falsum as its consequent (right of the arrow) in the implication. E.g. A->F");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of notElim rule is valid e.g. ¬A | A->F
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _notElimCheck(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //[3]
        let prop = currentLine.getProposition(); //"A->F"
        let tree = new tombstone.Statement(prop).tree["tree"][0];

        if(deps.length > 1 || deps.length < 1){ //too many or too little rule justifications
            this._addProblemToProblemList(currentLineNumber, "notElim can only have 1 rule justification. Rule usage: ¬A | A->F");
            return false;
        }else if(deps[0] >= currentLineNumber+1){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else if(tree["name"] !== "->"){ //first operation is not an implication i.e. A->F
            this._addProblemToProblemList(currentLineNumber, "you have attempted to use notElimination without the current line resulting in an implication (->) operation, e.g: A->F");
            return false;
        }


        let leftProp  = treeToFormula(tree["children"][1] , 0); //A
        let rightProp = treeToFormula(tree["children"][0] , 0); //F
        if(rightProp !== "F"){ //A->(F) !== "F"
            this._addProblemToProblemList(currentLineNumber, "notElim must result in an implication where the consequent (right of the arrow) is falsum, e.g: A->F");
            return false;
        }

        //justification line referencing
        let depLine = this.proof[deps[0]-1];
        let depProp = depLine.getProposition(); //"~A"
        let depTree = new tombstone.Statement(depProp).tree["tree"][0]; //~A treeObj
        let depOper = depTree["name"]; //"~"
        if(depOper !== "~"){ //operation on justification line is not negation
            this._addProblemToProblemList(currentLineNumber, "notElim must be carried out upon a negated proposition, e.g: ~A in the rule ~A | A->F");
            return false;
        }

        let notDepProp = treeToFormula(depTree["children"][0] , 0); //"A"
        if(notDepProp !== leftProp){ //(A)->F !== "A"
            this._addProblemToProblemList(currentLineNumber, "the antecedent (left of the arrow) of the implication on this line must be equivilant to the non-negated justification line: ¬A | A->F , where A is the antecedent");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of impElim1 rule is valid e.g. A  A->B | B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _impElimCheck(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //3,2
        let prop = currentLine.getProposition(); // B

        if(deps.length < 2 || deps.length > 2){//not 2 rule justifications
            this._addProblemToProblemList(currentLineNumber, "impElim can only have 2 rule justifications.");
            return false;
        }else if(deps[0] >= currentLineNumber+1 || deps[1] >= currentLineNumber+1){ //references a line after this line in the proof (cannot occur)
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }

        let dep2line = this.proof[deps[1] - 1]; //A->B
        let dep2prop = dep2line.getProposition();
        let dep2tree = new tombstone.Statement(dep2prop).tree["tree"][0];
        let dep2op   = dep2tree["name"]; //->

        if(dep2op !== "->"){
            this._addProblemToProblemList(currentLineNumber, "You are attempting to use impElim on a non-implication operation. Rule usage: A  A->B | B");
            return false;
        }

        let dep2prop1 = treeToFormula(dep2tree["children"][1], 0); //A
        let dep2prop2 = treeToFormula(dep2tree["children"][0], 0); //B
        let dep1      = this.proof[deps[0] - 1]; //A
        let dep1prop  = dep1.getProposition();

        if(dep1prop !== dep2prop1){ //A !== A
            this._addProblemToProblemList(currentLineNumber, "your 1st justification does not match the left-side of the implication in your 2nd justification. Rule usage: A  A->B | B");
            return false;   
        }else if(prop !== dep2prop2){ //B !== B
            this._addProblemToProblemList(currentLineNumber, "this line's proposition does not match the right-side of the implication in your 1st justification. Rule usage: A  A->B | B");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of orIntro1 rule is valid e.g. A | AvB
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _orIntro1Check(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //4
        let prop = currentLine.getProposition(); // AvB
        let tree = new tombstone.Statement(prop).tree["tree"][0];
        let mainOperation = tree["name"]; //"||"
        let leftProp  = treeToFormula(tree["children"][1], 0); //A

        if(mainOperation !== "||"){ //first operation of proposition is SOMEHOW not ||
            this._addProblemToProblemList(currentLineNumber, "cannot apply orIntro2 to non-Or operation. Use '∨' when introducing a disjunction.");
            return false;
        }else if(deps.length > 1 || deps.length < 1){ //eg orIntro 1,2,3
            this._addProblemToProblemList(currentLineNumber, "orIntro1 rule can only have one rule justification");
            return false;
        }else if(deps[0] >= currentLine.getLineNum()){ //justification values are beyond the current line number in proof
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else{ //operation is disjunction && there is 1 justification value: check if left symbol === justification line symbol
            let justificationProp = this.proof[deps[0] - 1].getProposition();
            if(leftProp !== justificationProp){
                this._addProblemToProblemList(currentLineNumber, "you have used orIntro1 incorrectly. orIntro1 introduces a proposition to the right of the 'OR' symbol: e.g. A | AvB. Perhaps try orIntro2 instead.");
                return false;
            }
        }
        return true;
    }

    /**
     * psuedo-private function check use of orIntro2 rule is valid e.g. B | AvB
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _orIntro2Check(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //4
        let prop = currentLine.getProposition(); // AvB
        let tree = new tombstone.Statement(prop).tree["tree"][0];
        let mainOperation = tree["name"]; //"||"
        let rightProp  = treeToFormula(tree["children"][0], 0); //B

        if(mainOperation !== "||"){ //first operation of proposition is SOMEHOW not ||
            this._addProblemToProblemList(currentLineNumber, "cannot apply orIntro2 to non-Or operation. Use '∨' when introducing a disjunction.");
            return false;
        }else if(deps.length > 1 || deps.length < 1){ //eg orIntro 1,2,3
            this._addProblemToProblemList(currentLineNumber, "orIntro2 rule can only have one rule justification");
            return false;
        }else if(deps[0] >= currentLine.getLineNum()){ //justification values are beyond the current line number in proof
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else{ //operation is disjunction && there is 1 justification value: check if left symbol === justification line symbol
            let justificationProp = this.proof[deps[0] - 1].getProposition();
            if(rightProp !== justificationProp){
                this._addProblemToProblemList(currentLineNumber, "you have used orIntro2 incorrectly. orIntro2 introduces a proposition to the left of the 'OR' symbol: e.g. B | AvB. Perhaps try orIntro1 instead.");
                return false;
            }
        }
        return true;
    }

    /**
     * psuedo-private function check use of andElim1 rule is valid E.g: andElim1(A & B) concludes to A
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _andElim1Check(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //3
        let prop = currentLine.getProposition(); //"A"

        if(deps.length > 1 || deps.length < 1){
            this._addProblemToProblemList(currentLineNumber, "andElim1 cannot be justified by more or less than one line in the proof. E.g. andElim1 4");
            return false;
        }else if(deps[0] >= currentLine.getLineNum()){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }

        let depLine = this.proof[deps[0]-1];
        let depProp = depLine.getProposition(); //A&B
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        let depTreeLeftProposition  = depTree["children"][1]; //A&B gives A
        let depOperation = depTree["name"]; //"&"

        if(depOperation !== "&"){
            this._addProblemToProblemList(currentLineNumber, "you are attempting to use a line number in your rule justification that does not contain a conjunction.");
            return false;
        }else if(treeToFormula(depTreeLeftProposition, 0) !== prop){ //line in proof doesn't match with justification line  
            this._addProblemToProblemList(currentLineNumber, "you have used andElim1 incorrectly. This line does not match with the left side of the & operation of the rule justification line.");
            return false;
        }
        return true;
    }

    /**
     * psuedo-private function check use of andElim2 rule is valid E.g: andElim2(A & B) concludes to B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _andElim2Check(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //3
        let prop = currentLine.getProposition(); //"B"

        if(deps.length > 1 || deps.length < 1){
            this._addProblemToProblemList(currentLineNumber, "andElim2 cannot be justified by more or less than one line in the proof. Use example: andElim2 4");
            return false;
        }else if(deps[0] >= currentLine.getLineNum()){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }

        let depLine = this.proof[deps[0]-1];
        let depProp = depLine.getProposition(); //A&B
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        let depTreeRightProposition  = depTree["children"][0]; //A&B gives B
        let depOperation = depTree["name"]; //"&"

        if(depOperation !== "&"){
            this._addProblemToProblemList(currentLineNumber, "you are attempting to use a line number in your rule justification that does not contain a conjunction.");
            return false;
        }else if(treeToFormula(depTreeRightProposition, 0) !== prop){ //line in proof doesn't match with justification line  
            this._addProblemToProblemList(currentLineNumber, "you have used andElim2 incorrectly. This line does not match with the left side of the & operation of the rule justification line. Perhaps using the andElim1 rule will resolve this issue.");
            return false;
        }
        return true;
    }

    /**
     * psuedo-private function check use of andIntro rule is valid for use to be valid the conclusion must use existing premises/assumptions. E.g: andintro1(A,B) concludes to A^B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _andIntroCheck(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies();
        let prop = currentLine.getProposition(); // A&B
        let tree = new tombstone.Statement(prop).tree["tree"][0];
        let mainOperation = tree["name"]; //"&"
        let leftProp  = treeToFormula(tree["children"][1], 0); //A
        let rightProp = treeToFormula(tree["children"][0], 0); //B

        if(mainOperation !== "&"){ //first operation of proposition is SOMEHOW not &
            this._addProblemToProblemList(currentLineNumber, "cannot apply and-Introduction to non-And operation. Use '∧' when introducing a conjunction.");
            return false;
        }else if(deps.length > 2 || deps.length < 2){ //eg &-intro 1,2,3
            this._addProblemToProblemList(currentLineNumber, "and-Introduction rule cannot have more or less than 2 rule justifications");
            return false;
        }else if(deps[0] >= currentLine.getLineNum() || deps[1] >= currentLine.getLineNum()){ //justification values are beyond the current line number in proof
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else{ //operation is conjuction && there are 2 justification values
            for(var i=0; i < deps.length; i++){
                let currentJustificationLineNumber = deps[i] - 1;
                let currentJustificationProp = this.proof[currentJustificationLineNumber].getProposition();

                if(currentJustificationLineNumber >= currentLine){
                    this._addProblemToProblemList(currentLineNumber, "rule justification values are incorrent. Use values that correspond to line numbers in the proof that are being used in the and-Introduction rule");
                    return false;
                }else if((i===0 && leftProp!==currentJustificationProp) || (i===1 && rightProp!==currentJustificationProp)){//left isn't correct OR right isn't correct
                    this._addProblemToProblemList(currentLineNumber, "justification values are not correct. Perhaps check if the justification ordering is correct. E.g. 2,1 to 1,2. This is to ensure consistency for introducing both the left and right side of the conjunction operation.");
                    return false;
                }
            }
            return true;
        }
    }



    //----------------------LOCAL FUNCTIONS---------------------------------------------//

    /**
     * psuedo-private function to add problem string to problemList
     * @param {number} lineNumber - line number of proof as ProofLine object (0 is valid)
     */
    _addProblemToProblemList(lineNumber, message){
        lineNumber++;
        this.problemList.push("[Line "+ lineNumber +"]: " + message)
    }
}

//import ProofValidator from "proofValidator.js";
//var pv = new ProofValidator(formulaTree, proofData);
module.exports = ProofValidator;