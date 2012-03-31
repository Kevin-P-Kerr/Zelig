evaluator = {};

evaluator.List = function List(car, cdr) { this.car = car; this.cdr = cdr; };

// Beware! These are all recursive.
evaluator.List.prototype.map = function(proc){
	return new evaluator.List(proc(this.car), this.cdr ? this.cdr.map(proc) : null);
};
evaluator.List.prototype.forEach = function(proc){
	proc(this.car);
	if (this.cdr) {
		this.cdr.forEach(proc);
	}
};
evaluator.List.prototype.toString = function(inner){
	var out = [], list = this;
	while (list != null){
		out.push(list.car instanceof this.constructor ? list.car.toString(true) : list.car);
		list = list.cdr;
	}
	return (inner ? '' : "'") + "(" + out.join(' ') + ')';
}

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
	if (expr instanceof evaluator.List) {
		if (expr.car in evaluator.SpecialForms) {
			return evaluator.SpecialForms[expr.car](expr, env);
		} else {
			evaluatedList = expr.map(function(expr){
				return evaluator.evaluate(expr, env);
			});
			return evaluatedList.car.call(evaluatedList.cdr);
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
		if (expr.cdr.car instanceof evaluator.List) {
			env[expr.cdr.car.car] = new evaluator.Procedure(expr.cdr.car.cdr, expr.cdr.cdr, env);
		} else {
			env[expr.cdr.car] = evaluator.evaluate(expr.cdr.cdr.car, env);
		}
	},
	'quote': function (expr) {
			return expr.cdr.car;
		},
	'lambda': function (expr, env) { 
		return new evaluator.Procedure(expr.cdr.car, expr.cdr.cdr, env);
	}
		
				
};

evaluator.extractTest = function (expr) {
	if (expr.car === 'if') {
		return expr.cdr.car;
	} else {
		throw Error("If Error");
	}
};

evaluator.extractResult = function (expr) {
	if (expr.car === 'if') {
		return expr.cdr.cdr.car;
	} else {
		throw Error("If Consequent Error");
	}
};

evaluator.extractElse = function (expr) {
	if (expr.car === 'if') {
		return expr.cdr.cdr.cdr.car;
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
	var env = Object.create(this.env), ret = undefined, expr;
	this.formal_args.forEach(function(arg){
		env[arg] = args.car;
		args = args.cdr;
	});
	for (expr = this.body; expr != null; expr = expr.cdr) {
		ret = evaluator.evaluate(expr.car, env);
	}
	return ret;
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
	car: function(l){ return l.car; },
	cdr: function(l){ return l.cdr; },
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
			return this.exec(op, args.car);
		}.bind(this));
	}
};

evaluator.GlobalEnv = {
	'+': new evaluator.NativeProcedure(function (args) {
		var total = 0;
		while (args != null) {
			total += args.car;
			args = args.cdr;
		}
		return total;
	}),
	'*': new evaluator.NativeProcedure(function (args) {
		var total = 1;
		while (args != null) {
			total *= args.car;
			args = args.cdr;
		}
		return total;
	}),
	'-': new evaluator.NativeProcedure(function (args) {
		var total = 0;
		while (args != null){
			total -= args.car;
			args = args.cdr;
		}
		return total;
	}),
	'/': new evaluator.NativeProcedure(function (args) {
		var total = args.car;
		args = args.cdr;
		while (args != null) {
			total /= args.car;
			args = args.cdr;
		}
		return total;
	}),
	'<': new evaluator.NativeProcedure(function (args) {
		return args.car < args.cdr.car;
	}),
	'>': new evaluator.NativeProcedure(function (args) {
		return args.car > args.cdr.car;
	}),
	'<=': new evaluator.NativeProcedure(function (args) {
		return args.car <= args.cdr.car;
	}),
	'>=': new evaluator.NativeProcedure(function (args) {
		return args.car >= args.cdr.car;
	}),
	'=': new evaluator.NativeProcedure(function  (args) {
		return args.car === args.cdr.car;
	}),
	'eval': new evaluator.NativeProcedure(function (args) {
		return evaluator.evaluate(args.car, evaluator.GlobalEnv);
	})
};
