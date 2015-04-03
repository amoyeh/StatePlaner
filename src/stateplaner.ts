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

    export class State extends EventDispatcher {

        public name: string;
        public parent: State;
        public childs: { [name: string]: State };
        public transitions: string[];
        public treeDeep: number = 0;

        public fsm: FSM;

        //cached all parents & child in the tree structure, used for fast data access
        //generate or update on every FSM buildTree() call
        public allParents: string[];
        public allChilds: string[];

        public isInitial: boolean;
        public isFinal: boolean;

        constructor(name: string, isInitial: boolean = false, isFinal: boolean = false) {
            super();
            this.name = name;
            this.transitions = [];
            this.childs = {};
            this.isInitial = isInitial;
            this.isFinal = isFinal;
        }

        public addChild(...args: any[]): void {
            for (var k: number = 0; k < args.length; k++) {
                if (args[k].constructor == State) {
                    var loopOne: State = args[k];
                    if (loopOne.parent) loopOne.parent.removeChild(loopOne);
                    if (this.childs[loopOne.name]) {
                        console.error("addChild error, state name must be unique on name: " + loopOne.name);
                        return;
                    }
                    this.childs[loopOne.name] = loopOne;
                    loopOne.parent = this;
                    //adding transiton automatically
                    if (this.constructor != FSM) {
                        loopOne.addTransition(this);
                    }
                    this.addTransition(loopOne);
                }
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

        constructor(name: string) {
            super(name);
            this.history = [];
        }

        public printTreeInfo(): string {
            var output = this.name;
            for (var key in this.allStates) {
                var loopOne: State = this.allStates[key];
                var addSpace: number = loopOne.treeDeep * 3;
                var space: string = "";
                while (addSpace > -1) {
                    space += " ";
                    addSpace--;
                }
                var extra: string = "";
                if (loopOne.isInitial) extra += " (I)";
                if (loopOne.isFinal) extra += " (F)";
                output += "\n" + space + loopOne.name + extra;
            }
            return output;
        }

        public getState(name: string): State {
            return this.allStates[name];
        }

        public buildTree(): void {

            this.history = [];
            this.allStates = {};
            this.treeLoop(this, this, 0);

            function recursiveChild(rootState: State, loopOn: State): void {
                for (var key in loopOn.childs) {
                    rootState.allChilds.push(loopOn.childs[key].name);
                    recursiveChild(rootState, loopOn.childs[key]);
                }
            }

            //update parent & child string data in all state
            for (var key in this.allStates) {

                //find all parents up to root, store it
                var loop: State = this.allStates[key];
                loop.allParents = [];
                if (loop.parent) {
                    var loopParent: State = loop.parent;
                    while (loopParent != undefined) {
                        loop.allParents.push(loopParent.name);
                        loopParent = loopParent.parent;
                    }
                }

                //add transition to special final state
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

        public toState(toState: string): boolean {

            //find the current active state, if undefined, use the root FSM
            var current: State = this.getCurrentState();

            var toStateObj: State = this.allStates[toState];

            if (current.transitions.indexOf(toState) > -1) {

                //if the current leaving state is not in any parent level, exit must be called
                if (toStateObj.allParents.indexOf(current.name) == -1) {

                    //console.log("fire " + current.name + ".exit");
                    this.fireEvent(new StateEvent(current, current.name + ".exit", { next: toStateObj.name }));
                    current.exit(current, this, toStateObj.name);

                }

                //console.log("fire " + toStateObj.name + ".enter");
                this.fireEvent(new StateEvent(toStateObj, toStateObj.name + ".enter", { from: current.name }));
                toStateObj.enter(toStateObj, this, current.name);

                this.history.push(toStateObj.name);

                //find any child state that make inital and call it, also push those state into history
                for (var key in toStateObj.childs) {
                    if (toStateObj.childs[key].isInitial) {

                        //console.log("fire " + toStateObj.childs[key].name + ".enter");
                        this.fireEvent(new StateEvent(toStateObj.childs[key], toStateObj.childs[key].name + ".enter", { from: current.name }));
                        toStateObj.childs[key].enter(toStateObj.childs[key], this, current.name);

                        this.history.push(toStateObj.childs[key].name);
                    }
                }

                //if the current state is set to final from its parent state, set parent to final
                if (toStateObj.isFinal) {
                    if (toStateObj.parent) {

                        //console.log("fire " + toStateObj.name + ".exit");
                        this.fireEvent(new StateEvent(toStateObj, toStateObj.name + ".exit"));
                        toStateObj.exit(toStateObj, this, "");

                        //console.log("fire " + toStateObj.parent.name + ".exit");
                        this.fireEvent(new StateEvent(toStateObj.parent, toStateObj.parent.name + ".exit"));
                        toStateObj.parent.exit(toStateObj.parent, this, "");

                    }
                }

                if (this.divObj) this.showLayoutStateActive(this.getCurrentState().name);

                return true;

            } else {
                console.error(current.name + " doesn't have transition to: " + toState);
                console.error(current.name + " transitions are : " + current.transitions);
                return false;
            }
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
                        } else {
                            setULOpen(targetUL);
                            targetUL.data("wasClose", false);
                        }
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

        }

        private showLayoutStateActive(name: string) {

            console.log("showLayoutStateActive " + name);

            var self = this;

            this.topUL.find("li").each(function (index, element) {
                //deactive all states first
                $(this).css({ "font-weight": "normal", "color": "#333333", "border-color": "#EEE", "opacity": "0.5" });
                $(this).css({ "font-weight": "normal", "color": "#333333", "border-color": "#EEE" });
            });

            this.topUL.find("li").each(function (index, element) {

                //active item
                if ($(this).attr("data-name") == name) {

                    $(this).css({ "color": "#FF0000", "font-weight": "bold", "border-color": "#FF0000", "opacity": "1" });
                    self.currentStateTxt.val($(this).attr("data-name") + " │ transitions: " + $(this).attr("data-trans").replace(/,/g, " , "));

                    var transList: string[] = $(this).attr("data-trans").split(",");

                    self.topUL.find("li").each(function (index, element) {
                        if (transList.indexOf($(this).attr("data-name")) > -1) {
                            console.log("set ON : " + $(this).attr("data-name"));
                            console.log($(this).get(0));
                            $(this).css({ "color": "#FF6666", "border-color": "#FF6666", "opacity": "1" });
                        }
                    });
                }

            });

        }

    }

}
