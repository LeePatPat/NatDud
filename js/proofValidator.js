var treeToFormula = require('./treeToFormula.js');
var ProofLine = require('./proofLine.js');
var tombstone = require('./tombstone.min.js');


/** Class representing Proof Validator functionality */
class ProofValidator {
	/**
	 * construct validation of given proof a proof is valid iff all assumptions are discharged
     * @param {Array.Array+} proofTree  - Tree form of original logic formula
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

                if(this.fullValidation===true && i+1 === this.proof.length && currentLineDeps.length > 0){ //fullValidation && last line AND there are still line dependencies
                    this._addProblemToProblemList(currentLineNumber, "the last line in the proof should not have dependencies. All assumptions should be discharged using inference rules by the final line of the proof.");
                    return false;
                }else if(currentLineProposition.replace(/ /g,'') === ""){
                    this._addProblemToProblemList(currentLineNumber, "proof lines cannot be empty.");
                    return false;
                }

                switch(currentRule){
                    case "assume":
                        if(currentLineDeps.length < 1 || currentLineDeps.length > 1 || Number(currentLineDeps[0]) !== currentLineNumber){
                            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - the line dependency for an assumption must be itself.");
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
                        if(!this._orElimCheck(currentLine)){
                            this._addProblemToProblemList(currentLineNumber, "\nRule usage: A∨B  A⊢C  B⊢C  |  C\n From the example of usage above - to use orElim: have a disjunction (A∨B); assume the left of the disjunction (A), deduce what you need from said assumption (A⊢C); assume the right of the disjunction (B), deduce what you need from said disjunction (B⊢C). As a result, both assumptions are discharged and you can now use C in your proof.");
                            return false;
                        }
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

            switch(currentRule){
                case "assume":
                    if(currentLineDeps.length < 1 || currentLineDeps.length > 1 || Number(currentLineDeps[0]) !== currentLineNumber){
                        this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - the line dependency for an assumption must be itself.");
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
                    if(!this._orElimCheck(currentLine)){
                        this._addProblemToProblemList(currentLineNumber, "\nRule usage: A∨B  A⊢C  B⊢C  |  C\n From the example of usage above - to use orElim: have a disjunction (A∨B); assume the left of the disjunction (A), deduce what you need from said assumption (A⊢C); assume the right of the disjunction (B), deduce what you need from said disjunction (B⊢C). As a result, both assumptions are discharged and you can now use C in your proof.");
                        return false;
                    }
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

        //check assumptions are discharged only when fullValidation flag is active
        if(this.fullValidation===true && this.assumeList.length > 0)
            return false;

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
            this._addProblemToProblemList(currentLineNumber, "∨-elim must have exactly 5 rule justifications.");
            return false;
        }else if(deps[0] > deps[1] || deps[1] > deps[2] || deps[2] > deps[3] || deps[3] > deps[4]){ //justifications not in correct order
            this._addProblemToProblemList(currentLineNumber, "the rule justifications are not in order; they must be in ascending order. E.g. 1,2,3,4,5");
            return false;
        }else if(deps[4] >= currentLineNumber){ //any of the justifications are greater than the current line number
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }


        //first justification check
        let dep1line = this.proof[ this._getProofLineIndex(deps[0]) ]; //AvB
        let dep1prop = dep1line.getProposition();
        let dep1tree = new tombstone.Statement(dep1prop).tree["tree"][0];
        let dep1mainOp = dep1tree["name"];
        if(dep1mainOp !== "||"){ //not a disjunction
            this._addProblemToProblemList(currentLineNumber, "the first justification of ∨-elim must be a disjunction ('or' operation). E.g. A∨B");
            return false;
        }

        //second justification check
        let dep1leftDisj  = treeToFormula(dep1tree["children"][1] , 0); //AvB is now A
        let dep2line = this.proof[ this._getProofLineIndex(deps[1]) ]; //A
        let dep2prop = dep2line.getProposition();
        let dep2rule = dep2line.getRule(); //assume
        if(dep1leftDisj !== dep2prop){ //left of the conjunction is not the first assumption
            this._addProblemToProblemList(currentLineNumber, "the second justification must be an assumption of the left-side of the disjunction (e.g. From A∨B, the assumption must be A).");
            return false;
        }else if(dep2rule !== "assume"){ //second justification is not an assumption
            this._addProblemToProblemList(currentLineNumber, "the second justification is not an assumption. This must be an assumption so that it can be discharged by ∨-elim.");
            return false;
        }

        //third justification check
        let dep3line = this.proof[ this._getProofLineIndex(deps[2]) ]; //C
        let dep3prop = dep3line.getProposition();
        let dep3rule = dep3line.getRule(); //some inference rule
        if(dep3prop !== prop){ //this justification does not match the current line's proposition
            this._addProblemToProblemList(currentLineNumber, "the third justification proposition must match the current line's proposition. This is so the assumption from the 2nd justiciation can be discharged.");
            return false;
        }
        // else if(dep3rule === "assume"){ //the rule for the 3rd justification is an assumption
        //     this._addProblemToProblemList(currentLineNumber, "the third justification cannot be an assumption. This is not a legitimate way of discharging the 2nd justification assumption, and therefore must be the product of inference rule usage.");
        //     return false;
        // }

        //fourth justification check
        let dep1rightDisj = treeToFormula(dep1tree["children"][0] , 0); //AvB is now B
        let dep4line = this.proof[ this._getProofLineIndex(deps[3]) ]; //B
        let dep4prop = dep4line.getProposition();
        let dep4rule = dep4line.getRule(); //assume
        if(dep1rightDisj !== dep4prop){ //does not match the right side of the disjunction 
            this._addProblemToProblemList(currentLineNumber, "the fourth justification must be an assumption of the right-side of the disjunction (e.g. From A∨B, the assumption must be B).");
            return false;
        }else if(dep4rule !== "assume"){ //rule for 4th justification is not an assumption
            this._addProblemToProblemList(currentLineNumber, "the fourth justification is not an assumption. This must be an assumption so that it can be discharged by ∨-elim.");
            return false;
        }


        //fifth justification check
        let dep5line = this.proof[ this._getProofLineIndex(deps[4]) ]; //C
        let dep5prop = dep5line.getProposition();
        let dep5rule = dep5line.getRule(); //some inference rule
        if(dep5prop !== prop){ //this justification does not match the current line's proposition
            this._addProblemToProblemList(currentLineNumber, "the fifth justification proposition must match the current line's proposition. This is so the assumption from the 4th justiciation can be discharged.");
            return false;
        }
        // else if(dep5rule === "assume"){ //rule for 5th justification is an assumption 
        //     this._addProblemToProblemList(currentLineNumber, "the fifth justification cannot be an assumption. This is not a legitimate way of discharging the 4th justification assumption, and therefore must be the product of inference rule usage.");
        //     return false;
        // }

        //---------------------LINE DEP CHECKS-----------------------------//
        let gammaDeps = dep1line.getDependencies().sort();    //Gamma
        let dep2deps  = dep2line.getDependencies().sort();    //l
        let dep3deps  = dep3line.getDependencies().sort();    //{l} union Delta
        let dep4deps  = dep4line.getDependencies().sort();    //n
        let dep5deps  = dep5line.getDependencies().sort();    //{n} union Sigma
        let currDeps  = currentLine.getDependencies().sort(); //Gamma union Delta union Sigma

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
            if(removeIndexes.includes(i)) continue;
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
            if(removeIndexes.includes(i)) continue;
            sigmaDeps.push(tempDeps[i]);
        }

        //combine all greek sets and check if the user has the same
        var greekSet = gammaDeps.concat(deltaDeps.concat(sigmaDeps)).sort();
        greekSet = new Set(greekSet);
        currDeps = new Set(currDeps);
        if(!this._areSetsEqual(greekSet, currDeps)){
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - each of your assumptions used as a rule justification on this line must have their dependencies discharged.");
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
            this._addProblemToProblemList(currentLineNumber, "RAA must have exactly 2 rule justifications. Rule usage: ¬A ⊢ F  | A   'F deduced from ¬A produces A'");
            return false;
        }else if(deps[0] >= currentLineNumber || deps[1] >= currentLineNumber){ //trying to use lines as justification that come after the current line
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else if(deps[0] >= deps[1]){ //first justification comes after the second justification
            this._addProblemToProblemList(currentLineNumber, "to use RAA, you must deduce Falsum (F) from the a negated assumption. This means that the negated assumption (e.g. ¬A) must come before falsum in the proof. Rule usage: ¬A ⊢ F | A   'F deduced from ¬A produces A'");
            return false;
        }

        
        let dep1line = this.proof[ this._getProofLineIndex(deps[0]) ]; //~A
        let dep1prop = dep1line.getProposition();
        let dep1tree = new tombstone.Statement(dep1prop).tree["tree"][0];
        let dep1mainOp = dep1tree["name"]; //"~"

        if(dep1mainOp !== "~"){ //first justification is not a negation
            this._addProblemToProblemList(currentLineNumber, "the first justification of RAA must be a negation. E.g. ¬A. Rule usage: ¬A ⊢ F | A   'F deduced from ¬A produces A'");
            return false;
        }

        
        let removedNotDep1 = treeToFormula(dep1tree["children"][0], 0); //remove ¬ from the negated proposition. So ¬A is now A

        if(dep1line.getRule() !== "assume"){ //first justification is not an assumption
            this._addProblemToProblemList(currentLineNumber, "the first justification must be an assumption. Rule usage: ¬A ⊢ F | A   'F deduced from ¬A produces A'");
            return false;
        }else if(removedNotDep1 !== prop){ //current line is not unnegated version of justification
            this._addProblemToProblemList(currentLineNumber, "the current line must be a non-negated form of the first justification. Rule usage: ¬A ⊢ F | A   'F deduced from ¬A produces A'");
            return false;
        }


        let dep2line = this.proof[ this._getProofLineIndex(deps[1]) ];
        let dep2prop = dep2line.getProposition();
        let dep2rule = dep2line.getRule();

        if(dep2prop !== "F"){
            this._addProblemToProblemList(currentLineNumber, "your second justification must be falsum (F). Rule usage:  ¬A ⊢ F | A   'F deduced from ¬A produces A'");
            return false;
        }else if(dep2rule === "assume"){
            this._addProblemToProblemList(currentLineNumber, "your second justification cannot be an assumption. You must derive falsum from the use of inference rules from the assumption. Rule usage:  ¬A ⊢ F | A   'F deduced from ¬A produces A'");
            return false;
        }


        //check line dependencies
        let dep1deps        = dep1line.getDependencies().sort();    //1,2
        let dep2deps        = dep2line.getDependencies().sort();    //1,2,5,6
        let currentLineDeps = currentLine.getDependencies().sort(); //5,6
        let tempDeps        = dep1deps.concat(dep2deps); //list for final comparison
        let removeIndexes   = []; //list of indexes to remove from tempDeps
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
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for the RAA: remove the dependencies of the assumption justification from the second justification's dependencies.");
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
            this._addProblemToProblemList(currentLineNumber, "you have used →-intro but have not introduced an implication. Rule usage: A  B | A->B");
            return false;
        }else if(deps.length > 2 || deps.length < 2){
            this._addProblemToProblemList(currentLineNumber, "→-intro must have exactly 2 rule justifications. Rule usage: A B | A->B");
            return false;
        }else if(deps[0] >= currentLineNumber  ||  deps[1] >= currentLineNumber){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
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
            this._addProblemToProblemList(currentLineNumber, "justification values are not correct. The antecedent (left-side) of your implication does not correspond to the 1st justification line number you have given. E.g. '3,2' where 3 is the line number for the antecedent.");
            return false;
        }else if(consequent !== dep2prop){ //A->(B) !== B
            this._addProblemToProblemList(currentLineNumber, "justification values are not correct. The consequent (right-side) of your implication does not correspond to the 2nd justification line number you have given. E.g. '3,2' where 2 is the line number for the consequent.");
            return false;
        }else if(dep1rule !== "assume"){ //antecedent is not an assumption
            this._addProblemToProblemList(currentLineNumber, "the antecedent (left-side) of the implication you are trying to introduce must be an assumption. Ensure that you only use →-intro when using an assumption as the antecedent and a product of an inference rule as the consequent.");
            return false;
        }else if(dep2rule === "assume"){ //consequent is not an inference rule
            //A->A on its own assumption line is a valid proof, so we use this:
            if(dep1line.getLineNum() !== dep2line.getLineNum()){
                this._addProblemToProblemList(currentLineNumber, "the consequent (right-side) of the implication you are trying to introduce must be a product of an inference rule. Ensure that you only use →-intro when using an assumption as the antecedent and a product of an inference rule as the consequent.");
                return false;
            }
        }

        //line dependency checks
        let dep1deps        = dep1line.getDependencies().sort();    //1,2
        let dep2deps        = dep2line.getDependencies().sort();    //1,2,5,6
        let currentLineDeps = currentLine.getDependencies().sort(); //5,6
        let tempDeps        = dep2deps; //list for final comparison
        let removeIndexes   = []; //list of indexes to remove from tempDeps
        
        for(var i=0; i<dep1deps.length; i++){
            for(var j=0; j<tempDeps.length; j++){
                if(dep1deps[i] === tempDeps[j]){
                    tempDeps.splice(j,1);       //remove any duplicates from tempDeps that are in dep1deps
                    j--;
                }
            }
        }
        if( !this._areArraysEqual(tempDeps, currentLineDeps) ){ //check if correct dependencies are what the user has
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for the →-intro rule: remove the dependencies of the assumption justification from the second justification's dependencies.");
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
            this._addProblemToProblemList(currentLineNumber, "EFQ can only have 1 rule justification. Rule usage: F | A");
            return false;
        }else if(deps[0] >= currentLineNumber){ //attempting to use justification that has not yet been deduced
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }

        //check if justifcation is Falsum
        let depLine = this.proof[ this._getProofLineIndex(deps[0]) ]; //F
        let depProp = depLine.getProposition();
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        if(depTree["name"] !== "F"){
            this._addProblemToProblemList(currentLineNumber, "you have attempted to use EFQ on a non-falsum symbol. On the NatDud application, the falsum system is represented by an 'F' character. Rule usage: F | A");
            return false;
        }

        //check line dependencies
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for a non-sequent rule: add together the set of dependencies from each justification line.");
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
            this._addProblemToProblemList(currentLineNumber, "¬-Intro can only have 1 rule justification. Rule usage: A->F | ¬A");
            return false;
        }else if(deps[0] >= currentLineNumber){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else if(tree["name"] !== "~"){ //first operation is not a negation
            this._addProblemToProblemList(currentLineNumber, "you have attempted to use ¬-Intro without introducing a negation. Rule usage: A->F | ¬A");
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
            this._addProblemToProblemList(currentLineNumber, "¬-Intro can only be used on an implication to falsum. E.g: A->F | ¬A");
            return false;
        }else if(depLeftProp !== notProp){ //(A)->F !== A
            this._addProblemToProblemList(currentLineNumber, "the antecedent (left of the arrow) of the implication used has to be the current line without the negation, i.e: A->F | ¬A , where A has to be the antecedent in the implication");
            return false;
        }else if(depRightProp !== "F"){    //A->(F) !== F
            this._addProblemToProblemList(currentLineNumber, "invalid use of ¬-Intro: the justification you are attempting to use does not contain Falsum as its consequent (right of the arrow) in the implication. E.g. A->F");
            return false;
        }

        //check line dependencies
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for a non-sequent rule: add together the set of dependencies from each justification line.");
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
            this._addProblemToProblemList(currentLineNumber, "¬-elim can only have 1 rule justification. Rule usage: ¬A | A->F");
            return false;
        }else if(deps[0] >= currentLineNumber){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else if(tree["name"] !== "->"){ //first operation is not an implication i.e. A->F
            this._addProblemToProblemList(currentLineNumber, "you have attempted to use ¬-elim without the current line resulting in an implication (->) operation, e.g: A->F");
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
            this._addProblemToProblemList(currentLineNumber, "¬-elim must be carried out upon a negated proposition, e.g: ~A in the rule ~A | A->F");
            return false;
        }

        let notDepProp = treeToFormula(depTree["children"][0] , 0); //"A"
        if(notDepProp !== leftProp){ //(A)->F !== "A"
            this._addProblemToProblemList(currentLineNumber, "the antecedent (left of the arrow) of the implication on this line must be equivilant to the non-negated justification line: ¬A | A->F , where A is the antecedent");
            return false;
        }

        //check line dependencies
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for a non-sequent rule: add together the set of dependencies from each justification line.");
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
            this._addProblemToProblemList(currentLineNumber, "→-elim can only have 2 rule justifications.");
            return false;
        }else if(deps[0] >= currentLineNumber || deps[1] >= currentLineNumber){ //references a line after this line in the proof (cannot occur)
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }

        let dep2line = this.proof[ this._getProofLineIndex(deps[1]) ];; //A->B
        let dep2prop = dep2line.getProposition();
        let dep2tree = new tombstone.Statement(dep2prop).tree["tree"][0];
        let dep2op   = dep2tree["name"]; //->

        if(dep2op !== "->"){
            this._addProblemToProblemList(currentLineNumber, "You are attempting to use →-elim on a non-implication operation. Rule usage: A  A->B | B");
            return false;
        }

        let dep2prop1 = treeToFormula(dep2tree["children"][1], 0); //A
        let dep2prop2 = treeToFormula(dep2tree["children"][0], 0); //B
        let dep1      = this.proof[ this._getProofLineIndex(deps[0]) ];; //A
        let dep1prop  = dep1.getProposition();

        if(dep1prop !== dep2prop1){ //A !== A
            this._addProblemToProblemList(currentLineNumber, "your 1st justification does not match the left-side of the implication in your 2nd justification. Rule usage: A  A->B | B");
            return false;   
        }else if(prop !== dep2prop2){ //B !== B
            this._addProblemToProblemList(currentLineNumber, "this line's proposition does not match the right-side of the implication in your 1st justification. Rule usage: A  A->B | B");
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
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for a non-sequent rule: add together the set of dependencies from each justification line.");
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
            this._addProblemToProblemList(currentLineNumber, "cannot apply ∨-intro to non-disjunction (non-or) operation. Use '∨' when introducing a disjunction.");
            return false;
        }else if(deps.length > 1 || deps.length < 1){ //eg orIntro 1,2,3
            this._addProblemToProblemList(currentLineNumber, "∨-intro rule can only have one rule justification");
            return false;
        }else if(deps[0] >= currentLineNumber){ //justification values are beyond the current line number in proof
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else{ //operation is disjunction && there is 1 justification value: check if left or right symbol === justification line symbol
            let justificationProp = this.proof[ this._getProofLineIndex(deps[0]) ].getProposition(); //A
            if(leftProp !== justificationProp && rightProp !== justificationProp){
                this._addProblemToProblemList(currentLineNumber, "you have used ∨-intro incorrectly. ∨-intro introduces a proposition to the right or left of the 'OR' symbol: e.g. A | AvB");
                return false;
            }
        }

        //check line dependencies
        let depLine = this.proof[ this._getProofLineIndex(deps[0]) ];
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for a non-sequent rule: add together the set of dependencies from each justification line.");
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
            this._addProblemToProblemList(currentLineNumber, "∧-elim cannot be justified by more or less than one line in the proof. E.g. ∧-elim 4");
            return false;
        }else if(deps[0] >= currentLine.getLineNum()){
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }

        let depLine = this.proof[ this._getProofLineIndex(deps[0]) ];
        let depProp = depLine.getProposition(); //A&B
        let depTree = new tombstone.Statement(depProp).tree["tree"][0];
        let depTreeLeftProposition   = depTree["children"][1]; //A&B gives A
        let depTreeRightProposition  = depTree["children"][0]; //A&B gives B
        let depOperation = depTree["name"]; //"&"

        if(depOperation !== "&"){
            this._addProblemToProblemList(currentLineNumber, "you are attempting to use a line number in your rule justification that does not contain a conjunction (and operation).");
            return false;
        }else if(treeToFormula(depTreeLeftProposition, 0) !== prop && treeToFormula(depTreeRightProposition, 0) !== prop){ //line in proof doesn't match with justification line
            this._addProblemToProblemList(currentLineNumber, "you have used ∧-elim incorrectly. This line does not match either side of the conjuction (and operation) you have used as a justification.");
            return false;
        }

        //check line dependencies
        let depLineDependencies = new Set(depLine.getDependencies()); //justification deps
        let currentLineDeps     = new Set(currentLine.getDependencies());
        if(!this._areSetsEqual(depLineDependencies, currentLineDeps)){
            this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for a non-sequent rule: add together the set of dependencies from each justification line.");
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
            this._addProblemToProblemList(currentLineNumber, "cannot apply ∧-intro to non-∧ operation. Use '∧' when introducing a conjunction.");
            return false;
        }else if(deps.length > 2 || deps.length < 2){ //eg &-intro 1,2,3
            this._addProblemToProblemList(currentLineNumber, "∧-intro rule cannot have more or less than 2 rule justifications");
            return false;
        }else if(deps[0] >= currentLineNumber || deps[1] >= currentLineNumber){ //justification values are beyond the current line number in proof
            this._addProblemToProblemList(currentLineNumber, "you cannot use a rule justification that is after this line in any proof. Only reference proof lines before the current line number.");
            return false;
        }else{ //operation is conjuction && there are 2 justification values
            var lineDepsToCheck = []; //array of sets of line dependencies of given justifications
            for(var i=0; i < deps.length; i++){
                let currentJustificationLineNumber = deps[i];
                let currentJustificationProp = this.proof[ this._getProofLineIndex( currentJustificationLineNumber ) ].getProposition();

                if(currentJustificationLineNumber >= currentLineNumber){
                    this._addProblemToProblemList(currentLineNumber, "rule justification values are incorrent. Use values that correspond to line numbers in the proof that are being used in the and-Introduction rule");
                    return false;
                }else if((i===0 && leftProp!==currentJustificationProp) || (i===1 && rightProp!==currentJustificationProp)){//left isn't correct OR right isn't correct
                    this._addProblemToProblemList(currentLineNumber, "justification values are not correct. Perhaps check if the justification ordering is correct. E.g. 2,1 to 1,2. This is to ensure consistency for introducing both the left and right side of the conjunction operation.");
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
                this._addProblemToProblemList(currentLineNumber, "dependencies are incorrect - to determine the dependencies for a non-sequent rule: add together the set of dependencies from each justification line.\nE.g. (7)...andIntro 5,6\nLine 5 dependencies: 1,3\nLine 6 dependencies: 2,4\nLine 7 dependencies: 1,2,3,4");
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
}

//import ProofValidator from "proofValidator.js";
//var pv = new ProofValidator(formulaTree, proofData);
module.exports = ProofValidator;