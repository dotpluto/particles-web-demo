import { Vec2 } from "modules/vector2.js";
import { CollisionMap } from "modules/physics.js";
import { Tower, TowerType, Projectile, Building, BuildingType, Enemy, EntityList, } from "modules/entity.js";
import { Viewport, ctx, canvas } from "modules/graphics.js";
import { SpawnMan } from "modules/spawnLogic.js";
import { Game } from "modules/game.js";
import { Currency } from "modules/currency.js";
export class LevelDescriptor {
    color;
    safeBuildRadius;
    size;
    constructor(color, safeBuildRadius, size) {
        this.color = color;
        this.safeBuildRadius = safeBuildRadius;
        this.size = size;
    }
}
export class Level {
    desc;
    frameCount = 0;
    view = new Viewport(new Vec2(0, 0));
    projectiles = new EntityList(Projectile);
    enemies = new EntityList(Enemy);
    buildings = new EntityList(Building);
    towers = new EntityList(Tower);
    cm;
    spawnMan = new SpawnMan();
    currency = new Currency({ nilrun: 100, energy: 100 });
    constructor(desc) {
        this.desc = desc;
        this.cm = new CollisionMap(desc.size.x, desc.size.y);
        this.buildings.reviveOrCreate().injectData(0, 0, true, BuildingType.HQ, BuildingType.HQ.maxHealth);
        /*
        let nodeNum = 5;
        const sizeX = desc.size.x - BuildingType.MINE.size.x;
        const sizeY = desc.size.y - BuildingType.MINE.size.y;
        while(nodeNum > 0) {
            const posX = Math.random() * sizeX;
            const posY = Math.random() * sizeY;
            let skip = false;
            for (let index = 0; index < this.buildings.alive.length; index++) {
                const build = this.buildings.alive[index];
                if(Vec2.doVectorSquaresIntersect(new Vec2(posX, posY), BuildingType.MINE.size, build.pos, build.eType.size)) {
                    skip = true;
                    break;
                }
            }
            if(skip) {
                continue;
            }

            this.buildings.reviveOrCreate().injectData(posX, posY, true, BuildingType.MINE, BuildingType.MINE.maxHealth);
            nodeNum -= 1;
        }
        */
    }
    draw() {
        ctx.fillStyle = this.desc.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        //this.cm.debugDraw(this);
        //updating
        this.buildings.draw(this.view);
        this.towers.draw(this.view);
        this.enemies.draw(this.view);
        this.projectiles.draw(this.view);
        if (Game.selBuildingType !== null) {
            const worldX = this.view.viewToWorldX(Game.screen.lastMouseX);
            const worldY = this.view.viewToWorldY(Game.screen.lastMouseY);
            if (Game.selBuildingType instanceof TowerType) {
                Tower.drawBlueprint(this.view, worldX, worldY, Game.selBuildingType);
            }
            else {
                this.view.fillRect(worldX - Game.selBuildingType.size.x / 2, worldY - Game.selBuildingType.size.y / 2, Game.selBuildingType.size.x, Game.selBuildingType.size.y, "green");
            }
        }
    }
    update() {
        //adding to collision map
        this.cm.reset();
        this.buildings.addToCm(this.cm);
        this.towers.addToCm(this.cm);
        this.enemies.addToCm(this.cm);
        this.projectiles.addToCm(this.cm);
        this.buildings.doCollision();
        this.towers.doCollision();
        this.enemies.doCollision();
        this.projectiles.doCollision();
        this.buildings.update();
        this.towers.update();
        this.enemies.update();
        this.projectiles.update();
        this.buildings.cull();
        this.towers.cull();
        this.enemies.cull();
        this.projectiles.cull();
        //spawning logic
        this.spawnMan.update();
        this.currency.update();
        this.frameCount += 1;
    }
}
