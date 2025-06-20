"use strict";
import { Vec2 } from "modules/vector2.js";
import { loadTexture } from "modules/assetManagement.js";
import { Game } from "modules/game.js";
import { EffArray, fastDelete } from "modules/util.js";
import { Resources } from "modules/currency.js";
export class EntityType {
    size;
    doCollision;
    hasHealth;
    maxHealth;
    constructor(args) {
        this.size = args.size;
        this.doCollision = args.doCollision;
        this.hasHealth = args.hasHealth;
        this.maxHealth = args.maxHealth;
    }
}
export class Entity {
    /**
      * Wheter this entity should be culled in the next check.
      */
    markDead = false;
    pos = new Vec2(0, 0);
    health;
    sections = []; //collision map sectors of current pass
    constructor(x, y, isCenter, eType, health) {
        this.setPos(x, y, isCenter, eType.size);
        this.health = health;
    }
    injectEntityData(x, y, isCenter, eType, health) {
        this.setPos(x, y, isCenter, eType.size);
        this.health = health;
        this.eType = eType;
    }
    setPos(x, y, isCenter, size) {
        this.pos.x = isCenter ? x - size.x / 2 : x;
        this.pos.y = isCenter ? y - size.y / 2 : y;
    }
    get center() {
        return new Vec2(this.pos.x + this.eType.size.x / 2, this.pos.y + this.eType.size.y / 2);
    }
    get centX() {
        return this.pos.x + this.eType.size.x / 2;
    }
    get centY() {
        return this.pos.y + this.eType.size.y / 2;
    }
    checkForCollisions() {
        let checkedEntities = new Set();
        checkedEntities.add(this);
        for (const section of this.sections) {
            for (const entity of section) {
                if (checkedEntities.has(entity)) {
                    continue;
                }
                if (this.collidesWith(entity)) {
                    this.doCollisionResults(entity);
                }
                checkedEntities.add(entity);
            }
        }
    }
    collidesWith(e) {
        return Vec2.doVectorSquaresIntersect(this.pos, this.eType.size, e.pos, e.eType.size);
    }
    /** Mark as dead */
    die() {
        this.markDead = true;
    }
    // virtual functions
    draw(_) { }
    doCollisionResults(_) { }
    init(_) { }
    /**
      * This should only be called by the cull function (or its successor)
      */
    cleanup() { }
    update() { }
    /**
      * Create a empty husk ready for injection.
      */
    static createDefault() {
        throw new Error("Default static method wasn't overriden properly.");
    }
    distanceTo(othEnt) {
        const difX = this.centX - othEnt.centX;
        const difY = this.centY - othEnt.centY;
        return Vec2.numLength(difX, difY);
    }
}
export class BuildingType extends EntityType {
    static HQ_TEXT = loadTexture("hq.png");
    static SOLAR_TEXT = loadTexture("solar_farm.png");
    static MINE_TEXT_EMPTY = loadTexture("quarry.png");
    static MINE_TEXT_FULL = loadTexture("quarry_mining.png");
    cost;
    generation;
    static HQ = new BuildingType({
        size: new Vec2(10, 10),
        doCollision: true,
        hasHealth: true,
        maxHealth: 100,
        cost: new Resources({}),
        generation: new Resources({ nilrun: 0.01, energy: 0.01 }),
    });
    static SOLAR = new BuildingType({
        size: new Vec2(20, 20),
        doCollision: true,
        hasHealth: true,
        maxHealth: 100,
        cost: new Resources({ energy: 10, nilrun: 15 }),
        generation: new Resources({ energy: 0.01 }),
    });
    static MINE = new BuildingType({
        size: new Vec2(10, 10),
        doCollision: true,
        hasHealth: true,
        maxHealth: 50,
        cost: new Resources({}),
        generation: new Resources({ nilrun: 0.01 }),
    });
    constructor(args) {
        super(args);
        this.cost = args.cost;
        this.generation = args.generation;
    }
    doCollisionResults() { }
}
export class Building extends Entity {
    static hurtCooldownMax = 5;
    hurtCooldown = 0;
    static createDefault() {
        return new Building(0, 0, true, BuildingType.HQ, 0);
    }
    eType;
    constructor(x, y, isCenter, eType, health) {
        super(x, y, isCenter, eType, health);
        this.eType = eType;
    }
    drawHealth(view) {
        if (this.eType.hasHealth) {
            const gapY = 4;
            const thickness = 3;
            const offX = this.pos.x;
            const offY = this.pos.y + this.eType.size.x + gapY;
            const healthSize = (this.health / this.eType.maxHealth) * this.eType.size.x;
            view.fillRect(offX, offY, healthSize, thickness, "red");
        }
    }
    injectData(x, y, isCenter, eType, health) {
        this.injectEntityData(x, y, isCenter, eType, health);
    }
    draw(view) {
        switch (this.eType) {
            case BuildingType.SOLAR:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "blue");
                this.drawHealth(view);
                break;
            case BuildingType.HQ:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "yellow");
                this.drawHealth(view);
                break;
            case BuildingType.MINE:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "grey");
                this.drawHealth(view);
                break;
            default:
                throw new Error("Tried to draw a building that doesn't exist.");
        }
    }
    update() {
        this.hurtCooldown -= 1;
        switch (this.eType) {
            case BuildingType.MINE:
                break;
            default:
                Game.level.currency.resourc.add(this.eType.generation);
                break;
        }
    }
    doCollisionResults(e) {
        if (e instanceof Enemy) {
            if (this.hurtCooldown <= 0) {
                this.hurtCooldown = Building.hurtCooldownMax;
                if (this.health > 0) {
                    this.health -= 1;
                }
            }
        }
    }
}
export class TowerType extends BuildingType {
    damage;
    shootCooldownMax;
    speed;
    range;
    static MG = new TowerType({
        size: new Vec2(15, 15),
        hasHealth: true,
        maxHealth: 50,
        doCollision: true,
        cost: new Resources({ energy: 50, nilrun: 10 }),
        shootCooldownMax: 5,
        damage: 2,
        speed: 8,
        generation: new Resources({}),
        range: 150,
    });
    static SNIPER = new TowerType({
        size: new Vec2(10, 10),
        hasHealth: true,
        maxHealth: 50,
        doCollision: true,
        cost: new Resources({ energy: 50, nilrun: 15 }),
        shootCooldownMax: 30,
        damage: 6,
        speed: 8,
        generation: new Resources({}),
        range: 300,
    });
    static ROCKET = new TowerType({
        size: new Vec2(10, 10),
        hasHealth: true,
        maxHealth: 50,
        doCollision: true,
        cost: new Resources({ energy: 50, nilrun: 10 }),
        shootCooldownMax: 20,
        damage: 16,
        speed: 8,
        generation: new Resources({}),
        range: 350,
    });
    constructor(args) {
        super(args);
        this.damage = args.damage;
        this.shootCooldownMax = args.shootCooldownMax;
        this.speed = args.speed;
        this.cost = args.cost;
        this.range = args.range;
    }
}
export class Tower extends Building {
    static createDefault() {
        return new Tower(0, 0, true, TowerType.MG, 0);
    }
    static drawBlueprint(view, centX, centY, eType) {
        view.fillRect(centX - eType.size.x / 2, centY - eType.size.y / 2, eType.size.x, eType.size.y, "blue");
        view.drawCircleOutline(centX, centY, eType.range, "black");
    }
    eType;
    shootCooldown = 0;
    target = null;
    constructor(x, y, isCenter, eType, health) {
        super(x, y, isCenter, eType, health);
        this.eType = eType;
    }
    injectData(x, y, isCenter, eType, health) {
        this.injectEntityData(x, y, isCenter, eType, health);
    }
    draw(view) {
        switch (this.eType) {
            case TowerType.ROCKET:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "LightBlue");
                break;
            case TowerType.MG:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "Aquamarine");
                break;
            case TowerType.SNIPER:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "DarkBlue");
                break;
        }
        view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "blue");
        this.drawHealth(view);
    }
    update() {
        this.findTarget();
        if (this.shootCooldown <= 0 && this.target !== null) {
            this.shoot();
            this.shootCooldown = this.eType.shootCooldownMax;
        }
        else {
            this.shootCooldown -= 1;
        }
    }
    shoot() {
        //this.target must be nonnull
        let dirX = this.target.centX - this.centX;
        let dirY = this.target.centY - this.centY;
        Vec2.numNormalize(dirX, dirY);
        dirX = Vec2.numX;
        dirY = Vec2.numY;
        Vec2.numScale(dirX, dirY, this.eType.speed);
        dirX = Vec2.numX;
        dirY = Vec2.numY;
        const type = this.eType === TowerType.MG
            ? ProjectileType.BALL
            : ProjectileType.ROCKET;
        Game.level.projectiles.reviveOrCreate().injectData(this.centX, this.centY, true, dirX, dirY, this.eType.damage, type);
    }
    findTarget() {
        const potEnem = Game.level.enemies.getRandom();
        if (potEnem !== undefined && this.distanceTo(potEnem) <= this.eType.range) {
            if (this.target === null) {
                potEnem.addShooter(this);
                this.target = potEnem;
            }
            else {
                let dist = Enemy.getDist(this, this.target);
                let nDist = Enemy.getDist(this, potEnem);
                if (nDist < dist) {
                    this.target.removeShooter(this);
                    this.target = potEnem;
                    potEnem.addShooter(this);
                }
            }
        }
    }
    notifyTargetDied() {
        this.target = null;
    }
}
export class ProjectileType extends EntityType {
    static BALL = new ProjectileType({
        size: new Vec2(5, 5),
        maxHealth: 0,
        hasHealth: false,
        doCollision: true,
    });
    static ROCKET = new ProjectileType({
        size: new Vec2(5, 5),
        maxHealth: 0,
        hasHealth: false,
        doCollision: true,
    });
    constructor(args) {
        super(args);
    }
}
export class Projectile extends Entity {
    damage;
    eType;
    static createDefault() {
        return new Projectile(0, 0, true, 0, 0, 0, ProjectileType.BALL);
    }
    vel = new Vec2(0, 0);
    constructor(x, y, isCenter, velX, velY, damage, eType) {
        super(x, y, isCenter, eType, 0);
        this.damage = damage;
        this.eType = eType;
        this.vel.x = velX;
        this.vel.y = velY;
    }
    injectData(x, y, isCenter, velX, velY, damage, eType) {
        this.injectEntityData(x, y, isCenter, eType, 0);
        this.vel.x = velX;
        this.vel.y = velY;
        this.damage = damage;
        this.eType = eType;
    }
    takeDamage() {
        this.damage -= 1;
        if (this.damage == 0) {
            this.markDead = true;
        }
    }
    draw(view) {
        switch (this.eType) {
            case ProjectileType.ROCKET:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "red");
                break;
            case ProjectileType.BALL:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "orange");
                break;
        }
    }
    update() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        if (this.pos.x + this.eType.size.x < -Game.level.desc.size.x / 2 ||
            this.pos.x > Game.level.desc.size.x / 2) {
            this.markDead = true;
        }
        if (this.pos.y + this.eType.size.y < -Game.level.desc.size.y / 2 ||
            this.pos.y > Game.level.desc.size.y / 2) {
            this.markDead = true;
        }
    }
}
export class EnemyType extends EntityType {
    static SMALL = new EnemyType({
        size: new Vec2(15, 15),
        doCollision: true,
        hasHealth: true,
        maxHealth: 10,
        reward: 10,
        isArmored: false,
    });
    static BIG = new EnemyType({
        size: new Vec2(25, 25),
        doCollision: true,
        hasHealth: true,
        maxHealth: 10,
        reward: 10,
        isArmored: false,
    });
    reward;
    isArmored;
    constructor(args) {
        super(args);
        this.reward = args.reward;
        this.isArmored = args.isArmored;
    }
}
export class Enemy extends Entity {
    static SPEED = 4;
    eType;
    static createDefault() {
        return new Enemy(0, 0, true, EnemyType.SMALL, 0);
    }
    static getDist(a, b) {
        let difX = a.centX - b.centX;
        let difY = a.centY - b.centY;
        return Vec2.numLength(difX, difY);
    }
    target = null;
    lockedOnMe = new EffArray();
    constructor(x, y, isCenter, eType, health) {
        super(x, y, isCenter, eType, health);
        this.eType = eType;
    }
    injectData(x, y, isCenter, eType, health) {
        this.injectEntityData(x, y, isCenter, eType, health);
        this.eType = eType;
    }
    draw(cam) {
        cam.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "red");
    }
    update() {
        if (this.target === null) {
            this.findTarget();
        }
        if (this.target !== null) {
            let dir = Vec2.subtract(this.target.center, this.center);
            if (dir.length > 0.3) {
                dir.normalize();
                dir.scale(Enemy.SPEED);
                this.pos.add(dir);
            }
        }
        if (this.markDead) {
            this.cleanup();
        }
        return this.markDead;
    }
    findTarget() {
        const target = Game.level.buildings.alive[0];
        if (target !== undefined) {
            this.target = target;
        }
    }
    //target lock
    addShooter(shooter) {
        this.lockedOnMe.push(shooter);
    }
    removeShooter(shooter) {
        for (let i = 0; i < this.lockedOnMe.length; i++) {
            if (shooter === this.lockedOnMe[i]) {
                fastDelete(i, this.lockedOnMe);
                return;
            }
        }
    }
    cleanup() {
        for (const tower of this.lockedOnMe) {
            tower.notifyTargetDied();
        }
        //Delete array in a performant manner to avoid any infinte gc loops
        this.lockedOnMe.clear();
    }
    doCollisionResults(oEntity) {
        if (oEntity instanceof Projectile) {
            if (!this.markDead) {
                Game.level.currency.resourc.nilrun += 0.1;
            }
            this.markDead = true;
            oEntity.takeDamage();
        }
        else if (oEntity instanceof Enemy) {
            let difX = oEntity.pos.x - this.pos.x;
            let difY = oEntity.pos.y - this.pos.y;
            Vec2.numNormalize(difX, difY);
            difX = Vec2.numX;
            difY = Vec2.numY;
            Vec2.numScale(difX, difY, 8);
            this.pos.x -= difX;
            this.pos.y -= difY;
        }
    }
}
/*
 * Content is explicitly unordered!
 */
export class EntityList {
    alive = new EffArray();
    dead = new EffArray();
    createDefault;
    constructor(constr) {
        this.createDefault = constr.createDefault;
    }
    reviveOrCreate() {
        let entity = this.dead.pop();
        if (entity === undefined) {
            entity = this.createDefault();
        }
        entity.markDead = false;
        this.alive.push(entity);
        return entity;
    }
    addToCm(cm) {
        this.alive.forEach((entity) => {
            cm.add(entity);
        });
    }
    update() {
        for (let i = 0; i < this.alive.length; i++) {
            this.alive[i].update();
        }
    }
    draw(cam) {
        this.alive.forEach((entity) => {
            entity.draw(cam);
        });
    }
    doCollision() {
        for (const entity of this.alive) {
            entity.checkForCollisions();
        }
    }
    cull() {
        for (let i = 0; i < this.alive.length; i++) {
            const entity = this.alive[i];
            if (entity.markDead) {
                entity.cleanup();
                this.dead.push(entity);
                fastDelete(i, this.alive);
                i -= 1;
            }
        }
    }
    getRandom() {
        return this.alive[Math.floor(Math.random() * this.alive.length)];
    }
}
