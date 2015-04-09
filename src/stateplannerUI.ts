module sp {

    export class FSMUI {

        private static PNGV: string = "http://www.w3.org/2000/svg";

        public fsm: FSM;
        public useDiv: JQuery;
        private topUL: JQuery;
        private stateDiv: JQuery;
        private currentStateTxt: JQuery;
        private currentBtn: JQuery;
        private svg: JQuery;
        private expendBtns: JQuery[];
        private currentUIName: string;
        private debugTextArea: JQuery;
        private debugTextAreaId: string;
        private debugMsgs: string[];

        constructor(fsm: FSM, divId: string) {
            this.fsm = fsm;
            this.useDiv = $("#" + divId);
            this.currentUIName = "";
            this.fsm.fsmui = this;
        }

        public setDebugTextArea(id: string): void {
            this.debugMsgs = [];
            this.debugTextAreaId = id;
            this.debugTextArea = $("#" + id);
        }

        public log(msg: string): void {
            if (this.debugTextArea) {
                this.debugMsgs.push(msg);
                this.debugTextArea.val(this.debugMsgs.join("\n"));
                while (this.debugMsgs.length > 100) this.debugMsgs.shift();
                document.getElementById(this.debugTextAreaId).scrollTop = document.getElementById(this.debugTextAreaId).scrollHeight;
            } else {
                console.log(msg);
            }
        }

        public init(): void {

            this.useDiv.empty();
            var self: FSMUI = this;

            //top tool bar
            var titleDiv = $("<div class='spTitle'></div>");
            this.useDiv.append(titleDiv);
            this.currentStateTxt = $("<input type='text' class='spStateTxt'/>");
            titleDiv.append(this.currentStateTxt);

            //current state display
            //this.stateDiv = $("<div class='spState'>paidfhaoihdf > pasihpfoasd > </div>");
            //this.useDiv.append(this.stateDiv);

            //root state list
            this.topUL = this.useDiv.append('<ul></ul>').find('ul');
            this.topUL.addClass("spul");

            this.expendBtns = [];

            var clickPt: { x: number; y: number } = { x: 0, y: 0 };
            var atPt: { x: number; y: number } = { x: 0, y: 0 };
            function dragMove(e) {
                var diffX = clickPt.x - e.pageX;
                var diffY = clickPt.y - e.pageY;
                self.useDiv.css({ "left": atPt.x - diffX + "px", "top": atPt.y - diffY + "px" })
                e.preventDefault();
                e.stopPropagation();
            }
            function dragUp(e) {
                $(window).off("mousemove", dragMove);
                $(window).off("mouseup", dragUp);
            }
            this.useDiv.on("mousedown", function (e) {
                //start drag on those items that does not have click events
                if ((<any>jQuery)._data(e.target, 'events') == undefined) {
                    clickPt = { x: e.pageX, y: e.pageY };
                    atPt = { x: self.useDiv.offset().left, y: self.useDiv.offset().top };
                    $(window).on("mousemove", dragMove);
                    $(window).on("mouseup", dragUp);
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            for (var ck in this.fsm.childs) {
                var loopOne: State = this.fsm.childs[ck];
                this.recursiveAdd(loopOne, this.fsm, 1, this.topUL);
            }

            //top functional buttons
            var showUIBtn = $("<span class='spTopBtn' style='width:60px; display:none;'>show UI</span>");
            this.useDiv.append(showUIBtn);

            var hideUIBtn = $("<span class='spTopBtn' style='width:60px;'>hide UI</span>");
            var openAllTbtn = $("<span class='spTopBtn'>open all</span>");
            var closeAllTbtn = $("<span class='spTopBtn'>close all</span>");
            var dragBtn = $("<span class='spTopBtn'>drag</span>");
            this.currentBtn = $("<span class='spTopBtn'>to current</span>");
            titleDiv.prepend(this.currentBtn);
            titleDiv.prepend(closeAllTbtn);
            titleDiv.prepend(openAllTbtn);
            titleDiv.prepend(hideUIBtn);

            closeAllTbtn.on("click", function () {
                for (var k = 0; k < self.expendBtns.length; k++) {
                    var ebtn: JQuery = self.expendBtns[k];
                    var targetUL = ebtn.data("ul");
                    self.setULClose(targetUL);
                    targetUL.data("wasClose", true);
                }
                self.drawStatePath();
            });
            openAllTbtn.on("click", function () {
                for (var k = 0; k < self.expendBtns.length; k++) {
                    var ebtn: JQuery = self.expendBtns[k];
                    var targetUL = ebtn.data("ul");
                    targetUL.data("wasClose", false);
                    targetUL.show();
                    ebtn.text("-");
                    targetUL.children("li").each(function (index, element) {
                        if (index > 0) $(this).show();
                        //targetUL.css({ "border": "1px solid #EEE" });
                    });
                }
                self.drawStatePath();
            });
            hideUIBtn.on("click", function () {
                titleDiv.hide();
                self.topUL.hide();
                self.svg.hide();
                showUIBtn.show();
            });
            showUIBtn.on("click", function () {
                titleDiv.show();
                self.topUL.show();
                self.svg.show();
                showUIBtn.hide();
            });
            this.currentBtn.on("click", function () {
                self.toCurrentState();
            });

            this.topUL.find("li").each(function (index, element) {
                $(this).addClass("inactiveState");
                $(this).removeClass("activeState activeTrans");
            });

            //svg to draw graphics
            var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            newSvg.setAttribute("width", this.useDiv.width().toString());
            newSvg.setAttribute("height", this.useDiv.height().toString());
            this.useDiv.prepend(newSvg);
            this.svg = $(newSvg);

            this.toCurrentState();

        }

        //local recursive adding structure
        private recursiveAdd(cState: State, parent: State, level: number, parentObj: JQuery): void {

            var newUL: JQuery;
            var addVal: string = "";
            var self: FSMUI = this;

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
                    $(this).attr("data-name");
                    self.showLayoutStateActive($(this).attr("data-name"));
                });
                firstLi.append(nameSpan);

                //expendButtons
                var expandDiv = $("<span class='spExpend'>-</span>");
                expandDiv.data("ul", loopUL);
                firstLi.append(expandDiv);
                this.expendBtns.push(expandDiv);
                expandDiv.on("click", function () {
                    var targetUL = $(this).data("ul");
                    if ($(this).text().indexOf("-") > -1) {
                        self.setULClose(targetUL);
                        targetUL.data("wasClose", true);
                    } else {
                        self.setULOpen(targetUL);
                        targetUL.data("wasClose", false);
                    }
                    self.drawStatePath();
                });
                for (var tk in cState.childs) {
                    this.recursiveAdd(cState.childs[tk], cState, level, loopUL);
                }
            } else {
                var newLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</li>');
                parentObj.append(newLi);
                newLi.on("click", function (e) {
                    self.showLayoutStateActive($(this).attr("data-name"));
                });
            }
        }//end recursiveAdd()

        private setULClose(subUL: JQuery): void {
            subUL.find(".spExpend").text("+");
            subUL.children("li").each(function (index, element) {
                if (index > 0) $(this).hide();
                //subUL.css({ "border": "1px solid rgba(0,0,0,0)" });
            });
            subUL.children("ul").each(function (index, element) { $(this).hide(); });
        }

        private setULOpen(subUL: JQuery): void {
            var self: FSMUI = this;
            subUL.show();
            subUL.find(".spExpend").text("-");
            subUL.children("li").each(function (index, element) {
                if (index > 0) $(this).show();
                //subUL.css({ "border": "1px solid #EEE" });
            });
            subUL.children("ul").each(function (index, element) {
                self.loopCheckOpen($(this), 1); // recursive open logic
            });
        }

        private loopCheckOpen(subUL: JQuery, level: number): void {
            //console.log("loopCheckOpen:  " + subUL.attr("data-name") + " , level: " + level + "  was close: " + subUL.data("wasClose"));
            var self: FSMUI = this;
            subUL.show();
            this.setULClose(subUL);
            if (!subUL.data("wasClose")) {
                subUL.find(".spExpend").text("-");
                subUL.children("li").each(function (index, element) {
                    $(this).show();
                    //subUL.css({ "border": "1px solid #EEE" });
                });
                subUL.children("ul").each(function (index, element) {
                    level++;
                    self.loopCheckOpen($(this), level);
                });
            }
        }

        private showLayoutStateActive(name: string): void {

            var self = this;
            this.currentUIName = name;

            this.topUL.find("li").each(function (index, element) {
                $(this).addClass("inactiveState");
                $(this).removeClass("activeState activeTrans");
            });

            this.topUL.find("li").each(function (index, element) {
                //active item
                if ($(this).attr("data-name") == name) {
                    $(this).removeClass("inactiveState activeTrans");
                    $(this).addClass("activeState");
                    self.currentStateTxt.val($(this).attr("data-name") + " │ transitions: " + $(this).attr("data-trans").replace(/,/g, " , "));
                    var transList: string[] = $(this).attr("data-trans").split(",");
                    self.topUL.find("li").each(function (index, element) {
                        if (transList.indexOf($(this).attr("data-name")) > -1) {
                            $(this).removeClass("inactiveState activeState");
                            $(this).addClass("activeTrans");
                        }
                    });
                }
            });

            this.drawStatePath();

        }//end showLayoutStateActive()

        public toCurrentState(): void {
            this.showLayoutStateActive(this.fsm.getCurrentState().name);
            this.currentBtn.text("to current : " + this.fsm.getCurrentState().name);
        }

        private drawStatePath(): void {
            this.svg.empty();
            var self: FSMUI = this;
            this.topUL.find("li").each(function (index, element) {
                if ($(this).attr("data-name") == self.currentUIName) {
                    if ($(this).is(":visible")) {
                        var strokeColor: string = $(this).css("color");
                        var cX = ($(this).offset().left + $(this).width() * .5) - self.useDiv.offset().left + 5;
                        var cY = ($(this).offset().top) - self.useDiv.offset().top + 10;
                        var transList: string[] = $(this).attr("data-trans").split(",");
                        self.topUL.find("li").each(function (index, element) {
                            if (transList.indexOf($(this).attr("data-name")) > -1) {
                                if ($(this).is(":visible")) {
                                    var toX: number = ($(this).offset().left + $(this).width() * .5 - 5) - self.useDiv.offset().left + 5;
                                    var toY: number = ($(this).offset().top) - self.useDiv.offset().top + 10;
                                    self.drawAPath(cX, cY, toX, toY, strokeColor);
                                }
                            }
                        });
                    }
                }
            });
        }

        //not ready
        private drawAPath(cX: number, cY: number, toX: number, toY: number, strokeColor: string): void {

            //var dpt1 = document.createElementNS(FSMUI.PNGV, "circle");
            //dpt1.setAttribute("cx", cX.toString());
            //dpt1.setAttribute("cy", cY.toString());
            //dpt1.setAttribute("r", "2");
            //dpt1.setAttribute("fill", "red");
            //this.svg.append(dpt1);
            //var dpt2 = document.createElementNS(FSMUI.PNGV, "circle");
            //dpt2.setAttribute("cx", toX.toString());
            //dpt2.setAttribute("cy", toY.toString());
            //dpt2.setAttribute("r", "2");
            //dpt2.setAttribute("fill", "red");
            //this.svg.append(dpt2);

            var newLine = document.createElementNS(FSMUI.PNGV, "line");
            newLine.setAttribute('x1', cX.toString());
            newLine.setAttribute('y1', cY.toString());
            newLine.setAttribute('x2', toX.toString());
            newLine.setAttribute('y2', toY.toString());
            newLine.setAttribute('style', "stroke:" + strokeColor + ";stroke-width:2; opacity:0.5;");
            this.svg.append(newLine);
            //var mX = cX + ((toX - cX) * .5);
            //var mY = cY - 5;
            if (cY == toY) {
                //var newpath = document.createElementNS(FSMUI.PNGV, "path");
                //var d: string = "M" + cX + "," + cY + " Q" + cX + "," + mY + " " + mX + "," + mY + " T" + toX + "," + toY;
                //newpath.setAttribute("d", d);
                //newpath.setAttribute("stroke", "#FF0000");
                //newpath.setAttribute("stroke-width", "1");
                //newpath.setAttribute("opacity", "0.5");
                //newpath.setAttribute("fill", "none");
                //this.svg.append(newpath);
            }

        }
    }

}