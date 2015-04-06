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
            this.treeDeep = 0;
            this.isActive = false;
            this.name = name;
            this.transitions = [];
            this.childs = {};
            this.isInitial = isInitial;
            this.isFinal = isFinal;
        }
        State.prototype.addChild = function (child, toChild, toParent) {
            if (toChild === void 0) { toChild = false; }
            if (toParent === void 0) { toParent = false; }
            if (this.isInitial || this.isFinal) {
                console.log("state name:" + this.name + " can not add child. (type is initial or final)");
                return;
            }
            if (child.constructor === Array) {
                var list = child;
                for (var k = 0; k < list.length; k++)
                    this.addAChild(list[k], toChild, toParent);
            }
            if (child.constructor === State)
                this.addAChild(child, toChild, toParent);
        };
        State.prototype.addAChild = function (child, toChild, toParent) {
            if (this.childs[child.name]) {
                console.error("addChild error, state name must be unique on name: " + child.name);
                return;
            }
            if (child.parent)
                child.parent.removeChild(child);
            this.childs[child.name] = child;
            child.parent = this;
            if (toChild)
                this.addTransition(child);
            if (toParent)
                child.addTransition(this);
            if (child.isInitial) {
                this.addTransition(child);
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
    })(sp.EventDispatcher);
    sp.State = State;
    var FSM = (function (_super) {
        __extends(FSM, _super);
        function FSM(name) {
            _super.call(this, name);
            this.history = [];
            this.allParents = [];
        }
        FSM.prototype.getState = function (name) {
            return this.allStates[name];
        };
        FSM.prototype.init = function (initState) {
            this.isActive = true;
            this.transitions.push(initState);
            this.toState(initState);
        };
        FSM.prototype.buildTree = function () {
            this.history = [];
            this.allStates = {};
            this.treeLoop(this, this, 0);
            var acceptAllTypes = [];
            function recursiveChild(rootState, loopOn) {
                for (var key in loopOn.childs) {
                    rootState.allChilds.push(loopOn.childs[key].name);
                    recursiveChild(rootState, loopOn.childs[key]);
                }
            }
            for (var key in this.allStates) {
                var loop = this.allStates[key];
                if (loop.acceptAllType)
                    acceptAllTypes.push(loop);
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
            for (var k = 0; k < acceptAllTypes.length; k++) {
                for (var key in this.allStates) {
                    var loopS = this.allStates[key];
                    if (loopS !== acceptAllTypes[k]) {
                        loopS.addTransition(acceptAllTypes[k]);
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
                console.log("enter >> " + state.name);
                this.history.push(state.name);
                state.enter(state, this, previous);
                for (var key in state.childs) {
                    if (state.childs[key].isInitial) {
                        console.log("enter >> " + state.childs[key].name + " (isInitial)");
                        state.childs[key].isActive = true;
                        state.childs[key].enter(state.childs[key], this, previous);
                        this.history.push(state.childs[key].name);
                    }
                }
                if (state.isFinal) {
                    console.log("exit [isFinal] >> " + state.name);
                    state.exit(state, this, state.name);
                    if (state.parent && state.parent.name != this.name) {
                        console.log("exit parent [isFinal] >> " + state.parent.name);
                        state.parent.exit(state.parent, this, state.name);
                        this.history.push(state.parent.name);
                    }
                }
                while (this.history.length > 20)
                    this.history.shift();
            }
        };
        FSM.prototype.stateExit = function (state, next) {
            if (state.isActive) {
                state.isActive = false;
                state.exit(state, this, next);
                console.log("exit  >> " + state.name);
            }
        };
        FSM.prototype.toState = function (toState) {
            var current = this.getCurrentState();
            var nextState = this.allStates[toState];
            console.log("====>  current: " + current.name + " , next: " + nextState.name + " , next parent: " + nextState.parent.name);
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
            if (this.divObj)
                this.showLayoutStateActive(this.getCurrentState().name);
            return true;
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
                        self.showLayoutStateActive(targetUL.attr("data-name"));
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
            this.topUL.find("li").each(function (index, element) {
                $(this).addClass("inactiveState");
                $(this).removeClass("activeState activeTrans");
            });
            var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            newSvg.setAttribute("width", useDiv.width().toString());
            newSvg.setAttribute("height", useDiv.height().toString());
            useDiv.prepend(newSvg);
            this.svg = $(newSvg);
        };
        FSM.prototype.showLayoutStateActive = function (name) {
            var self = this;
            this.svg.empty();
            this.topUL.find("li").each(function (index, element) {
                $(this).addClass("inactiveState");
                $(this).removeClass("activeState activeTrans");
            });
            this.topUL.find("li").each(function (index, element) {
                if ($(this).attr("data-name") == name) {
                    $(this).removeClass("inactiveState activeTrans");
                    $(this).addClass("activeState");
                    var aX = $(this).offset().left;
                    var aY = $(this).offset().top;
                    self.currentStateTxt.val($(this).attr("data-name") + " │ transitions: " + $(this).attr("data-trans").replace(/,/g, " , "));
                    var transList = $(this).attr("data-trans").split(",");
                    self.topUL.find("li").each(function (index, element) {
                        if (transList.indexOf($(this).attr("data-name")) > -1) {
                            $(this).removeClass("inactiveState activeState");
                            $(this).addClass("activeTrans");
                        }
                    });
                }
            });
        };
        FSM.prototype.drawPath = function (aX, aY, toX, toY) {
            if (aY >= toY) {
                var c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                c1.setAttribute("cx", (aX - 15).toString());
                c1.setAttribute("cy", (aY - 15).toString());
                c1.setAttribute("r", "2");
                c1.setAttribute("fill", "red");
                var c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                c2.setAttribute("cx", (aX - 10).toString());
                c2.setAttribute("cy", (aY).toString());
                c2.setAttribute("r", "2");
                c2.setAttribute("fill", "red");
                var c3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                c3.setAttribute("cx", (aX - 15).toString());
                c3.setAttribute("cy", (aY).toString());
                c3.setAttribute("r", "2");
                c3.setAttribute("fill", "blue");
                var newpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                var d = "M" + (aX - 10) + "," + aY + " Q" + (aX - 15) + "," + aY + " " + (aX - 15) + "," + (aY - 15) + " T" + toX + "," + toY;
                newpath.setAttribute("d", d);
                newpath.setAttribute("stroke", "#FF0000");
                newpath.setAttribute("stroke-width", "1");
                newpath.setAttribute("opacity", "1");
                newpath.setAttribute("fill", "none");
                this.svg.append(newpath);
            }
        };
        return FSM;
    })(State);
    sp.FSM = FSM;
})(sp || (sp = {}));
