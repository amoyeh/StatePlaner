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
            this.childs = {};
            this.isInitial = isInitial;
            this.isFinal = isFinal;
        }
        State.prototype.addChild = function (child, mask) {
            if (mask === void 0) { mask = 0; }
            if (this.isInitial || this.isFinal) {
                console.log("state name:" + this.name + " can not add child. (type is initial or final)");
                return;
            }
            if (child.constructor === Array) {
                var list = child;
                for (var k = 0; k < list.length; k++)
                    this.addAChild(list[k], mask);
            }
            if (child.constructor === State)
                this.addAChild(child, mask);
        };
        State.prototype.addAChild = function (child, mask) {
            if (mask === void 0) { mask = 0; }
            if (this.childs[child.name]) {
                console.error("addChild error, state name must be unique on name: " + child.name);
                return;
            }
            if (child.parent)
                child.parent.removeChild(child);
            this.childs[child.name] = child;
            child.parent = this;
            this.addTransition(child, mask);
        };
        State.prototype.addTransition = function (otherArg, mask) {
            if (mask === void 0) { mask = FSM.A_TO_B; }
            var otherAll = [];
            if (otherArg.constructor === Array)
                otherAll = otherArg;
            if (otherArg.constructor === State)
                otherAll.push(otherArg);
            for (var q = 0; q < otherAll.length; q++) {
                var other = otherAll[q];
                if ((mask & FSM.BOTH) != 0) {
                    this.addUniqueTrans([other.name]);
                    other.addUniqueTrans([this.name]);
                }
                else {
                    if ((mask & FSM.A_TO_B) != 0)
                        this.addUniqueTrans([other.name]);
                    if ((mask & FSM.B_TO_A) != 0)
                        other.addUniqueTrans([this.name]);
                }
            }
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
            if (this.childs[child.name]) {
                this.childs[child.name].parent = null;
                delete this.childs[child.name];
            }
        };
        State.prototype.deleteTransition = function (other, bothWay) {
            if (bothWay === void 0) { bothWay = false; }
            var index = this.transitions.indexOf(other.name);
            if (index > -1)
                this.transitions.splice(index, 1);
            if (bothWay) {
                var otherIndex = other.transitions.indexOf(this.name);
                if (otherIndex > -1)
                    other.transitions.splice(otherIndex, 1);
            }
        };
        State.prototype.enter = function (target, fsm, from) {
        };
        State.prototype.exit = function (target, fsm, next) {
        };
        State.prototype.hasChild = function () {
            for (var checkFlag in this.childs)
                return true;
            return false;
        };
        return State;
    })(sp.EventDispatcher);
    sp.State = State;
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
                console.error('createState("' + name + '") , state already exit.');
                return null;
            }
            var newState = new State(name);
            if ((typeMask & FSM.isInitial) != 0)
                newState.isInitial = true;
            if ((typeMask & FSM.isFinal) != 0)
                newState.isFinal = true;
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
                console.error("init() state name '" + initState + "' does not exist");
            }
        };
        FSM.prototype.buildTree = function () {
            this.history = [];
            function recursiveChild(rootState, loopOn) {
                for (var key in loopOn.childs) {
                    rootState.allChilds.push(loopOn.childs[key].name);
                    recursiveChild(rootState, loopOn.childs[key]);
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
                var hasChild = false;
                for (var childKey in loop.childs) {
                    hasChild = true;
                    break;
                }
                if (hasChild)
                    recursiveChild(loop, loop);
            }
            for (var key in this.allStates) {
                var loop = this.allStates[key];
                if (loop.isInitial && loop.parent) {
                    loop.parent.addTransition(loop);
                }
                if (loop.isFinal && (loop.parent)) {
                    var childList = [];
                    for (var key in loop.parent.childs) {
                        var pchild = loop.parent.childs[key];
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
        FSM.prototype.stateEnter = function (state, previous) {
            if (!state.isActive) {
                state.isActive = true;
                this.history.push(state.name);
                this.fireEvent(new sp.StateEvent(state, "stateEnter", { current: state, from: this.getState(previous) }));
                state.enter(state, this, this.getState(previous));
                for (var key in state.childs) {
                    if (state.childs[key].isInitial) {
                        state.childs[key].isActive = true;
                        this.fireEvent(new sp.StateEvent(state.childs[key], "stateEnter", { current: state.childs[key], from: this.getState(previous) }));
                        state.childs[key].enter(state.childs[key], this, this.getState(previous));
                        this.history.push(state.childs[key].name);
                    }
                }
                while (this.history.length > 20)
                    this.history.shift();
            }
        };
        FSM.prototype.stateExit = function (state, next) {
            if (state.isActive) {
                state.isActive = false;
                state.exit(state, this, this.getState(next));
                this.fireEvent(new sp.StateEvent(state, "stateExit", { current: state, next: this.getState(next) }));
            }
        };
        FSM.prototype.finalStateExit = function (stateArg) {
            var state;
            if (typeof stateArg == "string") {
                state = this.allStates[stateArg];
                if (state == undefined) {
                    console.error("finalStateExit() state : " + state.name + " not found.");
                    return;
                }
            }
            if (stateArg.constructor === State)
                state = stateArg;
            if (state.isFinal == false) {
                console.error("state : " + state.name + " is not a finalState");
                return;
            }
            state.isActive = false;
            state.exit(state, this, null);
            if (state.parent && state.parent.name != this.name) {
                this.fireEvent(new sp.StateEvent(state.parent, state.parent.name + ".exit", { from: state.name }));
                state.parent.isActive = false;
                state.parent.exit(state.parent, this, state);
            }
        };
        FSM.prototype.toState = function (toState) {
            var current = this.getCurrentState();
            var nextState = this.allStates[toState];
            if (current.transitions.indexOf(toState) == -1) {
                var errorMsg = current.name + " doesn't have transition to: " + toState + " , " + current.name + " transitions are: " + current.transitions;
                console.error(errorMsg);
                this.fireEvent(new sp.StateEvent(this, "error", { msg: errorMsg }));
                return false;
            }
            if (nextState.parent.name != current.name) {
                this.stateExit(current, nextState.name);
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
                this.stateExit(ep, nextState.name);
            }
            var parentReverse = nextState.allParents.concat().reverse();
            for (var p = 0; p < parentReverse.length; p++) {
                var loopP = this.allStates[parentReverse[p]];
                if (loopP) {
                    if (!loopP.isActive)
                        this.stateEnter(loopP, current.name);
                }
            }
            this.stateEnter(nextState, current.name);
            if (this.fsmui)
                this.fsmui.toCurrentState();
            return true;
        };
        FSM.A_TO_B = 1;
        FSM.B_TO_A = 2;
        FSM.BOTH = 4;
        FSM.isInitial = 1;
        FSM.isFinal = 2;
        return FSM;
    })(State);
    sp.FSM = FSM;
})(sp || (sp = {}));
