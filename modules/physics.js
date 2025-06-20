import { ctx } from "./graphics.js";
//section count
const sectionSizeHint = 100; //the wanted chunk size
/*
 * 2d array of squares to save collsion time
 * centered on the level.
 * Chunks range from -x to x where x is the total chunk number divided by two.
 */
export class CollisionMap {
    mapWidth;
    mapHeight;
    //how many chunks there are per axis
    chNumX;
    chNumY;
    //how big chunks are per dimension (might vary)
    chSizeX;
    chSizeY;
    columns;
    constructor(mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        //determininig size and making it divisible by two
        this.chNumX = Math.ceil(mapWidth / sectionSizeHint);
        if (this.chNumX % 2 === 1) {
            this.chNumX += 1;
        }
        this.chNumY = Math.ceil(mapHeight / sectionSizeHint);
        if (this.chNumY % 2 === 1) {
            this.chNumY += 1;
        }
        this.chSizeX = mapWidth / this.chNumX;
        this.chSizeY = mapHeight / this.chNumY;
        this.columns = [];
        for (let i = 0; i < this.chNumX; i++) {
            this.columns.push([]);
        }
        this.reset();
    }
    reset() {
        for (let x = 0; x < this.chNumX; x++) {
            for (let y = 0; y < this.chNumY; y++) {
                this.columns[x][y] = [];
            }
        }
    }
    add(entity) {
        //clearing old
        entity.sections = [];
        const topLeft = entity.pos;
        const size = entity.eType.size;
        //the smallest an enemy can be is a point so it must occupy at least one chunk
        let chunkBoxW = 1;
        let chunkBoxH = 1;
        const firstChunkX = this.getChunkFromPointX(topLeft.x);
        const firstChunkY = this.getChunkFromPointY(topLeft.y);
        chunkBoxW += Math.floor(size.x / this.chSizeX);
        chunkBoxH += Math.floor(size.y / this.chSizeY);
        const leftFlipped = topLeft.x < 0
            ? this.chSizeX - Math.abs(topLeft.x % this.chSizeX)
            : topLeft.x;
        const topFlipped = topLeft.y < 0
            ? this.chSizeY - Math.abs(topLeft.y % this.chSizeY)
            : topLeft.y;
        const inChunkDistX = leftFlipped % this.chSizeX;
        const inChunkDistY = topFlipped % this.chSizeY;
        if (inChunkDistX + (size.x % this.chSizeX) >= this.chSizeX)
            chunkBoxW += 1;
        if (inChunkDistY + (size.y % this.chSizeY) >= this.chSizeY)
            chunkBoxH += 1;
        for (let x = 0; x < chunkBoxW; x++) {
            for (let y = 0; y < chunkBoxH; y++) {
                this.addIfExists(entity, firstChunkX + x, firstChunkY + y);
            }
        }
    }
    addIfExists(entity, x, y) {
        if (x >= 0 &&
            y >= 0 &&
            x < this.chSizeX &&
            y < this.chSizeY) {
            if (x >= 0 && x < this.chNumX && y >= 0 && y < this.chNumY) {
                const section = this.columns[x][y];
                section.push(entity);
                entity.sections.push(section);
            }
        }
    }
    //gets chunks but doesn't validate wheter they are inside of the map
    getChunkFromPointX(x) {
        return Math.floor(x / this.chSizeX) + this.chNumX / 2;
    }
    //gets chunks but doesn't validate wheter they are inside of the map
    getChunkFromPointY(y) {
        return Math.floor(y / this.chSizeY) + this.chNumY / 2;
    }
    //get left of chunk with that pos
    chunkPosX(chPos) {
        return chPos * this.chSizeX;
    }
    //get top of chunk with that pos
    chunkPosY(chPos) {
        return chPos * this.chSizeY;
    }
    getChunkOffsetX(x) {
        if (x >= 0) {
            return x % this.chSizeX;
        }
        else {
            return (x % this.chSizeX) - this.chSizeX;
        }
    }
    getChunkOffsetY(y) {
        if (y >= 0) {
            return y % this.chSizeY;
        }
        else {
            return (y % this.chSizeY) - this.chSizeY;
        }
    }
    debugDraw(level) {
        const view = level.view;
        //make chunks with things in it colored
        for (let chunkX = 0; chunkX < this.chNumX; chunkX++) {
            for (let chunkY = 0; chunkY < this.chNumY; chunkY++) {
                const entities = this.columns[chunkX][chunkY];
                const color = entities.length > 0 ? "white" : "grey";
                view.fillRect(this.chunkPosX(chunkX) - level.desc.size.x / 2, this.chunkPosY(chunkY) - level.desc.size.x / 2, this.chSizeX, this.chSizeY, color);
            }
        }
        //draw lines
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        const worldLeft = 0 - level.desc.size.x / 2;
        const worldTop = 0 - level.desc.size.y / 2;
        const worldBot = worldTop + level.desc.size.y;
        const worldRight = worldLeft + level.desc.size.x;
        //vertical lines
        view.moveTo(worldLeft, worldTop);
        view.lineTo(worldLeft, worldBot);
        let worldXOff = 0;
        for (let chunkX = 0; chunkX < this.chNumX; chunkX++) {
            worldXOff += this.chSizeX;
            view.moveTo(worldLeft + worldXOff, worldTop);
            view.lineTo(worldLeft + worldXOff, worldBot);
        }
        //horizontal age
        view.moveTo(worldLeft, worldTop);
        view.lineTo(worldRight, worldTop);
        let worldYOff = 0;
        for (let chunkY = 0; chunkY < this.chNumY; chunkY++) {
            worldYOff += this.chSizeY;
            view.moveTo(worldLeft, worldTop + worldYOff);
            view.lineTo(worldRight, worldTop + worldYOff);
        }
        ctx.stroke();
    }
}
