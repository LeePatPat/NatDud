var treeToFormula = require('./treeToFormula.js');
var ProofLine = require('./proofLine.js');
var tombstone = require('./tombstone.min.js');


/** Class representing Proof Validator functionality */
class ProofValidator {
	/**
	 * construct validation of given proof a proof is valid iff all assumptions are discharged
     * @param {Array.Array} proofTree  - Tree form of original logic formula
     * @param {Array.ProofLine} proof   - Proof as data where each line is of ProofLine class
     * @param {Boolean} fullValidation  - boolean to determin whether the validator validates the proof completely or only partially
	 */
    constructor(formulaTree, proof, fullValidation) {
        this.problemList    = []; //list of wrong-doings in proof
        this.assumeList     = []; //list of assumptions to be discharged
        this.formulaTree    = formulaTree; //tree["tree"][0]
        this.proof          = proof;
        this.fullValidation = fullValidation; //boolean for full check
        this.isValid        = this._validate();
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
        if(this.fullValidation===true){ //if fullValidation flag is active
            if(treeToFormula(this.formulaTree, 0) !== this.proof[this.proof.length-1].getProposition()){ //only check on fullValidation
                this.problemList.push("[Proof]: the last line does not match the given formula. The conclusion of your proof must result in the given formula being proven.");
                return false;
            }

            for(var i = 0; i < this.proof.length; i++){ //checks if each line is being used validly
                var currentLine = this.proof[i];
                var currentLineDeps = currentLine.getDependencies();
                var currentLineNumber  = Number(currentLine.getLineNum());
                var currentLineProposition = currentLine.getProposition();
                var currentRule = currentLine.getRule().toLowerCase();
                var currentRuleJustification = currentLine.getRuleDependencies();

                if(this._isLineBlank(currentLine)){
                    continue; //ignore completely blank lines
                }

                switch(currentRule){
                    case "assume":
                        if(currentLineDeps.length < 1 || currentLineDeps.length > 1 || Number(currentLineDeps[0]) !== currentLineNumber){
                            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. An assumption depends on itself (only).");
                            return false;
                        }else if(!this.assumeList.includes(currentLineNumber))
                            this.assumeList.push(currentLineNumber);
                        break;
                    case "andintro":
                        if(!this._andIntroCheck(currentLine))
                            return false;
                        break;
                    case "andelim":
                        if(!this._andElimCheck(currentLine))
                            return false;
                        break;
                    case "impintro": //discharges assumptions
                        if(!this._impIntroCheck(currentLine))
                            return false;
                        break;
                    case "impelim":
                        if(!this._impElimCheck(currentLine))
                            return false;
                        break;
                    case "orintro":
                        if(!this._orIntroCheck(currentLine))
                            return false;
                        break;
                    case "orelim": //discharges assumptions
                        if(!this._orElimCheck(currentLine))
                            return false;
                        break;
                    case "notintro":
                        if(!this._notIntroCheck(currentLine))
                            return false;
                        break;
                    case "notelim":
                        if(!this._notElimCheck(currentLine))
                            return false;
                        break;
                    case "raa": //discharges assumptions
                        if(!this._raaCheck(currentLine))
                            return false;
                        break;
                    case "efq":
                        if(!this._efqCheck(currentLine, i))
                            return false;
                        break;
                    default:
                        this._addProblemToProblemList(currentLineNumber, "You must select a rule from the options given.");
                        return false;
                }
            }
        }else{ //just validate the final line given
            var currentLine = this.proof[ this.proof.length - 1 ]; //last line
            var currentLineDeps = currentLine.getDependencies();
            var currentLineNumber  = Number(currentLine.getLineNum());
            var currentLineProposition = currentLine.getProposition();
            var currentRule = currentLine.getRule().toLowerCase();
            var currentRuleJustification = currentLine.getRuleDependencies();

            if(this._isLineBlank(currentLine)){
                this._addProblemToProblemList(currentLineNumber, "Completely blank rows are acceptable.");
                return true;
            }

            switch(currentRule){
                case "assume":
                    if(currentLineDeps.length < 1 || currentLineDeps.length > 1 || Number(currentLineDeps[0]) !== currentLineNumber){
                        this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. An assumption depends on itself (only).");
                        return false;
                    }else if(!this.assumeList.includes(currentLineNumber))
                        this.assumeList.push(currentLineNumber);
                    break;
                case "andintro":
                    if(!this._andIntroCheck(currentLine))
                        return false;
                    break;
                case "andelim":
                    if(!this._andElimCheck(currentLine))
                        return false;
                    break;
                case "impintro": //discharges assumptions
                    if(!this._impIntroCheck(currentLine))
                        return false;
                    break;
                case "impelim":
                    if(!this._impElimCheck(currentLine))
                        return false;
                    break;
                case "orintro":
                    if(!this._orIntroCheck(currentLine))
                        return false;
                    break;
                case "orelim": //discharges assumptions
                    if(!this._orElimCheck(currentLine))
                        return false;
                    break;
                case "notintro":
                    if(!this._notIntroCheck(currentLine))
                        return false;
                    break;
                case "notelim":
                    if(!this._notElimCheck(currentLine))
                        return false;
                    break;
                case "raa": //discharges assumptions
                    if(!this._raaCheck(currentLine))
                        return false;
                    break;
                case "efq":
                    if(!this._efqCheck(currentLine, i))
                        return false;
                    break;
                default:
                    this._addProblemToProblemList(currentLineNumber, "You must select a rule from the options given.");
                    return false;
            }
        }

        this.problemList.push("Proof is valid! Rule usage is valid, line dependencies are correct and all assumptions are discharged.");
        return true; //all assumptions discharged, line dependencies are correct and use of rules are valid; proof is valid
    }

    //------------------------SEQUENT INFERENCE RULES------------------------------------//

    /**
     * psuedo-private function check use of orElim rule.
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _orElimCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let prop = currentLine.getProposition();
        let deps = currentLine.getRuleDependencies();

        if(deps.length > 5 || deps.length < 5){ //does not have 5 justifications
            this._addProblemToProblemList(currentLineNumber, "∨-elim must reference exactly five proof lines.");
            return false;
        }else if(deps[4] >= currentLineNumber){ //any of the justifications are greater than the current line number
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }


        //first justification check
        let dep1line = this.proof[ this._getProofLineIndex(deps[0]) ]; //AvB
        let dep1prop = dep1line.getProposition();
        let dep1tree = new tombstone.Statement(dep1prop).tree["tree"][0];
        let dep1mainOp = dep1tree["name"];
        if(dep1mainOp !== "||"){ //not a disjunction
            this._addProblemToProblemList(currentLineNumber, "The first proof line referenced by ∨-elim must be a disjunction ('or' operation), such as A∨B.");
            return false;
        }

        //second justification check
        let dep1leftDisj  = treeToFormula(dep1tree["children"][1] , 0); //AvB is now A
        let dep2line = this.proof[ this._getProofLineIndex(deps[1]) ]; //A
        let dep2prop = dep2line.getProposition();
        let dep2rule = dep2line.getRule(); //assume
        if(dep1leftDisj !== dep2prop){ //left of the conjunction is not the first assumption
            this._addProblemToProblemList(currentLineNumber, "The second proof line referenced by ∨-elim must be an assumption of the left side of the disjunction. For example, from A∨B, this must be an assumption of A.");
            return false;
        }else if(dep2rule !== "assume"){ //second justification is not an assumption
            this._addProblemToProblemList(currentLineNumber, "The second proof line referenced is not an assumption. It must be an assumption so that it can be discharged by ∨-elim.");
            return false;
        }

        //third justification check
        let dep3line = this.proof[ this._getProofLineIndex(deps[2]) ]; //C
        let dep3prop = dep3line.getProposition();
        let dep3rule = dep3line.getRule(); //some inference rule
        if(dep3prop !== prop){ //this justification does not match the current line's proposition
            this._addProblemToProblemList(currentLineNumber, "The formula in the third proof line referenced by ∨-elim must be the same as the formula in the current line.");
            return false;
        }

        //fourth justification check
        let dep1rightDisj = treeToFormula(dep1tree["children"][0] , 0); //AvB is now B
        let dep4line = this.proof[ this._getProofLineIndex(deps[3]) ]; //B
        let dep4prop = dep4line.getProposition();
        let dep4rule = dep4line.getRule(); //assume
        if(dep1rightDisj !== dep4prop){ //does not match the right side of the disjunction 
            this._addProblemToProblemList(currentLineNumber, "The fourth proof line referenced by ∨-elim must be an assumption of the right side of the disjunction. For example, from A∨B, this must be an assumption of B.");
            return false;
        }else if(dep4rule !== "assume"){ //rule for 4th justification is not an assumption
            this._addProblemToProblemList(currentLineNumber, "The fourth proof line referenced is not an assumption. It must be an assumption so that it can be discharged by ∨-elim.");
            return false;
        }


        //fifth justification check
        let dep5line = this.proof[ this._getProofLineIndex(deps[4]) ]; //C
        let dep5prop = dep5line.getProposition();
        let dep5rule = dep5line.getRule(); //some inference rule
        if(dep5prop !== prop){ //this justification does not match the current line's proposition
            this._addProblemToProblemList(currentLineNumber, "The formula in the fifth proof line referenced by ∨-elim must be the same as the formula in the current line.");
            return false;
        }


        //---------------------LINE DEP CHECKS-----------------------------//
        let gammaDeps = dep1line.getDependencies().sort();    //Gamma
        let dep2deps  = dep2line.getDependencies().sort();    //l
        let dep3deps  = dep3line.getDependencies().sort();    //{l} union Delta
        let dep4deps  = dep4line.getDependencies().sort();    //n
        let dep5deps  = dep5line.getDependencies().sort();    //{n} union Sigma
        let currDeps  = currentLine.getDependencies().sort(); //Gamma union Delta union Sigma

        //check if the 3rd reference line does not depend on the 2nd reference line (i.e. they do not form a sequent)
        if(!dep3deps.includes( dep2line.getLineNum().toString() )){
            this._addProblemToProblemList(currentLineNumber, "To use ∨-elim, the second and third proof lines referenced should form a sequent. The formula in the third line referenced must depend on the assumption in the second line referenced.");
            return false;
        }

        //check if the 5th reference line does not depend on the 4th reference line (i.e. they do not form a sequent)
        if(!dep5deps.includes( dep4line.getLineNum().toString() )){
            this._addProblemToProblemList(currentLineNumber, "To use ∨-elim, the fourth and fifth proof lines referenced should form a sequent. The formula in the fifth line referenced must depend on the assumption in the fourth line referenced.");
            return false;
        }

        //get Delta from {l, Delta}
        let tempDeps = dep2deps.concat(dep3deps);
        let removeIndexes = []; //list of indexes to remove from tempDeps
        for(var i=0; i<tempDeps.length; i++){ //list of indexes to remove from 
            for(var j=i+1; j<tempDeps.length; j++){
                if(tempDeps[i] === tempDeps[j]){
                    removeIndexes.push(i);
                    removeIndexes.push(j);
                }
            }
        }
        var deltaDeps = [];
        for(var i=0; i<tempDeps.length; i++){//remove duplicates
            if(removeIndexes.includes(i))
                continue;
            deltaDeps.push(tempDeps[i]);
        }

        //get Sigma from {n, Sigma}
        tempDeps = dep4deps.concat(dep5deps);
        removeIndexes = []; //list of indexes to remove from tempDeps
        for(var i=0; i<tempDeps.length; i++){ //list of indexes to remove from 
            for(var j=i+1; j<tempDeps.length; j++){
                if(tempDeps[i] === tempDeps[j]){
                    removeIndexes.push(i);
                    removeIndexes.push(j);
                }
            }
        }
        var sigmaDeps = [];
        for(var i=0; i<tempDeps.length; i++){//remove duplicates
            if(removeIndexes.includes(i))
                continue;
            sigmaDeps.push(tempDeps[i]);
        }

        //combine all greek sets and check if the user has the same
        var greekSet = gammaDeps.concat(deltaDeps.concat(sigmaDeps)).sort();
        greekSet = new Set(greekSet);
        currDeps = new Set(currDeps);

        //if the line dependencies are incorrect then check if the assumptions are included. If not, display generic error message.
        if(!this._areSetsEqual(greekSet, currDeps)){
            if(currDeps.has( dep2line.getLineNum().toString() )){ //if first assumption line number is in current line's line deps
                this._addProblemToProblemList(currentLineNumber, "The dependencies should not include the assumption in the second proof line referenced. This assumption should be discharged by ∨-elim.");
                return false;
            }else if(currDeps.has( dep4line.getLineNum().toString() )){ //if second assumption line number is in current line's line deps
                this._addProblemToProblemList(currentLineNumber, "The dependencies should not include the assumption in the fourth proof line referenced. This assumption should be discharged by ∨-elim.");
                return false;
            }
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. The dependencies should consist of those for the disjunction (in the first proof line referenced) together with any additional assumptions used in deducing the conclusion (in the third and fifth proof lines referenced) from the two disjuncts (in the second and fourth proof lines referenced).");
            return false;
        }
        //-----------------------END OF LINE DEP CHECK---------------------//

        //rule has been used validly - now discharge dep[1] and dep[3] assumptions
        var index  = this.assumeList.indexOf(dep2line.getLineNum());
        if(index !== -1)
            this.assumeList.splice(index, 1);

        index = this.assumeList.indexOf(dep4line.getLineNum());
        if(index !== -1)
            this.assumeList.splice(index, 1);

        return true;
    }

    /**
     * psuedo-private function check use of RAA. Takes in assumed negated line, checks if F is deduced from it, and checks if current line is "unnegated" version of assumption
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _raaCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let prop = currentLine.getProposition(); //A
        let deps = currentLine.getRuleDependencies(); //2,3

        if(deps.length > 2 || deps.length < 2){ //raa can only have 2 justifications
            this._addProblemToProblemList(currentLineNumber, "RAA must reference exactly two proof lines.");
            return false;
        }else if(deps[0] >= currentLineNumber || deps[1] >= currentLineNumber){ //trying to use lines as justification that come after the current line
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }else if(deps[0] >= deps[1]){ //first justification comes after the second justification
            this._addProblemToProblemList(currentLineNumber, "The first proof line referenced by RAA (a negated assumption) must occur before the second (falsum).");
            return false;
        }

        
        let dep1line = this.proof[ this._getProofLineIndex(deps[0]) ]; //~A
        let dep1prop = dep1line.getProposition();
        let dep1tree = new tombstone.Statement(dep1prop).tree["tree"][0];
        let dep1mainOp = dep1tree["name"]; //"~"

        if(dep1mainOp !== "~"){ //first justification is not a negation
            this._addProblemToProblemList(currentLineNumber, "The formula in the first proof line referenced by RAA must be a negation.");
            return false;
        }

        
        let removedNotDep1 = treeToFormula(dep1tree["children"][0], 0); //remove ¬ from the negated proposition. So ¬A is now A

        if(dep1line.getRule() !== "assume"){ //first justification is not an assumption
            this._addProblemToProblemList(currentLineNumber, "The first proof line referenced is not an assumption. It must be an assumption so that it can be discharged by RAA.");
            return false;
        }else if(removedNotDep1 !== prop){ //current line is not unnegated version of justification
            this._addProblemToProblemList(currentLineNumber, "The formula in the first proof line referenced by RAA must be the negation of the formula in the current line.");
            return false;
        }


        let dep2line = this.proof[ this._getProofLineIndex(deps[1]) ];
        let dep2prop = dep2line.getProposition();
        let dep2rule = dep2line.getRule();

        if(dep2prop !== "F"){
            this._addProblemToProblemList(currentLineNumber, "The formula in the second proof line referenced by RAA must be falsum (⊥).");
            return false;
        }else if(dep2rule === "assume"){
            this._addProblemToProblemList(currentLineNumber, "To use RAA, the two proof lines referenced should form a sequent. The formula in the second line referenced must depend on the assumption in the first line referenced. The dependencies should not include the assumption in the first proof line referenced. This assumption should be discharged by RAA.");
            return false;
        }


        //check line dependencies
        let dep1deps        = dep1line.getDependencies().sort();    //1,2
        let dep2deps        = dep2line.getDependencies().sort();    //1,2,5,6
        let currentLineDeps = currentLine.getDependencies().sort(); //5,6
        let tempDeps        = dep1deps.concat(dep2deps); //list for final comparison
        let removeIndexes   = []; //list of indexes to remove from tempDeps

        //check if the 2nd reference line does not depend on the 1st reference line (i.e. they do not form a sequent)
        if(!dep2deps.includes( dep1line.getLineNum().toString() )){
            this._addProblemToProblemList(currentLineNumber, "To use RAA, the two proof lines referenced should form a sequent. The formula in the second line referenced must depend on the assumption in the first line referenced.");
            return false;
        }

        for(var i=0; i<tempDeps.length-1; i++){ //find indexes that are duplicates
            for(var j=i+1; j<tempDeps.length; j++){
                if(tempDeps[i] === tempDeps[j]){
                    removeIndexes.push(i);
                    removeIndexes.push(j);
                }
            }
        }

        let newDeps = [];
        for(var i=0; i<tempDeps.length; i++){ //remove duplicates
            if(removeIndexes.includes(i)) continue;
            newDeps.push(tempDeps[i]);
        }

        newDeps = new Set(newDeps);
        currentLineDeps = new Set(currentLineDeps);
        if(!this._areSetsEqual(newDeps, currentLineDeps)){
            //check if the first line referenced is included in teh dependencies
            if(currentLineDeps.has( dep1line.getLineNum().toString() )){ //if first assumption line number is in current line's line deps
                this._addProblemToProblemList(currentLineNumber, "The dependencies should not include the assumption in the first proof line referenced. This assumption should be discharged by RAA.");
                return false;
            }
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. The dependencies should consist of any additional assumptions used in deducing falsum (in the second proof line referenced) from the negated assumption (in the first proof line referenced).");
            return false;
        }


        //discharge assumption from first justification
        const index = this.assumeList.indexOf(dep1line.getLineNum());
        if(index !== -1)
            this.assumeList.splice(index, 1);

        return true;
    }

    /**
     * psuedo-private function check use of impIntro. Takes assumption A and introduces B. This discharges the assumption A.
     * A must be an assumption and B must be the product of inference rule usage
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _impIntroCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let deps = currentLine.getRuleDependencies();
        let prop = currentLine.getProposition();
        let tree = new tombstone.Statement(prop).tree["tree"][0];
        let mainOperation = tree["name"];

        if(mainOperation !== "->"){
            this._addProblemToProblemList(currentLineNumber, "The formula in the current line must be an implication.");
            return false;
        }else if(deps.length > 2 || deps.length < 2){
            this._addProblemToProblemList(currentLineNumber, "→-intro must reference exactly two proof lines.");
            return false;
        }else if(deps[0] >= currentLineNumber  ||  deps[1] >= currentLineNumber){
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }


        let antecedent = treeToFormula(tree["children"][1], 0); //"A"
        let consequent = treeToFormula(tree["children"][0], 0); //"B"
        let dep1line = this.proof[ this._getProofLineIndex(deps[0]) ];
        let dep1prop = dep1line.getProposition();
        let dep1rule = dep1line.getRule();
        let dep2line = this.proof[ this._getProofLineIndex(deps[1]) ];
        let dep2prop = dep2line.getProposition();
        let dep2rule = dep2line.getRule();


        if(antecedent !== dep1prop){ //(A)->B  !== A
            this._addProblemToProblemList(currentLineNumber, "The formula in the first proof line referenced by →-intro must be the same as the left side of the implication in the current line.");
            return false;
        }else if(consequent !== dep2prop){ //A->(B) !== B
            this._addProblemToProblemList(currentLineNumber, "The formula in the second proof line referenced by →-intro must be the same as the right side of the implication in the current line.");
            return false;
        }else if(dep1rule !== "assume"){ //antecedent is not an assumption
            this._addProblemToProblemList(currentLineNumber, "The first proof line referenced is not an assumption. It must be an assumption so that it can be discharged by →-intro.");
            return false;
        }else if(dep2rule === "assume"){ //consequent is not an inference rule
            //A->A on its own assumption line is a valid proof, so we use this:
            if(dep1line.getLineNum() !== dep2line.getLineNum()){
                this._addProblemToProblemList(currentLineNumber, "To use →-intro, the two proof lines referenced should form a sequent. The formula in the second line referenced must depend on the assumption in the first line referenced. The dependencies should not include the assumption in the first proof line referenced. This assumption should be discharged by →-intro.");
                return false;
            }
        }

        //line dependency checks
        let dep1deps        = dep1line.getDependencies().sort();    //1,2
        let dep2deps        = dep2line.getDependencies().sort();    //1,2,5,6
        let currentLineDeps = currentLine.getDependencies().sort(); //5,6
        let tempDeps        = dep2deps; //list for final comparison
        let removeIndexes   = []; //list of indexes to remove from tempDeps

        //check if the 2nd reference line does not depend on the 1st reference line (i.e. they do not form a sequent)
        if(!dep2deps.includes( dep1line.getLineNum().toString() )){
            this._addProblemToProblemList(currentLineNumber, "To use →-intro, the two proof lines referenced should form a sequent. The formula in the second line referenced must depend on the assumption in the first line referenced.");
            return false;
        }

        for(var i=0; i<dep1deps.length; i++){
            for(var j=0; j<tempDeps.length; j++){
                if(dep1deps[i] === tempDeps[j]){
                    tempDeps.splice(j,1);       //remove any duplicates from tempDeps that are in dep1deps
                    j--;
                }
            }
        }

        if( !this._areArraysEqual(tempDeps, currentLineDeps) ){ //check if correct dependencies are what the user has
            //check if the first line referenced is included in teh dependencies
            if(currentLineDeps.includes( dep1line.getLineNum().toString() )){ //if first assumption line number is in current line's line deps
                this._addProblemToProblemList(currentLineNumber, "The dependencies should not include the assumption in the first proof line referenced. This assumption should be discharged by →-intro.");
                return false;
            }
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. The dependencies should consist of any additional assumptions used in deducing the conclusion (in the second proof line referenced) from the assumption (in the first proof line referenced).");
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
     * @return {boolean} isValid
     */
    _efqCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let deps = currentLine.getRuleDependencies(); //4

        if(deps.length > 1 || deps.length < 1){ //too many or too little rule justifications
            this._addProblemToProblemList(currentLineNumber, "⊥-elim has a single premiss; it must reference exactly one proof line.");
            return false;
        }else if(deps[0] >= currentLineNumber){ //attempting to use justification that has not yet been deduced
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }

        //check if justifcation is Falsum
        let depLine = this.proof[ this._getProofLineIndex(deps[0]) ]; //F
        let depProp = depLine.getProposition();
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        if(depTree["name"] !== "F"){
            this._addProblemToProblemList(currentLineNumber, "The formula in the proof line referenced by ⊥-elim must be falsum (⊥).");
            return false;
        }

        //check line dependencies
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. They should be the same as for the premiss.");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of notIntro rule is valid e.g. A->F | ¬A
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _notIntroCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let deps = currentLine.getRuleDependencies(); //3
        let prop = currentLine.getProposition(); //~A
        let tree = new tombstone.Statement(prop).tree["tree"][0];

        if(deps.length > 1 || deps.length < 1){ //too many or too little rule justifications
            this._addProblemToProblemList(currentLineNumber, "¬-intro has a single premiss; it must reference exactly one proof line.");
            return false;
        }else if(deps[0] >= currentLineNumber){
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }else if(tree["name"] !== "~"){ //first operation is not a negation
            this._addProblemToProblemList(currentLineNumber, "To use ¬-intro, the formula in the current line must be a negation.");
            return false;
        }

        let notProp = treeToFormula(tree["children"][0] , 0); //A


        let depLine = this.proof[ this._getProofLineIndex(deps[0]) ];
        let depProp = depLine.getProposition(); //"A->F"
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        let depOper = depTree["name"]; //"->"
        let depLeftProp  = treeToFormula(depTree["children"][1] , 0); //"A"
        let depRightProp = treeToFormula(depTree["children"][0] , 0); //"F"

        if(depOper !== "->"){ //justification proposition is not an implication
            this._addProblemToProblemList(currentLineNumber, "The formula in the proof line referenced by ¬-intro must be an implication to falsum.");
            return false;
        }else if(depLeftProp !== notProp){ //(A)->F !== A
            this._addProblemToProblemList(currentLineNumber, "To use ¬-intro, the formula in the current line must be the negation of the left side of the formula in the proof line referenced.");
            return false;
        }else if(depRightProp !== "F"){    //A->(F) !== F
            this._addProblemToProblemList(currentLineNumber, "The formula in the proof line referenced by ¬-intro must be an implication to falsum.");
            return false;
        }

        //check line dependencies
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. They should be the same as for the premiss.");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of notElim rule is valid e.g. ¬A | A->F
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _notElimCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let deps = currentLine.getRuleDependencies(); //[3]
        let prop = currentLine.getProposition(); //"A->F"
        let tree = new tombstone.Statement(prop).tree["tree"][0];

        if(deps.length > 1 || deps.length < 1){ //too many or too little rule justifications
            this._addProblemToProblemList(currentLineNumber, "¬-elim has a single premiss; it must reference exactly one proof line.");
            return false;
        }else if(deps[0] >= currentLineNumber){
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }else if(tree["name"] !== "->"){ //first operation is not an implication i.e. A->F
            this._addProblemToProblemList(currentLineNumber, "To use ¬-elim, the formula in the current line must be an implication to falsum.");
            return false;
        }


        let leftProp  = treeToFormula(tree["children"][1] , 0); //A
        let rightProp = treeToFormula(tree["children"][0] , 0); //F
        if(rightProp !== "F"){ //A->(F) !== "F"
            this._addProblemToProblemList(currentLineNumber, "¬-elim must result in an implication where the consequent (right of the arrow) is falsum, e.g: A->F");
            return false;
        }

        //justification line referencing
        let depLine = this.proof[ this._getProofLineIndex(deps[0]) ];
        let depProp = depLine.getProposition(); //"~A"
        let depTree = new tombstone.Statement(depProp).tree["tree"][0]; //~A treeObj
        let depOper = depTree["name"]; //"~"
        if(depOper !== "~"){ //operation on justification line is not negation
            this._addProblemToProblemList(currentLineNumber, "The formula in the proof line referenced by ¬-elim must be a negation.");
            return false;
        }

        let notDepProp = treeToFormula(depTree["children"][0] , 0); //"A"
        if(notDepProp !== leftProp){ //(A)->F !== "A"
            this._addProblemToProblemList(currentLineNumber, "The formula in the proof line referenced by ¬-elim must be the negation of the left side of the formula in the current line.");
            return false;
        }

        //check line dependencies
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. They should be the same as for the premiss.");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of impElim1 rule is valid e.g. A  A->B | B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _impElimCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let deps = currentLine.getRuleDependencies(); //3,2
        let prop = currentLine.getProposition(); // B

        if(deps.length < 2 || deps.length > 2){//not 2 rule justifications
            this._addProblemToProblemList(currentLineNumber, "→-elim has two premises; it must reference exactly two proof lines.");
            return false;
        }else if(deps[0] >= currentLineNumber || deps[1] >= currentLineNumber){ //references a line after this line in the proof (cannot occur)
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }

        let dep2line = this.proof[ this._getProofLineIndex(deps[1]) ];; //A->B
        let dep2prop = dep2line.getProposition();
        let dep2tree = new tombstone.Statement(dep2prop).tree["tree"][0];
        let dep2op   = dep2tree["name"]; //->

        if(dep2op !== "->"){
            this._addProblemToProblemList(currentLineNumber, "The formula in the second proof line referenced by →-elim must be an implication.");
            return false;
        }

        let dep2prop1 = treeToFormula(dep2tree["children"][1], 0); //A
        let dep2prop2 = treeToFormula(dep2tree["children"][0], 0); //B
        let dep1      = this.proof[ this._getProofLineIndex(deps[0]) ];; //A
        let dep1prop  = dep1.getProposition();

        if(dep1prop !== dep2prop1){ //A !== A
            this._addProblemToProblemList(currentLineNumber, "The formula in the first proof line referenced by →-elim must be the same as the left side of the formula in the second line referenced.");
            return false;   
        }else if(prop !== dep2prop2){ //B !== B
            this._addProblemToProblemList(currentLineNumber, "this line's proposition does not match the right-side of the implication in your 1st justification. Rule usage: A A->B | B");
            return false;
        }

        //check line dependencies
        let dep1deps = dep1.getDependencies();
        let dep2deps = dep2line.getDependencies();
        let justificationDeps = [];
        for(var i=0; i<dep1deps.length; i++)
            justificationDeps.push(dep1deps[i]);
        for(var i=0; i<dep2deps.length; i++)
            justificationDeps.push(dep2deps[i]);

        justificationDeps   = new Set(justificationDeps);
        let currentLineDeps = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(justificationDeps, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. They should consist of all dependencies of the two premises.");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of orIntro1 rule is valid e.g. A | AvB
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _orIntroCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let deps = currentLine.getRuleDependencies(); //4
        let prop = currentLine.getProposition(); // AvB
        let tree = new tombstone.Statement(prop).tree["tree"][0];
        let mainOperation = tree["name"]; //"||"
        let rightProp = treeToFormula(tree["children"][0], 0); //B
        let leftProp  = treeToFormula(tree["children"][1], 0); //A

        if(mainOperation !== "||"){ //first operation of proposition is SOMEHOW not ||
            this._addProblemToProblemList(currentLineNumber, "To use ∨-intro, the formula in the current line must be a disjunction ('or' operation), such as A ∨ B.");
            return false;
        }else if(deps.length > 1 || deps.length < 1){ //eg orIntro 1,2,3
            this._addProblemToProblemList(currentLineNumber, "∨-intro has a single premiss; it must reference exactly one proof line.");
            return false;
        }else if(deps[0] >= currentLineNumber){ //justification values are beyond the current line number in proof
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }else{ //operation is disjunction && there is 1 justification value: check if left or right symbol === justification line symbol
            let justificationProp = this.proof[ this._getProofLineIndex(deps[0]) ].getProposition(); //A
            if(leftProp !== justificationProp && rightProp !== justificationProp){
                this._addProblemToProblemList(currentLineNumber, "To use ∨-intro, the formula in the current line must be a disjunction in which one of the disjuncts is the formula in the proof line referenced.");
                return false;
            }
        }

        //check line dependencies
        let depLine = this.proof[ this._getProofLineIndex(deps[0]) ];
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. They should be the same as for the premiss.");
            return false;
        }

        return true;
    }

    /**
     * psuedo-private function check use of andElim1 rule is valid E.g: andElim(A & B) concludes to A or B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _andElimCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let deps = currentLine.getRuleDependencies(); //3
        let prop = currentLine.getProposition(); //"A"

        if(deps.length > 1 || deps.length < 1){
            this._addProblemToProblemList(currentLineNumber, "∧-elim has a single premiss; it must reference exactly one proof line.");
            return false;
        }else if(deps[0] >= currentLine.getLineNum()){
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }

        let depLine = this.proof[ this._getProofLineIndex(deps[0]) ];
        let depProp = depLine.getProposition(); //A&B
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        let depTreeLeftProposition   = depTree["children"][1]; //A&B gives A
        let depTreeRightProposition  = depTree["children"][0]; //A&B gives B
        let depOperation = depTree["name"]; //"&"

        if(depOperation !== "&"){
            this._addProblemToProblemList(currentLineNumber, "The formula in the proof line referenced by ∧-elim must be a conjunction ('and' operation), such as A ∧ B.");
            return false;
        }else if(treeToFormula(depTreeLeftProposition, 0) !== prop && treeToFormula(depTreeRightProposition, 0) !== prop){ //line in proof doesn't match with justification line
            this._addProblemToProblemList(currentLineNumber, "To use ∧-elim, the formula in the current line must be the same as one of the two sides in the conjunction in the proof line referenced.");
            return false;
        }

        //check line dependencies
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. They should be the same as for the premiss.");
            return false;
        }

        return true;
    }
    
    /**
     * psuedo-private function check use of andIntro rule is valid for use to be valid the conclusion must use existing premises/assumptions. E.g: andintro1(A,B) concludes to A^B
     * @param {Object.ProofLine} currentLine - Line as ProofLine object
     * @return {boolean} isValid
     */
    _andIntroCheck(currentLine){
        let currentLineNumber = Number(currentLine.getLineNum());
        let deps = currentLine.getRuleDependencies();
        let prop = currentLine.getProposition(); // A&B
        let tree = new tombstone.Statement(prop).tree["tree"][0];
        let mainOperation = tree["name"]; //"&"
        let leftProp  = treeToFormula(tree["children"][1], 0); //A
        let rightProp = treeToFormula(tree["children"][0], 0); //B

        if(mainOperation !== "&"){ //first operation of proposition is SOMEHOW not &
            this._addProblemToProblemList(currentLineNumber, "To use ∧-intro, the formula in the current line must be a conjunction ('and' operation), such as A ∧ B.");
            return false;
        }else if(deps.length > 2 || deps.length < 2){ //eg &-intro 1,2,3
            this._addProblemToProblemList(currentLineNumber, "∧-intro has two premises; it must reference exactly two proof lines.");
            return false;
        }else if(deps[0] >= currentLineNumber || deps[1] >= currentLineNumber){ //justification values are beyond the current line number in proof
            this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
            return false;
        }else{ //operation is conjuction && there are 2 justification values
            var lineDepsToCheck = []; //array of sets of line dependencies of given justifications
            for(var i=0; i < deps.length; i++){
                let currentJustificationLineNumber = deps[i];
                let currentJustificationProp = this.proof[ this._getProofLineIndex( currentJustificationLineNumber ) ].getProposition();

                if(currentJustificationLineNumber >= currentLineNumber){
                    this._addProblemToProblemList(currentLineNumber, "When using an inference rule, you can only reference proof lines above the current line.");
                    return false;
                }else if((i===0 && leftProp!==currentJustificationProp) || (i===1 && rightProp!==currentJustificationProp)){//left isn't correct OR right isn't correct
                    this._addProblemToProblemList(currentLineNumber, "The formula in the first proof line referenced by ∧-intro must be the same as the left side (first conjunct) of the formula in the current line. The formula in the second proof line referenced by ∧-intro must be the same as the right side (second conjunct) of the formula in the current line.");
                    return false;
                }

                //add to set of justification line dependencies
                let currentJustificationLineDependencies = this.proof[ this._getProofLineIndex( currentJustificationLineNumber ) ].getDependencies();
                for(var j=0; j<currentJustificationLineDependencies.length; j++){
                    lineDepsToCheck.push(currentJustificationLineDependencies[j]);
                }
            }

            lineDepsToCheck = new Set(lineDepsToCheck); //justification deps
            let currentLineDeps = new Set(currentLine.getDependencies());
            if(!this._areSetsEqual(lineDepsToCheck, currentLineDeps)){
                this._addProblemToProblemList(currentLineNumber, "The dependencies are incorrect. They should consist of all dependencies of the two premises.");
                return false;
            }

            return true;
        }
    }



    //----------------------LOCAL FUNCTIONS---------------------------------------------//

    /**
     * psuedo-private function to get the proof line index from the given actual proof line
     * @param  {Number} lineNumber - the number that is presented by the user from their proof input
     * @return {Number} proofLineIndex - index of the given proof line from the user (-1 if not present)
     */
    _getProofLineIndex(lineNumber){
        lineNumber = Number(lineNumber);
        for(var i=0; i<this.proof.length; i++){
            var currLineNum = Number(this.proof[i].getLineNum());
            if(currLineNum === lineNumber)
                return i;
        }
        return -1;
    }

    /**
     * psuedo-private function to check javascript array equality
     * @param  {Array.Number} arr1 - first array
     * @param  {Array.Number} arr2 - second array
     * @return {boolean} isEqual
     */
    _areArraysEqual(arr1, arr2){
        if(arr1.length !== arr2.length) return false;
        for(var i=0; i<arr1.length; i++){
            if(arr1[i] !== arr2[i])
                return false;
        }
        return true;
    }

    /**
     * psuedo-private function to check javascript set equality
     * @param  {Set} set1 - first set
     * @param  {Set} set2 - second set
     * @return {boolean} isEqual
     */
    _areSetsEqual(set1, set2){
        if(set1.size !== set2.size) return false;
        else if(set1.size === 0 && set1.size === 0) return true;
        for(var val of set1)
            if(!set2.has(val)) return false;
        return true;
    }

    /**
     * psuedo-private function to add problem string to problemList
     * @param {number} lineNumber - line number of proof as ProofLine object (0 is valid)
     */
    _addProblemToProblemList(lineNumber, message){
        this.problemList.push("[Line "+ lineNumber +"]: " + message)
    }

    /**
     * psuedo-private function to check if a given ProofLine object is blank
     * @param {ProofLine} line - ProofLine object to be checked for being blank
     * @returns {boolean} isBlank - boolean to represent whether or not the given line is blank
     */
    _isLineBlank(line){
        var currentLineDeps          = line.getDependencies(); //array
        var currentLineProposition   = line.getProposition().replace(/ /g,''); //string
        var currentRule              = line.getRule().toLowerCase().replace(/ /g,''); //string
        var currentRuleJustification = line.getRuleDependencies(); //array

        return (currentLineDeps.length === 0 &&
                currentRuleJustification.length === 0 &&
                currentRule === "" &&
                currentLineProposition === ""); //true if line is completely empty
    }

    /**
     * psuedo-private function to change the dependency
     * @param {Array.String} line - ProofLine object to be checked for being blank
     * @returns {Array.Number} isBlank - boolean to represent whether or not the given line is blank
     */
}

//import ProofValidator from "proofValidator.js";
//var pv = new ProofValidator(formulaTree, proofData);
module.exports = ProofValidator;