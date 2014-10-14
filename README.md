Jasp
====

Everyone knows that object-oriented programming is superior to the list-oriented programming
of the lisp family.  Everyone knows that JSON is superior to S-Expressions.  Introducing JASP,
a language that lets you program a Scheme-like dialect using nothing but JSON!

Here is a simply program to calculate the factorial of 100 and display it:


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

