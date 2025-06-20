export class Currency {
    resourc;
    curProvs = new Set();
    constructor(resourc) {
        this.resourc = new Resources(resourc);
    }
    update() {
        for (const curProvi of this.curProvs) {
            this.resourc.add(curProvi.getProv());
        }
    }
    addCurProv(curProv) {
        this.curProvs.add(curProv);
    }
    remCurProv(curProv) {
        this.curProvs.delete(curProv);
    }
}
/**
 * A reusable container for anything to do with resources.
 */
export class Resources {
    energy;
    nilrun;
    zasterite;
    puritanium;
    vitrium;
    charite;
    constructor(args) {
        this.energy = args.energy || 0;
        this.nilrun = args.nilrun || 0;
        this.zasterite = args.zasterite || 0;
        this.puritanium = args.puritanium || 0;
        this.vitrium = args.vitrium || 0;
        this.charite = args.charite || 0;
    }
    satisfies(toBeSatisfied) {
        return (toBeSatisfied.energy <= this.energy &&
            toBeSatisfied.nilrun <= this.nilrun &&
            toBeSatisfied.zasterite <= this.zasterite &&
            toBeSatisfied.vitrium <= this.vitrium &&
            toBeSatisfied.charite <= this.charite);
    }
    remove(tR) {
        this.energy -= tR.energy;
        this.nilrun -= tR.nilrun;
        this.zasterite -= tR.zasterite;
        this.puritanium -= tR.puritanium;
        this.vitrium -= tR.vitrium;
        this.charite -= tR.charite;
    }
    add(tR) {
        this.energy += tR.energy;
        this.nilrun += tR.nilrun;
        this.zasterite += tR.zasterite;
        this.puritanium += tR.puritanium;
        this.vitrium += tR.vitrium;
        this.charite += tR.charite;
    }
}
