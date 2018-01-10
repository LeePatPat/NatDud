import ProofLine from "../js/proofLine.js"; //may not need
import {treeToFormula} from '../js/treeToFormula.js'; //modular function
$.getScript("../js/tombstone.min.js"); //jQuery for PropLogic Library


/** Class representing Proof Validator functionality */
class ProofValidator {
	/**
	 * construct validation of given proof a proof is valid iff all assumptions are discharged
     * @param {Array.Array+} proofTree  - Tree form of original logic formula
     * @param {Array.ProofLine} proof   - Proof as data where each line is of ProofLife class
	 */
    constructor(formulaTree, proof) {
        this.problemList = []; //list of wrong-doings in proof
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
     * single-use psuedo-private function to carry out validation of proof
     * @return {boolean} isValid
     */
    _validate() {
        //proof structure eg:
        //  proof[0].getRule() returns "assume" from first line of proof
        let assumeList = []; //list of assumptions to be discharged

        if(treeToFormula(this.formulaTree, 0) !== this.proof[this.proof.length-1].getProposition()){
            this.problemList.push("[Proof]: the last line does not match the given formula. The final conclusion of your proof must result in the given formula being proven.");
            return false;
        }

        for(var i = 0; i < this.proof.length; i++){ //checks if each line is being used validly
            var currentLine = this.proof[i];
            var currentLineProposition = currentLine.getProposition();
            var currentRule = currentLine.getRule().toLowerCase();
            switch(currentRule){
                case "assume":
                    if(!assumeList.includes(currentLineProposition))
                        assumeList.push(currentLineProposition);
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
                case "impintro":
                    break;
                case "impelim":
                    break;
                case "orintro1":
                    break;
                case "orintro2":
                    break;
                case "orelim":
                    break;
                case "notintro":
                    break;
                case "notelim":
                    break;
                case "raa":
                    break;
                case "efq":
                    break;
            }
        }

        /**
         * TODO additional checking:
         *  - Check assumptions are discharged
         *  - Assumption dependencies on each line
         */

        return true; //all assumptions discharged and use of rules are valid; proof is valid
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
        }else if(treeToFormula(depTreeLeftProposition) !== prop){ //line in proof doesn't match with justification line  
            this._addProblemToProblemList(currentLineNumber, "you have used andElim1 incorrectly. This line does not match with the left side of the & operation of the rule justification line.");
            return false;
        }
        return true;
    }

    /**
     * psuedo-private function check use of andElim2 rule is valid E.g: andElim1(A & B) concludes to B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _andElim2Check(currentLine, currentLineNumber){
        let deps = currentLine.getRuleDependencies(); //3
        let prop = currentLine.getProposition(); //"A"

        if(deps.length > 1 || deps.length < 1){
            this._addProblemToProblemList(currentLineNumber, "andElim2 cannot be justified by more or less than one line in the proof. Use example: andElim2 4");
            return false;
        }else if(deps[0] >= currentLine.getLineNum()){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }

        let depLine = this.proof[deps[0]];
        let depProp = depLine.getProposition(); //A&B
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        let depTreeRightProposition  = depTree["children"][0]; //A&B gives B
        let depOperation = depTree["name"]; //"&"

        if(depOperation !== "&"){
            this._addProblemToProblemList(currentLineNumber, "you are attempting to use a line number in your rule justification that does not contain a conjunction.");
            return false;
        }else if(treeToFormula(depTreeLeftProposition) !== prop){ //line in proof doesn't match with justification line  
            this._addProblemToProblemList(currentLineNumber, "you have used andElim2 incorrectly. This line does not match with the left side of the & operation of the rule justification line.");
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
        let deps = this.proof[currentLineNumber].getRuleDependencies();
        let prop = this.proof[currentLineNumber].getProposition(); // A&B
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
export default ProofValidator