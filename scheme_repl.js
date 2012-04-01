#!/usr/bin/env node

var evaluator = require('./scminterp'),
	readline = require('readline'),
	rl = readline.createInterface(process.stdin, process.stdout);

require('colors');

rl.prompt();
rl.on('line', function(line) {
	try {
		evaluator.parse(line).forEach(function(expr){
			var result = evaluator.evaluate(expr, evaluator.GlobalEnv)
			if (result !== undefined) {
				console.log(result);
			}
		});
	} catch (e) {
		console.log(e.message.red);
	}
	rl.prompt();
});
rl.on('close', function(what){
	process.stdout.write('\n');
	process.exit();
});
