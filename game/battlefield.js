
const Pawn = require('./pawn.js');


function Coordinate(x, y){
    this.x = x;
    this.y = y;
}

Coordinate.prototype.serialize = function () {
    return {x:this.x, y : this.y};
};

Coordinate.fromAlgebraic = function(coords){
    if(!Coordinate.alegraicRegex.test(coords)){
        throw new Error("Unknown coordinate :" + coords);
    }

    var match = coords.match(Coordinate.alegraicRegex);
    var x = match[1];
    var y = +match[2];

    x = Coordinate.letterRange.indexOf(x.toLowerCase());

    return new Coordinate(x,y);
};

Coordinate.alegraicRegex = /^([a-y])(1?[0-9]|2[0-4])$/i;

Coordinate.letterRange = "abcdefghijklmnopqrstuvwxy";


function BattleField() {

    this.field = [];

    this.playersTurn = 0;
    this.completedActions = {"move": 0, "attack": 0};
}

/**
 * Returns the id of the player if there is one,
 * returns -1 otherwise
 */
BattleField.prototype.winner = function () {
  var metWhite = false;
  var metBlack = false;
  for(var y = 0; y < this.field.length; ++y){
      var line = this.field[y];
      for(var x = 0; x < line.length; ++x){
          var p = line[x];
          if(p){
              if(p.color === Pawn.colors.WHITE){
                  if(metBlack)return -1;
                  metWhite = true;
              }else if(p.color === Pawn.colors.BLACK){
                  if(metWhite)return -1;
                  metBlack = true;
              }
          }
      }
  }

  if(metWhite)return Pawn.colors.WHITE;

  return Pawn.colors.BLACK;

};

BattleField.prototype.isEndTurn = function () {
    return this.completedActions.move && this.completedActions.attack;
};

BattleField.prototype.move = function(id, f, t){
    if(id !== this.playersTurn || this.completedActions.move)return false;//not the player's turn

    if(!this.field[f.y][f.x] || this.field[t.y][t.x])return false;//no one at the given place or someone at the destination

    var pawn = this.field[f.y][f.x];

    if(pawn.isValidMove(f, t, this.field)){
        this.field[f.y][f.x] = null;
        this.field[t.y][t.x] = pawn;
        this.completedActions.move = 1;
        return true;
    }
    return false;
};

BattleField.prototype.attack = function (id, f, t) {
    if(id !== this.playersTurn || this.completedActions.attack){
        console.log("It's not your turn, wait your turn the attack")
        return false;
    }//not the player's turn to attack

    if(!this.field[f.y][f.x] || !this.field[t.y][t.x] || this.field[t.y][t.x].color === this.field[f.y][f.x].color){
        console.log("State of the board cannot allow attack");
        console.log(f);
        console.log(t);
        console.log(this.serialize());

        process.exit();//have the stacktrace
        return false;
    }//no attacker or same color

    var pawn = this.field[f.y][f.x];

    if(pawn.isValidAttack(f,t)){
        this.completedActions.attack = 1;
        this.field[t.y][t.x] = null;
        return true;
    }else{
        //print board
        console.log("Seems to be an invalid attack");
        console.log(f);
        console.log(t);
        console.log(this.serialize());

    }

    return false;
};

BattleField.prototype.nextTurn = function () {
    this.completedActions.attack = 0;
    this.completedActions.move =  0;
    this.playersTurn = 1 - this.playersTurn;
}

BattleField.prototype.init = function () {
    for(var y = 0; y < 25; ++y){
        this.field[y] = [];
        for(var x = 0; x < 25; ++x){
            this.field[y][x] = null;
        }
    }

    var self = this;

    BattleField.pawns.forEach(pawn => {
        var positions = pawn.positions();

        positions.forEach(p => {
            var coord = Coordinate.fromAlgebraic(p);

            var nwP = new Pawn(pawn.type, pawn.color);
            self.field[coord.y][coord.x] = nwP;
        })

    });
};

BattleField.prototype.serialize = function () {
    var res = [];
    for(var y = 0; y < this.field.length; ++y){
        for(var x = 0; x < this.field[y].length; ++x){
            if(this.field[y][x]){
                res.push({
                   coordinates : new Coordinate(x,y).serialize(),
                   pawn : this.field[y][x].serialize()
                });
            }
        }
    }

    return res;
};

function range(from, to, step){
    step = step || 1;
    var dist = (to - from)/step;

    return Array.apply(null, new Array(dist))
        .map((x,i) => from + (i*step));
}


BattleField.pawns = [
    {
        type : Pawn.types.INFANTRY,
        color : Pawn.colors.WHITE,
        positions : function () {
            return range(5,19,2)
                    .map(x=>Coordinate.letterRange[x] + "4")
                .concat(
                    range(10,14, 2)
                        .map(x=>Coordinate.letterRange[x] + "5")
                );
        }
    },
    {
        type : Pawn.types.INFANTRY,
        color : Pawn.colors.BLACK,
        positions : function () {
            return range(5,19,2)
                .map(x=>Coordinate.letterRange[x] + "20")
                .concat(
                    range(10,14, 2)
                        .map(x=>Coordinate.letterRange[x] + "19")
                );
        }
    },
    {
        type : Pawn.types.GUNNER,
        color : Pawn.colors.WHITE,
        positions : function () {
            return ["c5","d3", "w5","v3"];
        }
    },
    {
        type : Pawn.types.GUNNER,
        color : Pawn.colors.BLACK,
        positions : function () {
            return ["c19","d21","w19","v21"];
        }
    },
    {
        type : Pawn.types.MOBILE_TOWER,
        color : Pawn.colors.WHITE,
        positions : function () {
            return ["f2","i2","m2","q2","t2"];
        }
    },
    {
        type : Pawn.types.MOBILE_TOWER,
        color : Pawn.colors.BLACK,
        positions : function () {
            return ["f22","i22","m22","q22","t22"];
        }
    }
];

module.exports = BattleField;