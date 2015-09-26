(function () {
    'use strict';
    var confirmComponent = null;
    if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use sortableList components");

    if (typeof (buildfire.notifications) == "undefined")
        buildfire.notifications = {};

    // This is the class that will be used in the plugin content, design, or settings sections
    buildfire.notifications.confirm = function (options, callback) {

        if (!options || typeof (options) !== "object") {
            throw "You must provide a options of type provide buildfire.notifications.confirm or {} if you have no options";
        }
        if (!callback || typeof (callback) !== "function") {
            throw "You must provide a callback of type function to buildfire.notifications.confirm";
        }

        if (!confirmComponent.confirmContainer) {
            confirmComponent._appendContainer();
        }
        confirmComponent._renderTemplate(options);
        confirmComponent._setModalPosition(options);
        confirmComponent.initEvents(callback);
    };

    confirmComponent = buildfire.notifications.confirm;

    confirmComponent.confirmContainer = null;

    confirmComponent._appendContainer = function () {
        var container = document.createElement("div"),
            containerId = "confirm" + Math.floor((Math.random() * 10) + 1);
        container.setAttribute("id", containerId);
        container.style.position = "fixed";;
        document.body.appendChild(container);
        confirmComponent.confirmContainer = document.querySelector("#" + containerId);
    };

    confirmComponent._renderTemplate = function (options) {
        var html = '<div class="modal-backdrop fade in" style="z-index:1040;"></div>\
            <div class="modal fade in" style="z-index:1050; display:block;">\
                <div class="modal-dialog">\
                    <div class="modal-content">\
                        <div class="modal-header">\
                            <h5 class="item-link-header margin-zero">#title</h5>\
                        </div>\
                        <div class="modal-body">\
                            #message\
                        </div>\
                        <div class="bottom border-top-grey clearfix">\
                            <div class="col-md-6 pull-left text-center">\
                                <a class="text-primary default-background-hover transition-third cancel-confirmation">#cancel</a>\
                            </div>\
                            <div class="col-md-6 pull-right text-center border-left-grey">\
                                <a class="text-danger default-background-hover transition-third approve-confirmation">#ok</a>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>'
            .replace("#title", options.title ? options.title : "Confirm")
            .replace("#message", options.message ? options.message : "Confirm")
            .replace("#ok", options.buttonLabels && options.buttonLabels[0] ? options.buttonLabels[0] : "OK")
            .replace("#cancel", options.buttonLabels && options.buttonLabels[1] ? options.buttonLabels[1] : "Cancel");

        confirmComponent.confirmContainer.innerHTML = html;

    };

    confirmComponent._setModalPosition = function (options) {
        var modalStyle = "", bodyHeight = 0, modalElement = confirmComponent.confirmContainer.querySelector(".modal-dialog"),
            modalHeight = 0, targetTop = 0;
        if (options.target) {
            targetTop = options.target.getBoundingClientRect().top;
            modalElement.style.position = "absolute";
            bodyHeight = this._getElementHeight(confirmComponent.confirmContainer.querySelector(".modal-backdrop"));
            modalHeight = this._getElementHeight(modalElement) + Number(modalElement.style.paddingTop) + Number(modalElement.style.paddingBottom);
            targetTop = targetTop > bodyHeight ? bodyHeight : targetTop;
            if (modalHeight + targetTop > bodyHeight) {
                modalElement.style.top = (bodyHeight - modalHeight - 20) + "px";
            } else {
                modalElement.style.top = targetTop + "px";
            }
        }
    }

    confirmComponent._removeTemplate = function () {
        confirmComponent.confirmContainer.innerHTML = "";
    };

    confirmComponent._getElementHeight = function (elem) {
        return Math.max(elem.scrollHeight, elem.offsetHeight);
    }

    confirmComponent.initEvents = function (callback) {

        confirmComponent.confirmContainer.querySelector(".approve-confirmation").addEventListener("click", function (e) {
            e.preventDefault();
            callback(e);
            confirmComponent._removeTemplate();
        });

        confirmComponent.confirmContainer.querySelector(".cancel-confirmation").addEventListener("click", function (e) {
            e.preventDefault();
            confirmComponent._removeTemplate();
        });

    };
})();