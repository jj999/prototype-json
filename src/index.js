module.exports = {
	prototypeJSON,
	testObjectType,
	setPrototype,
	deepReference
};

//https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') {
  (function () {
	Object.assign = function (target) {
	  'use strict';
	  if (target === undefined || target === null) {
		throw new TypeError('Cannot convert undefined or null to object');
	  }

	  var output = Object(target);
	  for (var index = 1; index < arguments.length; index++) {
		var source = arguments[index];
		if (source !== undefined && source !== null) {
		  for (var nextKey in source) {
			if (source.hasOwnProperty(nextKey)) {
			  output[nextKey] = source[nextKey];
			}
		  }
		}
	  }
	  return output;
	};
  })();
}

function testObjectType(o, oType) {	//oType - Date, Array, RegExp, Object...
"use strict";
	return (typeof o === 'object' && o !== null) ? Object.prototype.toString.call(o) === ('[object '+oType+']') : false;
}

function getObjectType(o) {	//returns first 3 letters of object type (Arr, Obj, Dat, Reg, Nul...) or false if it is not an object
"use strict";
	return (o === null ? (
			'Nul'
			):(typeof o === 'object' ? (
					Object.prototype.toString.call(o).substr(8,3)
				):(
					false
				)
			)
	);
}

function deepReference(o, ref) {	//returns object with 3 keys: val - value, obj - object, ref - reference: obj[ref]=val
"use strict";
	try {
		return ref.split('.').reduce(function(parO, ref){
				return {val:parO.val[ref], obj:parO.val, ref:ref};
			}, {val:o});
	} catch (e) {
		throw new Error('Refence \''+ref+'\' is not found!');
	}
}

function setPrototype(childO, childP, parentO, parentP, protoMethod) {
	switch (protoMethod) {
		case 'assignCreate':
			childO[childP]=Object.assign(Object.create(parentO[parentP]), childO[childP]);
			break;
		case 'setPrototypeOf':
			Object.setPrototypeOf(childO[childP], parentO[parentP]);
			break;
		case 'proto':
			childO[childP].__proto__=parentO[parentP];
			break;
		default:
			throw new Error('Unknown protoMethod argument.');
	}
}

function prototypeJSON(o, optionsO) {
	"use strict";
	var optionsO = Object.assign({},
		//default options:
	   {deepParent: 'DEEP_PARENT',		//deep parent property name
		shallowParent: 'SHALLOW_PARENT',//shallow parent property name
		warningAlreadyAssignedF: false,	//if warning should be displayed for already assigned child prototype (if enabled, it should normally produce output only for second run)
		protoMethod: 'assignCreate',	//method of setting prototype - 'proto', 'setPrototypeOf', 'assignCreate'
		maxRecursion: 500,				//0=disabled, otherwise max depth of recursion to 'detect' circular references
		deletePrototypesF: true,		//will also check and delete prototypes where they are not needed
		parentPropDeepLevelF: true,		//if parentProp can be in deeper levels as well (otherwise first level only)
		parentPropInArraysF: true,		//if parentProp can be in objects in Arrays (requires parentPropDeepLevelF to be true as well)			
		skipRecursionForAlreadyAssignedF: false,	//skips recursion for already assigned prototypes - enable only if you are sure it is needed
		setProtoForObjInArrayInDeepParentF: true,	//if prototypes should be set for child object inside deep parent if it exists inside array
		childPath:''					//if non-empty, then only specified child reference will be parsed
		//debugF: true
		},
	   optionsO
	);
	
	var _prototypeJSONdeepInheritance=function(childO, parentO, childNameFull, parentNameFull, recurCount, rootF) {
	"use strict";
		recurCount++;
		if (optionsO.maxRecursion && recurCount>=optionsO.maxRecursion) {
			throw new Error('maxRecursion count ('+optionsO.maxRecursion+') exceeded - possible circular reference in '+childNameFull+' ?');
		}
		if (!rootF && (childO[optionsO.shallowParent] || childO[optionsO.deepParent])) {
			var shallow=(childO[optionsO.shallowParent]) ? optionsO.shallowParent+': '+childO[optionsO.shallowParent] : void 0;
			var deep=(childO[optionsO.deepParent]) ? optionsO.deepParent+': '+childO[optionsO.deepParent] : void 0;
			var pName=(shallow && deep) ? shallow+', '+deep : shallow || deep; 
			throw new Error('Parent ('+pName+') should not be defined inside object '+childNameFull+' which parent has deepParent already set.');
		}
		
		var propsA=Object.getOwnPropertyNames(childO);
		var propsLen=propsA.length;
		for (var f=0; f<propsLen; f++) {
			var p=propsA[f];
			var childObjType=getObjectType(childO[p]);
			var parentObjType=getObjectType(parentO[p]);
			if (parentO[p] !== childO[p] && childObjType && parentObjType && childObjType===parentObjType) {	//they are not the same, they are Objects, and they are of the same object type
				if (childObjType==='Obj' || (optionsO.setProtoForObjInArrayInDeepParentF && childObjType==='Arr')) {
					if (parentObjType==='Obj' || (optionsO.setProtoForObjInArrayInDeepParentF && parentObjType==='Arr')) {
						if (!optionsO.skipRecursionForAlreadyAssignedF || !parentO[p].isPrototypeOf(childO[p])) {
							//if (optionsO.debugF) {console.log('deepInheritance: Recur call ', childO[p], parentO[p])};
							_prototypeJSONdeepInheritance(childO[p], parentO[p], childNameFull+'.'+p, parentNameFull+'.'+p, recurCount);
							
							if (childObjType!=='Arr') {		//Prototype cannnot be set for Arrays, as some methods don't work with prototypal inheritance - such as length
								if (!parentO[p].isPrototypeOf(childO[p])) {
									//if (optionsO.debugF) {console.log('deepInheritance: Assigning deep: '+p+', child -> parent', childO[p], parentO[p])};
									//if (optionsO.debugF) {console.log('deepInheritance: Assigning deep: '+childNameFull+'.'+p+' -> '+parentNameFull+'.'+p)};
									setPrototype(childO, p, parentO, p, optionsO.protoMethod);
								} else {
									if (optionsO.warningAlreadyAssignedF) {
										console.log('prototypeJSON: Already deep assigned: '+childNameFull+'.'+p+' -> '+parentNameFull+'.'+p);
									}
								}
							}

						} else {
							if (optionsO.warningAlreadyAssignedF) {
								console.log('prototypeJSON: Skipping deep recursion for already assigned: '+childNameFull+' -> '+parentNameFull);
							}
						}
					} else {
						//parent is not an object, so prototype needs to be removed from child
						if (optionsO.deletePrototypesF && Object.getPrototypeOf(childO[p])!==Object.prototype && Object.getPrototypeOf(childO[p])!==Array.prototype) {
							//if (optionsO.debugF) {console.log('*** prototypeJSON: Removing prototype from '+p+' ('+childNameFull+'.'+p+') (deep)')};
							setPrototype(childO, p, Object, 'prototype', optionsO.protoMethod);
						}
					}
				}
			} else {
				//if (optionsO.debugF) {console.log('**** Child and parent are the same: '+childNameFull+' === '+ parentNameFull);
			}
		}
	}
		
	var _prototypeJSONinner=function(globO, childO, childName, childNameFull, recurCount){ 
	"use strict";
		recurCount++;
		if (optionsO.maxRecursion && recurCount>=optionsO.maxRecursion) {
			throw new Error('maxRecursion count ('+optionsO.maxRecursion+') exceeded - possible circular reference in '+childNameFull+' ?');
		}
		
		if (!checkedO[childNameFull]) {
			var parentName = childO[childName][optionsO.deepParent] || childO[childName][optionsO.shallowParent];
			var doRecursionF=false;
			if (typeof parentName !== 'undefined') {
				if (childO[childName].hasOwnProperty(optionsO.deepParent) && childO[childName].hasOwnProperty(optionsO.shallowParent)) {
					throw new Error('Both '+optionsO.deepParent+' and '+optionsO.shallowParent+' are defined on '+childNameFull+' - only one should exist.');
				}
				//if (optionsO.debugF) {console.log('_prototypeJSONinner: parentProp found in: '+childNameFull)};
				var parentO=deepReference(globO, parentName);
				if (!testObjectType(parentO.obj[parentO.ref], 'Object') ) {
					throw new Error('prototypeJSON(): Parent is not an object when trying to assign: '+childName+' -> '+parentName+' at '+childNameFull);
				}

				if (!optionsO.skipRecursionForAlreadyAssignedF || !parentO.obj[parentO.ref].isPrototypeOf(childO[childName])) {
					if (!optionsO.dontFollowParentF) {
						//if (optionsO.debugF) {console.log('** prototypeJSON: Resolving first:', parentName, '(for '+childName+'), parent.ref: '+parentO.ref )};
						_prototypeJSONinner(globO, parentO.obj, parentO.ref, parentName, recurCount);
					}
					
					if (!parentO.obj[parentO.ref].isPrototypeOf(childO[childName])) {
						//if (optionsO.debugF) {console.log('*** prototypeJSON: Assigning: '+childName+' ('+childNameFull+') -> '+parentName)};
						setPrototype(childO, childName, parentO.obj, parentO.ref, optionsO.protoMethod);
					} else {
						if (optionsO.warningAlreadyAssignedF) {
							console.log('prototypeJSON: Already assigned: '+childNameFull+' -> '+parentName);
						}
					}

					//if (optionsO.deepInheritanceF) {
					if (childO[childName][optionsO.deepParent]) {	//deep parent:
						_prototypeJSONdeepInheritance(childO[childName], parentO.obj[parentO.ref], childNameFull, parentName, recurCount, true);
					} else {	//shallow parent:
						doRecursionF=true;
					}
				} else {
					if (optionsO.warningAlreadyAssignedF) {
						console.log('prototypeJSON: Skipping recursion for already assigned: '+childNameFull+' -> '+parentName);
					}
				}
			} else {
				//no parent in an object => there should be no link
				if (optionsO.deletePrototypesF && Object.getPrototypeOf(childO[childName])!==Object.prototype && Object.getPrototypeOf(childO[childName])!==Array.prototype) {
					//debugger;
					//if (optionsO.debugF) {console.log('*** prototypeJSON: Removing prototype from '+childName+' ('+childNameFull+')')};
					setPrototype(childO, childName, Object, 'prototype', optionsO.protoMethod);
				}
				if (optionsO.parentPropDeepLevelF) {
					doRecursionF=true;
				}
			}
			
			if (doRecursionF) {
				//if (optionsO.debugF) {console.log('* Processing inner: '+childNameFull)};
				var propsA=Object.getOwnPropertyNames(childO[childName]);
				var propsLen=propsA.length;
				for (var f=0; f<propsLen; f++) {
					var p=propsA[f];
					//if (optionsO.debugF) {console.log('_prototypeJSONinner: Checking for parent props for: '+childName+'.'+p+' in '+childNameFull)};
					if (testObjectType(childO[childName][p], 'Object') || (optionsO.parentPropInArraysF && testObjectType(childO[childName][p], 'Array')) ) {
						//if (optionsO.debugF) {console.log('* Recursion for: '+childNameFull+'.'+p)};
						_prototypeJSONinner(globO, childO[childName], p, childNameFull+'.'+p, optionsO, recurCount);
					}
				}
			}
			
			//if (optionsO.debugF) {console.log('*** Adding into bypass list: '+childNameFull)};
			checkedO[childNameFull]=true;
			
		} else {
			//if (optionsO.debugF) {console.log('* Skipping: '+childName+' ('+childNameFull+')')};
		}
	}
	
	if (optionsO.deepParent===optionsO.shallowParent) {
		throw new Error('Options deepParent and shallowParent should not have the same values');
	}
	
	if (o[optionsO.deepParent] || o[optionsO.shallowParent]) {
		throw new Error('Parent in the root of main object is not supported.');
	}
	
	var checkedO={};		//object of finished properties
	
	if (optionsO.childPath==='') {
		//for (var p in o) {
		var propsA=Object.getOwnPropertyNames(o);
		var propsLen=propsA.length;
		for (var f=0; f<propsLen; f++) {
			var p=propsA[f];
			if (testObjectType(o[p], 'Object') || (optionsO.parentPropInArraysF && testObjectType(o[p], 'Array')) ) {
				//if (optionsO.debugF) {console.log('prototypeJSON: First level check for: '+p)};
				_prototypeJSONinner(o, o, p, p, 0);
			}
		}
	} else {
		var childO=deepReference(o, optionsO.childPath);
		//_prototypeJSONinner(o, childO.obj, childO.ref, childO.ref, 0);
		optionsO.dontFollowParentF=true;	//internal option
		_prototypeJSONinner(o, childO.obj, childO.ref, optionsO.childPath, 0);
	}
}
