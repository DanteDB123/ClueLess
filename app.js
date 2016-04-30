var express = require('express');

// Create a new Express application
var app = express();

//Create a new http Server
var http = require('http').Server(app);

//Create Socket.io client
var io = require('socket.io')(http);

var SERVER_PORT = process.env.OPENSHIFT_NODEJS_PORT || 3333;
var SERVER_IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP;

var playerData = [];


var locationData = {
	Study : {
		validMoves : ['Study_Hall', 'Study_Library', 'Kitchen']
		},
	Hall : {
		validMoves : ['Study_Hall', 'Hall_Lounge', 'Hall_Billiard'] 
		},
	Lounge : {
		validMoves : ['Hall_Lounge', 'Lounge_Dining', 'Conservatory'] 
		},
	Library : {
		validMoves : ['Study_Library', 'Library_Billiard', 'Library_Conservatory'] 
		},
	Billiard : {
		validMoves : ['Library_Billiard', 'Hall_Billiard', 'Billiard_Dining', 'Billard_Ballroom'] 
		},
	Dining : {
		validMoves : ['Lounge_Dining', 'Billiard_Dining', 'Dining_Kitchen'] 
		},
	Conservatory : {
		validMoves : ['Library_Conservatory', 'Conservatory_Ballroom', 'Lounge'] 
		},
	Ballroom : {
		validMoves : ['Conservatory_Ballroom', 'Billiard_Ballroom', 'Ballroom_Kitchen'] 
		},
	Kitchen : {
		validMoves : ['Ballroom_Kitchen', 'Dining_Kitchen', 'Study'] 
		},
	Study_Hall : {
		validMoves : ['Study', 'Hall'] 
		},
	Hall_Lounge : {
		validMoves : ['Hall', 'Lounge'] 
		},
	Study_Library : {
		validMoves : ['Study', 'Library'] 
		},
	Hall_Billiard : {
		validMoves : ['Hall', 'Billiard'] 
		},
	Lounge_Dining : {
		validMoves : ['Lounge', 'Dining'] 
		},
	Library_Billiard : {
		validMoves : ['Library', 'Billiard'] 
		},
	Billiard_Dining : {
		validMoves : ['Billiard', 'Dining'] 
		},
	Library_Conservatory : {
		validMoves : ['Library', 'Conservatory'] 
		},
	Billiard_Ballroom : {
		validMoves : ['Billiard', 'Ballroom'] 
		},
	Dining_Kitchen : {
		validMoves : ['Dining', 'Kitchen'] 
		},
	Conservatory_Ballroom : {
		validMoves : ['Conservatory', 'Ballroom'] 
		},
	Ballroom_Kitchen : {
		validMoves : ['Ballroom', 'Kitchen'] 
		}
}

//Declare the debug mode variable
var debug = true;

io.on('connection', function(socket){
  print('a user connected');

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
  	if(socket.player)
		print(socket.player.name + ' disconnected');
  });
});

app.use(express.static('./'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');

});

http.listen(SERVER_PORT, SERVER_IP_ADDRESS, function () {
  print( 'Listening on ' + (SERVER_IP_ADDRESS ? SERVER_IP_ADDRESS : 'localhost') + ':' + SERVER_PORT );
});

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

var Player = (function(){
    var name;
    var character;
    var id = 0;
    var location;

    /**
    * Player Construtor
    * @param {String} name - name of the player
    * @param {Character} character - the Character the player will be
    **/
    var player = function (name, character) {
        this.name = name;
        this.character = character;
        this.id = id++;

        if(character == 'Professor Schappelle')
        		this.location = 'Hall_Lounge';
        else if(character == 'Professor Demasco')
        		this.location = 'Lounge_Dining';
        else if(character == 'Professor Garonzik')
        		this.location = 'Ballroom_Kitchen';
        else if(character == 'Mr. Brock')
        		this.location = 'Conservatory_Ballroom';
        else if(character == 'Dean Schlesinger')
        		this.location = 'Library_Conservatory';
        else if(character == 'Asst Dean Horn')
        		this.location = 'Study_Library';

    };

    /**
    * Get Player
    * @return {Object} name: name of the player
    *                  character: the Character the player will be
    *                  id: unique player identifier
    **/
    player.getPlayer = function(){
        return {name: this.name, Character: this.character, playerId: this.id}; 
    };

    return player;
})();