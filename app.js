var express = require('express');

// Create a new Express application
var app = express();

//Create a new http Server
var http = require('http').Server(app);

//Create Socket.io client
var io = require('socket.io')(http);

var SERVER_PORT = process.env.OPENSHIFT_NODEJS_PORT || 3333;
var SERVER_IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP;

//Declare the debug mode variable
var debug = true;

var playerData = [];

io.on('connection', function(socket){
  print('a player connected');
  socket.emit('playerConnection', playerData);

  socket.on('message', function(msg){
	print('message from ' + socket.player.name + ' : ' + msg);
	io.sockets.emit('chatMessage', socket.player, msg);
  });

  socket.on('login', function(name, character){
	print(name + ' has logged in as ' + character);
	socket.player = new Player(name, character);
	playerData.push(socket.player);

	socket.emit('playerLogin', socket.player);
  });

  socket.on('moveTo', function(character, location){
	print('player ' + socket.player.name + ' has moved to the ' + location);
	socket.player.location = location;
	updatePlayerData(socket.player);
	io.sockets.emit('updateBoard', playerData);
  });

  socket.on('triggerUpdate', function(){
  	io.sockets.emit('updateBoard', playerData);
  });

  socket.on('alert', function(msg){
    print(msg, true);
  });

  socket.on('disconnect', function(){
  	if(socket.player){
		print(socket.player.name + ' disconnected');
		for(var i = playerData.length-1; i >= 0; i--){
			if(playerData[i].id == socket.player.id)
				playerData.splice(i, 1);
		}
		io.sockets.emit('removePlayer', socket.player);
  	}
  });
});

app.use(express.static(__dirname ));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(SERVER_PORT, SERVER_IP_ADDRESS, function () {
  print( 'Listening on ' + (SERVER_IP_ADDRESS ? SERVER_IP_ADDRESS : 'localhost') + ':' + SERVER_PORT );
});

/**
*Updates playerData object with input player data
*@param {object} data - the player data to be updated
*/
function updatePlayerData(data){
	for(var i in playerData){
		if(playerData[i].id == data.id){
			playerData[i] = data;
		}
	}
}

/**
*Prints input message to the console
*@param {String} msg - the message to be displayed
*@param {Boolean} error - whether or not the message is an error
*/
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
    var id;
    var location;

    /**
    * Player Construtor
    * @param {String} name - name of the player
    * @param {Character} character - the Character the player will be
    **/
    var player = function (name, character) {
        this.name = name;
        this.character = character;
        this.id = playerData.length;

        if(character == 'MissScarlet')
        		this.location = 'Hall_Lounge';
        else if(character == 'ColonelMustard')
        		this.location = 'Lounge_DiningRoom';
        else if(character == 'MrsWhite')
        		this.location = 'Ballroom_Kitchen';
        else if(character == 'MrGreen')
        		this.location = 'Conservatory_Ballroom';
        else if(character == 'MrsPeacock')
        		this.location = 'Library_Conservatory';
        else if(character == 'ProfessorPlum')
        		this.location = 'Study_Library';
    };

    /**
    * Get Player
    * @return {Object} name: name of the player
    *                  character: the Character the player will be
    *                  id: unique player identifier
    **/
    player.getPlayer = function(){
        return {name: this.name, character: this.character, id: this.id}; 
    };

    return player;
})();