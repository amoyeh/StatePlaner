var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TrafficLight = (function () {
    function TrafficLight() {
        this.lightDiv = document.getElementById("lightdiv");
        this.txtArea = document.getElementById("txtArea");
        this.logMsgs = [];
    }
    TrafficLight.prototype.start = function () {
        var self = this;
        this.timeInt = setInterval(function () {
            self.currentState.update();
        }, 1000);
    };
    TrafficLight.prototype.destroy = function () {
        clearInterval(this.timeInt);
    };
    TrafficLight.prototype.setColor = function (hex) {
        this.lightDiv.style.backgroundColor = hex;
    };
    TrafficLight.prototype.log = function (msg) {
        this.logMsgs.push(msg);
        this.txtArea.innerHTML = this.logMsgs.join("<br/>");
        while (this.logMsgs.length > 8)
            this.logMsgs.shift();
    };
    return TrafficLight;
})();
var StateBase = (function () {
    function StateBase(light) {
        this.timeCount = 3;
        this.light = light;
    }
    StateBase.prototype.update = function () {
        if (this.timeCount <= 0) {
            this.exit();
        }
        else {
            this.light.log(this.constructor.name + " update " + this.timeCount);
            this.timeCount--;
        }
    };
    StateBase.prototype.exit = function () {
    };
    return StateBase;
})();
var RedState = (function (_super) {
    __extends(RedState, _super);
    function RedState(light) {
        _super.call(this, light);
        this.timeCount = 4;
        light.setColor("#CC0000");
        this.update();
    }
    RedState.prototype.exit = function () {
        this.light.log("exit Red set currentState to Green");
        this.light.currentState = new GreenState(this.light);
    };
    return RedState;
})(StateBase);
var GreenState = (function (_super) {
    __extends(GreenState, _super);
    function GreenState(light) {
        _super.call(this, light);
        this.timeCount = 5;
        light.setColor("#00CC00");
        this.update();
    }
    GreenState.prototype.exit = function () {
        this.light.log("exit Green set currentState to Yellow");
        this.light.currentState = new YellowState(this.light);
    };
    return GreenState;
})(StateBase);
var YellowState = (function (_super) {
    __extends(YellowState, _super);
    function YellowState(light) {
        _super.call(this, light);
        this.timeCount = 3;
        light.setColor("#FFCC00");
        this.update();
    }
    YellowState.prototype.exit = function () {
        this.light.log("exit Yellow set currentState to Red");
        this.light.currentState = new RedState(this.light);
    };
    return YellowState;
})(StateBase);
var trafficLight;
function runLightTest() {
    if (trafficLight)
        trafficLight.destroy();
    trafficLight = new TrafficLight();
    trafficLight.currentState = new RedState(trafficLight);
    trafficLight.start();
    document.getElementById("startLightTestBtn").value = "重新開始";
}
