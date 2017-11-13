# prototype-json

* adds prototypal inheritance into JSON object
* supports two types of parent - deep and shallow
* shallow parent adds YAML-like functionality into native JSON

## usage and additional info:

- prototypeJSON(o, options)  - takes two arguments - object name and options; it updates prototypes of object o
- options and defaults:
```js
{
  deepParent: 'DEEP_PARENT',		//deep parent property name
  shallowParent: 'SHALLOW_PARENT',	//shallow parent property name
  warningAlreadyAssignedF: false,	//if warning should be displayed for already assigned child prototype
  protoMethod: 'assignCreate',		//method of setting prototype - 'proto', 'setPrototypeOf', 'assignCreate'
  maxRecursion: 500,			//0=disabled, otherwise max recursion depth to 'detect' circular references
  childPath:''				//if non-empty, then only specified child reference will be parsed
}
```

- parents can be chained - one parent can point to another parent
- deep and shallow parents can be combined within the same JSON object
- parents can use 'deep' references with dot - such as 'default.stooges'
 * arrays are supported in parent references - for example 'x.1.b' - will reference 'b' in {x:[ {a:1}, {b:2} ]}
- deep parent will set prototypes in objects inside array as well, but arrays themselves won't have their prototype changed

## Deep parent example:

```js
let customer={
  shipping_details: {   street:       'London Road',
                        house_number: '1a',
                        post_code:    'WX1 ABC',
                        phone_numbers:  {
                          home: '1234',
                          office: '4321'
                        }
  },
  billing_details:  {   phone_numbers: {
			work: '678'
						},
                        DEEP_PARENT:  'shipping_details' 
  }
}

prototypeJSON(customer);

console.log(customer.billing_details.house_number);
//response: '1a'

console.log(customer.billing_details.phone_numbers.home);
//response: '1234' - works because parent is 'deep'
```

## Shallow parent example / Yaml-like references in JSON using prototypeJSON:

```js
let x={ 'default': {
          URL: 'stooges.com',
          throw_pies: true,
          stooges: {  larry: 'first_stooge',
                      moe: 'second_stooge'
		  }
        },
        'development': {
          SHALLOW_PARENT: 'default',
          URL: 'stooges.local',
          stooges: { shemp: 'fourth_stooge' }
        },
        'test': {
          SHALLOW_PARENT: 'default',
          URL: 'test.stooges.qa',
          stooges: { SHALLOW_PARENT: 'default.stooges',
                     larry: 'larrys_stooge'
		  } 
        }
}

prototypeJSON(x);

console.log(x.development.stooges.moe);
//response: undefined - because parent is shallow

console.log(x.test.stooges.moe);
//response: 'second_stooge' - because test.stooges has parent defined as well
```
