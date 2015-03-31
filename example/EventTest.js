function EventTest() {
    var fsm = new sp.FSM("testFSM");
    var red = new sp.State("red");
    var green = new sp.State("green");
    var yellow = new sp.State("yellow");
    red.enter = function (target, fsm, from) {
        console.log("||| red entering " + fsm.name + " > " + target.name + " , from: " + from);
    };
    red.exit = function (target, fsm, next) {
        console.log("||| red exit " + fsm.name + " > " + target.name + " , next: " + next);
    };
    red.addTransition(green);
    green.enter = function (target, fsm, from) {
        console.log("||| green entering " + fsm.name + " > " + target.name + " , from: " + from);
    };
    green.exit = function (target, fsm, next) {
        console.log("||| green exit " + fsm.name + " > " + target.name + " , next: " + next);
    };
    green.addTransition(yellow);
    yellow.enter = function (target, fsm, from) {
        console.log("||| yellow entering " + fsm.name + " > " + target.name + " , from: " + from);
    };
    yellow.exit = function (target, fsm, next) {
        console.log("||| yellow exit " + fsm.name + " > " + target.name + " , next: " + next);
    };
    yellow.addTransition(red);
    fsm.addChild(red, green, yellow);
    fsm.buildTree();
    fsm.addEvent("red.enter", function (evt) {
        console.log("--- Event Fired red.enter --- ");
        console.log(evt);
    });
    fsm.addEvent("red.exit", function (evt) {
        console.log("--- Event Fired red.exit --- ");
        console.log(evt);
    });
    fsm.toState("red");
    fsm.toState("green");
    fsm.toState("yellow");
    fsm.toState("red");
}
