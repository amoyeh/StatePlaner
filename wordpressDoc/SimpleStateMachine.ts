
//紅綠燈範例主要物件
class TrafficLight {
    public timeInt: number;
    public currentState: StateBase;
    public lightDiv: HTMLDivElement;
    public logMsgs: string[];
    public txtArea: HTMLDivElement;
    //建構紅綠燈物件
    constructor() {
        //此範例用於顯示紅綠燈的div
        this.lightDiv = <HTMLDivElement>document.getElementById("lightdiv");
        //用於顯示訊息的 textarea
        this.txtArea = <HTMLDivElement> document.getElementById("txtArea");
        this.logMsgs = [];
    }
    //開始每秒不斷更新，透過目前的狀態 (RedState, GreenState, YellowState) 更新
    public start(): void {
        var self: TrafficLight = this;
        this.timeInt = setInterval(function () { self.currentState.update(); }, 1000);
    }
    //重來時清除
    public destroy(): void {
        clearInterval(this.timeInt);
    }
    //設定div的顏色 (黃、綠、紅)
    public setColor(hex: string): void {
        this.lightDiv.style.backgroundColor = hex;
    }
    //log 顯示訊息於textArea
    public log(msg: string): void {
        this.logMsgs.push(msg);
        this.txtArea.innerHTML = this.logMsgs.join("<br/>");
        while (this.logMsgs.length > 8) this.logMsgs.shift(); //keep only 50 lines
    }
}

//建立 此範例 State 物件的基本架構 (RedState, GreenState, YellowState 由此衍生)
class StateBase {
    //預設此 State 顯示秒數
    public timeCount: number = 3;
    public light: TrafficLight;
    constructor(light: TrafficLight) {
        this.light = light;
    }
    //更新時檢查是否顯示秒數已達到零，零則執行 exit()
    public update(): void {
        if (this.timeCount <= 0) {
            this.exit();
        } else {
            this.light.log((<any>this.constructor).name + " update " + this.timeCount);
            this.timeCount--;
        }
    }
    //透過衍生的class處理時間到時機制
    public exit(): void {
    }
}

//控制紅燈狀態 class
class RedState extends StateBase {
    //建立時設定紅燈顯示四秒，設定div顏色
    constructor(light: TrafficLight) {
        super(light);
        this.timeCount = 4;
        light.setColor("#CC0000");
        this.update();
    }
    //離開(秒數到零) RedState 時，設定下個 State 為 GreenState
    public exit(): void {
        this.light.log("exit Red set currentState to Green");
        this.light.currentState = new GreenState(this.light);
    }
}

//控制綠燈狀態 class
class GreenState extends StateBase {
    //建立時設定紅燈顯示四秒，設定div顏色
    constructor(light: TrafficLight) {
        super(light);
        this.timeCount = 5;
        light.setColor("#00CC00");
        this.update();
    }
    //離開(秒數到零) GreenState 時，設定下個 State 為 YellowState
    public exit(): void {
        this.light.log("exit Green set currentState to Yellow");
        this.light.currentState = new YellowState(this.light);
    }
}

//控制黃燈狀態 class
class YellowState extends StateBase {
    constructor(light: TrafficLight) {
        super(light);
        this.timeCount = 3;
        light.setColor("#FFCC00");
        this.update();
    }
    //離開(秒數到零) YellowState 時，設定下個 State 為 RedState
    public exit(): void {
        this.light.log("exit Yellow set currentState to Red");
        this.light.currentState = new RedState(this.light);
    }
}

//當頁面按鈕點下時執行 runLightTest()
var trafficLight: TrafficLight;
function runLightTest() {
    if (trafficLight) trafficLight.destroy();
    trafficLight = new TrafficLight();
    trafficLight.currentState = new RedState(trafficLight);
    trafficLight.start();
    (<HTMLButtonElement>document.getElementById("startLightTestBtn")).value = "重新開始";
}