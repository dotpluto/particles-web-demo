"use strict";
/*
 * This is both the vector class and support for vector operations while avoiding object allocation.
*/
export class Vec2 {
    x;
    y;
    //return "registers" for objectless vector manipulation
    static numX = 0;
    static numY = 0;
    //for non class vectors
    static numNormalize(x, y) {
        const length = this.numLength(x, y);
        Vec2.numX = x / length;
        Vec2.numY = y / length;
    }
    static numScale(x, y, scalar) {
        Vec2.numX = x * scalar;
        Vec2.numY = y * scalar;
    }
    static numLength(x, y) {
        return Math.sqrt(x * x + y * y);
    }
    static numRandomUnit() {
        this.numNormalize(2 * Math.random() - 1, 2 * Math.random() - 1);
    }
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static add(a, b) {
        return new Vec2(a.x + b.x, a.y + b.y);
    }
    static subtract(a, b) {
        return new Vec2(a.x - b.x, a.y - b.y);
    }
    static scaleVec(v, scale) {
        return new Vec2(v.x * scale, v.y * scale);
    }
    static getRandomUnitVec() {
        let vecAsRad = Math.random() * 2 * Math.PI;
        return new Vec2(Math.cos(vecAsRad), Math.sin(vecAsRad));
    }
    static doVectorSquaresIntersect(posA, sizeA, posB, sizeB) {
        if (posA.x + sizeA.x > posB.x && posA.x < posB.x + sizeB.x && posA.y + sizeA.x > posB.y && posA.y < posB.y + sizeB.y) {
            return true;
        }
        return false;
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    getNormalized() {
        return new Vec2(this.x / this.length, this.y / this.length);
    }
    normalize() {
        let length = this.length;
        this.x /= length;
        this.y /= length;
    }
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }
    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
    }
}
