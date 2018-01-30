
const BattleField = require("./battlefield")


function Lobby(){
    this.socket1 = null;
    this.socket2 = null;
    this.sockets = [];

    this.battleField = new BattleField();
    this.battleField.init();
}

Lobby.prototype.start = function () {
    this.warnPlayer();
};

Lobby.prototype.broadcast = function (message) {
    this.sockets.forEach(s => s.send(message));
};

Lobby.prototype.incomingMessage = function (id, jsonMsg) {
    if(!jsonMsg.type)return;

    if(jsonMsg.type === "get_board"){
        var data = {
            "type":"get_board",
            "data" : this.battleField.serialize()
        }

        this.sockets[id].send(JSON.stringify(data));
        return;
    }

    if(id != this.battleField.playersTurn)return; //not his turn

    switch(jsonMsg.type){
        case "end_turn":
            this.battleField.nextTurn();
            this.warnPlayer();
        case "move":
            console.log(jsonMsg);
            if(this.battleField.move(id, jsonMsg.data['from'], jsonMsg.data['to'])){
                this.broadcast(JSON.stringify(jsonMsg));//confirm move
            }else{
                this.sockets[id].send(JSON.stringify({
                    "type" : "error",
                    "data": "Move not possible"
                }));
            }

            //do the move, broadcast the move
            if(this.battleField.isEndTurn()){
                this.battleField.nextTurn();
                this.warnPlayer();
            }
            break;
        case "attack":
            if(this.battleField.attack(id, jsonMsg.from, jsonMsg.to)){
                this.broadcast(JSON.stringify(jsonMsg));//confirm attack
            }else{
                this.sockets[id].send(JSON.stringify({
                        "type":"error",
                        "data":"attack not possible"
                }));
            }

            if(this.battleField.isEndTurn()){
                //do the attack, broadcast the attack
                this.battleField.nextTurn();
                this.warnPlayer();
            }
            break;
    }

};


Lobby.prototype.addSocket = function (socket) {
    var msg = {type : "your_id",data: 0};
    if(!this.socket1){
        socket.id = 0;
        this.socket1 = socket;
        socket.send(JSON.stringify(msg));
        this.sockets.push(socket);
    }else if(!this.socket2){
        socket.id = 1;
        this.socket2 = socket;
        msg.data = 1;
        socket.send(JSON.stringify(msg));
        this.sockets.push(socket);
    }else{
        return;
    }

    socket.on("message", (message) => {
        try{
            this.incomingMessage(socket.id, JSON.parse(message));
        }catch(e){
            console.error(e);//error while parsing json, or treating message
        }
    });

    //socket onclose

    return this.isReady();
};

Lobby.prototype.isReady = function(){
    return !!this.socket1 && !!this.socket2;
};

Lobby.prototype.warnPlayer = function () {
    this.sockets[this.battleField.playersTurn].send('{"type":"your_turn"}');
};

module.exports = Lobby;