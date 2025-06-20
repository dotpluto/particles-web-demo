export const canvas = document.getElementById("canvas");
export const ctx = canvas.getContext("2d", {
    alpha: true,
    antialias: false,
});
/**
 * Class that represents a viewpoint.
 * It's size is equal to the size of the canvas.
 */
export class Viewport {
    center;
    constructor(center) {
        this.center = center;
    }
    drawImage(img, left, top) {
        ctx.drawImage(img, this.worldToViewX(left), this.worldToViewY(top));
    }
    fillRect(left, top, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.worldToViewX(left), this.worldToViewY(top), w, h);
    }
    drawCircleOutline(cLeft, cTop, radius, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(this.worldToViewX(cLeft), this.worldToViewY(cTop), radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
    moveTo(x, y) {
        ctx.moveTo(this.worldToViewX(x), this.worldToViewY(y));
    }
    lineTo(x, y) {
        ctx.lineTo(this.worldToViewX(x), this.worldToViewY(y));
    }
    worldToViewX(worldX) {
        return worldX + this.width / 2 - this.center.x;
    }
    worldToViewY(worldY) {
        return worldY + this.height / 2 - this.center.y;
    }
    viewToWorldX(viewX) {
        return viewX - this.width / 2 + this.center.x;
    }
    viewToWorldY(viewY) {
        return viewY - this.height / 2 + this.center.y;
    }
    get width() {
        return Display.width;
    }
    get height() {
        return Display.height;
    }
}
export class Display {
    static get width() {
        return canvas.width;
    }
    static get height() {
        return canvas.height;
    }
}
