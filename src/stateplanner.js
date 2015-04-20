var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var sp;
(function (sp) {
    var StateEvent = (function () {
        function StateEvent(target, type, values) {
            if (values === void 0) { values = null; }
            this.target = target;
            this.type = type;
            this.values = values;
        }
        return StateEvent;
    })();
    sp.StateEvent = StateEvent;
    var EventDispatcher = (function () {
        function EventDispatcher() {
            this.callBacks = [];
        }
        EventDispatcher.prototype.addEvent = function (type, func) {
            if (this.callBacks[type] == null) {
                this.callBacks[type] = [];
            }
            this.callBacks[type].push({ func: func });
        };
        EventDispatcher.prototype.removeEvent = function (type, func) {
            if (this.callBacks[type] != null) {
                var callbackLen = this.callBacks[type].length;
                for (var k = 0; k < callbackLen; k++) {
                    if (this.callBacks[type][k].func === func) {
                        this.callBacks[type].splice(k, 1);
                        break;
                    }
                }
            }
        };
        EventDispatcher.prototype.hasEvent = function (type, func) {
            if (this.callBacks[type] != null) {
                var callbackLen = this.callBacks[type].length;
                for (var k = 0; k < callbackLen; k++) {
                    if (this.callBacks[type][k].func === func) {
                        return true;
                    }
                }
            }
            return false;
        };
        EventDispatcher.prototype.fireEvent = function (event) {
            if (this.callBacks[event.type] != null) {
                var callbackLen = this.callBacks[event.type].length;
                for (var k = 0; k < callbackLen; k++) {
                    this.callBacks[event.type][k].func(event);
                }
            }
        };
        return EventDispatcher;
    })();
    sp.EventDispatcher = EventDispatcher;
})(sp || (sp = {}));
var sp;
(function (sp) {
    var State = (function (_super) {
        __extends(State, _super);
        function State(name, isInitial, isFinal) {
            if (isInitial === void 0) { isInitial = false; }
            if (isFinal === void 0) { isFinal = false; }
            _super.call(this);
            this.isActive = false;
            this.name = name;
            this.transitions = [];
            this.childs = [];
            this.isInitial = isInitial;
            this.isFinal = isFinal;
        }
        State.prototype.addChild = function (child, mask) {
            if (mask === void 0) { mask = 0; }
            if (this.isInitial || this.isFinal) {
                this.fsm.fireError("state name:" + this.name + " can not add child. (type is initial or final)");
                return;
            }
            if (child.constructor === Array) {
                var list = child;
                for (var k = 0; k < list.length; k++)
                    this.addAChild(list[k], mask);
            }
            if (child.constructor === State)
                this.addAChild(child, mask);
            return this;
        };
        State.prototype.addTo = function (parent, mask) {
            if (mask === void 0) { mask = 0; }
            if (parent.isInitial || parent.isFinal) {
                this.fsm.fireError("parent state name:" + parent.name + " can not add child. (type is initial or final)");
                return;
            }
            parent.addAChild(this, mask);
            return this;
        };
        State.prototype.addAChild = function (child, mask) {
            if (mask === void 0) { mask = 0; }
            if (this.hasChild(child)) {
                this.fsm.fireError("addAChild error, state name must be unique on name: " + child.name);
                return;
            }
            if (child.parent) {
                if (child.parent === this) {
                    this.fsm.fireError("addAChild error, state " + child.name + " is already a child of the parent  " + this.name);
                    return;
                }
                else {
                    child.parent.removeChild(child);
                }
            }
            this.childs.push(child);
            child.parent = this;
            this.addTransition(child, mask);
        };
        State.prototype.addTransition = function (otherArg, mask) {
            if (mask === void 0) { mask = sp.FSM.A_TO_B; }
            var otherAll = [];
            if (otherArg.constructor === Array)
                otherAll = otherArg;
            if (otherArg.constructor === State)
                otherAll.push(otherArg);
            for (var q = 0; q < otherAll.length; q++) {
                var other = otherAll[q];
                if ((mask & sp.FSM.BOTH) != 0) {
                    this.addUniqueTrans([other.name]);
                    other.addUniqueTrans([this.name]);
                }
                else {
                    if ((mask & sp.FSM.A_TO_B) != 0)
                        this.addUniqueTrans([other.name]);
                    if ((mask & sp.FSM.B_TO_A) != 0)
                        other.addUniqueTrans([this.name]);
                }
            }
            return this;
        };
        State.prototype.addUniqueTrans = function (list) {
            for (var k = 0; k < list.length; k++) {
                var loopName = list[k];
                if (this.transitions.indexOf(loopName) == -1 && this.name != loopName) {
                    this.transitions.push(loopName);
                }
            }
        };
        State.prototype.removeChild = function (child) {
            var clen = this.childs.length;
            for (var k = 0; k < clen; k++) {
                if (this.childs[k] === child) {
                    this.childs.splice(k, 1);
                    return this;
                }
            }
            return this;
        };
        State.prototype.removeAllChilds = function () {
            var clen = this.childs.length;
            for (var k = 0; k < clen; k++) {
                this.childs[k].parent = null;
            }
            this.childs = [];
            return this;
        };
        State.prototype.deleteTransition = function (other, mask) {
            if (mask === void 0) { mask = sp.FSM.A_TO_B; }
            var index = this.transitions.indexOf(other.name);
            if ((mask & sp.FSM.A_TO_B) != 0 || (mask & sp.FSM.BOTH) != 0)
                this.transitions.splice(index, 1);
            if ((mask & sp.FSM.B_TO_A) != 0 || (mask & sp.FSM.BOTH) != 0) {
                var otherIndex = other.transitions.indexOf(this.name);
                if (otherIndex > -1)
                    other.transitions.splice(otherIndex, 1);
            }
            return this;
        };
        State.prototype.enter = function (target, fsm, from, data) {
        };
        State.prototype.exit = function (target, fsm, next, data) {
        };
        State.prototype.update = function (data) {
        };
        State.prototype.stateFinal = function (target, fsm, child, data) {
        };
        State.prototype.hasChild = function (child) {
            var clen = this.childs.length;
            for (var k = 0; k < clen; k++) {
                if (this.childs[k] === child) {
                    return true;
                }
            }
            return false;
        };
        return State;
    })(sp.EventDispatcher);
    sp.State = State;
})(sp || (sp = {}));
var sp;
(function (sp) {
    var FSM = (function (_super) {
        __extends(FSM, _super);
        function FSM(name) {
            _super.call(this, name);
            this.history = [];
            this.allParents = [];
            this.allStates = {};
            this.allStates[this.name] = this;
        }
        FSM.prototype.createState = function (name, typeMask) {
            if (this.allStates[name]) {
                this.fireError('createState("' + name + '") , state already exit.');
                return null;
            }
            var newState = new sp.State(name);
            if ((typeMask & FSM.isInitial) != 0)
                newState.isInitial = true;
            if ((typeMask & FSM.isFinal) != 0)
                newState.isFinal = true;
            if ((typeMask & FSM.acceptAll) != 0)
                newState.acceptAll = true;
            this.allStates[name] = newState;
            newState.fsm = this;
            return newState;
        };
        FSM.prototype.getState = function (name) {
            return this.allStates[name];
        };
        FSM.prototype.init = function (initState) {
            this.isActive = true;
            if (this.allStates[initState]) {
                this.transitions.push(initState);
                this.toState(initState);
            }
            else {
                this.fireError("init() state name '" + initState + "' does not exist");
            }
        };
        FSM.prototype.buildTree = function () {
            this.history = [];
            function recursiveChild(rootState, loopOn) {
                var clen = loopOn.childs.length;
                for (var k = 0; k < clen; k++) {
                    rootState.allChilds.push(loopOn.childs[k].name);
                    recursiveChild(rootState, loopOn.childs[k]);
                }
            }
            for (var key in this.allStates) {
                var loop = this.allStates[key];
                loop.allParents = [];
                if (loop.parent) {
                    var loopParent = loop.parent;
                    while (loopParent != undefined) {
                        loop.allParents.push(loopParent.name);
                        loopParent = loopParent.parent;
                    }
                }
                loop.allChilds = [];
                if (loop.childs.length > 0)
                    recursiveChild(loop, loop);
            }
            for (var key in this.allStates) {
                var loop = this.allStates[key];
                if (loop.isInitial && loop.parent) {
                    loop.parent.addTransition(loop);
                }
                if (loop.isFinal && (loop.parent)) {
                    var childList = [];
                    var clen = loop.parent.childs.length;
                    for (var p = 0; p < clen; p++) {
                        var pchild = loop.parent.childs[p];
                        if (pchild.name != loop.name) {
                            childList.push(pchild.name);
                        }
                    }
                    var lptrans = loop.parent.transitions;
                    var lptranLen = lptrans.length;
                    for (var k = 0; k < lptranLen; k++) {
                        if (childList.indexOf(lptrans[k]) == -1 && lptrans[k] != loop.name) {
                            var addState = this.allStates[lptrans[k]];
                            loop.addTransition(addState);
                        }
                    }
                }
                if (loop.acceptAll) {
                    for (var subKey in this.allStates) {
                        if (this.allStates[subKey] !== loop) {
                            this.allStates[subKey].addTransition(loop);
                        }
                    }
                }
            }
        };
        FSM.prototype.getCurrentState = function () {
            var current = this;
            if (this.history.length > 0)
                current = this.allStates[this.history[this.history.length - 1]];
            return current;
        };
        FSM.prototype.getPreviousState = function (backwardCount) {
            var result = null;
            if (this.history.length >= backwardCount)
                result = this.allStates[this.history[this.history.length - backwardCount - 1]];
            return result;
        };
        FSM.prototype.stateEnter = function (state, data, previous) {
            if (!state.isActive) {
                state.isActive = true;
                this.history.push(state.name);
                state.enter(state, this, this.getState(previous), data);
                this.fireEvent(new sp.StateEvent(state, "stateEnter", { current: state, from: this.getState(previous), data: data }));
                var clen = state.childs.length;
                for (var k = 0; k < clen; k++) {
                    if (state.childs[k].isInitial) {
                        state.childs[k].isActive = true;
                        state.childs[k].enter(state.childs[k], this, this.getState(previous), data);
                        this.history.push(state.childs[k].name);
                        this.fireEvent(new sp.StateEvent(state.childs[k], "stateEnter", { current: state.childs[k], from: this.getState(previous), data: data }));
                    }
                }
                while (this.history.length > 100)
                    this.history.shift();
            }
        };
        FSM.prototype.stateExit = function (state, data, next) {
            if (state.isActive) {
                state.isActive = false;
                state.exit(state, this, this.getState(next), data);
                this.fireEvent(new sp.StateEvent(state, "stateExit", { current: state, next: this.getState(next), data: data }));
            }
        };
        FSM.prototype.stateFinal = function (stateArg, data) {
            var state;
            if (typeof stateArg == "string") {
                state = this.allStates[stateArg];
                if (state == undefined) {
                    this.fireError("finalStateExit() state : " + state.name + " not found.");
                    return;
                }
            }
            if (stateArg.constructor === sp.State)
                state = stateArg;
            if (state.isFinal == false) {
                this.fireError("state : " + state.name + " is not a finalState");
                return;
            }
            this.stateExit(state);
            if (state.parent && state.parent.name != this.name) {
                state.parent.stateFinal(state.parent, this, state, data);
                this.fireEvent(new sp.StateEvent(state.parent, "stateFinal", { current: state.parent, from: state, data: data }));
            }
        };
        FSM.prototype.toState = function (toState, data) {
            var current = this.getCurrentState();
            var nextState = this.allStates[toState];
            if (current.transitions.indexOf(toState) == -1) {
                this.fireError(current.name + " doesn't have transition to: " + toState + " , " + current.name + " transitions are: " + current.transitions);
                return false;
            }
            if (nextState.parent.name != current.name) {
                this.stateExit(current, data, nextState.name);
            }
            var cps = current.allParents.concat();
            var nps = nextState.allParents.concat();
            var exitParentNames = [];
            for (var c = 0; c < cps.length; c++) {
                if (nps.indexOf(cps[c]) == -1)
                    exitParentNames.push(cps[c]);
            }
            for (var q = 0; q < exitParentNames.length; q++) {
                var ep = this.allStates[exitParentNames[q]];
                this.stateExit(ep, data, nextState.name);
            }
            var parentReverse = nextState.allParents.concat().reverse();
            for (var p = 0; p < parentReverse.length; p++) {
                var loopP = this.allStates[parentReverse[p]];
                if (loopP) {
                    if (!loopP.isActive)
                        this.stateEnter(loopP, data, current.name);
                }
            }
            this.stateEnter(nextState, data, current.name);
            if (this.fsmui)
                this.fsmui.toCurrentState();
            return true;
        };
        FSM.prototype.fireError = function (msg) {
            console.error(msg);
            this.fireEvent(new sp.StateEvent(this, "error", { msg: msg }));
        };
        FSM.A_TO_B = 1;
        FSM.B_TO_A = 2;
        FSM.BOTH = 4;
        FSM.isInitial = 1;
        FSM.isFinal = 2;
        FSM.acceptAll = 4;
        return FSM;
    })(sp.State);
    sp.FSM = FSM;
})(sp || (sp = {}));
