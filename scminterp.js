evaluator = {};

evaluator.List = function List(car, cdr) { this.car = car; this.cdr = cdr; };

evaluator.List.prototype.map = function(proc){
	var head = new evaluator.List(null, null), tail = head;
	this.forEach(function(item, i, list){
		tail = tail.cdr = new evaluator.List(proc(item, i, list), null);
	});
	return head.cdr;
};
evaluator.List.prototype.length = function(){
	var l = 0;
	this.forEach(function(){ l++; });
	return l;
};
evaluator.List.prototype.forEach = function(proc){
	var item, i = 0;
	for (item = this; item instanceof evaluator.List; item = item.cdr, i++) {
		proc(item.cdr instanceof evaluator.List || item.cdr === null ? item.car : item, i, this);
	}
};
evaluator.List.prototype.toString = function(inner){
	var out = [], list = this;
	while (list != null){
		if (!(list instanceof evaluator.List)) {
			out.push('.', list);
			break;
		}
		out.push(list.car instanceof evaluator.List ? list.car.toString(true) : evaluator.exprToString(list.car, true));
		list = list.cdr;
	}
	return (inner ? '' : "'") + "(" + out.join(' ') + ')';
}

evaluator.parse = function(input) {
	var match, token, head = new evaluator.List(null, null), stack = [head], descending = false;
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
		} else if ((match = input.match(/^\s+/))) {
			// Ignore whitespace
		} else if ((match = input.match(/^[^\s()]+/))) { // What are valid identifiers?
			if (match[0] === 'null') {
				token = null;
			} else if (evaluator.isnumber(match[0])) {
				token = +match[0];
			} else {
				token = match[0];
			}
			stack[0] = stack[0][descending ? 'car' : 'cdr'] = new evaluator.List(token, null);
			descending = false;
		}
		input = input.substr(match[0].length);
	}
	if (stack.length > 1) {
		throw new Error("Unexpected end of input");
	}
	return head.cdr;
};

// Cheating
evaluator.Frame = function Frame(properties) {
	for (var k in properties){
		this[k] = properties[k];
	}
};

evaluator.evaluate = function evaluate(expr) {
	var stack = [new this.Frame({ body: expr, env: this.GlobalEnv })],
		result = undefined, frame, ret, instruction,
		maxStackDepth = 0;
	newframe:
	while (stack.length) {
		frame = stack[0];
		while (frame.body) {
			instruction = frame.body.car;
			frame.body = frame.body.cdr;
			if (instruction instanceof evaluator.List) {
				if (instruction.car in evaluator.SpecialForms) {
					ret = evaluator.SpecialForms[instruction.car](instruction, frame.env);
					if (ret instanceof this.Frame) {
						stack.unshift(ret);
						continue newframe;
					} else {
						result = ret;
					}
				} else {
					stack.unshift(new this.Frame({ body: instruction, env: frame.env, list: [] }));
					continue newframe;
				}
			} else if (typeof instruction === 'number' || instruction === null) {
				result = instruction;
			} else if (instruction in frame.env) {
				result = frame.env[instruction];
			} else if (evaluator.cadrator.test(instruction)) {
				// Special case for unlimited caddaddaddar
				result = evaluator.cadrator.makeProcedure(instruction);
			} else if (instruction in evaluator.SpecialForms || instruction in evaluator.specialIdentifiers) {
				throw new Error("\"" + instruction + "\" cannot be used as an expression");
			} else {
				throw new Error("\"" + instruction + "\" is not defined");
			}
			if ('list' in frame) {
				frame.list.push(result);
			}
		}
		if (stack.length > maxStackDepth) maxStackDepth = stack.length;
		stack.shift();
		if ('list' in frame || 'callback' in frame) {
			if ('list' in frame) {
				ret = frame.list[0].prepare(frame.list.slice(1));
			} else if ('callback' in frame) {
				ret = frame.callback(result);
			}
			if (ret instanceof this.Frame) {
				if (stack.length && stack[0].body === null && !('list' in stack[0]) && !('callback' in stack[0])) {
					stack[0] = ret;
				} else {
					stack.unshift(ret);
				}
			} else {
				result = ret;
			}
		}
		if (stack.length && 'list' in stack[0]) {
			stack[0].list.push(result);
		}
	}
	console.log("At most the stack had %d frames", maxStackDepth);
	return result;
};

evaluator.SpecialForms = { 
	'if': function(expr, env) {
		return new evaluator.Frame({
			body: new evaluator.List(evaluator.extractTest(expr), null),
			env: env,
			callback: function (result) {
				return new evaluator.Frame ({
					body: new evaluator.List( result ? evaluator.extractResult(expr) : evaluator.extractElse(expr), null), 
					env: env});
			}
		});
	},
	'cond': function (expr, env) {
		function testCondition(args) { 	
			if (!args) { 
				return undefined;
			} else if (args.car.car === 'else') {
				return new evaluator.Frame({ 
					body: args.car.cdr, 
					env: Object.create(env)
				}); 
			}

			return new evaluator.Frame({	
				body: new evaluator.List(args.car.car, null),
				env: env,
				callback: function aux (result) {
					return result ? new evaluator.Frame({ body: args.car.cdr, env: Object.create(env)})
						:  testCondition(args.cdr);
				}
			});
		}
		return testCondition(expr.cdr);
	},
	'define': function (expr, env) {
		if (expr.cdr.car instanceof evaluator.List) {
			env[expr.cdr.car.car] = new evaluator.Procedure(expr.cdr.car.cdr, expr.cdr.cdr, env);
		} else {
			return new evaluator.Frame({
				body: new evaluator.List(expr.cdr.cdr.car, null),
				env: env,
				callback: function (result) {
					env[expr.cdr.car] = result;
				}
			});
		}
	},
	'quote': function (expr) {
			return expr.cdr.car;
		},
	'lambda': function (expr, env) { 
		return new evaluator.Procedure(expr.cdr.car, expr.cdr.cdr, env);
	}
		
				
};
// Additional special identifiers (for error handling in evaluate())
evaluator.specialIdentifiers = { 'else': true };

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
	this.argc = formal_args ? formal_args.length() : 0;
	this.body = body;
	this.env = env;
}

evaluator.Procedure.prototype.prepare = function(args) {
	var env = Object.create(this.env);
	if (args.length != this.argc) {
		throw new Error("Expects " + this.argc + " argument" + (this.argc === 1 ? '' : 's') + ", got " + args.length);
	}
	if (this.formal_args) {
		this.formal_args.forEach(function(arg, index){
			env[arg] = args[index];
		});
	}
	return new evaluator.Frame({body: this.body, env: env});
};

evaluator.Procedure.prototype.toString = function(){
	return this.body.map(evaluator.exprToString).join(' ');
}


evaluator.exprToString = function(expr, inner){
	if (Array.isArray(expr)) {
		return '(' + expr.map(evaluator.exprToString).join(' ') + ')';
	} else if (expr === null) {
		return inner ? '()' : '\'()';
	} else {
		return expr;
	}
}

evaluator.NativeProcedure = function (handler) {
	this.handler = handler;
};

evaluator.NativeProcedure.prototype = new evaluator.Procedure;

evaluator.NativeProcedure.prototype.prepare = function(args) {
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
		if (args.length < 1) throw new Error("division needs at least one argument");
		return args.reduce(function(acc, n){ return acc / n; }, 1);
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
		return new evaluator.Frame({body: new evaluator.List(args[0], null), env: evaluator.GlobalEnv});
	}),
	'null?': new evaluator.NativeProcedure(function (args) {
		return args[0] === null;
	}),
	'cons': new evaluator.NativeProcedure(function (args) {
		return new evaluator.List(args[0], args[1]);
	})
};

if (typeof module !== 'undefined') {
	module.exports = evaluator;
}
