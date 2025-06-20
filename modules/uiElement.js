"use strict";
import { Rect } from "modules/rectangle.js";
import { Vec2 } from "modules/vector2.js";
import { CapturableMouseEvent, ScreenManager } from "modules/screenManager.js";
import { ctx, Display } from "modules/graphics.js";
export function addChild(parent, factory) {
    const child = factory(parent);
    parent.children.push(child);
    return child;
}
/**
 * The horizontal anchor point of a ui element
 */
export var HAnchPoint;
(function (HAnchPoint) {
    HAnchPoint[HAnchPoint["LEFT"] = 0] = "LEFT";
    HAnchPoint[HAnchPoint["MIDDLE"] = 1] = "MIDDLE";
    HAnchPoint[HAnchPoint["RIGHT"] = 2] = "RIGHT";
})(HAnchPoint || (HAnchPoint = {}));
(function (HAnchPoint) {
    function getPos(anch, pos, size) {
        switch (anch) {
            case HAnchPoint.LEFT:
                return pos - size / 2;
            case HAnchPoint.MIDDLE:
                return pos;
            case HAnchPoint.RIGHT:
                return pos + size / 2;
        }
    }
    HAnchPoint.getPos = getPos;
})(HAnchPoint || (HAnchPoint = {}));
/**
 * The vertical anchor point of an ui element
 */
export var VAnchPoint;
(function (VAnchPoint) {
    VAnchPoint[VAnchPoint["TOP"] = 0] = "TOP";
    VAnchPoint[VAnchPoint["MIDDLE"] = 1] = "MIDDLE";
    VAnchPoint[VAnchPoint["BOTTOM"] = 2] = "BOTTOM";
})(VAnchPoint || (VAnchPoint = {}));
(function (VAnchPoint) {
    function getPos(anch, pos, size) {
        switch (anch) {
            case VAnchPoint.TOP:
                return pos - size / 2;
            case VAnchPoint.MIDDLE:
                return pos;
            case VAnchPoint.BOTTOM:
                return pos + size / 2;
        }
    }
    VAnchPoint.getPos = getPos;
})(VAnchPoint || (VAnchPoint = {}));
/**
 * The UIElement is always positionted relative to its parent element.
 */
export class UIElement {
    /** The element that this one is attached to. If it is null the element is attached to the canvas. */
    parent;
    /** Position of the anchor on the parent element in the horizontal axis */
    parHorAnch;
    /** Position of the anchor on the parent element in the vertical axis */
    parVerAnch;
    /** Position of the anchor on the current element in the horizontal axis */
    horAnch;
    /** Position of the anchor on the current element in the vertical axis */
    verAnch;
    /** Screen coordinate offset after other transformations */
    offset;
    size;
    /** The position cache computed from the current state */
    computed;
    children = [];
    constructor({ parent, parVerAnch, parHorAnch, verAnch, horAnch, offset, size, }) {
        this.parent = parent;
        this.parHorAnch = parHorAnch;
        this.parVerAnch = parVerAnch;
        this.horAnch = horAnch;
        this.verAnch = verAnch;
        this.offset = offset;
        this.size = size;
        this.computed = new Vec2(0, 0);
        this.computePos();
    }
    computePos() {
        let parX;
        let parY;
        let parSizeX;
        let parSizeY;
        if (this.parent instanceof UIElement) {
            const p = this.parent;
            parX = p.computed.x;
            parY = p.computed.y;
            parSizeX = p.size.x;
            parSizeY = p.size.y;
        }
        else {
            parX = 0 + Display.width / 2;
            parY = 0 + Display.height / 2;
            parSizeX = Display.width;
            parSizeY = Display.height;
        }
        const parAnchX = HAnchPoint.getPos(this.parHorAnch, parX, parSizeX);
        const parAnchY = VAnchPoint.getPos(this.parVerAnch, parY, parSizeY);
        this.computed.x =
            parAnchX -
                HAnchPoint.getPos(this.horAnch, 0, this.size.x) +
                this.offset.x;
        this.computed.y =
            parAnchY -
                VAnchPoint.getPos(this.verAnch, 0, this.size.y) +
                this.offset.y;
        for (const child of this.children) {
            child.computePos();
        }
    }
    mouseMoveEvent(_) { }
    mouseDownEvent(_) { }
    mouseUpEvent(_) { }
}
export class UIText extends UIElement {
    text;
    font;
    static new(args) {
        return new UIText(args);
    }
    constructor(args) {
        super(args);
        this.text = args.text;
        this.font = Math.floor(this.size.y).toString() + "px orbitron";
        if (args.resizeForTxt)
            this.resizeForTxt();
    }
    draw(color) {
        ctx.font = this.font;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = color || "red";
        ctx.fillText(this.text, this.computed.x, this.computed.y, this.size.x);
    }
    resizeForTxt() {
        ctx.font = this.font;
        const metrics = ctx.measureText(this.text);
        this.size.x = metrics.width;
    }
}
export class UIButton extends UIText {
    isHoveredOver = false;
    clickCallback;
    static new(args) {
        return new UIButton(args);
    }
    constructor(args) {
        super(args);
        this.clickCallback = args.clickCallback;
    }
    draw() {
        super.draw(this.isHoveredOver ? "white" : "red");
    }
    mouseMoveEvent(e) {
        //TODO fix
        let buttonRect = new Rect(this.computed.x - this.size.x / 2, this.computed.y - this.size.y / 2, this.size.x, this.size.y);
        let mousePos = new Vec2(e.clientX, e.clientY);
        if (this.isHoveredOver === false) {
            if (buttonRect.isPointInside(mousePos)) {
                this.isHoveredOver = true;
                ScreenManager.markForRedraw();
            }
        }
        else {
            if (!buttonRect.isPointInside(mousePos)) {
                this.isHoveredOver = false;
                ScreenManager.markForRedraw();
            }
        }
    }
    mouseDownEvent(e) {
        //TODO fix
        const rect = new Rect(this.computed.x - this.size.x / 2, this.computed.y - this.size.y / 2, this.size.x, this.size.y);
        if (rect.isPointInside(new Vec2(e.clientX, e.clientY))) {
            this.clickCallback(e);
            CapturableMouseEvent.capture(e);
        }
    }
}
export class UIIconButton extends UIButton {
    icon;
    constructor(args) {
        super(args);
        this.icon = args.icon;
    }
    draw() {
        ctx.drawImage(this.icon, this.computed.x - this.size.x / 2, this.computed.y - this.size.y / 2, this.size.x, this.size.y);
    }
}
export class UIScore extends UIText {
    getScore;
    color;
    static new(args) {
        return new UIScore(args);
    }
    constructor(args) {
        super(args);
        this.getScore = args.getScore;
        this.color = args.color;
    }
    draw(color) {
        this.text = this.getScore();
        this.resizeForTxt();
        super.draw(this.color);
    }
}
