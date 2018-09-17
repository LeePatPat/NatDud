var treeToFormula 	= require('../js/treeToFormula.js');
var ProofLine 		= require('../js/proofLine.js');
var ProofValidator  = require('../js/proofValidator.js');
var tombstone		= require('../js/tombstone.min.js');
var $				= require('jquery');
var QUnit			= require('qunit');

/**
**************************Proof Line***********************
*/
QUnit.module("Proof Line", function(){

	QUnit.test( "Line Dependencies" , function( assert ) {
		var line = new ProofLine([1,2,3], 1, "A", "assume", []);

		assert.deepEqual( line.getDependencies() , [1,2,3] , "getDependencies() returns correct array of line dependencies");
	});

	QUnit.test( "Line Number" , function( assert ) {
		var line = new ProofLine([1,2,3], 1, "A", "assume", []);

		assert.equal( line.getLineNum() , 1 , "getLineNum() returns correct line number");
	});

	QUnit.test( "Line Formula" , function( assert ) {
		var line = new ProofLine([1,2,3], 1, "A->(B&C)", "assume", []);
		
		assert.equal( line.getProposition() , "A->(B&C)" , "getProposition() returns correct formula string");
	});

	QUnit.test( "Line Rule" , function( assert ) {
		var line = new ProofLine([1,2,3], 1, "A->(B&C)", "assume", []);
		
		assert.equal( line.getRule() , "assume" , "getRule() returns correct rule string");
	});

	QUnit.test( "Line Rule References" , function( assert ) {
		var line = new ProofLine([1,2,3], 1, "A->(B&C)", "impintro", [1,2,3,4]);
		
		assert.deepEqual( line.getRuleDependencies() , [1,2,3,4] , "getRule() returns correct string");
	});

	QUnit.test( "Line As String" , function( assert ) {
		var line = new ProofLine([1,2,3], 1, "A->(B&C)", "assume", []);
		assert.equal( line.getLineAsString() , "1,2,3 (1) A->(B&C) assume" , "getRule() returns correct string for assumption");

		line = new ProofLine([1,2,3], 1, "A->(B&C)", "impintro", [1,2]);
		assert.equal( line.getLineAsString() , "1,2,3 (1) A->(B&C) impintro 1,2" , "getRule() returns correct string for anything but assumption");
	});
});


/** 
**************************treeToFormula********************
*/
QUnit.module("treeToFormula" , function() {
	QUnit.test( "Positive Case 1 - 'A&(B||~C)'", function( assert ) {
		var prop 		  = new tombstone.Statement( "A&(B||~C)" );
		var tree 		  = prop.tree["tree"][0];

		assert.equal( treeToFormula(tree,0) , "A&(B||~C)" , "treeToFormula returns Tombstone original input");
	});

	QUnit.test( "Positive Case 2 - '~(B->(A&(~C||D)))'", function( assert ) {
		var prop = new tombstone.Statement("~(B->(A&(~C||D)))");
		var tree = prop.tree["tree"][0];

		assert.equal( treeToFormula(tree,0) , "~(B->(A&(~C||D)))" , "treeToFormula returns Tombstone original input");
	});	

	QUnit.test( "Extra Parentheses Removed - '(((A&(B||~C))))'   TO   'A&(B||~C)'", function( assert ) {
		var prop = new tombstone.Statement("(((A&(B||~C))))");
		var tree = prop.tree["tree"][0];

		assert.equal( treeToFormula(tree,0) , "A&(B||~C)" , "treeToFormula returns Tombstone original input with unnecessary parentheses");
	});

	QUnit.test( "'A&B->C&D'   TO   '(A&B)->(C&D)'", function( assert ) {
		var prop = new tombstone.Statement("A&B->C&D");
		var tree = prop.tree["tree"][0];

		assert.equal( treeToFormula(tree,0) , "(A&B)->(C&D)" , "treeToFormula returns CS103 WFF from non-CS103-friendly input");
	});

	QUnit.test( "'A&B||~C'   TO   '(A&B)||~C'", function( assert ) {
		var prop = new tombstone.Statement("A&B||~C");
		var tree = prop.tree["tree"][0];

		assert.equal( treeToFormula(tree,0) , "(A&B)||~C" , "treeToFormula returns CS103 WFF from non-CS103-friendly input");
	});

	QUnit.test( "'~(A)' TO '~A'", function( assert ) {
		var prop = new tombstone.Statement("~(A)");
		var tree = prop.tree["tree"][0];

		assert.equal( treeToFormula(tree,0) , "~A" , "treeToFormula returns CS103 WFF from non-CS103-friendly input");
	});

	QUnit.test( "'~(~A)' TO '~~A'", function( assert ) {
		var prop = new tombstone.Statement("~(~A)");
		var tree = prop.tree["tree"][0];

		assert.equal( treeToFormula(tree,0) , "~~A" , "treeToFormula returns CS103 WFF from non-CS103-friendly input");
	});
});

/** 
**************************Proof Validator FULL********************
*/
QUnit.module("Proof Valiadator - Full Validation Units", function() {
	QUnit.test( "Positive Case 1 - 'A -> A'", function( assert ) {
		var tree  = stringToParseTree("A->A");
		var proof = [];

		proof.push( new ProofLine(["1"], 1, "A",    "assume",   []   	   ) );
		proof.push( new ProofLine([],    2, "A->A", "impintro", ["1","1"]  ) );

		var pv = new ProofValidator(tree, proof, true);

		assert.ok( pv.isProofValid() , getProofAsString(proof));
	});

	QUnit.test( "Positive Case 2 - '~P -> (P -> Q)'", function( assert ) {
		var prop  = new tombstone.Statement( "~P->(P->Q)" );
		var tree  = prop.tree["tree"][0];
		var proof = [];

		proof.push( new ProofLine(["1"],     1, "~P", 			"assume", 	[]			) );
		proof.push( new ProofLine(["2"],     2, "P", 			"assume", 	[]			) );
		proof.push( new ProofLine(["1"],     3, "P->F", 		"notelim", 	["1"]		) );
		proof.push( new ProofLine(["1","2"], 4, "F", 			"impelim", 	["2","3"]	) );
		proof.push( new ProofLine(["1","2"], 5, "Q", 			"efq", 		["4"]		) );
		proof.push( new ProofLine(["1"],     6, "P->Q", 		"impintro", ["2","5"]	) );
		proof.push( new ProofLine([],    	 7, "~P->(P->Q)", 	"impintro", ["1","6"]	) );

		var pv = new ProofValidator(tree, proof, true);

		assert.ok( pv.isProofValid() , getProofAsString(proof));
	});

	QUnit.test( "Positive Case 3 - '(R || S) -> ((R -> S) -> S)'", function( assert ) {
		var prop  = new tombstone.Statement( "(R||S)->((R->S)->S)" );
		var tree  = prop.tree["tree"][0];
		var proof = [];

		proof.push( new ProofLine( ["1"],     1, "R||S", 		  		"assume",   []						) );
		proof.push( new ProofLine( ["2"],     2, "R->S", 		  		"assume",   []						) );
		proof.push( new ProofLine( ["3"],     3, "R", 	  				"assume",  	["1"]					) );
		proof.push( new ProofLine( ["2","3"], 4, "S", 		  			"impelim",  ["3","2"]				) );
		proof.push( new ProofLine( ["5"],     5, "S", 		  			"assume", 	[]						) );
		proof.push( new ProofLine( ["1","2"], 6, "S", 	  				"orelim", 	["1","3","4","5","5"]	) );
		proof.push( new ProofLine( ["1"],     7, "(R->S)->S",		 	"impintro", ["2","6"]				) );
		proof.push( new ProofLine( [],        8, "(R||S)->((R->S)->S)", "impintro", ["1","7"]				) );

		var pv = new ProofValidator(tree, proof, true);

		assert.ok( pv.isProofValid() , getProofAsString(proof));
	});

	QUnit.test( "Final Line Is Not Initial Theroem Input", function( assert ) {
		var tree  = stringToParseTree("A->A");
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "assume",   []   ) );

		var pv = new ProofValidator(tree, proof, true);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});

	QUnit.test( "Empty Formula Check", function( assert ) {
		var tree  = stringToParseTree("A->A");
		var proof = [];

		proof.push( new ProofLine([1], 1, "  ",    "assume",   []   ) );
		proof.push( new ProofLine([],  2, "A->A", "impintro", [1,1]) );

		var pv = new ProofValidator(tree, proof, true);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});
});

/** 
**************************Proof Validator RULES********************
*/
QUnit.module("Proof Valiadator - Rule Function Units", function() {

	//orElim
	QUnit.test( "Disjunction Elimination - Positive Case 1", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( ["1"],     1, "R||S", 	"assume",   []						) );
		proof.push( new ProofLine( ["2"],     2, "R->S", 	"assume",   []						) );
		proof.push( new ProofLine( ["3"],     3, "R", 	  	"assume",  	["1"]					) );
		proof.push( new ProofLine( ["2","3"], 4, "S", 		"impelim",  ["3","2"]				) );
		proof.push( new ProofLine( ["5"],     5, "S", 		"assume", 	[]						) );
		proof.push( new ProofLine( ["1","2"], 6, "S", 	  	"orelim", 	["1","3","4","5","5"]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Disjunction Elimination - Positive Case 2", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( ["1"],     1, "(A->C)||(B->C)", 	"assume",   []						) );
		proof.push( new ProofLine( ["2"],     2, "A&B",			 	"assume",   []						) );
		proof.push( new ProofLine( ["3"],     3, "A->C", 	  		"assume",	[]						) );
		proof.push( new ProofLine( ["2"],     4, "A", 				"andelim",  ["2"]					) );
		proof.push( new ProofLine( ["2","3"], 5, "C", 				"impelim",	["4","3"]				) );
		proof.push( new ProofLine( ["6"],     6, "B->C",		 	"assume",   []						) );
		proof.push( new ProofLine( ["2"],     7, "B",			 	"andelim",  ["2"]					) );
		proof.push( new ProofLine( ["2","6"], 8, "C",			 	"impelim",  ["7","6"]		    	) );
		proof.push( new ProofLine( ["1","2"], 9, "C",			 	"orelim",   ["1","3","5","6","8"]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , pv.getFeedback()[0]);
	});

	QUnit.test( "Disjunction Elimination - Incorrect Number of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R||S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "R", 	  	"assume",  	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "S", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "S", 		"assume", 	[]			) );
		proof.push( new ProofLine( [1,2], 6, "S", 	  	"orelim", 	[1,3,5,5]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});

	QUnit.test( "Disjunction Elimination - Rule Reference Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R||S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "R", 	  	"assume",  	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "S", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "S", 		"assume", 	[]			) );
		proof.push( new ProofLine( [1,2], 6, "S", 	  	"orelim", 	[1,3,4,5,10]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});

	QUnit.test( "Disjunction Elimination - First Line Reference Is Not A Disjunction", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R&S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "R", 	  	"assume",  	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "S", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "S", 		"assume", 	[]			) );
		proof.push( new ProofLine( [1,2], 6, "S", 	  	"orelim", 	[1,3,4,5,5]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});

	QUnit.test( "Disjunction Elimination - Second Line Reference Does Not Match Left Side Of Disjunction", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R||S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "A", 	  	"assume",	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "S", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "S", 		"assume", 	[]			) );
		proof.push( new ProofLine( [1,2], 6, "S", 	  	"orelim", 	[1,3,4,5,5]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});

	QUnit.test( "Disjunction Elimination - Second Line Reference Is Not An Assumption", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R||S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "R", 	  	"impintro",	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "S", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "S", 		"assume", 	[]			) );
		proof.push( new ProofLine( [1,2], 6, "S", 	  	"orelim", 	[1,3,4,5,5]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});

	QUnit.test( "Disjunction Elimination - Third Line Reference Does Not Match Current Line Formula", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R||S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "R", 	  	"assume",	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "A", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "S", 		"assume", 	[]			) );
		proof.push( new ProofLine( [1,2], 6, "S", 	  	"orelim", 	[1,3,4,5,5]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});

	QUnit.test( "Disjunction Elimination - Fourth Line Reference Does Not Match Right Side Of Disjunction", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R||S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "R", 	  	"assume",	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "S", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "A", 		"assume", 	[]			) );
		proof.push( new ProofLine( [1,2], 6, "S", 	  	"orelim", 	[1,3,4,5,5]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0] );
	});

	QUnit.test( "Disjunction Elimination - Fourth Line Reference Is Not An Assumption", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R||S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "R", 	  	"assume",	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "S", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "S", 		"impintro",	[]			) );
		proof.push( new ProofLine( [1,2], 6, "S", 	  	"orelim", 	[1,3,4,5,5]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0]);
	});

	QUnit.test( "Disjunction Elimination - Fifth Line Reference Does Not Match Current Line Formula", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "(A->C)||(B->C)", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "A&B",			 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "A->C", 	  		"assume",	[]			) );
		proof.push( new ProofLine( [2],   4, "A", 				"andelim",  [2]			) );
		proof.push( new ProofLine( [2,3], 5, "C", 				"impelim",	[4,3]		) );
		proof.push( new ProofLine( [26],  6, "B->C",		 	"assume",   []			) );
		proof.push( new ProofLine( [2],   7, "B",			 	"andelim",  [2]			) );
		proof.push( new ProofLine( [2,6], 8, "Z",			 	"impelim",  [7,6]		) );
		proof.push( new ProofLine( [1,2], 9, "C",			 	"orelim",   [1,3,5,6,8]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback()[0]);
	});

	QUnit.test( "Disjunction Elimination - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( ["1"],     1, "R||S", 	"assume",   []						) );
		proof.push( new ProofLine( ["2"],     2, "R->S", 	"assume",   []						) );
		proof.push( new ProofLine( ["3"],     3, "R", 	  	"assume",	["1"]					) );
		proof.push( new ProofLine( ["2","3"], 4, "S", 		"impelim",  ["3","2"]				) );
		proof.push( new ProofLine( ["5"],     5, "S", 		"assume",	[]						) );
		proof.push( new ProofLine( ["1","2"], 6, "S", 	  	"orelim", 	["1","3","4","5","5"]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , proof[ proof.length -1 ].getLineAsString());
	});

	QUnit.test( "Disjunction Elimination - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "R||S", 	"assume",   []			) );
		proof.push( new ProofLine( [2],   2, "R->S", 	"assume",   []			) );
		proof.push( new ProofLine( [3],   3, "R", 	  	"assume",	[1]			) );
		proof.push( new ProofLine( [2,3], 4, "S", 		"impelim",  [3,2]		) );
		proof.push( new ProofLine( [5],   5, "S", 		"assume",	[]			) );
		proof.push( new ProofLine( [3,2], 6, "S", 	  	"orelim", 	[1,3,4,5,5]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , proof[ proof.length -1 ].getLineAsString());
	});


	//RAA
	QUnit.test( "Reductio Ad Absurdum - Positive Case", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( ["1"],   1, "~(B||~B)",  "assume",   []			) );
		proof.push( new ProofLine( ["1"],   2, "F", 		"impelim",  ["0","0"]	) );
		proof.push( new ProofLine( [],      3, "B||~B", 	"raa",  	["1","2"]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , pv.getFeedback() );
	});	

	QUnit.test( "Reductio Ad Absurdum - Incorrect Number Of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "~(B||~B)",  "assume",   []	) );
		proof.push( new ProofLine( [1],   2, "F", 		  "impelim",  [0,0]	) );
		proof.push( new ProofLine( [],    3, "B||~B", 	  "raa",  	  [1,2,3]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Reductio Ad Absurdum - Rule Reference Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "~(B||~B)",  "assume",   []	) );
		proof.push( new ProofLine( [1],   2, "F", 		  "impelim",  [0,0]	) );
		proof.push( new ProofLine( [],    3, "B||~B", 	  "raa",  	  [1,6]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Reductio Ad Absurdum - First Rule Reference Is Not A Negation", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "B||~B",	  "assume",   []	) );
		proof.push( new ProofLine( [1],   2, "F", 		  "impelim",  [0,0]	) );
		proof.push( new ProofLine( [],    3, "B||~B", 	  "raa",  	  [1,2]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});	

	QUnit.test( "Reductio Ad Absurdum - First Rule Reference Is Not An Assumption", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "~(B||~B)",  "impelim",  []	) );
		proof.push( new ProofLine( [1],   2, "F", 		  "impelim",  [0,0]	) );
		proof.push( new ProofLine( [],    3, "B||~B", 	  "raa",  	  [1,2]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Reductio Ad Absurdum - Current Line Is Not Non-negated Version Of Rule Reference", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "~~(B||~B)",  "assume",   []	) );
		proof.push( new ProofLine( [1],   2, "F", 		  "impelim",  [0,0]	) );
		proof.push( new ProofLine( [],    3, "B||~B", 	  "raa",  	  [1,2]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});	

	QUnit.test( "Reductio Ad Absurdum - Second Rule Reference Is Not Falsum", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "~(B||~B)",  "assume",   []	) );
		proof.push( new ProofLine( [1],   2, "A", 		  "impelim",  [0,0]	) );
		proof.push( new ProofLine( [],    3, "B||~B", 	  "raa",  	  [1,2]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Reductio Ad Absurdum - Second Rule Reference Is Not An Assumption", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "~(B||~B)",  "impelim",   []	) );
		proof.push( new ProofLine( [1],   2, "F", 		  "impelim",  [0,0]	) );
		proof.push( new ProofLine( [],    3, "B||~B", 	  "raa",  	  [1,2]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Reductio Ad Absurdum - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( ["1"],   1, "~(B||~B)",  "assume",   []			) );
		proof.push( new ProofLine( ["1"],   2, "F", 		"impelim",  ["0","0"]	) );
		proof.push( new ProofLine( [],      3, "B||~B", 	"raa",  	["1","2"]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Reductio Ad Absurdum - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine( [1],   1, "~(B||~B)",  "impelim",  []	) );
		proof.push( new ProofLine( [1],   2, "F", 		  "impelim",  [0,0]	) );
		proof.push( new ProofLine( [1,2], 3, "B||~B", 	  "raa", 	  [1,2]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});


	//impintro
	QUnit.test( "Implication Introduction - Positive Case 1", function( assert ) {
		var proof = [];

		proof.push( new ProofLine(["1"], 1, "A",    "assume",   []   		) );
		proof.push( new ProofLine([],    2, "A->A", "impintro", ["1","1"]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Implication Introduction - Positive Case 2", function( assert ) {
		var proof = [];

		proof.push( new ProofLine(["1"], 1, "A",    "assume",   []   		) );
		proof.push( new ProofLine(["1"], 2, "B",    "impelim",  []   		) );
		proof.push( new ProofLine([],    3, "A->B", "impintro", ["1","2"]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Implication Introduction - Current Line Is Not An Implication", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([],  2, "A&A",  "impintro", [1,1]) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Introduction - Incorrect Number Of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([],  2, "A->A",  "impintro", [1,1,1]) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Introduction - A Rule Reference Is Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([],  2, "A->A",  "impintro", [1,4]) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Introduction - First Rule Reference Does Not Match Left Of Implication", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([],  2, "B->A",  "impintro", [1,1]) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Introduction - Second Rule Reference Does Not Match Right Of Implication", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([],  2, "A->B",  "impintro", [1,1]) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Introduction - First Rule Reference Is Not An Assumption", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "impintro",  []   ) );
		proof.push( new ProofLine([],  2, "A->A", "impintro",  [1,1]) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Introduction - Second Rule Reference Is An Assumption (And Not Introducing Itself)", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "assume",   []  	) );
		proof.push( new ProofLine([2], 2, "B", 	  "assume",   [] 	) )
		proof.push( new ProofLine([] ,  3, "A->B", "impintro", [1,2] ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Introduction - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine(["1"], 1, "A",    "assume",   []   		) );
		proof.push( new ProofLine([],    2, "A->A", "impintro", ["1","1"]	) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Introduction - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([1,2],  2, "A->A", "impintro", [1,1]) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});


	//efq
	QUnit.test( "Ex Falso Quodlibet - Positive Case", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2], 1, "F",  "impelim",  [0,0]   ) );
		proof.push( new ProofLine([1,2], 2, "Y",  "efq",  	  [1]	  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Ex Falso Quodlibet - Incorrect Number of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2], 1, "F",  "impelim",  [0,0]   ) );
		proof.push( new ProofLine([1,2], 2, "Y",  "efq",  	  [1,2,3]	  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Ex Falso Quodlibet - A Reference Rule Is Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2], 1, "F",  "impelim",  [0,0]   ) );
		proof.push( new ProofLine([1,2], 2, "Y",  "efq",  	  [3]	  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Ex Falso Quodlibet - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2], 1, "F",  "impelim",  [0,0]   ) );
		proof.push( new ProofLine([1,2], 2, "Y",  "efq",  	  [1]	  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Ex Falso Quodlibet - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2], 1, "F",  "impelim",  [0,0]   ) );
		proof.push( new ProofLine([1,2,3], 2, "Y",  "efq",  	  [1]	  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});


	//notintro
	QUnit.test( "Negation Introduction - Positive Case", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "(U&~U)->F", "assume",   [0,0]   ) );
		proof.push( new ProofLine([1], 2, "~(U&~U)",   "notintro", [1]     ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Negation Introduction - Incorrect Number of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "(U&~U)->F", "assume",   [0,0]  ) );
		proof.push( new ProofLine([1], 2, "~(U&~U)",   "notintro", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Introduction - A Rule Reference Is Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "(U&~U)->F", "assume",   [0,0]  ) );
		proof.push( new ProofLine([1], 2, "~(U&~U)",   "notintro", [3]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Introduction - Current Line Operation Is Not A Negation", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "(U&~U)->F", "assume",   [0,0]  ) );
		proof.push( new ProofLine([1], 2, "U&~U",      "notintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Introduction - Rule Reference Formula Operation Is Not An Implication", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "U&~U", "assume",   [0,0]  ) );
		proof.push( new ProofLine([1], 2, "~(U&~U)",   "notintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Introduction - Left Of Implication On Reference Line Is Not Negated On Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "(U&~U)->F", "assume",   [0,0]  ) );
		proof.push( new ProofLine([1], 2, "~(A&B)",   "notintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Introduction - Right Of Implication On Reference Line Is Not Falsum", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "(U&~U)->A", "assume",   [0,0]  ) );
		proof.push( new ProofLine([1], 2, "~(U&~U)",   "notintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Introduction - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "(U&~U)->F", "assume",   [0,0]  ) );
		proof.push( new ProofLine([1], 2, "~(U&~U)",   "notintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Negation Introduction - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "(U&~U)->F", "assume",   [0,0]  ) );
		proof.push( new ProofLine([1,2,3], 2, "~(U&~U)",   "notintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});


	//notelim
	QUnit.test( "Negation Elimination - Correct Case", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "~A",   "assume",  []  ) );
		proof.push( new ProofLine([1], 2, "A->F", "notelim", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Negation Elimination - Incorrect Number of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "~A",   "assume",  []  ) );
		proof.push( new ProofLine([1], 2, "A->F", "notelim", [1,2,3]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Elimination - A Rule Reference Is Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "~A",   "assume",  []  ) );
		proof.push( new ProofLine([1], 2, "A->F", "notelim", [4] ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Elimination - Current Line Formula Operation Is Not An Implication", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "~A",   "assume",  []  ) );
		proof.push( new ProofLine([1], 2, "A&F", "notelim", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Elimination - Right Of Implication On Current Line Is Not Falsum", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "~A",   "assume",  []  ) );
		proof.push( new ProofLine([1], 2, "A->B", "notelim", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Elimination - Reference Line Is Not A Negation", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "A",   "assume",  []  ) );
		proof.push( new ProofLine([1], 2, "A->F", "notelim", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Elimination - Left Of Implication Is Not Non-negated Formula Of Reference Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "~A",   "assume",  []  ) );
		proof.push( new ProofLine([1], 2, "B->F", "notelim", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Negation Elimination - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "~A",   "assume",  []  ) );
		proof.push( new ProofLine([1], 2, "A->F", "notelim", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Negation Elimination - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1], 1, "~A",   "assume",  []  ) );
		proof.push( new ProofLine([1,2,3], 2, "A->F", "notelim", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});


	//impelim
	QUnit.test( "Implication Elimination - Correct Case", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []  ) );
		proof.push( new ProofLine([2],   2, "A->B", "notelim", [0]  ) );
		proof.push( new ProofLine([1,2], 3, "B",    "impelim", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Implication Elimination - Incorrect Number Of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []  ) );
		proof.push( new ProofLine([2],   2, "A->B", "notelim", [0]  ) );
		proof.push( new ProofLine([1,2], 3, "B",    "impelim", [1,2,3]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Elimination - A Rule Reference Is Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []  ) );
		proof.push( new ProofLine([2],   2, "A->B", "notelim", [0]  ) );
		proof.push( new ProofLine([1,2], 3, "B",    "impelim", [1,4]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Elimination - Second Rule Reference Is Not An Implication", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []  ) );
		proof.push( new ProofLine([2],   2, "A&B", "notelim", [0]  ) );
		proof.push( new ProofLine([1,2], 3, "B",    "impelim", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Elimination - Left Of Implication Is Not Equal To First Rule Reference Formula", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []  ) );
		proof.push( new ProofLine([2],   2, "C->B", "notelim", [0]  ) );
		proof.push( new ProofLine([1,2], 3, "B",    "impelim", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Elimination - Current Line Formula Is Not Equal To Right Of Implication", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []  ) );
		proof.push( new ProofLine([2],   2, "A->B", "notelim", [0]  ) );
		proof.push( new ProofLine([1,2], 3, "C",    "impelim", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Implication Elimination - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []  ) );
		proof.push( new ProofLine([2],   2, "A->B", "notelim", [0]  ) );
		proof.push( new ProofLine([1,2], 3, "B",    "impelim", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Implication Elimination - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []  ) );
		proof.push( new ProofLine([2],   2, "A->B", "notelim", [0]  ) );
		proof.push( new ProofLine([1,2,3,4], 3, "B",    "impelim", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});


	//orintro
	QUnit.test( "Disjunction Introduction - Correct Case 1", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([1],   2, "A||B", "orintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Disjunction Introduction - Correct Case 2", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([1],   2, "B||A", "orintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Disjunction Introduction - Current Line Operation Is Not Disjunction", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([1],   2, "A&B", "orintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Disjunction Introduction - Incorrect Number Of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([1],   2, "A||B", "orintro", [1,2,3]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Disjunction Introduction - A Rule Reference Is Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([1],   2, "A||B", "orintro", [5]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Disjunction Introduction - Left Or Right Of Disjunction Is Not Equal To Rule Reference Formula", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([1],   2, "C||D", "orintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Disjunction Introduction - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([1],   2, "A||B", "orintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Disjunction Introduction - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([1,2,3],   2, "A||B", "orintro", [1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});


	//andintro
	QUnit.test( "Conjunction Introduction - Correct Case 1", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([2],   2, "B",    "assume",  []   ) );
		proof.push( new ProofLine([1,2], 3, "A&B",  "andintro", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Conjunction Introduction - Correct Case 2", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",  []   ) );
		proof.push( new ProofLine([2],   2, "B",    "assume",  []   ) );
		proof.push( new ProofLine([1,2], 3, "B&A",  "andintro", [2,1]  ) );

		var pv = new ProofValidator(null, proof, false);
		console.log(pv);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Conjunction Introduction - Current Line Operation Is Not A Conjunction", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([2],   2, "B",    "assume",   []   ) );
		proof.push( new ProofLine([1,2], 3, "A||B",  "andintro", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Conjunction Introduction - Incorrect Number Of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([2],   2, "B",    "assume",   []   ) );
		proof.push( new ProofLine([1,2], 3, "A&B",  "andintro", [1,2,3]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Conjunction Introduction - A Rule Reference Is Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([2],   2, "B",    "assume",   []   ) );
		proof.push( new ProofLine([1,2], 3, "A&B",  "andintro", [1,4]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Conjunction Introduction - Left Or Right Of The Conjunction Is Incorrect Through Rule Reference Numbers", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([2],   2, "B",    "assume",   []   ) );
		proof.push( new ProofLine([1,2], 3, "A&B",  "andintro", [2,1]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Conjunction Introduction - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([2],   2, "B",    "assume",   []   ) );
		proof.push( new ProofLine([1,2], 3, "A&B",  "andintro", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Conjunction Introduction - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1],   1, "A",    "assume",   []   ) );
		proof.push( new ProofLine([2],   2, "B",    "assume",   []   ) );
		proof.push( new ProofLine([1,3], 3, "A&B",  "andintro", [1,2]  ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});


	//andelim
	QUnit.test( "Conjunction Elimination - Correct Case 1", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2],  1,  "A&B",   "assume",   []   ) );
		proof.push( new ProofLine([1,2],  2,  "A",     "andelim",  [1]   ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Conjunction Elimination - Correct Case 2", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2],  1,  "A&B",   "assume",   []   ) );
		proof.push( new ProofLine([1,2],  2,  "B",     "andelim",  [1]   ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Conjunction Elimination - Incorrect Number Of Rule References", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2],  1,  "A&B",   "assume",   []   ) );
		proof.push( new ProofLine([1,2],  2,  "A",     "andelim",  [1,2,3]   ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Conjunction Elimination - A Rule Reference Is Beyond The Current Line", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2],  1,  "A&B",   "assume",   []   ) );
		proof.push( new ProofLine([1,2],  2,  "A",     "andelim",  [4]   ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Conjunction Elimination - Current Line Operation Is Not A Conjunction", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2],  1,  "A->B",   "assume",   []   ) );
		proof.push( new ProofLine([1,2],  2,  "A",     "andelim",  [1]   ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Conjunction Elimination - Current Line Formula Does Not Match Left Or Right Of Conjunction", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2],  1,  "A&B",   "assume",   []   ) );
		proof.push( new ProofLine([1,2],  2,  "C",     "andelim",  [1]   ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

	QUnit.test( "Conjunction Elimination - Correct Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2],  1,  "A&B",   "assume",   []   ) );
		proof.push( new ProofLine([1,2],  2,  "A",     "andelim",  [1]   ) );

		var pv = new ProofValidator(null, proof, false);

		assert.ok( pv.isProofValid() , getProofAsString(proof) );
	});

	QUnit.test( "Conjunction Elimination - Incorrect Line Dependencies", function( assert ) {
		var proof = [];

		proof.push( new ProofLine([1,2],  1,  "A&B",   "assume",   []   ) );
		proof.push( new ProofLine([2],  2,  "A",     "andelim",  [1]   ) );

		var pv = new ProofValidator(null, proof, false);

		assert.notOk( pv.isProofValid() , pv.getFeedback() );
	});

});




function stringToParseTree(str){
	return new tombstone.Statement(str).tree["tree"][0];
	//
}
function getProofAsString(proof){
	let str = "";
	for(var i=0; i<proof.length; i++){
		str += proof[i].getLineAsString() + " ■ ";
	}
	return str;
}