evaluator = {};

evaluator.parse = function(input) {
	var match, exprs = [], stack = [exprs], newList;
	while (input.length) {
		if ((match = input.match(/^\(/))) {
			newList = [];
			stack[0].push(newList);
			stack.unshift(newList);
		}
		else if ((match = input.match(/^\)/))) {
			if (stack.length < 2) {
				throw new Error("Unexpected \")\"");
			}
			stack.shift();
		} else if ((match = input.match(/^ +/))) {
			// Ignore whitespace
		} else if ((match = input.match(/^[^ ()]+/))) { // What are valid identifiers?
			stack[0].push(match[0]);
		}
		input = input.substr(match[0].length);
	}
	if (stack.length > 1) {
		throw new Error("Unexpected end of input");
	}
	return exprs;
};
	
evaluator.evaluate = function evaluate(expr, env) {
	var evaluatedList;
	if (Array.isArray(expr)) {
		if (expr[0] in evaluator.SpecialForms) { 
			return evaluator.SpecialForms[expr[0]](expr, env);
		} else {
			evaluatedList = expr.map(function (expr) {
				return evaluator.evaluate(expr, env);
			}); 
			return evaluatedList[0].call(evaluatedList.slice(1));		
		}	
	} else if (evaluator.isnumber(expr)) {
		return +expr;
	} else if (expr in env) {
		return env[expr]; 
	} else {
		throw new Error("Evaluate Error"); 
	}
};

evaluator.SpecialForms = { 
	'if': function(expr, env) {
		if (evaluator.evaluate(evaluator.extractTest(expr), env)) {
			return evaluator.evaluate(evaluator.extractResult(expr), env);
		} else {
			return evaluator.evaluate(evaluator.extractElse(expr), env);
		}
	},
	'define': function (expr, env) {
	     	if (Array.isArray(expr[1])) {
				env[expr[1][0]] = new evaluator.Procedure(expr[1].slice(1), expr.slice(2), env);
		} else {
			env[expr[1]] = evaluator.evaluate(expr[2], env);
		}
	}
};

evaluator.extractTest = function (expr) {
	if (expr[0] === 'if') {
		return expr[1];
	} else {
		throw Error("If Error");
	}
};

evaluator.extractResult = function (expr) {
	if (expr[0] === 'if') {
		return expr[2];
	} else {
		throw Error("If Consequent Error");
	}
};

evaluator.extractElse = function (expr) {
	if (expr[0] === 'if') {
		return expr[3];
	} else {
		throw Error("If Else Error");
	}
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
	for (var i = 0, l = this.formal_args.length; i<=l; i++) {
			env[this.formal_args[i]] = args[i]; 
		};
	return this.body.reduce (function (acc, expr) {
		return evaluator.evaluate(expr, env);
	}, undefined);
};
		

evaluator.NativeProcedure = function (handler) {
	this.handler = handler;
};

evaluator.NativeProcedure.prototype = new evaluator.Procedure;

evaluator.NativeProcedure.prototype.call = function(args) {
	return this.handler(args);
};


evaluator.GlobalEnv = {
	'+': new evaluator.NativeProcedure(function (args) {
		return args.reduce( function (acc, x) {
			return x + acc;
		}, 0); 
	}),
	'*': new evaluator.NativeProcedure(function (args) {
		return args[0] * args[1];
		}),
	'-': new evaluator.NativeProcedure(function (args) {
		return args[0] - args[1];
		}),
	'/': new evaluator.NativeProcedure(function (args) {
		return args[0] / args[1];
		}),
	'<': new evaluator.NativeProcedure(function (args) {
		return args[0] < args[1];
		}),
	'>': new evaluator.NativeProcedure(function (args) {
		return args[0] > args[1];
		}),
	'<=': new evaluator.NativeProcedure(function (args) {
		return args[0] <= args[1];
		}),
	'>=': new evaluator.NativeProcedure(function (args) {
		return args[0] >= args[1]; 
		}),
	'=': new evaluator.NativeProcedure(function  (args) {
		return args[0] === args[1];
		})
};			
