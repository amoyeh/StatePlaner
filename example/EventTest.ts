
function EventTest() {

    var fsm: sp.FSM = new sp.FSM("testFSM");

    var red: sp.State = new sp.State("red");
    var green: sp.State = new sp.State("green");
    var yellow: sp.State = new sp.State("yellow");


    red.enter = function (target: sp.State, fsm: sp.FSM, from: string): void {
        console.log("||| red entering " + fsm.name + " > " + target.name + " , from: " + from);
    }
    red.exit = function (target: sp.State, fsm: sp.FSM, next: string): void {
        console.log("||| red exit " + fsm.name + " > " + target.name + " , next: " + next);
    }
    red.addTransition(green);


    green.enter = function (target: sp.State, fsm: sp.FSM, from: string): void {
        console.log("||| green entering " + fsm.name + " > " + target.name + " , from: " + from);
    }
    green.exit = function (target: sp.State, fsm: sp.FSM, next: string): void {
        console.log("||| green exit " + fsm.name + " > " + target.name + " , next: " + next);
    }
    green.addTransition(yellow);


    yellow.enter = function (target: sp.State, fsm: sp.FSM, from: string): void {
        console.log("||| yellow entering " + fsm.name + " > " + target.name + " , from: " + from);
    }
    yellow.exit = function (target: sp.State, fsm: sp.FSM, next: string): void {
        console.log("||| yellow exit " + fsm.name + " > " + target.name + " , next: " + next);
    }
    yellow.addTransition(red);


    fsm.addChild(red, green, yellow);
    fsm.buildTree();

    fsm.addEvent("red.enter", function (evt: sp.StateEvent): void {
        console.log("--- Event Fired red.enter --- ");
        console.log(evt);
    });
    fsm.addEvent("red.exit", function (evt: sp.StateEvent): void {
        console.log("--- Event Fired red.exit --- ");
        console.log(evt);
    });
    fsm.toState("red");
    fsm.toState("green");
    fsm.toState("yellow");
    fsm.toState("red");

}