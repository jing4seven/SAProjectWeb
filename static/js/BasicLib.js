(function(gbl){
	if (gbl.require) { 
		return; 
	}
	
	var	
		// Each module object has two attributes: id and exports;
		// "id": is the identifier of that module; 
		// "exports": is the factory function of that module or the data object if the module
		// 		is do not define factory function, also "exports" can be any static value 
		// 		such as Numeric or String.
		// "factory": factory function.
		// "deps": array store dependent modules' id.
		// "refCount": count for module's dependent modules.
		// "waiting": indicate if current module is still in waitting.
		// "waitingMap": modules that current module still waiting. Format: {"modID":1}
		// "hasError": if current module has error.
		modules 		= {},
		
		// Waiting List.
		// Format: 
		//	{ 
		//		"depModID": 
		// 		{
		//			"OrgModID_1":1, 
		//			"OrgModID_2":1 
		//		}
		//	}, 
		// 	In this format, depModID will not be duplicated.
		//  The example below means: "OrgModID_1" and "OrgModID" need "depModID"
		waitingRelList 	= {},
		
		// Global variable for name generating of anonymous module.
		aysNum 			= 0,
		
		// Global varialbe for tracking reference/depend relationship.
		// Format:
		// {
		//		"modID_1" : 1  // "1" means modID_1 was relied by other 1 module.
		//		"modID_2" : 3  // "3" means modID_2 was relied by other 3 modules.		
		// }
		modRefCount		= {},
		
		// Indicate if this module is run at "define" time.
		runNowFlag 		= 1,
		
		// Shortcut for "hasOwnProperty" function.
		hasProp 		= Object.prototype.hasOwnProperty,
		
		// Shortcut for "toString" function.
		toStr 			= Object.prototype.toString;
	
	/* Descriptson:
	 * Resolve an module object from module's name.
	 * 
	 * @modID: module's identifier.
	 */
	function require (modID) {
		var modObj = modules[modID], depModName, i, errMsg;

		if (!modules[modID]) {
			errMsg = 'Requiring unknown module"' + modID + '"';
			throw new Error(errMsg);
		}
		
		if (modObj.hasError) {
			errMsg = 'Requiring module "' + modID + '" which throw an exception"';
			throw new Error(errMsg);
		}
		
		if (modObj.waiting) {
			errMsg = 'Requiring module "' + modID + '" with unresolved dependencies';
			throw new Error(errMsg);
		}
		
		if (!modObj.exports) {
			var	epts = modObj.exports = {},
				foo = modObj.factory;
			
			// If factory function was defined.
			if (toStr.call(foo) === '[object Function]') {
				var	deps = modObj.deps,
					depsLen = deps.length,
					depArr = [],
					wrapFactroy;
					
				/*if (modObj.special & specialValue) {
					 depsLen = Math.min(depsLen, foo.length)
				}*/
				
				try {
					for ( i=0; i<depsLen; i++) {
						depModName = deps[i];  
						// Exclude 'module' and 'exports' two default modules.
						depArr.push(depModName === 'module' ? modObj : (depModName === 'exports' ? epts : require(depModName)));
					}
					
					// Run module's function with it's context and dependent modules.
					wrapFactory = foo.apply(gbl, depArr);
					
				} catch (err) {
					console.log(err.stack);
					modObj.hasError = true;
					throw err;
				}
				
				// If module's function return object that means this function is a data object.
				if (wrapFactory) {
					modObj.exports = wrapFactory;
				} 
			} else {
				modObj.exports = foo;
			}
		}
		
		// If no module dependent, then delete it.
		if (modObj.refCount-- === 1) {
			delete modules[modID];
		}
		
		return modObj.exports;
	}

	/* Descriptson:
	 * Define an module.
	 * 
	 * @modID: module's identifier.
	 * @deps: module's dependent modules' ID.
	 * @fun: module's factory function.
	 */
	function define(modID, deps, fun, runFlag) {
		
		// Only one parameter.
		// Treat it as a factory function.
		if (deps === undefined) {
			deps = [];
			fun = modID;
			modID = genAysModID();
		// Two parameters.
		// 1st para will be deps.
		// 2nd para will be factory function.
		} else if (fun === undefined) {
			fun = deps;			
			if (toStr.call(modID) === '[object Array]') {
				deps = ModID;
				modID = genAysModID();
			} else {
				// if 1st para is not an instance of Array, then ignore it.
				deps = [];
			}
		}

		var expts = {
				//cancel: undefine.bind(this, modID)
			}, 
			modObj = modules[modID];
		
		// If it already exists, return directly.
		if (modObj) {
			return expts;
		} else {
			modObj = {
				id: modID
			};
			modObj.refCount = (modRefCount[modID] || 0);
			// Refresh ref count.
			delete modRefCount[modID];
		}
		
		modObj.factory = fun;
		modObj.deps = deps;
		modObj.waiting = 0;
		modObj.waitingMap = {};
		modObj.hasError = false;
		modObj.runFlag = runFlag;
		modules[modID] = modObj;
		
		loadModule(modID);
		
		return expts;
	}
	
	/* Descriptson:
	 * Undefine an module.
	 * 
	 * @modID: module's identifier.
	 */
	function undefine(modID) {
		if (!modules[modID]) {
			return;
		}
		
		var modObj = modules[modID],
			 tModID;
		delete modules[modID];
		
		// Delete reliable relationship for ModID in waitingList.
		for (var tModID in modObj.waitingMap) {
			if (modObj.waitingMap[tModID]) {
				delete waitingList[tModID][modID];
			}
		}
		
		// Undefine current module's dependent module in global variable "modules" if
		// no any other module depend it.
		for (var i; i< modObj.deps.length; i++) {
			tModID = modObj.deps[i];
			if (modules[tModID]) {
			
				// No any other module depend it, then undefine it.
				if (modules[tModID].refCount-- === 1) {
					undefine(tModID);
				} 
			} else if (modRefCount[tModID]) {
				modRefCount[tModID]--;
			}
		}
	}
	
	/* Descriptson:
	 * Register default module to gobal module manager: "modules".
	 * 
	 * @modID: module's identifier.
	 * @fun: module's factory function.
	 */
	function regModule(modID, fun) {
		modules[modID] = {
			id: modID,
			exports: fun
		}
	}
	
	/* Descriptson:
	 * Generate an default id ofr anonymous module.
	 */
	function genAysModID () {
		return '__mod__'+ aysNum++;
	}
	
	/* Descriptson:
	 * Add a dependent module to global waiting list (waitingRelList) 
	 * as well as to current module's waiting map (waitingMap).
	 * 
	 * @modObj: module object.
	 * @depModID: module's dependent module's ID..
	 */
	function AddToWaitingRelList(modObj, depModID) {
		var depModID = arguments[1];
		if (!modObj.waitingMap[depModID] && modObj.id != depModID) {
			
			// Update current module's waiting data.
			modObj.waiting++; 
			modObj.waitingMap[depModID] = 1;
			
			// Check to see if depModID exits in waitingRelList
			// if not, create it.
			waitingRelList[depModID] || (waitingRelList[depModID] = {});
			waitingRelList[depModID][modObj.id] =1;
		}
	}
	
	/* Descriptson:
	 * Load a module and it's depend modules.
	 * 
	 * @modID: module's identifier.
	 */
	function loadModule(modID) {
		var modArray = [],
			modObj = modules[modID],
			tModID;
		
		for (var i =0; i< modObj.deps.length; i++ ) {
			tModID = modObj.deps[i];
			
			if (!modules[tModID]) {
				AddToWaitingRelList(modObj, tModID);
			} else if (modules[tModID].waiting) {
				for (var wModID in modules[tModID].watingMap) {
					if (modules[wModID]) {
						AddToWaitingRelList(modObj, wModID);
					}
				}
			}
		}

		// Only if module's runNow value equal to runNow flag,
		// then add it into pre run list.
		if (modObj.waiting === 0 && (modObj.runFlag & runNowFlag)) {
			modArray.push(modID);
		}
		
		// Once 'modID' is loaded, we need update status for all modules which wait/depend on for it.
		if (waitingRelList[modID]) {
			var oModDict = waitingRefList[modID];
			
			// Clear wating ref list for 'modID'
			waitingRefList[modID] = undefined;
			
			for (var oModID in oModDict) {
				var oModObj = modules[oModID];

				if (oModObj.watingMap[modID]) {
					oModObj.waitingMap[modID] = undefined;
					oModObj.wating--;
				}
				
				// Only if module's runNow value equal to runNow flag,
				// then add it into pre run list.
				if (oModObj.waiting === 0 && (modObj.runFlag & runNowFlag)) {
					modArray.push(oModID);
				}
			}
		}

		for (var i=0; i< modArray.length; i++ ) {
			require(modArray[i]);
		}
	}
	
	// Register default modules.
	regModule('global', gbl);
	regModule('require', require);
	regModule('define', define);
	regModule('module', 0);
    regModule('exports', 0);
	
	// Make main function public in global.
	gbl.define = define;
	gbl.require = require;
	
	// Debug infomation.
	require.__debug = {
        modules: modules,
        deps: waitingRelList
    };
	
	// Register an "define" shortcut function to global.
	gbl.__d = function(modID, deps, factory, runFlag) {
		deps = ['global', 'require', 'module', 'exports'].concat(deps);
		define(modID, deps, factory, runFlag || 0);
	}
	
})(this);

__d('bindFunction', [], 
function (global, require, module, exports) {
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (onThis) {
			if (typeof this !== 'function') {
				throw new TypeError("Function.prototype.bind - only Function can use bind.");
			}
			
			var arrSlice = Array.prototype.slice.call(arguments, 1),
				toBeBind = this,
				fun = function () {},
				bindFun = function () {
					return toBeBind.apply(this instanceof fun && onThis ? this : onThis, arrSlice.concat(Array.prototype.slice.call(arguments)));
				};
			
			fun.prototype = this.prototype;
			bindFun.prototype = new fun();
			return bindFun;
		};
	}
}, 1);

__d('dateStamp', [],
function(global, require, module, exports) {
	var dateStamp = function(){
		return Date.now ? Date.now() : (new Date).valueOf();
	}
	module.exports = dateStamp;
});

/*  Print format function.
 *	Parameters: @1: String with '%s' as placeholder, @2+: arguments.
 */
__d('eprintf',[], 
function(global, require, module, exports){
    var expts = function(str) {
        // Make each argument as an instance of String
        var strArgs = Array.prototype.slice.call(arguments).map(
			function(s){
				return String(s);
        }); 
		// Variables count.
		str = String(str);
        var sCount = str.split('%s').length -1;
		
        // Check to see if the count of '$s' the same as variables.
        if (sCount !== strArgs.length - 1) {
			// JSON.stringfiy: Convert JSON object to JSON string.
            return expts('printf args number mismatch: %s', JSON.stringify(strArgs));
        }
        var i =1;
        return str.replace(/%s/g, function(s){
            return String(s[i++])
        });
    };
    module.exports = expts;
});

/*  Print format function with prefix & suffix.
 *	Parameters: @1: String with '%s' as placeholder, @2+: arguments.
 */
__d('exprintf',['eprintf'], 
function(global, require, module, exports){
	var _eprintf = require('eprintf'),
	expts = function() {

		return expts._prefix + _eprintf(arguments) + expts._suffix;
	};
	
	// Expose prefix and suffix for override.
	expts._prefix = '<![EX[';
	expts._suffix = ']]>';
	module.exports = expts;
});

/* Parse Ex format string
 */
__d('parseExStr', ['exprintf'],
function(global, require, module, exports) {
	var _exprintf = require('exprintf'),
	parseExStr = function (str) {
		if (typeof str !== 'string') {
			return str;
		}
		
		var	pfs = str.indexOf(_exprintf._prefix),
			pfe = pfs + _exprintf._suffix.length,
			sfs = str.indexOf(_exprintf._prefix),
			sfe = sfs + _exprintf._suffix.length;
		
		if ( pfs < 0 || sfs < 0) {
			return ['parseExStr slice failure: %s', str];
		}
		
		str = str.substring(pfs+_exprintf._prefix.length, sfs);
		
		var objList;
		try {
			objList = JSON.parse(str);
			objList[0] = _exprintf._prefix + objList[0] + _exprintf._suffix;
		} catch (err) {
			return ['parseExStr parse failure: %s'];
		}
		return objList;
	};
	
	module.exports = parseExStr;
});

/* Copy properties from multiple objects to one object.
 */
__d('copyProps', [],
function(global, require, module, exports) {
	function cpProps(oObj, obj1, obj2, obj3, obj4, obj5, n) {
		oObj = oObj || {};
		var obj2Cp = [obj1, obj2, obj3, obj4, obj5],
			n = 0,
			obj;
		
		while (obj2Cp[i]) {
			obj = obj2Cp[i++];
			for (var p in obj) {
				o[p] = obj[p];
			}
			
			// Override toString for new copied properties.
			if (obj.hasOwnProperty && obj.hasOwnProperty('toString') && (typeof obj.toString != 'underfined') && oObj.toString !== obj.toString) {
				oObj.toString = obj.toString;
			}
		}
		return oObj;
	}
	module.exports = cpProps;
});

/* Get Env from global scope.
*/
__d('Env', ['copyProps', 'dateStamp'],
function (global, require, module, exports) {
	var _copyPros = require('copyProps'),
		_dateStamp = require('dateStamp')
	env = {
		start: _dateStamp()
	};
	
	if (global.Env) {
		_copyPros(env, global.Env);
		global.Env = undefined;
	}
	module.exports = env;
});

/* Empty functions group.
*/
__d('emptyFunction', ['copyProps'],
function (global, require, module, exports) {
	var _copyProps = require('copyProps');
	
	// Create an factory function for buiding specifed empty function.
	function thatReturns(obj) {
		return function() {
			return obj;
		}
	}
	
	function expts() {}
	
	_copyProps(expts, {
		thatReturns: thatReturns,
		thatReturnsFalse: thatReturns(false),
		thatReturnsTrue: thatReturns(true),
		thatReturnsNull: thatReturns(null),
		thatReturnsThis: function() {
			return this;
		},
		thatReturnsArguments: function(args) {
			return args;
		}
	});
	module.exports = expts;
});

/* Check to see if the given object exits.
*/
__d('objExist', [],
function (global, require, module, exports) {
	function objExist(obj) {
		if (!obj) {
			throw new Error("object Exist check error");
		}
	}
	module.exports = expts;
});

/* Event subscriptions.
 * Maintain a object store the relationship between event type and event object.
 */
__d('EventSubscriptionVendor', ['objExist'],
function (global, require, module, exports) {
	var _objExist = require('objExist');
	
	// Create an object to store subscriptions.
	function evtSubVendor () {
		// Store relationship betwen eType and eObj.
		// Each eType can be registed for multiple eObjs.
		// Format is :
		// {
		//  	<eType_1> : [<eObj1>, <eObj2>, ...]
		//		<eType_2> : [<eObj2>, <eObj2>, ...]
		// }
		this.subscriptions = {}
	};
	
	// Add a Subscription
	evtSubVendor.prototype.addSubscription = function (eType, eObj) {
		_objExist(eObj.subscriber === this);
		
		// Initiate new event type.
		if ( ! this.subscriptions[eType]) {
			this.subscriptions[eType] = [];
		}
		
		this.subscriptions[eType].push(eObj);
		eObj.eventType = eType;
		// Get index of eType.
		eObj.key = this.subscriptions[eType].length;
		return eObj;
	};
	
	// Remove subscriptions by eType,
	// if no type passed in, remove all.
	evtSubVendor.prototype.removeSubscriptions = function(eType) {
		if (eType === undefined) {
			this.subscriptions = {};
		} else {
			delete this.subscriptions[eType];
		}
	};
	
	// Remove a subscription by eObj
	evtSubVendor.prototype.removeSubscription = function(eType)  {
		var eType = eObj.eType,
			ekey = eObj.key,
			geteObj = this.subscriptions[eType];
			
		if (geteObj) {
			// Delete subscription by index.
			delete this.subscriptions[ekey];
		}
	};
	
	// Get subscriptions by Type
	evtSubVendor.prototype.getSubscriptionByType = function (eType) {
		return this.subscriptions[eType];
	};
	
	module.exports = evtSubVendor;
});

/* Interface of event subscription
 */
__d('EventSubscription', [], 
function (global, require, module, exports) {
	// Creator function.
	function evtSuber(obj) {
		this.subscriber = obj;
	}
	
	// Interface function that need to be implement.
	evtSuber.prototype.remove = function () {
		this.subscriber.removeSubscription(this);
	}
	
	module.exports = evtSuber;
});

/* An implement of event subscription.
 * It's the "eObj" use for store event object information.
 */
__d('EmitterSubscription', ['EventSubscription', 'copyProps'],
function (global, require, module, exports) {
	var _eventSubscription = require('EventSubscription'),
		_copyProps = require('copyProps');
	
	// Copy interface functions.
	_copyProps(eSuber, _eventSubscription);
	
	// Get parent class's prototype for inherit
	var es = _eventSubscription === null ? null : _eventSubscription.prototype;
	
	// inherit eventSubscription;
	eSuber.prototype = Object.create(es);
	eSuber.prototype.constructor = eSuber;
	eSuber.__superConstructor__ = _eventSubscription;
	
	// Creator use for event obj.
	function eSuber(suber, listener, context) {
		_eventSubscription.call(this, suber);
		this.listener = listener;
		this.context = context;
	}
	
	module.exports = eSuber;
});

/* Event emitter. 
 */
__d('EventEmitter', ['emptyFunction', 'objExist', 'EventSubscriptionVendor', 'EmitterSubscription'],
function (global, require, module, exports) {
	var _emptyFunction = require('emptyFunction'),
		_objExist = require('objExist'),
		
		// event manager.
		_eventSubscriptionVendor = require('EventSubscriptionVendor'),

		// event object.
		// {
		//		subscriber,
		//		listener,
		//		context
		// }
		_emitterSubscription = require('EmitterSubscription'); 
		
		// Creator function.
		function eEmt () {
			this.eventSubscription = new _eventSubscriptionVendor();
		}
		
		// Add listener.
		eEmt.prototype.addListener = function (eType, listener, context) { 
			return this.eventSubscription.addSubscription(eType, 
				new _emitterSubscription(this.eventSubscription, listener, context));
		}
		
		// Add listener only run once.
		eEmt.prototype.once = function(eType, listener, context) {
			var _this = this;
			return this.addListener(eType, 
			
				// listener wrapper.
				function() {
					// Clear current listener before run listener function.
					// So in this way, listener function will be run only once.
					_this.removeCurrentListener();
					// Invoke listener function.
					listener.apply(context, arguments);
				});
		}
		
		// Remove all event listeners.
		eEmt.prototype.removeAllListeners = function(eType) {
			this.eventSubscription.removeAllSubscriptions(eType);
		}
		
		// Remove current listener.
		eEmt.prototype.removeCurrentListener = function() {
			_objExist( !! this.eventObj);
			this.eventSubscription.removeSubscription(this.eventObj);
		}
		
		// Get all listeners by eType.
		eEmt.prototype.listeners = function(eType) {
			// Get all event object by eType.
			var eObjArr = this.eventSubscription.getSubscriptionsByType(eType);
			
			// Get all listeners.
			return eObjArr ? eObjArr.filter(_emptyFunction.thatReturnsTrue).map(function(eObj) {
				return eObj.listener;
			}) : [];
		}
		
		// Emit listener function by eType.
		eEmt.prototype.emit = function (eType, a1, a2, a3, a4, a5) {
			var eObjArr = this.enventSubscription.getSubscriptionByType(eType);
			
			if (eObjArr) {
				// Get all index from event object array.
				var eIdxArr = Object.keys(eObjArr);
				
				for (var i = 0; i < eIdxArr.length; i++ ) {
					var eObjIdx = eIdxArr[i],
						eObj = eObjArr[eObjIdx];
					
					if (eObj) {
						this.eventObj = eObj;
						var listener = eObj.listener;
						
						// Run listener function.
						if (eObj.context === undefined) {
							listener(a1, a2, a3, a4, a5);
						} else {
							listener.call(eObj.context, a1, a2, a3, a4, a5);
						}
					}
				}
				this.eventObj = null;
			}
		}
		
		module.exports = eEmt;
});

/* An Wrapper of Event emitter for 'emit' thread safty.
 */
__d('EventEmitterWithHolding', [],
function (global, require, module, exports) {
	// Creator function.
	function eEmtHolding (eEmtIns, eHolder) {
		this.eEmtIns 		= eEmtIns;
		this.eHolder 		= eHolder;
		this.eHolderIdx 	= null;
		
		// Excute lock for thread safty.
		this.lock = false;
		
	}
	
	// Add Listener.
	eEmtHolding.prototype.addListener = function (eType, listener, context) {
		return this.eEmtIns.addListener(eType, listener, context);
	}
	
	// Add listener only run once. 
	eEmtHolding.prototype.once = function (eType, listener, context) {
		return this.eEmtIns.once(eType, listener, context);
	}
	
	
	eEmtHolding.prototype.addRetroactiveListener = function (eType, listener, context ) {
		// Register a listener and return event object.
		var eObj = this.eEmtIns.addListener(eType, listener, context);
		
		// Lock
		this.lock = true;
		
		this.eHolder.emitToListener(eType, listener, context);
		
		// Release lock
		this.lock = false;
		
		return eObj;
	}
	
	// Remove all listeners by eType.
	eEmtHolding.prototype.removeAllListeners = function(eType) {
		this.eEmtIns.removeAllListeners(eType);
	}
	
	// Remove current listener.
	eEmtHolding.prototype.removeCurrentListener = function() {
		this.eEmtIns.removeCurrentListener();
	}
	
	// Get all listeners by eType.
	eEmtHolding.prototype.listeners = function(eType) {
		return this.eEmtIns.listeners(eType);
	}
	
	// Emit listener function by eType.
	eEmtHolding.prototype.emit = function(eType, a1, a2, a3, a4, a5) {
		this.eEmtIns.emit(eType, a1, a2, a3, a4, a5);
	}
	
	// Hold and emit an event.
	eEmtHolding.prototype.emitAndHold = function(eType, a1, a2, a3, a4, a5) {
		// Hold.
		this.eHolderIdx = this.eHolder.holdEvent(eType, a1, a2, a3, a4, a5);
		// Emit.
		this.eEmtIns.emit(eType, a1, a2, a3, a4, a5);
		this.eHolderIdx = null;
	}
	
	// Release current event.
	eEmtHolding.prototype.releaseCurrentEvent = function() {
		if (this.eHolderIdx !== null) {
			this.eHolder.releaseEvent(this.eHolderIdx);
		} else if (this.lock) {
			this.eHolder.releaseCurrentEvent();
		}
	}
	
	module.exports = eEmtHolding;
});

/* Hold events and for retrieve later.
 */
__d('EventHolder', ['objExits'],
function (global, require, module, exports) {
	var _objExits = require('objExits');
	
	// Creator function.
	function eHolder () {
		// Event holder that store several groups of event arguments.
		this.eHolderArr = [];
		
		// Index of current event.
		this.curEvent = null;
	}
	
	// Store a group of event arguments and return it's index.
	eHolder.prototype.holdEvent = function (eType, e1, e2, e3, e4, e5, e6) {
		var count = this.eHolderArr.length,
			events = [eType, e1, e2, e3, e4, e5, e6];
		
		// Append a group of arugmens into eHolderArr as an event arguments.
		this.eHolderArr.push(events);
		
		// Return index for retrieve.
		return count;	
	}
	
	// Wrapper function for forEachHoldEvent.
	eHolder.prototype.emitToListener = function (eType, listener, context) {
		this.forEachHoldEvent (function(et, a1, a2, a3, a4, a5, a6){
			if (et === eType) {
				listener.call(context, a1, a2, a3, a4, a5, a6);
			}
		});
	}
	
	// Loop and emit listener function.
	eHolder.prototype.forEachHoldEvent = function (listener, context) {
		this.eHolderArr.forEach(function (arrElm, idx) {
			this.curEvent = idx;
			
			// Emit listenser function.
			listener.apply(context, arrElm);
		}, 
		// Passed 'this' scope in loop.
		this);
		this.curEvent = null;
	}
	 
	// Release current event.
	eHolder.prototype.releaseCurrentEvent = function() {
		_objExits(this.curEvent !== null);
		delete this.eHolderArr[this.curEvent];
	}
	
	// Release event by index.
	eHolder.prototype.releaseEvent = function (idx) {
		delete this.eHolderArr[idx]
	}
});

__d('asyncCallback', [], 
function (global, require, module, exports) {
	function asyncCallback (fun, xx) {
		if (global.ArbiterMonitor) {
			return global.ArbiterMonitor.asyncCallback(foo, xx);
		}
	}
});

__d('isArray', [], 
function(global, require, module, exports) {
	
	var isArray = function(vArg) {
		return Object.prototype.toString.call(vArg) === "[object Array]";
	}
	
	module.exports = isArray;
});

/* Create array from arguments.
 */
__d('createArrayFrom', [], 
function (global, require, module, exports) {
	var _isArray = require('isArray');

	function typeCheck(arg) {
		return (!!arg && (typeof arg == 'object' || typeof arg == 'function') 
			&& ('length' in arg)
			&& !('setInterval' in arg)
			&& (typeof arg.nodeType != 'number')
			&& (_isArray(arg) || ('callee' in arg) || ('item' in arg)) );
	}
	
	function createArrayFrom(arg) {
		
		if (!typeCheck(arg)) {
			return [arg];
		}
		
		if (arg.item) {
			var len = arg.length,
				items = new Array(len);
			
			while (len--) {
				items[len] = arg[len];
			}
			return items;
		} 

		return Array.prototype.slice.call(arg);
	}
	module.exports = createArrayFrom;
});



/* Error utils, guard for all function execute.
 */
__d('ErrorUtils', ['eprintf', 'exprintf', 'Env'],
function (global, require, module, exports) {
	var _eprintf 					= require('eprintf'),
		_exprintf 					= require('exprintf'),
		_Env 						= require('Env'),
		_anonymous_guard_tag 		= '<anonymous guard>',
		_generate_guard_tag 		= '<generate guard>',
		_global_error_handler_tag 	= '<window.onerror>',
		_listenerArr 				= [],
		_history 					= [],
		_history_limit 				= 50, 
		_typeInChrome 				= window.chrome && 'type' in new Error(),
		_inReporting				= false,
		_createArrayFrom			= require('createArrayFrom');
		
	function formatStack(errStack) {
		if (!errStack) {
			return;
		}
		/* An example of error stack:
		TypeError: 1 is not a function
		at Array.forEach (native)
		at <anonymous>:2:29
		at Object.InjectedScript._evaluateOn (<anonymous>:580:39)
		at Object.InjectedScript._evaluateAndWrap (<anonymous>:539:52)
		at Object.InjectedScript.evaluate (<anonymous>:458:21)
		*/
		var stackArr = errStack.split(/\n\n/)[0]  // split whole stack info into each
							// clear bracket and TypeError info.
							.replace(/[\(\)]|\[.*?\]|^\w+:\s.*?\n/g, '')  
							.split('\n') // split each line
							.map ( function (lineInfo) {
								var row, col, type;
								if (/(:(\d+)(:(\d+))?)$/.test(lineInfo)) {
									row = RegExp.$2;
									col = RegExp.$4;
									
									// line info except row and col.
									lineInfo = lineInfo.slice(0, -RegExp.$1.length); 
								}
								
								if (/(.*)(@|\s)[^\s]+$/.test(lineInfo)) {
									// Eg. "<anonymous>"
									lineInfo = lineInfo.substring(RegExp.$1.length + 1);
									// Eg. "Object.InjectedScript.evaluate"
									type = /(at)?\s*(.*)([^\s]+|$)/.test(RegExp.$1) ? RegExp.$2 : '';
								}
								
								return '    at' + (type? ' ' + type + ' (': ' ') + lineInfo.replace(/^@/, '') + (row ? ':' + row: '' ) + (col ? ':' + col: '') + (type ? ')' : '');
							});
		return stackArr.join('\n');
	}

	// Normalize error object.
	function normalizeError(err) {
		if (!err) {
			return {};
		} else if (err.originalError) {
			return err;
		}
			
		// Error object.
		var errObj = {
			line	: err.lineNumber || err.line,
			column	: err.columnNumber || err.column,
			name	: err.name,
			message	: err.message,
			script	: err.fileName || err.sourceURL || err.script,
			stack	: formatStack(err.stackTrace || err.stack),
			guard	: err.guard
		};

		if (typeof errObj.message === 'string') {
			errObj.messageWithParams = _exprintf(errObj.name);
			errObj.message = _eprintf.apply(global, _createArrayFrom(errObj.messageWithParams));
		} else {
			errObj.messageObj = errObj.message;
			errObj.message = String(errObj.message);
		}
		
		// Flag to check if a error was already normalized.
		errObj.originalError = err;
		
		if (err.framesTopPop && errObj.stack) {
			var stackArr = errObj.stack.split('\n');
			stackArr.shift();
			
			if (err.framesToPop === 2) {
				err.message += ' ' + stackArr.shift().trim();
			}
			
			errObj.stack = stackArr.join('\n');
			
			// Parse stack info like "https://www.example.com/path/to/error/file:100.
			if (/(\w{3,5}:\/\/[^:]+):(\d+)/.test(stackArr[0])) {
				// File path.
				errObj.script = RegExp.$1;
				// Line number.
				errObj.line = parseInt(RegExp.$2, 10);
			}
			
			delete err.framesTopPop;
		}
		
		if (_typeInChrome && /(\w{3,5}:\/\/[^:]+):(\d+)/.test(err.stack)) {
			errObj.script = RegExp.$1;
			errObj.line = parseInt(RegExp.$2, 10);
		}
		
		// Clear unuseable properties.
		for (var p in errObj) {
			(errObj[p] == null && delete errObj[p]);
		}
		
		return errObj;
	}
	
	// Get stack info.
	function getTrace() {
		try {
			throw new Error();
		} catch (err) {
			var stack = normalizeError(err).stack;
			return stack && stack.replace(/[\s\S]*__getTrace__.*\n/, '');
		}
	}
	
	// Archive error message.
	function reportError(err) {
		if (_inReporting) {
			return false;
		}
		
		err = normalizeError(err);
		
		if (_history.length > _history_limit) {
			_history.splice(_history_limit/2, 1);
		}
		
		_history.push(err);
		_inReporting = true;
		
		for (var i=0; i< _listenerArr.length; i++) {
			try {
				_listenerArr[i](err);
			} catch (err) {}
		}
		
		_inReporting = false;
		return true;
	}
	
	// Execute lock.
	var isInGuard = true;
	
	// Check execute lock.
	function inGuard() {
		return isInGuard;
	}
	
	// Reset execute lock.
	function resetInGuard() {
		isInGuard = false;
	}
	
	// Run callback function with try/catch, is possible archive it.
	function applyWithGuard(fun, context, args, errFilter, errTag) {
		var needMakeInGuard = ! isInGuard;
		
		if (needMakeInGuard) {
			isInGuard = true;
		}
		
		var callbackRtn,
		
			// Detect if querystring contains 'nocatch' parameter.
			nocatch = _Env.nocatch || (/nocatch/).test(location.search);
		
		// If 'nocatch' exists, then run callback function without try/catch.
		if (nocatch) {
		
			// Run callback function directly.
			callbackRtn = fun.apply(context, args || [] );
			
			// Reset flag.
			if (needMakeInGuard) {
				resetInGuard();
			}
			
			return callbackRtn;
		}
		
		try {
			callbackRtn = fun.apply(context, args || []);
			
			if (needMakeInGuard) {
				resetInGuard();
			}
			
			return callbackRtn;
			
		} catch (err) {
			
			if (needMakeInGuard) {
				resetInGuard();
			}
			
			var err = normalizedError(err);
			
			// If other filter exists, run here.
			if (errFilter) {
				errFilter(err);
			}
			
			// If callback function exists, store it to 'callee' property.
			if (fun) {
				err.callee = fun.toString().substring(0, 100);
			}
			
			if (args) {
				err.args = Array.prototype.slice.call(args).toString().substring(0, 100);
			}
			
			// If errTag not defined use anonymous as default.
			err.guard = errTag || _anonymous_guard_tag;
			
			reportError(err);
		}
	}
	
	// Wrapper for 'applyWithGuard'. 
	function guard(fun, errTag) {
		errTag = errTag || fun.name || _generate_guard_tag;
		
		function guard() {
			return applyWithGuard(fun, this, arguments, null, errTag);
		}
		
		return guard;
	}
	
	// Replace for window.onerror.
	function onerror (msg, script, line, col) {
		reportError({
			message	: msg,
			script	: script,
			line	: line,
			column	: col,
			guard	: _global_error_handler_tag
		}, true);
	}
	
	// Override window.onerror function.
	window.onerror = onerror;
	
	// Add listener for error history.
	function addListener(fun, runNow) {
		_listenerArr.push(fun);
		
		if (runNow) {
			_history.forEach(fun);
		}
	}
	
	// Data object.
	var errUtility = {
		ANONYMOUS_GUARD_TAG			: _anonymous_guard_tag,
		GENERATE_GUARD_TAG			: _generate_guard_tag,
		GLOBAL_ERROR_HANDLER_TAG	: _global_error_handler_tag,
		addListener					: addListener,
		applyWithGuard				: applyWithGuard,
		getTrace					: getTrace,
		guard						: guard,
		history						: _history,
		inGuard						: inGuard,
		normalizeError				: normalizeError,
		onerror						: onerror,
		reprotError					: reportError
	};
	
	module.exports = global.ErrorUtils = errUtility;
});

/* Manager that manage resources that need async load.
 */
__d('CallbackDependencyManager', ['createArrayFrom', 'ErrorUtils'],
function (global, require, module, exports) {
	var errorUtils = require('ErrorUtils');
	
	// Creator function.
	function depManager() {
	
		// Dictionary stored resources's reference count by 'idx'.
		// Format is:
		// {
		// 		<resKey>: { <idx_1>: <count>, <idx_2>: <count>}
		// }
		this.resDepCountDict 		= {};
		
		// Dictionary stored callback function and count of it's dependent resources, indexed by 'idx'.
		// Format is:
		// {
		// 		<idx>: { callbackFun: <fun>, depResCount: <realCount>}
		// }
		this.resCallbackDepDict 	= {};
		this.idx 					= 1;
		this.alreadyLoaded 			= {};
	}
	
	// Calculate count of a registered callback function's dependent resources.
	depManager.prototype.calcRealResCount = function (idx, resKeyArr) {
		var count 			= 0,
			// A dict use for log resource key and remove duplicated.
			// {'resKey_1':1, 'resKey_2':1}
			resKeyDict 		= {},
			resKeyArrLen  	= resKeyArr.length;
			
			for (var i=0; i< resKeyArrLen; i++) {
				resKeyDict[resKeyArr[i]] = 1;
			}
			
			for (var k in resKeyDict) {
				// Only count resources that not be loaded.
				if (this.alreadyLoaded[k]) {
					continue;
				}
				
				count++;
				
				if (this.resDepCountDict[k] === undefined) {
					this.resDepCountDict[k] = {};
					this.resDepCountDict[k][idx] = (this.resDepCountDict[k][idx] || 0) +1;
				}
			}
			
			return count;
	}
	
	// Check to see if all callback function that depend on 'resKey' can be run
	// once 'resKey' was loaded.
	depManager.prototype.checkToRunCallback = function (resKey) {
	
		// If resKey do not exists in dependecy dict, then interrupt.
		if (!this.resDepCountDict[resKey]) {
			return;
		}
		
		for (var idx in this.resDepCountDict[resKey] ) {
			this.resDepCountDict[resKey][idx]--;
			
			if (this.resDepCountDict[resKey][idx] <= 0) {
				delete this.resDepCountDict[resKey][idx];
			}
			this.resCallbackDepDict[idx].depResCount--;
			
			if (this.resCallbackDepDict[idx].depResCount <=0 ) {
				var fun = this.resCallbackDepDict[idx].callbackFun;
				delete this.resCallbackDepDict[idx];
				errorUtils.applyWithGuard(fun);
			}
		}
	}
	
	// Add dependent resources into manager.
	depManager.prototype.addDependenciesToExistingCallback = function (idx, resKeyArr) {
		
		// If index does not exists then interrupt.
		if (!this.resCallbackDepDict[idx]) {
			return null;
		}
		
		// Count resources.
		var count = this.calcRealResCount (idx, resKeyArr);
		this.resCallbackDepDict[idx].depResCount += count;
		return idx;
	}
	
	// Register a callback function and it's resources key array into manager.
	depManager.prototype.registerCallback = function (callbackFun, resKeyArr) {
		var index = this.idx;
		this.idx++;
		
		// Get current 
		var realCount = this.calcRealResCount(index, resKeyArr);
		if (realCount === 0) {
			errorUtils.applyWithGuard(callbackFun);
			return null;
		}
		this.resCallbackDepDict[index] = {
			callbackFun :callbackFun,
			depResCount : realCount
		}
	}
	
	// Check to see if an resources was loaded.
	depManager.prototype.isPersistentDependencySatisfied = function (resKey) {
		return !! this.alreadyLoaded[resKey];
	}
	
	// Mark a resource as unloaded.
	depManager.prototype.unsatisfyPersistentDenpendency = function (resKey) {
		delete this.alreadyLoaded[resKey];
	}
	
	// Mark a resource as loaded, make this resource persistent.
	depManager.prototype.satisfyPersistentDependency = function (resKey ) {
		this.alreadyLoaded[resKey] = 1;
		this.checkToRunCallback(resKey);
	}
	
	// Makr a resource as loaded, but make it unloaded after callback function was invoked.
	depManager.prototype.satisfyNonPersistentDependency = function (resKey) {
		var isAlreadyLoaded = this.alreadyLoaded[resKey] === 1;
		
		if (!isAlreadyLoaded) {
			this.alreadyLoaded[resKey] = 1;
		}
		
		this.checkToRunCallback(resKey);
		
		if (!isAlreadyLoaded) {
			delete this.alreadyLoaded[resKey];
		}
	}
	module.exports = depManager;
});

__d('Arbiter', ['CallbackDependencyManager', 'ErrorUtils', 'EventEmitter', 'EventEmitterWithHolding',
'EventHolder', 'asyncCallback', 'copyProps', 'createArrayFrom', 'objExist'],
function (global, require, module, exports) {
	var _callbackDependencyManager 	= require('CallbackDependencyManager'), 
		_errorUtils 				= require('ErrorUtils'), 
		_eventEmitter 				= require('EventEmitter'),
		_eventEmitterWithHolding 	= require('EventEmitterWithHolding'), 
		_eventHolder 				= require('EventHolder'), 
		_asyncCallback 				= require('asyncCallback'),
		_copyProps 					= require('copyProps'),  
		_createArrayFrom 			= require('createArrayFrom'), 
		_objExist 					= require('objExist'); 
		
	// Creator function.
	function Arbiter () { 
		var eventEmtIns 		= new _eventEmitter();
		this.eHoldingIns 		= new eHolding();
		this.eventEmtWHdIns 	= new _eventEmitterWithHolding(eventEmtIns, this.eHoldingIns);
		this.callbackMgrIns 	= new _callbackDependencyManager(); 
		
		// Object that store Event type and it's callback return (true/false).
		// Format is:
		// [
		// 		{ <eType>: false}
		//		{ <eType>: true }
		// ]
		this.eCallbackRtnArr 		= []; 
	}
	
	Arbiter.prototype.subscribe = function (eTypeArr, fun, behavior) {
		eTypeArr = _createArrayFrom(eTypeArr);
		eTypeArr.forEach(function (eType) {
			_objExist( eType && typeof eType === 'string');
		});
		
		_objExist(typeof fun === 'function');
		
		behavior = behavior || Arbiter.SUBSCRIBE_ALL;
		
		_objExist( behavior === Arbiter.SUBSCRIBE_NEW || behavior === Arbiter.SUBSCRIBE_ALL);
		
		var eObjArr = eTypeArr.map(function(eType){
		
			// Function.prototype.bind(thisArg[, arg1[, arg2[, ...]]])
			var listener = this.emitAndTrack.bind(this, fun, eType);
			
			if ( behavior === Arbiter.SUBSCRIBE_NEW) {
				return this.eventEmtWHdIns.addListener(eType, listener);
			}
			
			this.eCallbackRtnArr.push({});
			
			var eObj = this.eventEmtWHdIns.addRetroactiveListener(eType, listener);
			
			this.eCallbackRtnArr.pop();
			
			return listener;
			
		}, this);
		
		return new ArbiterWrapper(this, eObjArr);
	};
	
	Arbiter.prototype.emitAndTrack = function (fun, eType, behavior) {
		var eCallBcakObj = this.eCallbackRtnArr[this.eCallbackRtnArr.length -1];
		
		if (eCallBcakObj[eType] === false) {
			return;
		}
		
		var callbackRtn = _errorUtils.applyWithGuard(fun, null, [eType, behavior]);
		
		if (callbackRtn == false) {
			this.eventEmtWHdIns.releaseCurrentEvent();
		}
		
		eCallBcakObj[eType] = callbackRtn;
	};
	
	Arbiter.prototype.subscribeOnce = function (eTypeArr, fun, behavior) {
		var arbiterWrapper = this.subscribe(eTypeArr, function (arg1, arg2) {
			arbiterWrapper && arbiterWrapper.unsubscribe();
			return fun(arg1, arg2);
		}, behavior);
		
		return arbiterWrapper;
	};
	
	Arbiter.prototype.unsubscribe = function (arbitWrapper) {
		_objExist(arbitWrapper.isForArbiterInstance(this));
		arbitWrapper.unsubscribe();
	};
	
	Arbiter.prototype.inform = function (eTypeArr, fun, behavior) {
		var isArr = Array.isArray(eTypeArr);
		eTypeArr = _createArrayFrom(eTypeArr);
		
		behavior = behavior || Arbiter.BEHAVIOR_EVENT;
		
		var persist = ( behavior === Arbiter.BEHAVIOR_EVENT ) || ( behavior === Arbiter.BEHAVIOR_PERSISTENT),
			aMonitor = global.ArbiterMonitor;
			
		this.eCallbackRtnArr.push({});
		
		for (var i = 0; i< eTypeArr.length; i++) {
			var eType = eTypeArr[i];
			
			_objExist(eType);
			
			this.eHoldingIns.setHoldingBehavior(eType, behavior);
			
			aMonitor && aMonitor.record('event', eType, fun, this);
			
			this.eventEmtWHdIns.emitAndHold(eType, fun);
			
			this.satisfyDependency(eType, fun, persist);
			
			aMonitor && aMonitor.record('done', eType, fun, this);
		}
		
		var eCallBackObj = this.eCallbackRtnArr.pop();
		return isArr ? eCallBackObj : eCallBackObj[eTypeArr[0]];
	};
	
	Arbiter.prototype.query = function (eType) {
		var behavior = this.eHoldingIns.getHoldingBehavior(eType);
		
		_objExist( !behavior || behavior === Arbiter.BEHAVIOR_STATE);
		
		var arg = null;
		
		this.eHoldingIns.emitToListener(eType, function(a) {
			arg = a;
		});
		
		return arg;
	};
	
	Arbiter.prototype.registerCallback = function (idxOrFun, resKeyArr) {
		if (typeof idxOrFun === 'function') {
			return this.callbackMgrIns.registerCallback(_asyncCallback(idxOrFun, 'arbiter'));
		} else {
			return this.callbackMgrIns.addDependenciesToExistingCallback(idxOrFun, resKeyArr);
		}
	};
	
	Arbiter.prototype.satisfyDependency = function (resKey, fun, persist) {
		if ( fun === null) {
			return;
		} 
		
		if (persist) {
			this.callbackMgrIns.satisfyPersistentDenpendency(resKey);
		} else {
			this.callbackMgrIns.satisfyNonPersistentDenpendency(resKey);
		}
	};
	
	for (var prop in _eventHolder) {
		if (_eventHolder.hasOwnProperty(prop) && prop != '_metaprototype') {
			eHolding[prop] = _eventHolder[prop];
		}
	}
	
	var eHoldInsProtos = _eventHolder === null ? null : _eventHolder.prototype;
	
	eHolding.prototype = Object.create(eHoldInsProtos);
	eHolding.prototype.constructor = eHolding;
	eHolding.__superConstructor__ = _eventHolder;
	
	// Inherit from '_eventHolder'
	function eHolding () {
		_eventHolder.call(this);
		this.behavirorDict = {};
	}
	
	eHolding.prototype.setHoldingBehavior = function (eType, behavior) {
		this.behavirorDict[eType] = behavior;
	};
	
	eHolding.prototype.getHoldingbehavior = function (eType) {
		return this.behavirorDict[eType];
	};
	
	eHolding.prototype.holdEvent = function (behavior, a1, a2, a3, a4) {
		
		var behavior = this.behavirorDict[behavior];
		
		if (behavior !== Arbiter.BEHAVIOR_PERSISTENT) {
			this.emit(behavior);
		}
		
		if (behavior !== Arbiter.BEHAVIOR_EVENT) {
			return eHoldInsProtos.holdEvent.call(this, behavior, a1, a2, a3, a4);
		}
	};
	
	eHolding.prototype.emit = function (behavior) {
		this.emitToListener(behavior, this.releaseCurrentEvent, this);
	};
	
	_copyProps(Arbiter, {
		SUBSCRIBE_NEW: 'new',
		SUBSCRIBE_ALL: 'all',
		BEHAVIOR_EVENT: 'event',
		BEHAVIOR_STATE: 'state',
		BEHAVIOR_PERSISTENT: 'persistent'
	});
	
	function ArbiterWrapper(arbiter, eObjArr) {
		this.arbiter = arbiter;
		this.eventObjArr = eObjArr;
	}
	
	ArbiterWrapper.prototype.unsubscribe = function() {
		for (var i=0; i< this.eventObjArr.length; i++) {
			this.eventObjArr[i].remove();
		}
		this.eventObjArr.length = 0;
	}
	
	ArbiterWrapper.prototype.isForArbiterInstance = function (abIns) {
		_objExist(this.arbiter);
		return this.arbiter === abIns
	}
	
	Object.keys(Arbiter.prototype).forEach(function(arbitProto) {
		Arbiter[arbitProto] = function() {
			var _this = (this instanceof Arbiter) ? this : Arbiter;
			return Arbiter.prototype[arbitProto].apply(_this, arguments);
		}
	});
	
	Arbiter.call(Arbiter);
	module.exports = Arbiter; 
	
});

__d('OnloadEvent', [], 
function (global, require, module, exports) {
	var onloadEvent = {
		ONLOAD						: 'onload/onload',
		ONLOAD_CALLBACK				: 'onload/onload_callback',
		ONLOAD_DOMCONTENT			: 'onload/dom_content_ready',
		ONLOAD_DOMCONTENT_CALLBACK	: 'onload/domcontent_callback',
		ONBEFOREUNLOAD				: 'onload/beforeunload',
		ONUNLOAD					: 'onload/unload'
	};
	module.exports = global;
});

__d('Run', ['Arbiter', 'OnloadEvent', 'dateStamp'],
function (global, require, module, exports) {
	var _arbiter 			= require('Arbiter'), // g
		_onloadEvent 		= require('OnloadEvent'), // h
		_onunloadhooks 		= 'onunloadhocks', // i
		_onafterunloadhooks = 'onafterunloadhooks', // j
		_behavior_state 	= _arbiter.BEHAVIOR_STATE, // k
		_dateStamp			= require('dateStamp');
		
	function l(ba) {
		var cavLoger = global.CavalryLogger;
		cavLoger && cavLoger.getInstance().setTimeStamp(ba);
	}
	
	function m() { 
		return ! window.loading_page_chrome;
	}
	
	function onLoad(ba) { // n
		var onloadhocks = global.OnloadHooks;
		
		if (window.loaded && onloadhocks ) {
			onloadhocks.runHock(ba, 'onlateloadhooks');
		} else {
			u('onloadhooks', ba);
		}
	}
	
	function onAfterLoad(ba) { // o
		var oh = global.OnloadHocks;
		
		if (window.afterloaded && oh) {
			setTimeout(function() {
				oh.runHook(ba, 'onlateloadhooks');
			}, 0);
		} else {
			u('onafterloadhooks', ba);
		}
	}
	
	function onBeforeUnload(ba, ca) { // p
		if ( ca === undefined) {
			ca = m();
		} 
		
		ca ? u('onbeforeleavehooks', ba) : u('onbeforeunloadhooks', ba);
	}
	
	function q(ba, ca) {
		if (!window.onunload) {
			window.onunload = function () {
				g.inform(h.ONUNLOAD, true, k);
			};
		}
		u(ba, ca);
	}
	
	function onUnload(ba) { // r
		q(_onunloadhooks, ba);
	}
	
	function onAfterUnload(ba) { //s
		q(_onafterunloadhooks, ba);
	}
	
	function onLeave() { // t
		q('onleavehooks', ba);
	}
	
	function u(ba, ca) {
		window[ba] = (window[ba] || []).concat(ca);
	}
	
	function _removeHook() {
		window[ba] = [];
	}
	
	function w() {
		_arbiter.inform(h.ONLOAD_DOMCONTENT, true, _behavior_state);
	}
	
	global._domcontentready = w;
	
	function x() {
		var dom = document, // ba 
			win = window; // ca
			
		if (dom.addEventListener) {
			var appleWebkit =/AppleWebKit.(\d+)/.exec(navigator.userAgent);
			
			if (appleWebkit && appleWebKit[1] < 525) {
				var testState = setInterval(function(){
					if (/loaded|complete/.test(dom.readSate)) {
						w();
						clearInterval(testState);
					}
				}, 10);
			}
		} else {
			var dovoid = 'javascript:void(0)';
			
			if (win.location.protocol =- 'htts:') {
				dovoid = '//:';
			}
			document.write('<script onreadstatechange="if (this.readySate==\'complete\') {' +
				'this.parentNode.removeChild(this); _domcontentready();}"' + 'defer="defer" src="'+fa+
				'"><\/script\>');
		}
		
		var _onload = win.onload;
		win.onload = function() {
			l('t_layout');
			_onload || _load();
			_arbiter.inform(h.ONLOAD, true, k);
		};
		
		win.onbeforeunload = function() {
			var fun = {};
			_arbiter.inform(_onloadEvent.ONBEFOREUNLOAD, fun, k);
			
			if (!fun.warn) {
				_arbiter.inform('onload/exit', true);
			}
			
			return fun.warn;
		}
	}
	
	var _onloadCallback = _arbiter.registerCallback(function() {
			l('t_onload');
			_arbiter.inform(_onloadEvent.ONLOAD_CALLBACK, true, k);
		}, [_onloadEvent.ONLOAD]),
	
		_domContentCallback = _arbiter.registerCallback(function() {
			l('t_domcontent');
			var fun = {
				timeTriggered: dateStamp()
			};
			_arbiter.inform(_onloadEvent.ONLOAD_DOMCONTENT_CALLBACK, ba, k);
		}, [_onloadEvent.ONLOAD_DOMCONTENT]);
	
	x();
	
	var run = {
		onLoad					: onload,
		onAfterLoad				: onAfterLoad,
		onLeave					: onLeave,
		onBeforeUnload			: onBeforeUnload,
		onUnload				: onUnload,
		onAfterUnload			: onAfterUnload,
		__domContentCallback	: _domContentCallback,
		__onloadCallback		: _onloadCallback,
		__removeHook			: _removeHook
	}
	
	modules.exports = run;
});


__d('isEmpty', ['isArray'], 
function (global, require, module, exports) {
	var _isArray = require('isArray');
	function isEmpty(arg) {
		if (_isArray(arg)) {
			return arg.length === 0;
		} else {
			for (var p in arg) {
				return false;
			}
			return true;
		}
	}
	
	module.exports = isEmpty;
});

__d('CSSLoader', ["isEmpty", "dateStamp"], 
function (global, require, module, exports) {
	var _isEmpty = require('isEmpty'),
		checkExpireTS = 20,
		ts = 5000,
		canLoadingCSS,
		hasCheckedLoading,
		
		// Resources that already been loaded.
		// For IE, format is:
		// { <resKey>: 
		// 		{ 
		// 			'styleSheet': <styleSheetObj>,
		// 			'uri': <src>
		// 		} 
		// }
		// For other Browsers, format is:
		// {
		// 	'link': { 'rel':<rel>, 'type'=<type>, 'href':<href>}
		// }
		alreadyRequestdDict = {},
		
		// Stylesheet object array.
		styleSheetObjArr = [],
		baseTime,
		pendingLoadDict = {},
		dateStamp = require('dateStamp');
		
		// Check to see if CSS file can be loaded.
		// If checked, mark 'hasCheckedLoading' as true;
		// If sucessful, mark 'canLoadingCSS' as true; 
		function checkLoadingCSS(elm) {
			if (hasCheckedLoading) {
				return;
			}
			
			hasCheckedLoading = true;
			
			var linkElm = document.createElement('link');
			linkElm.onload = function () {
				canLoadingCSS = true;
				linkElm.parentNode.removeChild(linkElm);
			};
			
			linkElm.rel = 'stylesheet';
			linkElm.href = 'data:text/css;base64,';
			elm.appendChild(linkElm);
		}
		
		//
		function checkPendingList() {
			var resKey, 
				errorArr = [],
				signalArr = [];
			
			if (dateStamp() >= baseTime) {
				for (resKey in pendingLoadDict) {
					signalArr.push(pendingLoadDict[resKey].signal);
					errorArr.push(pendingLoadDict[resKey].error); // callbackFun
				}
				pendingLoadDict = {};
			} else {
				for (resKey in pendingLoadDict) {
					var signal = pendingLoadDict[resKey].signal,
						// IE does not support 'getComputedStyle', subsitution is 'currentStyle'.
						style = window.getComputedStyle ? getComputedStyle(signal, null) : signal.currentStyle;
						
					if (style && parseInt(style.height, 10) > 1) {
						errorArr.push(pendingLoadDict[resKey].load); // doneFun
						signalArr.push(signal);
						
						delete pendingLoadDict[resKey];
					}
				}
			}
			
			for (var i=0; i<signalArr.length; i++) {
				signalArr[i].parentNode.removeChild(signalArr[i]);
			}
			
			if (!_isEmpty(errorArr)) {
				for (var i=0; i< errorArr.length; i++) {
					errorArr[i]();
				}
				baseTime = dateStamp() + ts;
			}
			
			return _isEmpty(pendingLoadDict);
		}
		
		function logUnloadCSS(resKey, headElm, doneFun, callbackFun) {
			var metaElm = document.createElement('meta');
			
			metaElm.id = 'bootloader_' + resKey.replace(/[^a-z0-9]/ig, '_');
			headElm.appendChild(metaElm);
			
			var hasPending = !_isEmpty(pendingLoadDict);
			
			baseTime = dateStamp() + ts;
			
			pendingLoadDict[resKey] = {
				signal: metaElm,
				load: doneFun,
				error: callbackFun
			};
			
			if (!hasPending) {
				var chankHandler = setInterval(function() {
					// If pending list is empty, then cancel this handler.
					if (checkPendingList()) {
						clearInterval(chankHandler);
					}
				}, checkExpireTS, false);
			}
		}
		
		var CSSLoader = {
			loadStyleSheet: function (resKey, src, headElm, doneFun, callbackFun) {
				
				if (alreadyRequestdDict[resKey]) {
					throw new Error('CSS component ' + resKey + ' has already been requested.');
				}
				
				// Only for IE.
				if (document.createStyleSheet) {
					var ssLen;
					for (var i =0; i< styleSheetObjArr.length; i++) {
						if (styleSheetObjArr[i].imports.length < 31 ) {
							ssLen = i;
							break;
						}
					}
					
					if (ssLen === undefined) {
						styleSheetObjArr.push(document.createStyleSheet());
						ssLen = styleSheetObjArr.length -1;
					}
					
					styleSheetObjArr[ssLen].addImport(src);
					
					alreadyRequestdDict[resKey] = {
						styleSheet: styleSheetObjArr[ssLen],
						uri: src
					}
					
					logUnloadCSS(resKey, headElm, doneFun, callbackFun);
					return;
				}
				
				var linkElm = document.createElement('link');
				linkElm.rel = 'stylesheet';
				linkElm.type = 'text/css';
				linkElm.href = src;
				
				alreadyRequestdDict[resKey] = {
					link: linkElm
				}
				
				if (canLoadingCSS) {
					linkElm.onload = function () {
						linkElm.onload = linkElm.onerror = null;
						doneFun();
					};
					linkElm.onerror = function () {
						linkElm.onload = linkElm.onerror = null;
						canbackFun();
					}; 
				} else {
					logUnloadCSS(resKey, headElm, doneFun, callbackFun);
					if (canLoadingCSS === undefined) {
						checkLoadingCSS(headElm);
					}
				}
				headElm.appendChild(linkElm);
			},
			
			registerLoadedStyleSheet: function (resKey, linkElm) {
				if (alreadyRequestdDict[resKey]) {
					throw new Error ('CSS component ' + resKey + ' has been requested and should not be ' + 'loaded more than once.');
				}
				
				alreadyRequestdDict[resKey] = {
					link: linkElm
				};
			},
			
			unloadStyleSheet: function (resKey) {
				if (!resKey in alreadyRequestdDict) {
					return;
				}
				
				var resObj = alreadyRequestDict[resKey],
					linkElm = resObj.link;
				
				if (linkElm) {
					linkElm.onload = linkElm.onerror = null;
					linkElm.parentNode.removeChild(linkElm);
				} else {
					var ssObj = resObj.styleSheet;
					
					for (var i=0; i< ssObj.imports.length; i++) {
						if (ssObj.imports[i].href == resObj.uri) {
							ssObj.removeImports(i);
							break;
						}
					}
					
					delete pendingLoadDict[resKey];
					delete alreadyRequestDict[resKey];
				}
			}
		};
		
		module.exports = CSSLoader;
});

__d("Bootloader",['createArrayFrom','CallbackDependencyManager', 'dateStamp'],
function(global, require, module, exports){
    var createArrayFrom				= require('createArrayFrom'),
		callbackDependencyManager 	= require('CallbackDependencyManager'),
		cssLoader 					= require('CSSLoader'),
		depManagerIns 				= new callbackDependencyManager,
		
		// Resources map dict:
		// Example of format is:
		// {
        //      "tKv6W": {
		// 			"name": tKv6W
        //          "type": "js",
        //          "crossOrigin": 0,
        //          "src": "http:\/\/localhost:8080\/static\/scripts\/target.js"
        //      }
        //  }
		resMapDict 					= {},
		pendingLoadResDict			= {},
		resSrcTimestmpDict			= {},
		
		// Component dict store module name and it's obj.
		// Format is:
		// {
		//		<modName>: <modObj>
		// }
		// Each 'modObj' has properity of 'resources'.
		comDict 					= {},
		
		errorUrlDict 				= {},
		needEnableBootloadArray 	= [],
		normalResDict     			= {},
		hardpoint					= null,
		isEnableBootload 			= false,
		dateStamp					= require('dateStamp');

    function prepareResources(comNameArray, fun) {
        if (!isEnableBootload) {
            needEnableBootloadArray.push([comNameArray, fun]);
            return;
        }

        comNameArray = createArrayFrom(comNameArray);
        var resArray = [];
        for (var i=0;i<comNameArray.length;++i) {
            if (!comNameArray[i]) {
                continue;
            }
            var modObj = comDict[comNameArray[i]];
            if (modObj) {
                var reses = modObj.resources;
                for (var j=0;j<reses.length;++j) {
                    resArray.push(reses[j]);
                }
            }
        }
        bootloader.loadResources(resArray, fun);
    }
	
    function getResObjArray(resArray) {
        if (!resArray) {
            return [];
        }
        var resObjArray = [];

        for (var i=0;i<resArray.length;i++) {
            if (typeof resArray[i] == "string") {
                if (resMapDict[resArray[i]]) { 
                    resObjArray.push(resMapDict[resArray[i]]);
                }
            } else {
                resObjArray.push(resArray[i]);
            }
        }
        return resObjArray;
    }
	
    function loadResCallback(type, src, resKey, headOrBodyObj) {
        var doneFun = bootloader.done.bind(null, [resKey], type === "css", src);
        resSrcTimestmpDict[src] = dateStamp();
        if (type == "js") {
            var srcObj = document.createElement("script");
            srcObj.src = src;
            srcObj.async = true;
            var resObj = resMapDict[resKey];
            if (resObj && resObj.crossOrigin) {
                srcObj.crossOrigin = "anonymous";
            }
            srcObj.onload = doneFun;
            srcObj.onerror = function() {
                errorUrlDict[src] = true;
                doneFun();
            };
            srcObj.onreadystatechange = function () {
                if (this.readyState in {loaded:1, complete:1}) {
                    doneFun();
                }
            }
            headOrBodyObj.appendChild(srcObj);
        } else if (type == "css" ) {
            cssLoader.loadStyleSheet(resKey, src, headOrBodyObj, doneFun, function() {
                errorUrlDict[src] = true;
                doneFun();
            });
        }
    }
	
    function AddToPendingResDict(resKeyArray) {
        resKeyArray = createArrayFrom(resKeyArray);
        for (var i=0;i<resKeyArray.length;++i) {
            if (resKeyArray[i] != undefined) {
                pendingLoadResDict[resKeyArray[i]] = true;
            }
        }
    }
	
    bootloader = {
        // Set resources map into Bootloader.
        // example resDict:
        // {
        //      "tKv6W": {
        //          "type": "js",
        //          "crossOrigin": 0,
        //          "src": "http:\/\/localhost:8080\/static\/scripts\/target.js"
        //      }
        //  }
        setResourceMap: function (resDict) {
            for (var resKey in resDict) {
                if (!resMapDict[resKey]) {
                    resDict[resKey].name = resKey;
                    resMapDict[resKey] = resDict[resKey];
                }
            }
        },
		
        loadEarlyResources: function(resDict) {
            bootloader.setResourceMap(resDict);
            var resEarlyLoadArray = [];
            for (var resKey in resDict) {
                var resObj = resMapDict[resKey];
                resEarlyLoadArray.push(resObj);
                if (!resObj.permanent) {
                    normalResDict[resObj.name] = resObj;
                }
            }
            bootloader.loadResources(resEarlyLoadArray);
        },
		
        loadResources: function(resArray, callbackFun) {
            var i,resToBeLoadArray=[];
            resArray = getResObjArray(createArrayFrom(resArray));
            var blockingResArray = [];
            for (i=0;i<resArray.length;++i) {
                var resObj = resArray[i];

                if (depManagerIns.isPersistentDependencySatisfied(resObj.name)) {
                    continue;
                }

                if (!resObj.nonblocking) {
                    blockingResArray.push(resObj.name);
                }

                if(!pendingLoadResDict[resObj.name]) {
                    AddToPendingResDict(resObj.name);
                    resToBeLoadArray.push(resObj);
                }
            }

            var idx;
            if (callbackFun) {
                if (typeof callbackFun === "function" ) {
                    idx = depManagerIns.registerCallback(callbackFun, blockingResArray);
                } else {
                    idx = depManagerIns.addDependenciesToExistingCallback(callbackFun, blockingResArray);
                }
            }
            var hardpoint = bootloader.getHardpoint();
            for (i=0;i<resToBeLoadArray.length;++i) {
                loadResCallback(resToBeLoadArray[i].type,
                               resToBeLoadArray[i].src,
                               resToBeLoadArray[i].name,
                               hardpoint);
            }
            return idx;
        },
        getHardpoint: function() {
            if (!hardpoint) {
                var domHead = document.getElementsByTagName("head");
                hardpoint = domHead.length && domHead[0] || document.body;
            }
            return hardpoint;
        },
        done: function(resKeyArray, isCSS, src) {
            if (src) {
                delete resSrcTimestmpDict[src];
            }
            //AddToPendingResDict(resKeyArray);
/*            if (!isCSS) {*/
                //for (var i=0, lth=v.length; i<lth; i++) {
                    //v[i]();
                //}
/*            }*/
            for (var i=0;i<resKeyArray.length;++i) {
                var resKey = resKeyArray[i];
                if (resKey) {
                    depManagerIns.satisfyPersistentDependency(resKey);
                }
            }
        },
        // Make module bootloadable;
        // {
        //     "Dialog": {
        //         "resources": ["ahYyK", "lGdCv", "m1iFJ", "uhv+w"],
        //         "module": true
        //     }
        // }
        enableBootload: function (bootLoadDict) {
            for (var loadableComName in bootLoadDict) {
                if (!comDict[loadableComName]) {
                    comDict[loadableComName] = bootLoadDict[loadableComName];
                }
            }
            if (!isEnableBootload) {
                isEnableBootload = true;
                for (var i=0;i<needEnableBootloadArray.length;++i) {
                    prepareResources.apply(null, needEnableBootloadArray[i]);
                }
                needEnableBootloadArray = [];
            }
        },
		
		// Load components.
        loadComponents: function (comNameArray, callbackFun) {
            comNameArray = createArrayFrom(comNameArray);
            var deps = [];
            for (var i=0;i<comNameArray.length;i++) {
                var comObj = comDict[comNameArray[i]];
                if (comObj && !comObj.module) {
                    continue;
                }
                var legacyModName = 'legacy:' + comNameArray[i];
                if (comDict[legacyModName]) {
                    comNameArray[i] = legacyModName;
                    deps.push(legacyModName);
                } else if (comObj && comObj.module) {
                    deps.push(comNameArray[i]);
                }
            }
            prepareResources(comNameArray, deps.length ? require.bind(null, deps, callbackFun): callbackFun);
        }
    }
    module.exports = bootloader;
});

__d('legacy:Bootloader', [],
function(global, require, module, exports) {
	global.Bootloader = require('Bootloader');
}, 1);



// Set Resources for async load.
window.Bootloader.setResourceMap({
                "cu2cX": {
                    "type": "js",
                    "crossOrigin": 0,
                    "src": "http:\/\/www.saproject.com:9000\/static\/modules\/js1.js"
					},
				"mUc2c": {
					"type": "css",
                    "permanent": 1,
					"crossOrigin": 0,
                    "src": "http:\/\/www.saproject.com:9000\/static\/modules\/css1.css"
					}
				});
				
				
window.Bootloader.loadResources(['cu2cX', 'mUc2c'], function(){
	alert('yes');
}); 

















