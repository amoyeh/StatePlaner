/// <reference path="../dts/jquery.d.ts" />
module sp {
    export class StateEvent {
        public target: any;
        public type: string;
        public values: any;
        constructor(target: any, type: string, values: any = null) {
            this.target = target;
            this.type = type;
            this.values = values;
        }
    }
    export class EventDispatcher {
        private callBacks: { type: string; callbacks: any[] }[] = [];
        addEvent(type: string, func: any): void {
            if (this.callBacks[type] == null) {
                this.callBacks[type] = [];
            }
            this.callBacks[type].push({ func: func });
        }
        removeEvent(type: string, func: any) {
            if (this.callBacks[type] != null) {
                var callbackLen: number = this.callBacks[type].length;
                for (var k: number = 0; k < callbackLen; k++) {
                    if (this.callBacks[type][k].func === func) {
                        this.callBacks[type].splice(k, 1);
                        break;
                    }
                }
            }
        }
        hasEvent(type: string, func: any): boolean {
            if (this.callBacks[type] != null) {
                var callbackLen: number = this.callBacks[type].length;
                for (var k: number = 0; k < callbackLen; k++) {
                    if (this.callBacks[type][k].func === func) {
                        return true;
                    }
                }
            }
            return false;
        }
        fireEvent(event: StateEvent) {
            //console.log("F: " + event.type);
            if (this.callBacks[event.type] != null) {
                //console.log(this.callBacks[event.type]);
                var callbackLen: number = this.callBacks[event.type].length;
                for (var k: number = 0; k < callbackLen; k++) {
                    this.callBacks[event.type][k].func(event);
                }
            }
        }
    }
}

module sp {

    export class State extends EventDispatcher {

        public name: string;
        public parent: State;
        public childs: { [name: string]: State };
        public transitions: string[];
        public treeDeep: number = 0;
        public acceptAllType: boolean;

        public fsm: FSM;

        //cached all parents & child in the tree structure, used for fast data access
        //generate or update on every FSM buildTree() call
        public allParents: string[];
        public allChilds: string[];

        public isInitial: boolean;
        public isFinal: boolean;

        public isActive: boolean = false;

        constructor(name: string, isInitial: boolean = false, isFinal: boolean = false) {
            super();
            this.name = name;
            this.transitions = [];
            this.childs = {};
            this.isInitial = isInitial;
            this.isFinal = isFinal;
        }

        public addChild(child: any, toChild: boolean = false, toParent: boolean = false): void {
            if (this.isInitial || this.isFinal) {
                console.log("state name:" + this.name + " can not add child. (type is initial or final)");
                return;
            }
            if (child.constructor === Array) {
                var list: State[] = child;
                for (var k: number = 0; k < list.length; k++) this.addAChild(list[k], toChild, toParent);
            }
            if (child.constructor === State) this.addAChild(child, toChild, toParent);
        }

        private addAChild(child: State, toChild: boolean, toParent: boolean): void {
            if (this.childs[child.name]) {
                console.error("addChild error, state name must be unique on name: " + child.name);
                return;
            }
            if (child.parent) child.parent.removeChild(child);
            this.childs[child.name] = child;
            child.parent = this;
            if (toChild) this.addTransition(child);
            if (toParent) child.addTransition(this);
            if (child.isInitial) {
                this.addTransition(child);
            }

        }

        public removeChild(child: State): void {
            if (this.childs[child.name]) {
                this.childs[child.name].parent = null;
                delete this.childs[child.name];
            }
        }

        public addTransition(other: any, bothWay: boolean = false): void {
            if (other.constructor === Array) {
                var list: State[] = other;
                for (var k: number = 0; k < list.length; k++) {
                    this.addOneTransition(list[k], bothWay);
                }
            }
            if (other.constructor === State) {
                this.addOneTransition(other, bothWay);
            }
        }

        private addOneTransition(other: State, bothWay: boolean): void {
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
        }

        public deleteTransition(other: State, bothWay: boolean = false): void {
            var index: number = this.transitions.indexOf(other.name);
            if (index > -1) this.transitions.splice(index, 1);
            if (bothWay) {
                var otherIndex: number = other.transitions.indexOf(this.name);
                if (otherIndex > -1) other.transitions.splice(otherIndex, 1);
            }
        }

        protected treeLoop(target: State, root: FSM, levelCount: number): void {
            levelCount++;
            for (var key in this.childs) {
                var childOne: State = this.childs[key];
                if (root.allStates[childOne.name]) {
                    console.error("buildTree error, state name must be unique on name: " + childOne.name);
                } else {
                    root.allStates[childOne.name] = childOne;
                    childOne.fsm = root;
                    childOne.treeDeep = levelCount;
                }
                childOne.treeLoop(childOne, root, levelCount);
            }
        }

        public enter(target: State, fsm: FSM, from: string): void {
        }

        public exit(target: State, fsm: FSM, next: string): void {
        }

        public hasChild(): boolean {
            for (var checkFlag in this.childs) return true;
            return false;
        }

    }

    export class FSM extends State {

        //build the state tree and find all states and reference it
        public allStates: { [name: string]: State };
        public history: string[];
        private divObj: JQuery;
        private topUL: JQuery;
        private currentStateTxt: JQuery;
        private svg: JQuery;

        constructor(name: string) {
            super(name);
            this.history = [];
            this.allParents = [];
        }

        public getState(name: string): State {
            return this.allStates[name];
        }

        public init(initState: string): void {
            this.isActive = true;
            this.transitions.push(initState);
            this.toState(initState);
        }

        public buildTree(): void {

            this.history = [];
            this.allStates = {};
            this.treeLoop(this, this, 0);
            var acceptAllTypes: State[] = [];

            function recursiveChild(rootState: State, loopOn: State): void {
                for (var key in loopOn.childs) {
                    rootState.allChilds.push(loopOn.childs[key].name);
                    recursiveChild(rootState, loopOn.childs[key]);
                }
            }

            //update parent & child  data in all state
            for (var key in this.allStates) {

                //find all parents up to root, store it
                var loop: State = this.allStates[key];

                if (loop.acceptAllType) acceptAllTypes.push(loop);

                loop.allParents = [];
                if (loop.parent) {
                    var loopParent: State = loop.parent;
                    while (loopParent != undefined) {
                        loop.allParents.push(loopParent.name);
                        loopParent = loopParent.parent;
                    }
                }

                //add transition to special final state (accept all parent transition setting
                for (var key in this.allStates) {
                    var loop: State = this.allStates[key];
                    if (loop.isFinal && (loop.parent)) {
                        //find all siblings
                        var childList: string[] = [];
                        for (var key in loop.parent.childs) {
                            var pchild: State = loop.parent.childs[key];
                            if (pchild.name != loop.name) {
                                childList.push(pchild.name);
                                //adding bothway transitions to sibling
                                //loop.addTransition(pchild, true);
                            }
                        }
                        //adding parent's transition settings
                        var lptrans: string[] = loop.parent.transitions;
                        var lptranLen: number = lptrans.length;
                        for (var k: number = 0; k < lptranLen; k++) {
                            if (childList.indexOf(lptrans[k]) == -1 && lptrans[k] != loop.name) {
                                var addState: State = this.allStates[lptrans[k]];
                                loop.addTransition(addState);
                            }
                        }

                    }
                }

                loop.allChilds = [];
                var hasChild: boolean = false;
                for (var childKey in loop.childs) {
                    hasChild = true;
                    break;
                }
                if (hasChild) recursiveChild(loop, loop);
            }

            //for special acceptAllTpe
            for (var k: number = 0; k < acceptAllTypes.length; k++) {
                for (var key in this.allStates) {
                    var loopS: State = this.allStates[key];
                    if (loopS !== acceptAllTypes[k]) {
                        loopS.addTransition(acceptAllTypes[k]);
                    }
                }
            }

        }

        public getCurrentState(): State {
            var current: State = this;
            if (this.history.length > 0) current = this.allStates[this.history[this.history.length - 1]];
            return current;
        }

        public getPreviousState(backwardCount: number): State {
            var result: State = null;
            if (this.history.length >= backwardCount) result = this.allStates[this.history[this.history.length - backwardCount - 1]];
            return result;
        }

        private stateEnter(state: State, previous?: string): void {
            if (!state.isActive) {
                state.isActive = true;
                console.log("enter >> " + state.name);
                this.history.push(state.name);
                state.enter(state, this, previous);
                //enter any initial states in child
                for (var key in state.childs) {
                    if (state.childs[key].isInitial) {
                        console.log("enter >> " + state.childs[key].name + " (isInitial)");
                        state.childs[key].isActive = true;
                        state.childs[key].enter(state.childs[key], this, previous);
                        this.history.push(state.childs[key].name);
                    }
                }

                //when enter final state, set to exit
                //if state is final and has parent, exit parent
                if (state.isFinal) {
                    console.log("exit [isFinal] >> " + state.name);
                    state.exit(state, this, state.name);
                    if (state.parent && state.parent.name != this.name) {
                        console.log("exit parent [isFinal] >> " + state.parent.name);
                        state.parent.exit(state.parent, this, state.name);
                        this.history.push(state.parent.name);
                    }
                }

                //only keep 20 entries in history
                while (this.history.length > 20) this.history.shift();

            }
        }
        private stateExit(state: State, next?: string): void {
            if (state.isActive) {
                state.isActive = false;
                state.exit(state, this, next);
                console.log("exit  >> " + state.name);

            }
        }

        public toState(toState: string): boolean {

            //find the current active state, if undefined, use the root FSM
            var current: State = this.getCurrentState();
            var nextState: State = this.allStates[toState];

            //if (current.transitions.indexOf(toState) == -1) {
            //    console.error(current.name + " doesn't have transition to: " + toState);
            //    console.error(current.name + " transitions are : " + current.transitions);
            //    return false;
            //}

            console.log("====>  current: " + current.name + " , next: " + nextState.name + " , next parent: " + nextState.parent.name);
            //if transition is valid
            //if (current.transitions.indexOf(toState) > -1) {

            //current exit
            //=============================================================================
            //if nextState is not child of the current state, exit calls
            if (nextState.parent.name != current.name) {
                this.stateExit(current, nextState.name);
            }


            //if current exiting has parent, make sure all parents that are not in the same tree structure exit
            var cps: string[] = current.allParents.concat();
            var nps: string[] = nextState.allParents.concat();
            //console.log(current.name + " allParents : " + current.allParents);
            //console.log(nextState.name + " allParents : " + nextState.allParents);
            var exitParentNames: string[] = [];
            for (var c: number = 0; c < cps.length; c++) {
                if (nps.indexOf(cps[c]) == -1) exitParentNames.push(cps[c]);
            }
            //console.log("different parents : " + exitParentNames.join(" , "));
            for (var q: number = 0; q < exitParentNames.length; q++) {
                var ep: State = this.allStates[exitParentNames[q]];
                this.stateExit(ep, nextState.name);
            }


            //next enter
            //=============================================================================
            //update and enter the state first
            //if nextState has parent, make sure all parents are active and calls enter()
            var parentReverse: string[] = nextState.allParents.concat().reverse();
            for (var p: number = 0; p < parentReverse.length; p++) {
                var loopP: State = this.allStates[parentReverse[p]];
                if (loopP) {
                    if (!loopP.isActive) this.stateEnter(loopP, current.name);
                }
            }

            this.stateEnter(nextState, current.name);




            ////if (nextState.allParents.indexOf(current.name) == -1) {
            ////    //console.log("fire " + current.name + ".exit");
            ////    this.fireEvent(new StateEvent(current, current.name + ".exit", { next: nextState.name }));
            ////    current.exit(current, this, nextState.name);
            ////}

            //////if toStateObj and current does not have same parent, parent exit calls
            ////if (current.parent && nextState.parent) {
            ////    console.log("P:  " + current.parent.name + " N: " + nextState.parent.name);
            ////    if (current.parent.name !== nextState.parent.name) {
            ////        console.log("current.parent.name  " + current.parent.name + " nextState.parent.name " + nextState.parent.name);
            ////    }
            ////}



            ////enter toStateObj
            ////=============================================================================
            ////console.log("fire " + toStateObj.name + ".enter");
            //this.fireEvent(new StateEvent(nextState, nextState.name + ".enter", { from: current.name }));
            //nextState.enter(nextState, this, current.name);

            ////find any child state that make inital and call it, also push those state into history
            //for (var key in nextState.childs) {
            //    if (nextState.childs[key].isInitial) {
            //        this.toState(nextState.childs[key].name);
            //    }
            //}

            ////if the current state is set to final from its parent state, set parent to final
            //if (nextState.isFinal) {
            //    if (nextState.parent) {

            //        //console.log("fire " + toStateObj.name + ".exit");
            //        this.fireEvent(new StateEvent(nextState, nextState.name + ".exit"));
            //        nextState.exit(nextState, this, "");

            //        //console.log("fire " + toStateObj.parent.name + ".exit");
            //        this.fireEvent(new StateEvent(nextState.parent, nextState.parent.name + ".exit"));
            //        nextState.parent.exit(nextState.parent, this, "");

            //    }
            //}


            if (this.divObj) this.showLayoutStateActive(this.getCurrentState().name);
            return true;

        }

        public setLayoutMap(divId: string): void {

            var self: FSM = this;
            var useDiv: JQuery = $("#" + divId);
            useDiv.empty();

            this.divObj = useDiv;

            //the name of the FMS

            var titleDiv = $("<div class='spTitle'></div>");
            useDiv.append(titleDiv);
            this.currentStateTxt = $("<input type='text' class='spStateTxt'/>");
            titleDiv.append(this.currentStateTxt);

            //root state list
            this.topUL = useDiv.append('<ul></ul>').find('ul');
            this.topUL.addClass("spul");

            var expendBtns = [];

            for (var ck in this.childs) {
                var loopOne: State = this.childs[ck];
                recursiveAdd(loopOne, this, 1, this.topUL);
            }

            function setULClose(subUL: JQuery) {
                subUL.find(".spExpend").text("+");
                subUL.children("li").each(function (index, element) {
                    if (index > 0) {
                        $(this).hide();
                    }
                    //margin-bottom: -4px;
                    subUL.css({ "border": "1px solid rgba(0,0,0,0)" });
                });
                subUL.children("ul").each(function (index, element) { $(this).hide(); });
            }

            function loopCheckOpen(subUL: JQuery, level: number) {
                //console.log("loopCheckOpen:  " + subUL.attr("data-name") + " , level: " + level + "  was close: " + subUL.data("wasClose"));
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

            function setULOpen(subUL: JQuery) {
                subUL.show();
                subUL.find(".spExpend").text("-");
                subUL.children("li").each(function (index, element) {
                    if (index > 0) $(this).show();
                    subUL.css({ "border": "1px solid #EEE" });
                });
                subUL.children("ul").each(function (index, element) {
                    loopCheckOpen($(this), 1); // recursive open logic
                });
            }

            //local recursive adding structure
            function recursiveAdd(cState: State, parent: State, level: number, parentObj: JQuery) {

                var newUL: JQuery;
                var addVal: string = "";

                if (cState.isInitial) addVal = " (init)";
                if (cState.isFinal) addVal = " (final)";

                if (cState.hasChild()) {

                    var loopUL: JQuery = $("<ul data-name='" + cState.name + "'></ul>");
                    parentObj.append(loopUL);
                    parentObj.append(newUL);
                    loopUL.data("wasClose", false);

                    //first li refer to state itself
                    var firstLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '"></li > ');
                    loopUL.append(firstLi);

                    var nameSpan = $('<span data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</span>');
                    nameSpan.on("click", function (e) {
                        //self.showLayoutStateActive($(this).attr("data-name"));
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
                        } else {
                            setULOpen(targetUL);
                            targetUL.data("wasClose", false);
                        }
                        self.showLayoutStateActive(targetUL.attr("data-name"));
                    });

                    for (var tk in cState.childs) {
                        recursiveAdd(cState.childs[tk], cState, level, loopUL);
                    }

                } else {

                    var newLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</li>');
                    parentObj.append(newLi);
                    newLi.on("click", function (e) {
                        self.showLayoutStateActive($(this).attr("data-name"));
                    });
                }

            }

            //top functional buttons
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
                    var ebtn: JQuery = expendBtns[k];
                    var targetUL = ebtn.data("ul");
                    setULClose(targetUL);
                    targetUL.data("wasClose", true);
                }
            });
            openAllTbtn.on("click", function () {
                for (var k = 0; k < expendBtns.length; k++) {
                    var ebtn: JQuery = expendBtns[k];
                    var targetUL = ebtn.data("ul");
                    targetUL.data("wasClose", false);
                    targetUL.show();
                    ebtn.text("-");
                    targetUL.children("li").each(function (index, element) {
                        if (index > 0) $(this).show();
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

            //svg to draw graphics
            var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            newSvg.setAttribute("width", useDiv.width().toString());
            newSvg.setAttribute("height", useDiv.height().toString());
            useDiv.prepend(newSvg);
            this.svg = $(newSvg);

        }

        private showLayoutStateActive(name: string) {
            var self = this;
            this.svg.empty();


            this.topUL.find("li").each(function (index, element) {
                $(this).addClass("inactiveState");
                $(this).removeClass("activeState activeTrans");
            });
            this.topUL.find("li").each(function (index, element) {

                //active item
                if ($(this).attr("data-name") == name) {

                    $(this).removeClass("inactiveState activeTrans");
                    $(this).addClass("activeState");

                    var aX = $(this).offset().left;
                    var aY = $(this).offset().top;

                    self.currentStateTxt.val($(this).attr("data-name") + " │ transitions: " + $(this).attr("data-trans").replace(/,/g, " , "));
                    var transList: string[] = $(this).attr("data-trans").split(",");
                    self.topUL.find("li").each(function (index, element) {
                        if (transList.indexOf($(this).attr("data-name")) > -1) {
                            $(this).removeClass("inactiveState activeState");
                            $(this).addClass("activeTrans");
                            //if ($(this).is(":visible")) {
                            //    self.drawPath(aX, aY, $(this).offset().left, $(this).offset().top);
                            //}
                        }
                    });

                }
            });
        }

        //not ready
        private drawPath(aX: number, aY: number, toX: number, toY: number): void {
            //var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            //target node position y same or upper
            if (aY >= toY) {
                //to pt
                var c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                c1.setAttribute("cx", (aX - 15).toString());
                c1.setAttribute("cy", (aY - 15).toString());
                c1.setAttribute("r", "2");
                c1.setAttribute("fill", "red");
                //this.svg.append(c1);
                //start pt
                var c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                c2.setAttribute("cx", (aX - 10).toString());
                c2.setAttribute("cy", (aY).toString());
                c2.setAttribute("r", "2");
                c2.setAttribute("fill", "red");
                //this.svg.append(c2);
                //middle pt
                var c3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                c3.setAttribute("cx", (aX - 15).toString());
                c3.setAttribute("cy", (aY).toString());
                c3.setAttribute("r", "2");
                c3.setAttribute("fill", "blue");
                //this.svg.append(c3);

                var newpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                var d: string = "M" + (aX - 10) + "," + aY + " Q" + (aX - 15) + "," + aY + " " + (aX - 15) + "," + (aY - 15) + " T" + toX + "," + toY;
                newpath.setAttribute("d", d);
                newpath.setAttribute("stroke", "#FF0000");
                newpath.setAttribute("stroke-width", "1");
                newpath.setAttribute("opacity", "1");
                newpath.setAttribute("fill", "none");
                this.svg.append(newpath);

            }

        }

    }

}
