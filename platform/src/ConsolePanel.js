/*global ace -- ace is externally imported*/

import { Panel } from "./Panel.js";
import { define } from "ace-builds";
import { Button } from "./Button.js";

class ConsolePanel extends Panel {

    constructor(id) {
        super(id);
    }

    initialize(editor) {
        super.initialize(editor)

        this.editor.setReadOnly(true);
        this.editor.setValue("", 1);
        let buttons = [];
        let clearButton = new Button(
            { id:"clear", 
              hint:"Clear the console", 
              internal: `panels.find((p) => p.id==="${this.id}").editor.setValue('')`,
              icon: "clear" }, 
            this.id
        );
        buttons.push(clearButton); 
        this.addButtons(buttons);

        this.detectHyperlinks(this.editor);
        this.setTitleAndIcon("Console", "console");   
    }

    setValue(value) {
        this.setOutput(value+"");
    }

    setOutput(str) {
        let element = document.getElementById(this.id + "Editor");
        element.style.color = "black";
        this.editor.getSession().setUseWrapMode(false);
        this.editor.setValue(str, 1);
        // Reset undo manager
        this.editor.session.getUndoManager().reset();
        // Scroll to the bottom. This works because we're really still using an ACE editor even in the console panel.
        this.editor.renderer.scrollToLine(Number.POSITIVE_INFINITY);
    }

    setError(str) {
        document.getElementById(this.id + "Editor").style.color = "#CD352C";
        this.editor.getSession().setUseWrapMode(true);
        this.editor.setValue(str, 1);
    }

    fit() {
        var editorElement = document.getElementById(this.id + "Editor");
        if (editorElement != null) {
            editorElement.parentNode.style = "flex-basis: calc(100% - 4px);";
        }
        this.editor.resize();
    }

    createElement() {
        var root = document.createElement("div");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");

        var editor = document.createElement("div");
        editor.setAttribute("class", "editor");
        editor.setAttribute("id", this.id + "Editor");

        root.appendChild(editor);

        return root;
    }

    detectHyperlinks(editor) {
        var locationRegexp = /\(((.+?)@(\d+):(\d+)-(\d+):(\d+))\)/i;

        define("hoverlink", [], function (require, exports) {
            "use strict";

            var oop = require("ace/lib/oop");
            var event = require("ace/lib/event");
            var Range = require("ace/range").Range;
            var EventEmitter = require("ace/lib/event_emitter").EventEmitter;

            var HoverLink = function (editor) {
                if (editor.hoverLink)
                    return;
                editor.hoverLink = this;
                this.editor = editor;

                this.update = this.update.bind(this);
                this.onMouseMove = this.onMouseMove.bind(this);
                this.onMouseOut = this.onMouseOut.bind(this);
                this.onClick = this.onClick.bind(this);
                event.addListener(editor.renderer.scroller, "mousemove", this.onMouseMove);
                event.addListener(editor.renderer.content, "mouseout", this.onMouseOut);
                event.addListener(editor.renderer.content, "click", this.onClick);
            };

            (function () {
                oop.implement(this, EventEmitter);

                this.token = {};
                this.range = new Range();

                this.update = function () {
                    this.$timer = null;
                    var editor = this.editor;
                    var renderer = editor.renderer;

                    var canvasPos = renderer.scroller.getBoundingClientRect();
                    var offset = (this.x + renderer.scrollLeft - canvasPos.left - renderer.$padding) / renderer.characterWidth;
                    var row = Math.floor((this.y + renderer.scrollTop - canvasPos.top) / renderer.lineHeight);
                    var col = Math.round(offset);

                    var screenPos = { row: row, column: col, side: offset - col > 0 ? 1 : -1 };
                    var session = editor.session;
                    var docPos = session.screenToDocumentPosition(screenPos.row, screenPos.column);

                    var selectionRange = editor.selection.getRange();
                    if (!selectionRange.isEmpty()) {
                        if (selectionRange.start.row <= row && selectionRange.end.row >= row)
                            return this.clear();
                    }

                    var line = editor.session.getLine(docPos.row);
                    if (docPos.column == line.length) {
                        var clippedPos = editor.session.documentToScreenPosition(docPos.row, docPos.column);
                        if (clippedPos.column != screenPos.column) {
                            return this.clear();
                        }
                    }

                    var token = this.findLink(docPos.row, docPos.column);
                    this.link = token;
                    if (!token) {
                        return this.clear();
                    }
                    this.isOpen = true;
                    editor.renderer.setCursorStyle("pointer");

                    session.removeMarker(this.marker);

                    this.range = new Range(token.row, token.start, token.row, token.start + token.value.length);
                    this.marker = session.addMarker(this.range, "ace_link_marker", "text", true);
                };

                this.clear = function () {
                    if (this.isOpen) {
                        this.editor.session.removeMarker(this.marker);
                        this.editor.renderer.setCursorStyle("");
                        this.isOpen = false;
                    }
                };

                this.getMatchAround = function (regExp, string, col) {
                    var match;
                    regExp.lastIndex = 0;
                    string.replace(regExp, function (str) {
                        var offset = arguments[arguments.length - 2];
                        var length = str.length;
                        if (offset <= col && offset + length >= col)
                            match = {
                                start: offset,
                                value: str
                            };
                    });

                    return match;
                };

                this.onClick = function () {
                    if (this.link) {
                        this.link.editor = this.editor;
                        this._signal("open", this.link);
                        this.clear();
                    }
                };

                this.findLink = function (row, column) {
                    var editor = this.editor;
                    var session = editor.session;
                    var line = session.getLine(row);

                    var match = this.getMatchAround(locationRegexp, line, column);
                    if (!match)
                        return;

                    match.row = row;
                    return match;
                };

                this.onMouseMove = function (e) {
                    if (this.editor.$mouseHandler.isMousePressed) {
                        if (!this.editor.selection.isEmpty())
                            this.clear();
                        return;
                    }
                    this.x = e.clientX;
                    this.y = e.clientY;
                    this.update();
                };

                this.onMouseOut = function () {
                    this.clear();
                };

                this.destroy = function () {
                    this.onMouseOut();
                    event.removeListener(this.editor.renderer.scroller, "mousemove", this.onMouseMove);
                    event.removeListener(this.editor.renderer.content, "mouseout", this.onMouseOut);
                    delete this.editor.hoverLink;
                };

            }).call(HoverLink.prototype);

            exports.HoverLink = HoverLink;

        });

        var HoverLink = ace.require("hoverlink").HoverLink;
        editor.hoverLink = new HoverLink(editor);
        editor.hoverLink.on("open", function (e) {
            var location = e.value;
            if (editor.getValue().indexOf(location) > -1) {
                /* TODO  fix link highlighting issue mdenet/educationplatform#181
                          original epsilon playground behaviour */
            }
        });
    }
}

export { ConsolePanel };
