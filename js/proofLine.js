/** A class to represent proof lines as a more logical data structure */
class ProofLine {
    /**
     * @param {string} dependencies     - assumption dependencies
     * @param {string} lineNum           - line number
     * @param {string} proposition       - proposition result from assumption or inference rule
     * @param {string} rule              - rule used (or assumption)
     * @param {string} ruleDependencies - line numbers that given inference rule depends on
     */
    constructor(dependencies, lineNum, proposition, rule, ruleDependencies) {
        this.dependencies = dependencies;
        this.lineNum = lineNum;
        this.proposition = proposition;
        this.rule = rule;
        this.ruleDependencies = ruleDependencies;
    }

    //getters
    getDependencies() { return this.dependencies; }
    getLineNum() { return this.lineNum; }
    getProposition() { return this.proposition; }
    getRule() { return this.rule; }
    getRuleDependencies() { return this.ruleDependencies; }

    //setters
    setDependencies(dep) { this.dependencies = dep; }
    setLineNum(l) { this.lineNum = l; }
    setProposition(prop) { this.proposition = prop; }
    setRule(r) { this.rule = r; }
    setRuleDependencies(rDep) { this.ruleDependencies = rDep; }

    /**
     * @return {string} - proof line as a string 
     */
    getLineAsString() {
        return this.dependencies + " " +
            "(" + lineNum.toString() + ")" + " " +
            this.proposition + " " +
            this.rule + " " +
            this.ruleDependencies;
    }
}

//import ProofLine from "js/proofLine.js";
export default ProofLine