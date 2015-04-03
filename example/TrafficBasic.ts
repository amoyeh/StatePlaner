var fsm: sp.FSM;

function TrafficBasic() {

    fsm = new sp.FSM("TrafficApp");

    var red: sp.State = new sp.State("red");
    var green: sp.State = new sp.State("green");
    var yellow: sp.State = new sp.State("yellow");

    red.addTransition(green);
    green.addTransition(yellow);
    yellow.addTransition(red);

    //used in autorun 
    var addedSec = 0;

    red.enter = function (target: sp.State, fsm: sp.FSM, from: string): void {
        addedSec = 0;
        $("#redDiv").css("background-color", "#CC0000");
        log("enter red state from " + from);
        $("#startBtn").off("click");
        $("#startBtn").prop("value", "click to go green");
        $("#startBtn").on("click", function () {
            fsm.toState("green");
        });
    }
    red.exit = function (target: sp.State, fsm: sp.FSM, next: string): void {
        log("exit red state next " + next);
        $("#redDiv").css("background-color", "#3D0000");
    }

    green.enter = function (target: sp.State, fsm: sp.FSM, from: string): void {
        addedSec = 0;
        $("#greenDiv").css("background-color", "#00CC00");
        log("enter green state from " + from);
        $("#startBtn").off("click");
        $("#startBtn").prop("value", "click to go yellow");
        $("#startBtn").on("click", function () {
            fsm.toState("yellow");
        });
    }
    green.exit = function (target: sp.State, fsm: sp.FSM, next: string): void {
        log("exit green state next " + next);
        $("#greenDiv").css("background-color", "#001F00");
    }

    yellow.enter = function (target: sp.State, fsm: sp.FSM, from: string): void {
        addedSec = 0;
        $("#yellowDiv").css("background-color", "#FFCC00");
        log("enter yellow state from " + from);
        $("#startBtn").off("click");
        $("#startBtn").prop("value", "click to go red");
        $("#startBtn").on("click", function () {
            fsm.toState("red");
        });
    }
    yellow.exit = function (target: sp.State, fsm: sp.FSM, next: string): void {
        log("exit yellow state next " + next);
        $("#yellowDiv").css("background-color", "#332900");
    }

    //first time click on the button
    $("#startBtn").on("click", function () {
        fsm.toState("red");
    });


    var autoRunInt;
    $("#autoRunBtn").on("click", function () {
        if ($("#autoRunBtn").prop("value") == "autoRun") {
            if (fsm.getCurrentState().name == "TrafficApp") fsm.toState("red");
            autoRunInt = setInterval(function () {
                addedSec += 1;
                var change: boolean = false;
                if (fsm.getCurrentState() === red && addedSec >= 5) change = true;
                if (fsm.getCurrentState() === green && addedSec >= 5) change = true;
                if (fsm.getCurrentState() === yellow && addedSec >= 3) change = true;
                if (change) {
                    addedSec = 0;
                    $("#startBtn").click();
                }
                log("auto run addedSec: " + addedSec + " currentState : " + fsm.getCurrentState().name);
            }, 1000);
            $("#autoRunBtn").prop("value", "autoRunOff");
        } else {
            clearInterval(autoRunInt);
            addedSec = 0;
            $("#autoRunBtn").prop("value", "autoRun");
            log("auto run off");
        }
    });

    $("#toRedBtn").on("click", function () {
        if (!fsm.toState("red")) {
            log("current state can not go to red , current state is : " + fsm.getCurrentState().name);
        }
    });

    fsm.addChild(red, green, yellow);
    fsm.buildTree();

    $("#clearOutPutBtn").on("click", () => {
        msgs = [];
        $("#output").val("");
    });

}


var msgs: string[] = [];
function log(newMsg: string) {
    msgs.push(newMsg);
    $("#output").val(msgs.join("\n"));
    while (msgs.length > 20) {
        msgs.shift();
    }
    document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
}

