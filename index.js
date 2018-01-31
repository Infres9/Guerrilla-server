const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const Lobby = require('./game/lobby')

const WebSocket = require('ws');

const server = express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))


const ws = new WebSocket.Server({ server });

var mLobbies = [createLobby()];

function createLobby(){
    var nwLobby = new Lobby();
    nwLobby.onFinished(l => {
        mLobbies = mLobbies.filter(x => x !== l);
    });

    nwLobby.onStart(l => {
        mLobbies.push(createLobby());
    });

    return nwLobby;
}

ws.on('connection', function(socket){
    mLobbies[mLobbies.length-1].addSocket(socket);
});
