#!/usr/bin/env node

// Jasp!

var
    fs = require("fs"),
    clog = console.log,
    cerr = console.error,
    argv = require("yargs").argv,
    fname = argv._.pop()
;

function usage () {
    return "jasp <filename>\n";
}

if (!fname) {
    cerr( usage() );
    process.exit();
}

fname = (fname[0] === '/') ? fname : './' + fname;

var prog = JSON.parse( fs.readFileSync(fname, "utf8") ),
    genv = jasp_env(false)
;


genv.defvar("+", function (x, y) { return x + y; });
genv.defvar("-", function (x, y) { return x - y; });
genv.defvar("*", function (x, y) { return x * y; });
genv.defvar("/", function (x, y) { return x / y; });
genv.defvar("%", function (x, y) { return x % y; });
genv.defvar("=",  function (x, y) { return x === y; });
genv.defvar(">",  function (x, y) { return x > y; });
genv.defvar(">=", function (x, y) { return x >= y; });
genv.defvar("<",  function (x, y) { return x < y; });
genv.defvar("<=", function (x, y) { return x <= y; });
genv.defvar("display", function (x) { console.log(x); });


function jasp_env (parental) {
    var me = { },
        iface = {
            lookup: lookup,
            defvar: defvar,
            setvar: setvar,
            extend: extend
        }
    ;

    function boo (name, msg) {
        cerr("Symbol \"" + name + "\" " + msg);
        process.exit();
    }

    function lookup (name) {
        if (me[name] !== undefined) {
            return me[name];
        }

        if (parental) {
            return parental.lookup(name);
        }

        boo(name, "not defined!");
    }

    function defvar (name, val) {
        if (me[name] !== undefined) {
            boo(name, "already defined in this environment!");
        }

        me[name] = val;
    }

    function setvar (name, val) {
        if (me[name] !== undefined) {
            me[name] = val;
            return null;
        }

        if (parental) {
            return parental.setvar(name, val);
        }

        boo(name, "not defined!");
    }

    function extend (vars) {
        var noob = jasp_env(iface);

        Object.keys(vars).forEach(
            function (k) {
                noob.defvar(k, vars[k]);
            }
        );

        return noob;
    }

    return iface;
}

function jasp_eval (code, env) {

    if (code === undefined) {
        cerr([ "WTF", code ]);
        return null;
    }

    if (code.operator) {
        var ctable = {
            "define":  jasp_define,
            "set!":    jasp_set,
            "if":      jasp_if,
            "quote":   jasp_quote,
            "lambda":  jasp_lambda,
            "eval":    function (c, env) { return jasp_eval(jasp_eval(c.code, env), env); }
        };

        var op = ctable[code.operator];

        if (op) {
            return op(code, env);
        }

        var fun = env.lookup(code.operator);

        return fun.apply(null, jasp_seq(code["arguments"], env) );
    }
    else {
        if (Array.isArray(code)) {
            return jasp_seq(code, env).pop();
        }

        if ( (typeof code === "string") && code[0] === "$") {
            return env.lookup(code.slice(1));
        }

        return code;        
    }
}

function jasp_define (code, env) {
    env.defvar(code.name, null);
    return env.setvar(code.name, jasp_eval(code.value, env));
}

function jasp_set (code, env) {
    return env.setvar(code.name, jasp_eval(code.value, env));
}

function jasp_if (code, env) {
    var is_true = jasp_eval(code.predicate, env);

    if (is_true) {
        return jasp_eval(code.then, env);
    }

    return jasp_eval(code.else, env);
}

function jasp_quote(code, env) {
    return code.value;
}

function jasp_seq(code, env) {
    function enveval (x) {
        return jasp_eval(x, env);
    }

    return code.map(enveval);
}

function jasp_lambda (code, env) {
    function jasp_apply (_, args) {
        var ext = { };

        code["arguments"].forEach(
            function (name, idx) {
                ext[name] = args[idx];
            }
        );

        var noob = env.extend(ext);

        return jasp_eval(code.body, noob);
    }

    return {
        env: env,
        formals: code["arguments"],
        body: code.body,
        apply: jasp_apply
    };
}


// Ok, go!!!

jasp_eval(prog, genv);


