Jasp
====

Everyone knows that object-oriented programming is superior to the list-oriented programming
of the Lisp family, and that JSON is superior to S-Expressions.  Introducing Jasp,
a language that lets you program in a Scheme-like dialect using nothing but JSON!

**Jasp syntax**

```javascript

    // symbol definition

    {
        "operator": "define",
        "name": <string>,
        "value": <expr>
    }

    // mutation

    {
        "operator": "set!",
        "name": <string>,
        "value": <expr>
    }

    // reference

    /* 
        if "x" is defined in the current environment,
        "$x" returns the value,
        whereas "x" is just a string

        The dollar sign is not necessary if the referenced symbol is in the operator position.
    */

    // branching

    {
        "operator:" "if",
        "predicate": <expr> ,
        "then": <expr>,
        "else": <expr>
    }

    // sequencing

    // Jasp interprets naked arrays as sequences of instructions, like (begin) in Scheme.

    [
        { "operator": "set!", "name": "x", "value": 2 },
        { "operator": "display", "arguments": [ "$x" ] },
        "$x" // returns the value of "x" from the sequence
    ]

    // quotation

    {
        "operator": "quote",
        "value": <expr>
    }

    // abstraction

    {
        "operator": "lambda",
        "arguments": [ "string", "string", ... ]
        "body": <expr> // (can be an array, interpreted as a sequence)
    }

    // function application

    {
        "operator": "foo",
        "arguments": [ 1, 2, 3 ]
    }

    // reflection

    {
        "operator": "eval",
        "code": <quoted-expr>
    }

```

Here is a simple program to calculate the factorial of 100 and display it:


```json

[

    {
        "operator": "define",
        "name": "fact",
        "value": {
            "operator": "lambda",
            "arguments": [ "n" ],
            "body": {
                "operator": "if",
                "predicate": { "operator": "=", "arguments": [ "$n", 0 ] },
                "then": 1,
                "else": {
                    "operator": "*",
                    "arguments": [
                        "$n",
                        {
                            "operator": "fact",
                            "arguments": [
                                {
                                    "operator": "-",
                                    "arguments": [ "$n", 1 ]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },

    {
        "operator": "display",
        "arguments": [
            {
                "operator": "fact",
                "arguments": [ 100 ]
            }
        ]
    }

]


```

$ ./index.js fact.jasp  

9.33262154439441e+157


