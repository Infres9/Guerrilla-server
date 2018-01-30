const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const Lobby = require('./game/lobby')

const WebSocket = require('ws');

const ws = new WebSocket.Server({ port: 4554 });

var mLobbies = [];

mLobbies.push(new Lobby());


ws.on('connection', function(socket){
    if(mLobbies[mLobbies.length-1].addSocket(socket)){//ready to start
        mLobbies[mLobbies.length-1].start();
        //listen for lobby ending
        mLobbies.push(new Lobby());
    }
});

console.log("Web socket listening on port 4554");

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
