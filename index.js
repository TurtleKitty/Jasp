#!/usr/bin/env node

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
//clog("HAS OP");
        var ctable = {
            "define":  jasp_define,
            "set":     jasp_set,
            "if":      jasp_if,
            "quote":   jasp_quote,
            "lambda":  jasp_lambda
        };

        var op = ctable[code.operator];

        if (op) {
            return op(code, env);
        }

        var fun = env.lookup(code.operator);

//cerr({ FUN: fun });

        return fun.apply(null, jasp_seq(code["arguments"], env) );
    }
    else {
        if (Array.isArray(code)) {
//clog("IS SEQ");
            return jasp_seq(code, env).pop();
        }

        if ( (typeof code === "string") && code[0] === "$") {
//clog("IS REF");
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
    return code["arguments"][0];
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

//cerr([ "JASP-APPLY", code, args ]);
        code["arguments"].forEach(
            function (name, idx) {
                ext[name] = args[idx];
            }
        );

        var noob = env.extend(ext);

//cerr([ "NOOB-LOOKUP", code["arguments"][0], noob.lookup(code["arguments"][0]) ]);
        return jasp_eval(code.body, noob);
    }

    return {
        env: env,
        formals: code["arguments"],
        body: code.body,
        apply: jasp_apply
    };
}


var jfn = jasp_lambda(
    {
        operator: "lambda",
        "arguments": [ "x" ],
        "body": {
            operator: "*",
            "arguments": [ "$x", "$x" ]
        }
    },
    genv
);

// clog( jfn.apply(4) );

/*

jasp_eval(
    {
        operator: "display",
        arguments: [
            [
                { operator: "define", name: "x", value: 2 },
                { operator: "define", name: "y", value: 3 },
                { operator: "display", arguments: [ "$x" ] },
                { operator: "display", arguments: [ "$y" ] },
                { operator: "set", name: "x", value: 3 },
                { operator: "if", predicate: { operator: "=", arguments: [ "$x", "$y" ] }, then: "Yay!", else: "Boo!" }
            ]
        ]
    },
    genv
);

*/


jasp_eval(prog, genv);


/*

    {
        operator: "define",
        name: "foo",
        value: 1
    },

    {
        operator: "set!",
        name: "foo",
        value: 2
    },

    {
        operator: "if",
        predicate: ... ,
        then: ... ,
        else: ... ,
    },

    {
        operator: "quote",
        arguments: [ ... ]
    },

    {
        operator: "lambda",
        arguments: [ "x", "y" ]
        body: ...
    },

    {
        operator: "foo",
        arguments: [ 1, 2, 3 ]
    },

*/
