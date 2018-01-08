import ProofLine from "js/proofLine.js"; //may not require
import Statement from "js/tombstone.min.js";

/** Class representing Proof Validator functionality */
class ProofValidator {
	/**
	 * construct validation of given proof
     * a proof is valid iff all assumptions are discharged
     * @param {Array.Array+} proofTree    - Tree form of original logic formula
     * @param {Array.ProofLine} proofData - Proof as data where each line is of ProofLife class
	 */
    constructor(proofTree, proofData) {
        this.proofTree      = proofTree;
        this.proofData      = proofData;
        this.isValid        = _validate();
        this.feedback       = _generateFeedback();
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
        return false;
    }
}

//import ProofValidator from "proofValidator.js";
//var pv = new ProofValidator(proofString);
export default ProofValidator