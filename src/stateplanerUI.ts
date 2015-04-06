//public setLayoutMap(divId: string): void {

//            var self: FSM = this;
//            var useDiv: JQuery = $("#" + divId);
//useDiv.empty();

//this.divObj = useDiv;

////the name of the FMS

//var titleDiv = $("<div class='spTitle'></div>");
//useDiv.append(titleDiv);
//this.currentStateTxt = $("<input type='text' class='spStateTxt'/>");
//titleDiv.append(this.currentStateTxt);

////root state list
//this.topUL = useDiv.append('<ul></ul>').find('ul');
//this.topUL.addClass("spul");

//var expendBtns = [];

//for (var ck in this.childs) {
//    var loopOne: State = this.childs[ck];
//    recursiveAdd(loopOne, this, 1, this.topUL);
//}

//function setULClose(subUL: JQuery) {
//    subUL.find(".spExpend").text("+");
//    subUL.children("li").each(function (index, element) {
//        if (index > 0) {
//            $(this).hide();
//        }
//        //margin-bottom: -4px;
//        subUL.css({ "border": "1px solid rgba(0,0,0,0)" });
//    });
//    subUL.children("ul").each(function (index, element) { $(this).hide(); });
//}

//function loopCheckOpen(subUL: JQuery, level: number) {
//    //console.log("loopCheckOpen:  " + subUL.attr("data-name") + " , level: " + level + "  was close: " + subUL.data("wasClose"));
//    subUL.show();
//    setULClose(subUL);
//    if (!subUL.data("wasClose")) {
//        subUL.find(".spExpend").text("-");
//        subUL.children("li").each(function (index, element) {
//            $(this).show();
//            subUL.css({ "border": "1px solid #EEE" });

//        });
//        subUL.children("ul").each(function (index, element) {
//            level++;
//            loopCheckOpen($(this), level);
//        });
//    }
//}

//function setULOpen(subUL: JQuery) {
//    subUL.show();
//    subUL.find(".spExpend").text("-");
//    subUL.children("li").each(function (index, element) {
//        if (index > 0) $(this).show();
//        subUL.css({ "border": "1px solid #EEE" });
//    });
//    subUL.children("ul").each(function (index, element) {
//        loopCheckOpen($(this), 1); // recursive open logic
//    });
//}

////local recursive adding structure
//function recursiveAdd(cState: State, parent: State, level: number, parentObj: JQuery) {

//    var newUL: JQuery;
//    var addVal: string = "";

//    if (cState.isInitial) addVal = " (init)";
//    if (cState.isFinal) addVal = " (final)";

//    if (cState.hasChild()) {

//        var loopUL: JQuery = $("<ul data-name='" + cState.name + "'></ul>");
//        parentObj.append(loopUL);
//        parentObj.append(newUL);
//        loopUL.data("wasClose", false);

//        //first li refer to state itself
//        var firstLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '"></li > ');
//        loopUL.append(firstLi);

//        var nameSpan = $('<span data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</span>');
//        nameSpan.on("click", function (e) {
//            self.showLayoutStateActive($(this).attr("data-name"));
//        });
//        firstLi.append(nameSpan);

//        var expandDiv = $("<span class='spExpend'>-</span>");
//        expandDiv.data("ul", loopUL);
//        firstLi.append(expandDiv);
//        expendBtns.push(expandDiv);
//        expandDiv.on("click", function () {
//            var targetUL = $(this).data("ul");
//            if ($(this).text().indexOf("-") > -1) {
//                setULClose(targetUL);
//                targetUL.data("wasClose", true);
//            } else {
//                setULOpen(targetUL);
//                targetUL.data("wasClose", false);
//            }
//            self.showLayoutStateActive(targetUL.attr("data-name"));
//        });

//        for (var tk in cState.childs) {
//            recursiveAdd(cState.childs[tk], cState, level, loopUL);
//        }

//    } else {

//        var newLi = $('<li data-name="' + cState.name + '" data-trans="' + cState.transitions.join(",") + '">' + cState.name + addVal + '</li>');
//        parentObj.append(newLi);
//        newLi.on("click", function (e) {
//            self.showLayoutStateActive($(this).attr("data-name"));
//        });
//    }

//}

////top functional buttons
//var showUIBtn = $("<span class='spTopBtn' style='width:60px; display:none;'>show UI</span>");
//useDiv.append(showUIBtn);

//var hideUIBtn = $("<span class='spTopBtn' style='width:60px;'>hide UI</span>");
//var openAllTbtn = $("<span class='spTopBtn'>open all</span>");
//var closeAllTbtn = $("<span class='spTopBtn'>close all</span>");
//titleDiv.prepend(closeAllTbtn);
//titleDiv.prepend(openAllTbtn);
//titleDiv.prepend(hideUIBtn);

//closeAllTbtn.on("click", function () {
//    for (var k = 0; k < expendBtns.length; k++) {
//        var ebtn: JQuery = expendBtns[k];
//        var targetUL = ebtn.data("ul");
//        setULClose(targetUL);
//        targetUL.data("wasClose", true);
//    }
//});
//openAllTbtn.on("click", function () {
//    for (var k = 0; k < expendBtns.length; k++) {
//        var ebtn: JQuery = expendBtns[k];
//        var targetUL = ebtn.data("ul");
//        targetUL.data("wasClose", false);
//        targetUL.show();
//        ebtn.text("-");
//        targetUL.children("li").each(function (index, element) {
//            if (index > 0) $(this).show();
//            targetUL.css({ "border": "1px solid #EEE" });
//        });
//    }
//});
//hideUIBtn.on("click", function () {
//    titleDiv.hide();
//    self.topUL.hide();
//    showUIBtn.show();
//});
//showUIBtn.on("click", function () {
//    titleDiv.show();
//    self.topUL.show();
//    showUIBtn.hide();
//});

//this.topUL.find("li").each(function (index, element) {
//    $(this).addClass("inactiveState");
//    $(this).removeClass("activeState activeTrans");
//});

////svg to draw graphics
//var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//newSvg.setAttribute("width", useDiv.width().toString());
//newSvg.setAttribute("height", useDiv.height().toString());
//useDiv.prepend(newSvg);
//this.svg = $(newSvg);

//        }

//        private showLayoutStateActive(name: string) {
//    var self = this;
//    this.svg.empty();


//    this.topUL.find("li").each(function (index, element) {
//        $(this).addClass("inactiveState");
//        $(this).removeClass("activeState activeTrans");
//    });
//    this.topUL.find("li").each(function (index, element) {

//        //active item
//        if ($(this).attr("data-name") == name) {

//            $(this).removeClass("inactiveState activeTrans");
//            $(this).addClass("activeState");

//            var aX = $(this).offset().left;
//            var aY = $(this).offset().top;

//            self.currentStateTxt.val($(this).attr("data-name") + " │ transitions: " + $(this).attr("data-trans").replace(/,/g, " , "));
//            var transList: string[] = $(this).attr("data-trans").split(",");
//            self.topUL.find("li").each(function (index, element) {
//                if (transList.indexOf($(this).attr("data-name")) > -1) {
//                    $(this).removeClass("inactiveState activeState");
//                    $(this).addClass("activeTrans");
//                    //if ($(this).is(":visible")) {
//                    //    self.drawPath(aX, aY, $(this).offset().left, $(this).offset().top);
//                    //}
//                }
//            });

//        }
//    });
//        }

//        //not ready
//        private drawPath(aX: number, aY: number, toX: number, toY: number): void {
//    //var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
//    //target node position y same or upper
//    if (aY >= toY) {
//        //to pt
//        var c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//        c1.setAttribute("cx", (aX - 15).toString());
//        c1.setAttribute("cy", (aY - 15).toString());
//        c1.setAttribute("r", "2");
//        c1.setAttribute("fill", "red");
//        //this.svg.append(c1);
//        //start pt
//        var c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//        c2.setAttribute("cx", (aX - 10).toString());
//        c2.setAttribute("cy", (aY).toString());
//        c2.setAttribute("r", "2");
//        c2.setAttribute("fill", "red");
//        //this.svg.append(c2);
//        //middle pt
//        var c3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//        c3.setAttribute("cx", (aX - 15).toString());
//        c3.setAttribute("cy", (aY).toString());
//        c3.setAttribute("r", "2");
//        c3.setAttribute("fill", "blue");
//        //this.svg.append(c3);

//        var newpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
//        var d: string = "M" + (aX - 10) + "," + aY + " Q" + (aX - 15) + "," + aY + " " + (aX - 15) + "," + (aY - 15) + " T" + toX + "," + toY;
//        newpath.setAttribute("d", d);
//        newpath.setAttribute("stroke", "#FF0000");
//        newpath.setAttribute("stroke-width", "1");
//        newpath.setAttribute("opacity", "1");
//        newpath.setAttribute("fill", "none");
//        this.svg.append(newpath);

//    }

//} 