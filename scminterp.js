evaluator = {};

evaluator.getInput = function(input) {
	
	evaluator.input = input;
	evaluator.input = evaluator.input.replace(/\(/g,  "( ");
	evaluator.input = evaluator.input.replace(/\)/g, " )");
	evaluator.input = evaluator.input.split(' ');
	evaluator.input = evaluator.prep(evaluator.input);
	//evaluator.index = 0;
	evaluator.input = evaluator.makeList(evaluator.input);

};
	
evaluator.prep = function(an_array) {
	var i = 0;
	while (an_array[i] === ' ') {
		++i;
	}
	if (an_array[i] === '(') {
		var x = an_array;
		x.shift();
		return x;
	}
	else {
		return an_array;
	}
};

evaluator.makeList = function(an_array) {
		evaluator.inarray = an_array;
		var return_val = this.makeArray();
		return return_val;
	};

evaluator.makeArray = function makearray() {

				var new_array = [];
				var i = 0;
				while (evaluator.inarray[0]!==')') {
					if (evaluator.inarray[0] === '(') {
						evaluator.inarray.shift();
						new_array[i] = makearray();
						i++;
						evaluator.inarray.shift();
				   } else {
						new_array[i] = evaluator.inarray[0];
						i++;
						evaluator.inarray.shift();
				   }
				}
				return new_array;
			};
			


evaluator.getRemainder = function(an_array, pos) {
	
	var i = 0;
	var return_array = [];
	var len = an_array.length;
	pos++;

	while (pos<=len) {
		return_array[i] = an_array[pos];
		pos++;
		i++;
	}
	return return_array;
};
////
evaluator.evaluate = function evaluate(expr, env) {

	if (evaluator.isSelfEvaluating(expr[0])) {
		return evaluator.selfEvaluate(expr);
	if (expr[0] in evaluator.SpecialForms) {
		return evaluator.SpecialForms[expr[0]](expr);
}
	else if (evaluator.isnumber(expr[0])) {
		return +expr;
}	else {
		console.log("Evaluate Error"); 
	}
};

evaluator.SpecialForms = { 
	'if': function(expr, env) {
		return evaluator.evaluate(evaluator.evaluate(expr[1], env) ? expr[2] : expr[3], env);
	},
	'define': function(expr, env) {
		if (Array.isArray(expr[1]) {
			env[expr[1][0]] = new Procedure(expr[1].slice(1), expr[2], env);
		} else {
			env[expr[1]] = evaluator.evaluate(expr[2], env);
		}
	},
	
		


evaluator.isSelfEvaluating = function (expr) {
		return ((expr === '+') || 
				(expr === '-') ||
				(expr === '*') ||
				(expr === '/') ||
				(expr === '<') || (expr === '>') ||
				(expr === '<=') ||
				(expr === '>=') ||
				(expr === '='));
};

	
evaluator.isnumber = function(expr) {	
	return (typeof parseInt(expr, 10) === "number" && isFinite(expr));
};

evaluator.Procedure = function (formal_args, body, env) {
		
	this.formal_args = formal_args;
	this.body = body;
	this.env = env;
}

evaluator.Procedure.prototype.call = function(args) {
	var env = Object.create(this.env);
	for (var i = 0, l = formal_args.length; i<=l; i++;)
	return evaluator.evaluate(this.body, env);


