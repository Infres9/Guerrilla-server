
const BattleField = require("./battlefield")


function Lobby(){
    this.sockets = [];

    this.battleField = new BattleField();
    this.battleField.init();

    this.finishCallback = null;
    this.startingCallback = null;

    this.isOver = false;
}

Lobby.prototype.sendMessage = function (socket, msg) {
    msg["id"] = socket.msgCounter++;
    socket.send(JSON.stringify(msg));
};


Lobby.prototype.onFinished = function (callback) {
    this.finishCallback = callback;
};

Lobby.prototype.onStart = function (callback) {
    this.startingCallback = callback;
}

Lobby.prototype.start = function () {
    if(this.startingCallback){
        this.startingCallback(this);
    }

    this.warnPlayer();
};

Lobby.prototype.broadcast = function (message) {
    this.sockets.forEach(s => this.sendMessage(s, message) );
};

Lobby.prototype.incomingMessage = function (id, jsonMsg) {
    if(!jsonMsg.type)return;

    if(jsonMsg.type === "get_board"){
        let data = {
            "type":"get_board",
            "data" : this.battleField.serialize()
        };

        this.sendMessage(this.sockets[id], data);
        return;
    }

    if(this.isOver)return;

    if(jsonMsg.type === "is_ready"){
        this.sockets[id].ready = true;
        if(this.isReady())
            this.start();
        return;
    }


    if(id !== this.battleField.playersTurn)return; //not his turn

    switch(jsonMsg.type){
        case "end_turn":
            this.battleField.nextTurn();
            this.warnPlayer();
            return;
        case "move":
            if(this.battleField.move(id, jsonMsg.data['from'], jsonMsg.data['to'])){
                this.broadcast(jsonMsg);//confirm move
            }else{
                this.sendMessage(this.sockets[id],{
                    "type" : "error",
                    "data": "Move not possible"
                });
            }

            break;
        case "attack":
            if(this.battleField.attack(id, jsonMsg.data['from'], jsonMsg.data['to'])){
                this.broadcast(jsonMsg);//confirm attack
            }else{
                this.sendMessage(this.sockets[id], {"type":"error","data":"attack not possible"});
            }
            break;
    }

    let winner = this.battleField.winner();

    if(winner !== -1){
        this.sendMessage(this.sockets[winner],{type:"you_win"});
        this.sendMessage(this.sockets[1-winner], {type : "you_loose"});
        this.endGame();
        return;
    }

    if(this.battleField.isEndTurn()){
        //do the attack, broadcast the attack
        this.battleField.nextTurn();
        this.warnPlayer();
    }
};


Lobby.prototype.endGame = function () {
    this.sockets.forEach(s => s.close());
    this.isOver = true;
    this.sockets = [];
    if(this.finishCallback){
        this.finishCallback(this);
    }
}

Lobby.prototype.addSocket = function (socket) {
    if(this.sockets.length === 2)return;

    let msg = {type : "your_id",data: this.sockets.length};

    socket.id = this.sockets.length;
    socket.msgCounter = 0;

    this.sendMessage(socket, msg);
    this.sockets.push(socket);


    socket.on("message", (message) => {
        try{
            this.incomingMessage(socket.id, JSON.parse(message));
        }catch(e){
            console.error(e);//error while parsing json, or treating message
        }
    });

    socket.on('close', () => {
        this.sockets = this.sockets.filter(l => l != socket);
        this.broadcast({type: "you_win"});
        this.endGame();
    });

    //socket onclose

    return this.isReady();
};

Lobby.prototype.isReady = function(){
    return this.sockets.length === 2 && this.sockets.every(s => s.ready);
};

Lobby.prototype.warnPlayer = function () {
    this.sendMessage(this.sockets[this.battleField.playersTurn], {type : "your_turn"});
};

module.exports = Lobby;