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
            if (other.constructor === Array) {
                var list = other;
                for (var k = 0; k < list.length; k++) {
                    this.addOneTransition(list[k], bothWay);
                }
            }
            if (other.constructor === State) {
                this.addOneTransition(other, bothWay);
            }
        };
        State.prototype.addOneTransition = function (other, bothWay) {
            if (other.name) {
                if (this.transitions.indexOf(other.name) == -1 && this.name != other.name) {
                    this.transitions.push(other.name);
                }
                if (bothWay) {
                    if (other.transitions.indexOf(this.name) == -1 && other.name != this.name) {
                        other.transitions.push(this.name);
                    }
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
                if (this.divObj)
                    this.showLayoutStateActive(this.getCurrentState().name);
                return true;
            }
            else {
                console.error(current.name + " doesn't have transition to: " + toState);
                console.error(current.name + " transitions are : " + current.transitions);
                return false;
            }
        };
        FSM.prototype.setLayoutMap = function (divId) {
            var self = this;
            var useDiv = $("#" + divId);
            useDiv.empty();
            this.divObj = useDiv;
            var titleDiv = $("<div class='spTitle'></div>");
            useDiv.append(titleDiv);
            this.currentStateTxt = $("<input type='text' class='spStateTxt'/>");
            titleDiv.append(this.currentStateTxt);
            this.topUL = useDiv.append('<ul></ul>').find('ul');
            this.topUL.addClass("spul");
            var expendBtns = [];
            for (var ck in this.childs) {
                var loopOne = this.childs[ck];
                recursiveAdd(loopOne, this, 1, this.topUL);
            }
            function setULClose(subUL) {
                subUL.find(".spExpend").text("+");
                subUL.children("li").each(function (index, element) {
                    if (index > 0) {
                        $(this).hide();
                    }
                    subUL.css({ "border": "1px solid rgba(0,0,0,0)" });
                });
                subUL.children("ul").each(function (index, element) {
                    $(this).hide();
                });
            }
            function loopCheckOpen(subUL, level) {
                subUL.show();
                setULClose(subUL);
                if (!subUL.data("wasClose")) {
                    subUL.find(".spExpend").text("-");
                    subUL.children("li").each(function (index, element) {
                        $(this).show();
                        subUL.css({ "border": "1px solid #EEE" });
                    });
                    subUL.children("ul").each(function (index, element) {
                        level++;
                        loopCheckOpen($(this), level);
                    });
                }
            }
            function setULOpen(subUL) {
                subUL.show();
                subUL.find(".spExpend").text("-");
                subUL.children("li").each(function (index, element) {
                    if (index > 0)
                        $(this).show();
                    subUL.css({ "border": "1px solid #EEE" });
                });
                subUL.children("ul").each(function (index, element) {
                    loopCheckOpen($(this), 1);
                });
            }
            function recursiveAdd(cState, parent, level, parentObj) {
                var newUL;
                var addVal = "";
                if (cState.isInitial)
                    addVal = " (init)";
                if (cState.isFinal)
                    addVal = " (final)";
                if (cState.hasChild()) {
                    var loopUL = $("<ul data-name='" + cState.name + "'></ul>");
                    parentObj.append(loopUL);
                    parentObj.append(newUL);
                    loopUL.data("wasClose", false);
                    var firstLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '"></li > ');
                    loopUL.append(firstLi);
                    var nameSpan = $('<span data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</span>');
                    nameSpan.on("click", function (e) {
                        self.showLayoutStateActive($(this).attr("data-name"));
                    });
                    firstLi.append(nameSpan);
                    var expandDiv = $("<span class='spExpend'>-</span>");
                    expandDiv.data("ul", loopUL);
                    firstLi.append(expandDiv);
                    expendBtns.push(expandDiv);
                    expandDiv.on("click", function () {
                        var targetUL = $(this).data("ul");
                        if ($(this).text().indexOf("-") > -1) {
                            setULClose(targetUL);
                            targetUL.data("wasClose", true);
                        }
                        else {
                            setULOpen(targetUL);
                            targetUL.data("wasClose", false);
                        }
                    });
                    for (var tk in cState.childs) {
                        recursiveAdd(cState.childs[tk], cState, level, loopUL);
                    }
                }
                else {
                    var newLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</li>');
                    parentObj.append(newLi);
                    newLi.on("click", function (e) {
                        self.showLayoutStateActive($(this).attr("data-name"));
                    });
                }
            }
            var showUIBtn = $("<span class='spTopBtn' style='width:60px; display:none;'>show UI</span>");
            useDiv.append(showUIBtn);
            var hideUIBtn = $("<span class='spTopBtn' style='width:60px;'>hide UI</span>");
            var openAllTbtn = $("<span class='spTopBtn'>open all</span>");
            var closeAllTbtn = $("<span class='spTopBtn'>close all</span>");
            titleDiv.prepend(closeAllTbtn);
            titleDiv.prepend(openAllTbtn);
            titleDiv.prepend(hideUIBtn);
            closeAllTbtn.on("click", function () {
                for (var k = 0; k < expendBtns.length; k++) {
                    var ebtn = expendBtns[k];
                    var targetUL = ebtn.data("ul");
                    setULClose(targetUL);
                    targetUL.data("wasClose", true);
                }
            });
            openAllTbtn.on("click", function () {
                for (var k = 0; k < expendBtns.length; k++) {
                    var ebtn = expendBtns[k];
                    var targetUL = ebtn.data("ul");
                    targetUL.data("wasClose", false);
                    targetUL.show();
                    ebtn.text("-");
                    targetUL.children("li").each(function (index, element) {
                        if (index > 0)
                            $(this).show();
                        targetUL.css({ "border": "1px solid #EEE" });
                    });
                }
            });
            hideUIBtn.on("click", function () {
                titleDiv.hide();
                self.topUL.hide();
                showUIBtn.show();
            });
            showUIBtn.on("click", function () {
                titleDiv.show();
                self.topUL.show();
                showUIBtn.hide();
            });
        };
        FSM.prototype.showLayoutStateActive = function (name) {
            console.log("showLayoutStateActive " + name);
            var self = this;
            this.topUL.find("li").each(function (index, element) {
                $(this).css({ "font-weight": "normal", "color": "#333333", "border-color": "#EEE", "opacity": "0.5" });
                $(this).css({ "font-weight": "normal", "color": "#333333", "border-color": "#EEE" });
            });
            this.topUL.find("li").each(function (index, element) {
                if ($(this).attr("data-name") == name) {
                    $(this).css({ "color": "#FF0000", "font-weight": "bold", "border-color": "#FF0000", "opacity": "1" });
                    self.currentStateTxt.val($(this).attr("data-name") + " │ transitions: " + $(this).attr("data-trans").replace(/,/g, " , "));
                    var transList = $(this).attr("data-trans").split(",");
                    self.topUL.find("li").each(function (index, element) {
                        if (transList.indexOf($(this).attr("data-name")) > -1) {
                            console.log("set ON : " + $(this).attr("data-name"));
                            console.log($(this).get(0));
                            $(this).css({ "color": "#FF6666", "border-color": "#FF6666", "opacity": "1" });
                        }
                    });
                }
            });
        };
        return FSM;
    })(State);
    sp.FSM = FSM;
})(sp || (sp = {}));
