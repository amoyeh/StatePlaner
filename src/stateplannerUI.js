var sp;
(function (sp) {
    var FSMUI = (function () {
        function FSMUI(fsm, divId) {
            this.fsm = fsm;
            this.useDiv = $("#" + divId);
            this.currentUIName = "";
            this.fsm.fsmui = this;
        }
        FSMUI.prototype.setDebugTextArea = function (id) {
            this.debugMsgs = [];
            this.debugTextAreaId = id;
            this.debugTextArea = $("#" + id);
        };
        FSMUI.prototype.log = function (msg) {
            if (this.debugTextArea) {
                this.debugMsgs.push(msg);
                this.debugTextArea.val(this.debugMsgs.join("\n"));
                while (this.debugMsgs.length > 100)
                    this.debugMsgs.shift();
                document.getElementById(this.debugTextAreaId).scrollTop = document.getElementById(this.debugTextAreaId).scrollHeight;
            }
            else {
                console.log(msg);
            }
        };
        FSMUI.prototype.init = function (cssSetting) {
            this.useDiv.empty();
            var self = this;
            var titleDiv = $("<div class='spTitle'></div>");
            this.useDiv.append(titleDiv);
            this.currentStateTxt = $("<input type='text' class='spStateTxt'/>");
            titleDiv.append(this.currentStateTxt);
            this.topUL = this.useDiv.append('<ul></ul>').find('ul');
            this.topUL.addClass("spul");
            this.expendBtns = [];
            var clickPt = { x: 0, y: 0 };
            var atPt = { x: 0, y: 0 };
            function dragMove(e) {
                var diffX = clickPt.x - e.pageX;
                var diffY = clickPt.y - e.pageY;
                self.useDiv.css({ "left": atPt.x - diffX + "px", "top": atPt.y - diffY + "px" });
                e.preventDefault();
                e.stopPropagation();
            }
            function dragUp(e) {
                $(window).off("mousemove", dragMove);
                $(window).off("mouseup", dragUp);
            }
            this.useDiv.on("mousedown", function (e) {
                if (jQuery._data(e.target, 'events') == undefined) {
                    clickPt = { x: e.pageX, y: e.pageY };
                    atPt = { x: self.useDiv.offset().left, y: self.useDiv.offset().top };
                    $(window).on("mousemove", dragMove);
                    $(window).on("mouseup", dragUp);
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            for (var ck in this.fsm.childs) {
                var loopOne = this.fsm.childs[ck];
                this.recursiveAdd(loopOne, this.fsm, 1, this.topUL);
            }
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
                    var ebtn = self.expendBtns[k];
                    var targetUL = ebtn.data("ul");
                    self.setULClose(targetUL);
                    targetUL.data("wasClose", true);
                }
                self.drawStatePath();
            });
            openAllTbtn.on("click", function () {
                for (var k = 0; k < self.expendBtns.length; k++) {
                    var ebtn = self.expendBtns[k];
                    var targetUL = ebtn.data("ul");
                    targetUL.data("wasClose", false);
                    targetUL.show();
                    ebtn.text("-");
                    targetUL.children("li").each(function (index, element) {
                        if (index > 0)
                            $(this).show();
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
            var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            newSvg.setAttribute("width", this.useDiv.width().toString());
            newSvg.setAttribute("height", this.useDiv.height().toString());
            this.useDiv.prepend(newSvg);
            this.svg = $(newSvg);
            if (cssSetting) {
                this.useDiv.css(cssSetting);
            }
            this.toCurrentState();
        };
        FSMUI.prototype.recursiveAdd = function (cState, parent, level, parentObj) {
            var newUL;
            var addVal = "";
            var self = this;
            if (cState.isInitial)
                addVal = " (init)";
            if (cState.isFinal)
                addVal = " (final)";
            if (cState.childs.length > 0) {
                var loopUL = $("<ul data-name='" + cState.name + "'></ul>");
                parentObj.append(loopUL);
                parentObj.append(newUL);
                loopUL.data("wasClose", false);
                var firstLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '"></li > ');
                loopUL.append(firstLi);
                var nameSpan = $('<span data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</span>');
                nameSpan.on("click", function (e) {
                    $(this).attr("data-name");
                    self.showLayoutStateActive($(this).attr("data-name"));
                });
                firstLi.append(nameSpan);
                var expandDiv = $("<span class='spExpend'>-</span>");
                expandDiv.data("ul", loopUL);
                firstLi.append(expandDiv);
                this.expendBtns.push(expandDiv);
                expandDiv.on("click", function () {
                    var targetUL = $(this).data("ul");
                    if ($(this).text().indexOf("-") > -1) {
                        self.setULClose(targetUL);
                        targetUL.data("wasClose", true);
                    }
                    else {
                        self.setULOpen(targetUL);
                        targetUL.data("wasClose", false);
                    }
                    self.drawStatePath();
                });
                for (var tk in cState.childs) {
                    this.recursiveAdd(cState.childs[tk], cState, level, loopUL);
                }
            }
            else {
                var newLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</li>');
                parentObj.append(newLi);
                newLi.on("click", function (e) {
                    self.showLayoutStateActive($(this).attr("data-name"));
                });
            }
        };
        FSMUI.prototype.setULClose = function (subUL) {
            subUL.find(".spExpend").text("+");
            subUL.children("li").each(function (index, element) {
                if (index > 0)
                    $(this).hide();
            });
            subUL.children("ul").each(function (index, element) {
                $(this).hide();
            });
        };
        FSMUI.prototype.setULOpen = function (subUL) {
            var self = this;
            subUL.show();
            subUL.find(".spExpend").text("-");
            subUL.children("li").each(function (index, element) {
                if (index > 0)
                    $(this).show();
            });
            subUL.children("ul").each(function (index, element) {
                self.loopCheckOpen($(this), 1);
            });
        };
        FSMUI.prototype.loopCheckOpen = function (subUL, level) {
            var self = this;
            subUL.show();
            this.setULClose(subUL);
            if (!subUL.data("wasClose")) {
                subUL.find(".spExpend").text("-");
                subUL.children("li").each(function (index, element) {
                    $(this).show();
                });
                subUL.children("ul").each(function (index, element) {
                    level++;
                    self.loopCheckOpen($(this), level);
                });
            }
        };
        FSMUI.prototype.showLayoutStateActive = function (name) {
            var self = this;
            this.currentUIName = name;
            this.topUL.find("li").each(function (index, element) {
                $(this).addClass("inactiveState");
                $(this).removeClass("activeState activeTrans");
            });
            this.topUL.find("li").each(function (index, element) {
                if ($(this).attr("data-name") == name) {
                    $(this).removeClass("inactiveState activeTrans");
                    $(this).addClass("activeState");
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
            this.drawStatePath();
        };
        FSMUI.prototype.toCurrentState = function () {
            this.showLayoutStateActive(this.fsm.getCurrentState().name);
            this.currentBtn.text("to current : " + this.fsm.getCurrentState().name);
        };
        FSMUI.prototype.drawStatePath = function () {
            this.svg.empty();
            var self = this;
            this.topUL.find("li").each(function (index, element) {
                if ($(this).attr("data-name") == self.currentUIName) {
                    if ($(this).is(":visible")) {
                        var strokeColor = $(this).css("color");
                        var cX = ($(this).offset().left + $(this).width() * .5) - self.useDiv.offset().left + 5;
                        var cY = ($(this).offset().top) - self.useDiv.offset().top + 10;
                        var transList = $(this).attr("data-trans").split(",");
                        self.topUL.find("li").each(function (index, element) {
                            if (transList.indexOf($(this).attr("data-name")) > -1) {
                                if ($(this).is(":visible")) {
                                    var toX = ($(this).offset().left + $(this).width() * .5 - 5) - self.useDiv.offset().left + 5;
                                    var toY = ($(this).offset().top) - self.useDiv.offset().top + 10;
                                    self.drawAPath(cX, cY, toX, toY, strokeColor);
                                }
                            }
                        });
                    }
                }
            });
        };
        FSMUI.prototype.drawAPath = function (cX, cY, toX, toY, strokeColor) {
            var newLine = document.createElementNS(FSMUI.PNGV, "line");
            newLine.setAttribute('x1', cX.toString());
            newLine.setAttribute('y1', cY.toString());
            newLine.setAttribute('x2', toX.toString());
            newLine.setAttribute('y2', toY.toString());
            newLine.setAttribute('style', "stroke:" + strokeColor + ";stroke-width:2; opacity:0.5;");
            this.svg.append(newLine);
            if (cY == toY) {
            }
        };
        FSMUI.PNGV = "http://www.w3.org/2000/svg";
        return FSMUI;
    })();
    sp.FSMUI = FSMUI;
})(sp || (sp = {}));
