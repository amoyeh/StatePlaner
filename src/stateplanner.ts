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
            if (this.callBacks[event.type] != null) {
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
        public acceptAll: boolean;

        public fsm: FSM;

        //cached all parents & child in the tree structure, used for fast data access
        //generate or update on every FSM buildTree() call
        public allParents: string[];
        public allChilds: string[];
        public referStates: string[]; //used to add transtion array in this Sate to to other State

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

        public addChild(child: any, mask: number = 0): void {
            if (this.isInitial || this.isFinal) {
                console.log("state name:" + this.name + " can not add child. (type is initial or final)");
                return;
            }
            if (child.constructor === Array) {
                var list: State[] = child;
                for (var k: number = 0; k < list.length; k++) this.addAChild(list[k], mask);
            }
            if (child.constructor === State) this.addAChild(child, mask);
        }

        private addAChild(child: State, mask: number = 0): void {
            if (this.childs[child.name]) {
                console.error("addChild error, state name must be unique on name: " + child.name);
                return;
            }
            if (child.parent) child.parent.removeChild(child);
            this.childs[child.name] = child;
            child.parent = this;
            this.addTransition(child, mask);
        }

        public addTransition(otherArg: any, mask: number = FSM.A_TO_B): void {
            var otherAll: State[] = [];
            if (otherArg.constructor === Array) otherAll = otherArg;
            if (otherArg.constructor === State) otherAll.push(otherArg);
            for (var q: number = 0; q < otherAll.length; q++) {
                var other: State = otherAll[q];
                if ((mask & FSM.BOTH) != 0) {
                    this.addUniqueTrans([other.name]);
                    other.addUniqueTrans([this.name]);
                } else {
                    if ((mask & FSM.A_TO_B) != 0) this.addUniqueTrans([other.name]);
                    if ((mask & FSM.B_TO_A) != 0) other.addUniqueTrans([this.name]);
                }
            }
        }

        public addUniqueTrans(list: string[]): void {
            for (var k: number = 0; k < list.length; k++) {
                var loopName: string = list[k];
                if (this.transitions.indexOf(loopName) == -1 && this.name != loopName) {
                    this.transitions.push(loopName);
                }
            }
        }

        public removeChild(child: State): void {
            if (this.childs[child.name]) {
                this.childs[child.name].parent = null;
                delete this.childs[child.name];
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

        public enter(target: State, fsm: FSM, from: State): void {
        }

        public exit(target: State, fsm: FSM, next: State): void {
        }

        public hasChild(): boolean {
            for (var checkFlag in this.childs) return true;
            return false;
        }

    }

    export class FSM extends State {

        //mask bit for adding connection type
        public static A_TO_B: number = 1;
        public static B_TO_A: number = 2;
        public static BOTH: number = 4;

        //mask bit for state type
        public static isInitial: number = 1;
        public static isFinal: number = 2;

        //build the state tree and find all states and reference it
        public allStates: { [name: string]: State };
        public history: string[];
        private divObj: JQuery;
        private topUL: JQuery;
        private currentStateTxt: JQuery;
        private svg: JQuery;
        public fsmui: FSMUI;

        constructor(name: string) {
            super(name);
            this.history = [];
            this.allParents = [];
            this.allStates = {};
            this.allStates[this.name] = this;
        }

        public createState(name: string, typeMask: number): State {
            if (this.allStates[name]) {
                console.error('createState("' + name + '") , state already exit.');
                return null;
            }
            var newState = new State(name);
            if ((typeMask & FSM.isInitial) != 0) newState.isInitial = true;
            if ((typeMask & FSM.isFinal) != 0) newState.isFinal = true;
            this.allStates[name] = newState;
            newState.fsm = this;
            return newState;
        }

        public getState(name: string): State {
            return this.allStates[name];
        }

        public init(initState: string): void {
            this.isActive = true;
            if (this.allStates[initState]) {
                this.transitions.push(initState);
                this.toState(initState);
            } else {
                console.error("init() state name '" + initState + "' does not exist");
            }
        }

        public buildTree(): void {

            this.history = [];

            //update allChilds and allParents value to all States
            //---------------------------------------------------------------------------
            function recursiveChild(rootState: State, loopOn: State): void {
                for (var key in loopOn.childs) {
                    rootState.allChilds.push(loopOn.childs[key].name);
                    recursiveChild(rootState, loopOn.childs[key]);
                }
            }
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
                loop.allChilds = [];
                var hasChild: boolean = false;
                for (var childKey in loop.childs) {
                    hasChild = true;
                    break;
                }
                if (hasChild) recursiveChild(loop, loop);
            }

            //create transtions on special states (isFinal, isInitial, acceptAllTpe)..
            //---------------------------------------------------------------------------
            for (var key in this.allStates) {

                var loop: State = this.allStates[key];

                //create transition that marked isInitial to its parent
                if (loop.isInitial && loop.parent) {
                    loop.parent.addTransition(loop);
                }

                //marked isFinal contains all parents transition
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

                //special acceptAllTpe
                if (loop.acceptAll) {
                    for (var subKey in this.allStates) {
                        if (this.allStates[subKey] !== loop) {
                            this.allStates[subKey].addTransition(loop);
                        }
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
                //if (this.fsmui) this.fsmui.log("enter          >>  " + state.name + " |  from: " + previous);
                this.history.push(state.name);
                this.fireEvent(new StateEvent(state, "stateEnter", { current: state, from: this.getState(previous) }));
                state.enter(state, this, this.getState(previous));
                //enter any initial states in child
                for (var key in state.childs) {
                    if (state.childs[key].isInitial) {
                        //if (this.fsmui) this.fsmui.log("enter(initial) >>  " + state.childs[key].name + " |  from: " + previous);
                        state.childs[key].isActive = true;
                        this.fireEvent(new StateEvent(state.childs[key], "stateEnter", { current: state.childs[key], from: this.getState(previous) }));
                        state.childs[key].enter(state.childs[key], this, this.getState(previous));
                        this.history.push(state.childs[key].name);
                    }
                }
                //if (state.isFinal) {
                //    if (state.parent && state.parent.name != this.name) {
                //        if (this.consoleDebug) console.log("exit.parent(final) >> " + state.parent.name + ", from:" + state.name);
                //        this.fireEvent(new StateEvent(state.parent, state.parent.name + ".exit", { from: previous }));
                //        state.parent.exit(state.parent, this, state.name);
                //    }
                //}
                //only keep 20 entries in history
                while (this.history.length > 20) this.history.shift();
            }
        }
        private stateExit(state: State, next?: string): void {
            if (state.isActive) {
                state.isActive = false;
                state.exit(state, this, this.getState(next));
                this.fireEvent(new StateEvent(state, "stateExit", { current: state, next: this.getState(next) }));
                //if (this.fsmui) this.fsmui.log("exit           >>  " + state.name + " |  next: " + next);
            }
        }

        public finalStateExit(stateArg: any): void {
            var state: State;
            if (typeof stateArg == "string") {
                state = this.allStates[stateArg];
                if (state == undefined) {
                    console.error("finalStateExit() state : " + state.name + " not found.");
                    return;
                }
            }
            if (stateArg.constructor === State) state = stateArg;
            if (state.isFinal == false) {
                console.error("state : " + state.name + " is not a finalState");
                return;
            }
            state.isActive = false;
            state.exit(state, this, null);
            //if (this.fsmui) this.fsmui.log("\nexit(final)    >>  " + state.name);
            if (state.parent && state.parent.name != this.name) {
                //if (this.fsmui) this.fsmui.log("exit parent    >>  " + state.parent.name + " | from child: " + state.name);
                this.fireEvent(new StateEvent(state.parent, state.parent.name + ".exit", { from: state.name }));
                state.parent.isActive = false;
                state.parent.exit(state.parent, this, state);
            }
        }

        public toState(toState: string): boolean {

            //find the current active state, if undefined, use the root FSM
            var current: State = this.getCurrentState();
            var nextState: State = this.allStates[toState];

            //if transition to the state does not exit, abort
            if (current.transitions.indexOf(toState) == -1) {
                var errorMsg: string = current.name + " doesn't have transition to: " + toState + " , " + current.name + " transitions are: " + current.transitions;
                console.error(errorMsg);
                this.fireEvent(new StateEvent(this, "error", { msg: errorMsg }));
                return false;
            }
            //if (this.fsmui) this.fsmui.log("\ntoState    >>>>>>  " + current.name + " -> " + nextState.name);

            //current exit
            //=============================================================================
            //if nextState is not child of the current state, exit calls
            if (nextState.parent.name != current.name) {
                this.stateExit(current, nextState.name);
            }

            //if current exiting has parent, make sure all parents that are not in the same tree structure exit
            //=============================================================================
            var cps: string[] = current.allParents.concat();
            var nps: string[] = nextState.allParents.concat();
            var exitParentNames: string[] = [];
            for (var c: number = 0; c < cps.length; c++) {
                if (nps.indexOf(cps[c]) == -1) exitParentNames.push(cps[c]);
            }
            //console.log(current.name + " allParents : " + current.allParents);
            //console.log(nextState.name + " allParents : " + nextState.allParents);
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
            //update debug display if exist
            if (this.fsmui) this.fsmui.toCurrentState();
            return true;

        }

    }

}
