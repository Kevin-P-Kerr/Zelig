evaluator = {};

evaluator.List = function List(car, cdr) { this.car = car; this.cdr = cdr; };

evaluator.parse = function(input) {
	var match, head = new evaluator.List(null, null), stack = [head], descending = false;
	while (input.length) {
		if ((match = input.match(/^\(/))) {
			stack[0] = stack[0][descending ? 'car' : 'cdr'] = new evaluator.List(null, null);
			stack.unshift(stack[0]);
			descending = true;
		}
		else if ((match = input.match(/^\)/))) {
			if (stack.length < 2) {
				throw new Error("Unexpected \")\"");
			}
			stack.shift();
			descending = false;
		} else if ((match = input.match(/^ +/))) {
			// Ignore whitespace
		} else if ((match = input.match(/^[^ ()]+/))) { // What are valid identifiers?
			stack[0] = stack[0][descending ? 'car' : 'cdr'] = new evaluator.List(match[0], null);
			descending = false;
		}
		input = input.substr(match[0].length);
	}
	if (stack.length > 1) {
		throw new Error("Unexpected end of input");
	}
	return head.cdr;
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
	} else if (evaluator.cadrator.test(expr)) {
		// Special case for unlimited caddaddaddar
		return evaluator.cadrator.makeProcedure(expr);
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
				return 'ok';
		} else {
			env[expr[1]] = evaluator.evaluate(expr[2], env);
			return 'ok';
		}
	},
	'quote': function (expr) {
			return expr[1];
		},
	'lambda': function (expr, env) { 
		return new evaluator.Procedure (expr[1], expr.slice(2), env);
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
evaluator.Procedure.prototype.toString = function(){
	return this.body.map(evaluator.exprToString).join(' ');
}


evaluator.exprToString = function(expr){
	if (Array.isArray(expr)) {
		return '(' + expr.map(evaluator.exprToString).join(' ') + ')';
	} else {
		return expr;
	}
}

evaluator.NativeProcedure = function (handler) {
	this.handler = handler;
};

evaluator.NativeProcedure.prototype = new evaluator.Procedure;

evaluator.NativeProcedure.prototype.call = function(args) {
	return this.handler(args);
};
evaluator.NativeProcedure.prototype.toString = function(){
	return this.handler.toString();
}

evaluator.cadrator = {
	expr: /^c([ad]+)r$/,
	car: function(l){ return l[0] },
	cdr: function(l){ return l.slice(1); },
	test: function(op){
		return this.expr.test(op);
	},
	exec: function(op, list){
		return op.match(this.expr)[1].split('').reduceRight(function(acc, op){
			return({a: this.car, d: this.cdr}[op](acc));
		}.bind(this), list);
	},
	makeProcedure: function(op){
		return new evaluator.NativeProcedure(function(args){
			return this.exec(op, args[0]);
		}.bind(this));
	}
};

evaluator.GlobalEnv = {
	'+': new evaluator.NativeProcedure(function (args) {
		return args.reduce( function (acc, x) {
			return x + acc;
		}, 0); 
	}),
	'*': new evaluator.NativeProcedure(function (args) {
		return args.reduce(function (acc, x) {
			return x * acc;
		}, 1);
	}),
	'-': new evaluator.NativeProcedure(function (args) {
		var len = args.length;
		var n = 0;
		while (n < len-1) {
			args[n+1] = args[n] - args[n+1];
			n++;
		} return args[args.length-1];
	}),
	'/': new evaluator.NativeProcedure(function (args) {
			var len = args.length;
			var n = 0;
			while (n < len-1) {
				args[n+1] = args[n] / args[n+1];
				++n;
			} return args[len-1];
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
		}),
	'eval': new evaluator.NativeProcedure(function (args) {
		return evaluator.evaluate(args[0], evaluator.GlobalEnv);
		})
};
