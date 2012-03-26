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

evaluator.evaluate = function evaluate(expr, env) {

	if (evaluator.isSelfEvaluating(expr[0])) {
		return evaluator.selfEvaluate(expr);
}	//else if (evaluator.isSymbol(expr, env) {
	//		evaluate(evaluator.apply(expr, env)
//}
	else if (evaluator.isnumber(expr[0])) {
		return expr;
}	else {
		console.log("Evaluate Error");
	}
};

//evaluator.isSymbol = function lookup(expr, env) {
//	
//	var sym = expr[0];
//
//	if (env.indexOf(sym)!== -1) {
//		return true;
//}	else if (env.indexOf(env)!== -1) {
//		return(lookup(expr, env[env.indexOf(env)]));
//}	else {
//		return false;
//	}
//};
			
//evaluator.apply = function apply(expr, env)

//	var sym = expr[0];
//	var formal_params = [];
//	var body = [];
		
	

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

	


evaluator.selfEvaluate = function selfevaluate(expr) {

	if (expr[0] === '+') {
		return eval(evaluator.evaluate(expr[1]) + '+' + evaluator.evaluate(expr[2]));
}	else if (expr[0] === '*') {
		return eval(evaluator.evaluate(expr[1]) + '*' + evaluator.evaluate(expr[2]));
}	else if (expr[0] === '/') {
		return eval(evaluator.evaluate(expr[1]) + '/' + evaluator.evaluate(expr[2]));
}	else if (expr[0] === '-') {
		return(eval(evaluator.evaluate(expr[1]) + '-' + evaluator.evaluate(expr[2])));
}	else if (expr[0] === '<') {
		return eval(evaluator.evaluate(expr[1]) + '<' + evaluator.evaluate(expr[2]));
}	else if (expr[0] === '>') {
		return eval(evaluator.evaluate(expr[1]) + '>' + evaluator.evaluate(expr[2]));
}	else if (expr[0] === '<=') {
		return eval(evalutor.evaluate(expr[1]) + '<=' + evaluator.evaluate(expr[2]));
}	else if (expr[0] === '>=') {
		return eval(evaluator.evaluate(expr[1]) + '>=' + evaluator.evaluate(expr[2]));
}	else {
		console.log("Self Evaluate Error");
	}
};
evaluator.isnumber = function(expr) {
	return (typeof parseInt(expr, 10) === "number" && isFinite(expr));
};

