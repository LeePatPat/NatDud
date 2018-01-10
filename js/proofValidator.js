import ProofLine from "../js/proofLine.js"; //may not need
import {treeToFormula} from '../js/treeToFormula.js';
$.getScript("../js/tombstone.min.js"); //jQuery for PropLogic Library


/** Class representing Proof Validator functionality */
class ProofValidator {
	/**
	 * construct validation of given proof
     * a proof is valid iff all assumptions are discharged
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
        let isValid = false;
        let assumeList = []; //list of assumptions to be discharged

        if(treeToFormula(this.formulaTree, 0) !== this.proof[this.proof.length-1].getProposition()){
            console.log("this.formulaTree: " + treeToFormula(this.formulaTree, 0));
            console.log("this.proof[this.proof.length-1].getProposition(): " + this.proof[this.proof.length-1].getProposition());
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
                    if(!this._andIntroCheck(currentLine, i)) return false;
                    break;

                case "andelim1":
                case "andelim2":
                case "impintro":
                case "impelim":
                case "orintro1":
                case "orintro2":
                case "orelim":
                case "notintro":
                case "notelim":
                case "raa":
                case "efq":

            }
        }

        /**
         * TODO additional checking:
         *  - Check assumptions are discharged
         *  - Assumption dependencies on each line
         */

        return isValid; //all assumptions discharged; proof is valid
    }

    /**
     * psuedo-private function check use of andIntro rule is validfor use to be valid the conclusion must use existing premises/assumptions. E.g: andintro1(A,B) concludes to A^B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _andIntroCheck(currentLine, currentLineNumber){
        let isValid = true;
        let lineNumString = this._getLineNumberString(currentLineNumber);
        let deps = this.proof[currentLineNumber].getRuleDependencies();
        let prop = this.proof[currentLineNumber].getProposition(); // A&B
        let stmt = new tombstone.Statement(prop);
        let tree = stmt.tree["tree"][0];
        let mainOperation = tree["name"]; //"&"
        let leftProp  = treeToFormula(tree["children"][1], 0); //A
        let rightProp = treeToFormula(tree["children"][0], 0); //B

        if(mainOperation !== "&"){ //first operation of proposition is SOMEHOW not &
            this.problemList.push(lineNumString + "cannot apply and-Introduction to non-And operation. Use '∧' when introducing a conjunction.");
            return false;
        }else if(deps.length > 2 || deps.length < 2){ //eg &-intro 1,2,3
            this.problemList.push(lineNumString + "and-Introduction rule cannot have more or less than 2 rule justifications");
            return false;
        }else if(deps[0] >= currentLine.getLineNum() || deps[1] >= currentLine.getLineNum()){ //justification values are beyond the current line number in proof
            this.problemList.push(lineNumString + "you are attempting to use a line number in your rule justification that cannot yet be used to justify the use of the andIntro rule.");
            return false;
        }else{ //operation is conjuction && there are 2 justification values
            for(var i=0; i < deps.length; i++){
                let currentJustificationLineNumber = deps[i] - 1;
                let currentJustificationProp = this.proof[currentJustificationLineNumber].getProposition();

                if(currentJustificationLineNumber >= currentLine){
                    this.problemList.push(lineNumString + "rule justification values are incorrent. Use values that correspond to line numbers in the proof that are being used in the and-Introduction rule");
                    return false;
                }else if((i===0 && leftProp!==currentJustificationProp) || (i===1 && rightProp!==currentJustificationProp)){//left isn't correct OR right isn't correct
                    this.problemList.push(lineNumString + "justification values are not correct. Perhaps check if the justification ordering is correct. E.g. 2,1 to 1,2. This is to ensure consistency for introducing both the left and right side of the conjunction operation.");
                    return false;
                }
            }
            return true;
        }
    }

    /**
     * psuedo-private function to get the string for line error output
     * @param {number} lineNumber - line number of proof
     * @return {string} lineString - line number in error format
     */
    _getLineNumberString(lineNumber){
        lineNumber++;
        return "[Line "+ lineNumber +"]: ";
    }
}

//import ProofValidator from "proofValidator.js";
//var pv = new ProofValidator(formulaTree, proofData);
export default ProofValidator