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
    var State = (function (_super) {
        __extends(State, _super);
        function State(name, isInitial, isFinal) {
            if (isInitial === void 0) { isInitial = false; }
            if (isFinal === void 0) { isFinal = false; }
            _super.call(this);
            this.treeDeep = 0;
            this.name = name;
            this.transitions = [];
            this.childs = {};
            this.isInitial = isInitial;
            this.isFinal = isFinal;
        }
        State.prototype.addChild = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            for (var k = 0; k < args.length; k++) {
                if (args[k].constructor == State) {
                    var loopOne = args[k];
                    if (loopOne.parent)
                        loopOne.parent.removeChild(loopOne);
                    if (this.childs[loopOne.name]) {
                        console.error("addChild error, state name must be unique on name: " + loopOne.name);
                        return;
                    }
                    this.childs[loopOne.name] = loopOne;
                    loopOne.parent = this;
                    if (this.constructor != FSM) {
                        loopOne.addTransition(this);
                    }
                    this.addTransition(loopOne);
                }
            }
        };
        State.prototype.removeChild = function (child) {
            if (this.childs[child.name]) {
                this.childs[child.name].parent = null;
                delete this.childs[child.name];
            }
        };
        State.prototype.addTransition = function (other, bothWay) {
            if (bothWay === void 0) { bothWay = false; }
            if (this.transitions.indexOf(other.name) == -1 && this.name != other.name) {
                this.transitions.push(other.name);
            }
            if (bothWay) {
                if (other.transitions.indexOf(this.name) == -1 && other.name != this.name) {
                    other.transitions.push(this.name);
                }
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
        State.prototype.treeLoop = function (target, root, levelCount) {
            levelCount++;
            for (var key in this.childs) {
                var childOne = this.childs[key];
                if (root.allStates[childOne.name]) {
                    console.error("buildTree error, state name must be unique on name: " + childOne.name);
                }
                else {
                    root.allStates[childOne.name] = childOne;
                    childOne.fsm = root;
                    childOne.treeDeep = levelCount;
                }
                childOne.treeLoop(childOne, root, levelCount);
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
    })(EventDispatcher);
    sp.State = State;
    var FSM = (function (_super) {
        __extends(FSM, _super);
        function FSM(name) {
            _super.call(this, name);
            this.history = [];
        }
        FSM.prototype.printTreeInfo = function () {
            var output = this.name;
            for (var key in this.allStates) {
                var loopOne = this.allStates[key];
                var addSpace = loopOne.treeDeep * 3;
                var space = "";
                while (addSpace > -1) {
                    space += " ";
                    addSpace--;
                }
                var extra = "";
                if (loopOne.isInitial)
                    extra += " (I)";
                if (loopOne.isFinal)
                    extra += " (F)";
                output += "\n" + space + loopOne.name + extra;
            }
            return output;
        };
        FSM.prototype.getState = function (name) {
            return this.allStates[name];
        };
        FSM.prototype.buildTree = function () {
            this.history = [];
            this.allStates = {};
            this.treeLoop(this, this, 0);
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
                for (var key in this.allStates) {
                    var loop = this.allStates[key];
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
        FSM.prototype.toState = function (toState) {
            var current = this.getCurrentState();
            var toStateObj = this.allStates[toState];
            if (current.transitions.indexOf(toState) > -1) {
                if (toStateObj.allParents.indexOf(current.name) == -1) {
                    this.fireEvent(new StateEvent(current, current.name + ".exit", { next: toStateObj.name }));
                    current.exit(current, this, toStateObj.name);
                }
                this.fireEvent(new StateEvent(toStateObj, toStateObj.name + ".enter", { from: current.name }));
                toStateObj.enter(toStateObj, this, current.name);
                this.history.push(toStateObj.name);
                for (var key in toStateObj.childs) {
                    if (toStateObj.childs[key].isInitial) {
                        this.fireEvent(new StateEvent(toStateObj.childs[key], toStateObj.childs[key].name + ".enter", { from: current.name }));
                        toStateObj.childs[key].enter(toStateObj.childs[key], this, current.name);
                        this.history.push(toStateObj.childs[key].name);
                    }
                }
                if (toStateObj.isFinal) {
                    if (toStateObj.parent) {
                        this.fireEvent(new StateEvent(toStateObj, toStateObj.name + ".exit"));
                        toStateObj.exit(toStateObj, this, "");
                        this.fireEvent(new StateEvent(toStateObj.parent, toStateObj.parent.name + ".exit"));
                        toStateObj.parent.exit(toStateObj.parent, this, "");
                    }
                }
                return true;
            }
            else {
                console.error(current.name + " doesn't have transition to: " + toState);
                console.error(current.name + " transitions are : " + current.transitions);
                return false;
            }
        };
        FSM.prototype.setDebugUI = function (target) {
            target.empty();
            var headDiv = $("<div></div>");
            headDiv.css({ "color": "#333333", "cursor": "pointer" });
            headDiv.text(this.name);
            target.append(headDiv);
            var topUL = target.append('<ul></ul>').find('ul');
            function recursiveAdd(target, parent, parentObj) {
                var newObj;
                var addVal = "";
                if (target.isInitial)
                    addVal = " (init)";
                if (target.isFinal)
                    addVal = " (final)";
                var newLi = $('<li data-trans="' + target.transitions.join(",") + '">' + target.name + addVal + '</li>');
                $(newLi).css({ "font-weight": "normal", "color": "#333", "text-decoration": "none" });
                parentObj.append(newLi);
                if (target.hasChild()) {
                    newObj = $("<ul></ul>");
                    parentObj.append(newObj);
                    for (var tk in target.childs) {
                        recursiveAdd(target.childs[tk], target, newObj);
                    }
                }
            }
            for (var ck in this.childs) {
                var loopOne = this.childs[ck];
                recursiveAdd(loopOne, this, topUL);
            }
            var outDiv = $("<div></div>");
            target.append(outDiv);
            topUL.find("li").each(function () {
                $(this).css({ "cursor": "pointer" });
                $(this).on("click", function (e) {
                    var transVal = $(e.currentTarget).attr("data-trans").split(",");
                    topUL.find("li").each(function () {
                        var checkText = $(this).text();
                        checkText = checkText.replace(" (init)", "");
                        checkText = checkText.replace(" (final)", "");
                        if (transVal.indexOf(checkText) > -1) {
                            $(this).css({ "font-weight": "bold", "color": "#FF6666", "text-decoration": "none", "font-size": "100%" });
                        }
                        else {
                            $(this).css({ "font-weight": "normal", "color": "#333", "text-decoration": "none", "font-size": "100%" });
                        }
                    });
                    $(this).css({ "color": "#CC3300", "font-weight": "bold", "text-decoration": "underline", "font-size": "120%" });
                    var tranStr = $(e.currentTarget).attr("data-trans");
                    tranStr = tranStr.replace(/,/g, " , ");
                    outDiv.html("state: " + $(this).text() + "  <span style='padding-left:30px; '>  transitions: " + tranStr + "</span>");
                });
            });
            headDiv.on("click", function (e) {
                topUL.find("li").each(function () {
                    $(this).css({ "font-weight": "normal", "color": "#333", "text-decoration": "none", "font-size": "100%" });
                    outDiv.html("");
                });
            });
        };
        return FSM;
    })(State);
    sp.FSM = FSM;
})(sp || (sp = {}));
