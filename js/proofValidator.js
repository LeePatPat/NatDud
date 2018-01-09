import ProofLine from "../js/proofLine.js"; //may not need
import {treeToFormula} from '../js/treeToFormula.js';
$.getScript("js/tombstone.min.js"); //jQuery for PropLogic Library


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
        this.isValid     = _validate();
        this.feedback    = _generateFeedback();
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
     * @return {String} feedback
     */
    getFeedback() {
        return this.feedback;
    }

    /**
     * single-use psuedo-private function to generate feedback based on proof report
     * @return {String} feedback
     */
    _generateFeedback() {
        if (this.isValid)
            return "Proof is valid";

        let feedback = "";
        return feedback;
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
        let formulaList = []; //list of assumptions AND conclusions of inference rules

        if(treeToFormula(this.formulaTree) !== proof[proof.length-1].getProposition()){
            this.problemList.push("[Proof]: the last line does not match the given formula. The final conclusion of your proof must result in the given formula being proven.");
            return false;
        }

        for(var i = 0; i < proof.length; i++){ //checks if each line is being used validly
            var currentLine = proof[i];
            var currentRule = currentLine.getRule().toLowerCase();
            switch(currentRule){
                case "assume":
                    assumeList.push(currentLine.getProposition());
                    formulaList.push(currentLine.getProposition());
                    break;

                case "andintro": //requires both premises to be written
                    isValid = _andIntroCheck(currentLine, i);
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
         *  - Assumption dependencies on each line
         */

        return isValid; //all assumptions discharged; proof is valid
    }

    /**
     * psuedo-private function check use of andIntro rule is valid
     * for use to be valid the conclusion must use existing premises/assumptions
     * E.g: andintro1(A,B) concludes to A^B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @param {number} currentLineNumber     - line number of proof line
     * @return {boolean} isValid
     */
    _andIntroCheck(currentLine, currentLineNumber){
        let isValid = true;
        let lineNumString = "[Line "+ currentLineNumber+1 +"]: ";
        let deps = this.proof[currentLineNumber].getRuleDependencies();
        let prop = this.proof[currentLineNumber].getProposition(); // A&B
        let stmt = new tombstone.Statement(prop);
        let tree = stmt.tree["tree"][0]; //left branch=1; right=0; A/&\B
        let mainOperation = tree["name"]; //"&"
        let leftProp  = treeToFormula(tree["children"][1]); //A
        let rightProp = treeToFormula(tree["children"][0]); //B

        if(mainOperation !== "&"){ //first operation of proposition is SOMEHOW not &
            this.problemList.push(lineNumString + "cannot apply and-Introduction to non-And operation. Use '∧' when introducing a conjunction.");
            return false;
        }else if(deps.length > 2 || deps.length < 2){ //eg &-intro 1,2,3
            this.problemList.push(lineNumString + "and-Introduction rule cannot have more or less than 2 rule justifications");
            return false;
        /**
         * }else if (check if both justification values or propositions are the same){
         *  return false ?????
         */
        }else{
            var validLeft  = false;
            var validRight = false;
            for(var i=0; i < deps.length; i++){
                let currentJustificationLineNumber = deps[i] - 1;
                let currentProp = proof[currentJustificationLineNumber].getProposition();

                if(curDepLine >= currentLine){
                    this.problemList.push(lineNumString + "rule justification values are incorrent. Use values that correspond to line numbers in the proof that are being used in the and-Introduction rule");
                    return false;
                }else if(!validLeft && currentProp === leftProp){ //not checked left && left is currentProp
                    validLeft = true;
                }else if(!validRight && currentProp === rightProp){ //not checked right && right is currentProp
                    validRight = true;
                }
            }
            if(validRight && validLeft) //left and right atoms of AndIntro Rule are previously made assumptions/conclusions
                return true;
        }

        this.problemList.push(lineNumString + "illegal use of and-Introduction. You should only use assumptions/premises/conclusions that are already present in the proof");
        return false;
    }
}

//import ProofValidator from "proofValidator.js";
//var pv = new ProofValidator(proofString);
export default ProofValidator