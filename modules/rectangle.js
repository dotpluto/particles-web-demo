"use strict";
import { Vec2 } from "modules/vector2.js";
export class Rect {
    x;
    y;
    w;
    h;
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    static fromVectors(a, b) {
        return new Rect(a.x, a.y, b.x, b.y);
    }
    getCenter() {
        return new Vec2(this.x + this.w / 2, this.y + this.h / 2);
    }
    intersects(otherRect) {
        if (this.left > otherRect.right || this.right < otherRect.left) {
            return false;
        }
        if (this.top > otherRect.bottom || this.bottom < otherRect.top) {
            return false;
        }
        return true;
    }
    isPointInside(point) {
        return (point.x > this.left &&
            point.x < this.right &&
            point.y > this.top &&
            point.y < this.bottom);
    }
    get left() {
        return this.x;
    }
    get right() {
        return this.x + this.w;
    }
    get top() {
        return this.y;
    }
    get bottom() {
        return this.y + this.h;
    }
    get width() {
        return this.w;
    }
    get height() {
        return this.h;
    }
}
