module.exports = {
	prototypizeJSON,
	testObjectType
};

function testObjectType(o, oType) {	//oType - Date, Array, RegExp, Object...
"use strict";
	return (typeof o === 'object' && o !== null) ? Object.prototype.toString.call(o) === ('[object '+oType+']') : false;
}

function _prototypizeJSONnested(childO, parentO) {
"use strict";
	for (var p in childO) {
		if (testObjectType(childO[p], 'Object') && testObjectType(parentO[p], 'Object')) {
			//console.log('Recur call', childO[p], parentO[p]);
			_prototypizeJSONnested(childO[p], parentO[p]);
			//if (!parentO.isPrototypeOf(childO)) {
				childO[p]=Object.assign(Object.create(parentO[p]), childO[p]);			
			//}
		}
	}
}

function _prototypizeJSONinner(o, childName, optionsO){
"use strict";
	var parentName = o[childName][optionsO.parentProp];

	if (typeof parentName !== 'undefined' && testObjectType(o[childName], 'Object')) {
		if (!testObjectType(o[parentName], 'Object')) {
			//console.log('prototypizeJSON: Parent element is not an object: '+p+' -> '+parentName);
			throw new Error('prototypizeJSON(): Parent is not an object when trying to assign: '+p+' -> '+parentName);
		} else if (!o[parentName].isPrototypeOf(o[childName])) {
			//console.log('prototypizeJSON: Resolving first:', parentName, '(for '+p+')');
			_prototypizeJSONinner(o, parentName, optionsO);
			//console.log('prototypizeJSON: Assigning: '+p+' -> '+parentName);
			o[childName]=Object.assign(Object.create(o[parentName]), o[childName]);
			if (optionsO.nestedF) {
				_prototypizeJSONnested(o[childName], o[parentName]);
			}
		} else {
			//console.log('prototypizeJSON: Already assigned: '+p+' -> '+parentName);
		}
	}
}

function prototypizeJSON(o, optionsO) {
"use strict";
	var optionsO = Object.assign({},
	   {//default options:
		parentProp: 'PARENT',
		nestedF: true
	   },
	   optionsO
	);
		
	for (var p in o) {
		_prototypizeJSONinner(o, p, optionsO);
	}
}
