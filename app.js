var express = require('express');

// Create a new Express application
var app = express();

//Create a new http Server
var http = require('http').Server(app);

//Create Soclet.io client
var io = require('socket.io')(http);

//
var SERVER_PORT = process.env.OPENSHIFT_NODEJS_PORT || 3333
var SERVER_IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP

var players;

//Declare the debug mode variable
var debug = true;

io.on('connection', function(socket){
  print('a user connected');

  socket.on('message', function(msg){
	print('message from ' + socket.player.name + ' : ' + msg);
	io.sockets.emit('chatMessage', socket.player, msg);
  });

  socket.on('login', function(name, character){
	print('player ' + name + " has logged in as " + character);
	socket.player = new Player(name, character);
	//io.sockets.players.push(socket.player);

	//console.log(io.sockets.player);
	io.sockets.emit('playerLogin', socket.player.name, socket.player.character);
  });

  socket.on('alert', function(msg){
    print(msg, true);
  });

  socket.on('disconnect', function(){
  	if(socket.player)
		print(socket.player.name + ' disconnected');
  });
});

app.use(express.static('./'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');

});

http.listen(SERVER_PORT, SERVER_IP_ADDRESS, function () {
  print( "Listening on " + (SERVER_IP_ADDRESS ? SERVER_IP_ADDRESS : 'vddp03p-2860dbd.lm.lmig.com') + ":" + SERVER_PORT );
});

/*http.listen(3333, function(){
  print('listening at http://vddp03p-2860dbd.lm.lmig.com:3333/');
});*/

function print(msg, error){
	if(debug){
		if(error){
			console.error(msg);
		}
		else{
			console.log(msg);
		}
	}
}

var Player = (function(){
    var name;
    var character;
    var playerId = 0;

    /**
    * Player Construtor
    * @param {String} name - name of the player
    * @param {Character} character - the Character the player will be
    **/
    var player = function (name, character) {
        this.name = name;
        this.character = character;
        this.playerId = playerId++;
    };

    /**
    * Get Player
    * @return {Object} name: name of the player
    *                  character: the Character the player will be
    *                  playerId: unique player identifier
    **/
    player.getPlayer = function(){
        return {name: this.name, Character: this.character, playerId: this.playerId}; 
    };

    return player;
})();