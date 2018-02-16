

function Pawn(type, color){

    this.type = type;
    this.color = color;
}

Pawn.prototype.toString = function () {
    return (this.type + "") + (this.color + "");
};

function toMove(p1, p2){
    return {
        x : p2.x - p1.x,
        y : p2.y - p1.y,
        aX : Math.abs(p1.x - p2.x),
        aY : Math.abs(p1.y - p2.y)
    };
}

Pawn.prototype.isValidMove = function (from, to, field) {
    var m = toMove(from, to);
    if(m.aX > 3 || m.aY > 3)return false;
    if(this.type !== Pawn.types.INFANTRY){
        if(m.aX >= 2 || m.aY >= 2)return false;
        return true;
    }else{
        if(m.aX === 2 && m.aY === 1 || m.aY === 2 && m.aX === 1){
            return false;//can only move 2 in same direction
        }

        if(m.aX === 2 || m.aY === 2){
            let incrX = parseInt(m.x/2);
            let incrY = parseInt(m.y/2);
            return field[from.y+incrY] && !field[from.y+incrY][from.x+incrX];//intermediate box must be empty
        }

        return true;
    }
};

Pawn.prototype.isValidAttack = function (from, to) {
    let m = toMove(from,to);

    if(this.type === Pawn.types.INFANTRY){
        return (m.aX === 1 && m.y === 0 || m.y === ((this.color === Pawn.colors.WHITE) ? 1 : -1) && m.x === 0);
    }

    if(this.type === Pawn.types.GUNNER){
        let mult = this.color === Pawn.colors.WHITE ? 1 : -1;
        return ((m.aX === 1 || m.aX === 2) && m.y === 0 || (m.y === mult || m.y === mult*2 || m.y === mult*3) && m.x === 0 );
    }

    if(this.type === Pawn.types.MOBILE_TOWER){
        return (m.aX <= 1 && m.aY <= 1 || (m.aX === 2 && (m.aY === 0 || m.aY === 2)  || m.aY === 2 && (m.aX === 0 || m.aX === 2) ));
    }

    return false;//what type ?
};

Pawn.prototype.serialize = function () {
    return {
        color: this.color,
        type: this.type
    };
};

Pawn.types = {
    MOBILE_TOWER : 0,
    INFANTRY : 1,
    GUNNER : 2
};

Pawn.colors = {
    WHITE : 0,
    BLACK : 1
};

module.exports = Pawn;