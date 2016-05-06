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
var solution = {};
var suggestion = {};

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

  socket.on('checkToBeginGame', function(buttonClicked){
if(playerData.length > 2 && buttonClicked){
		distributeCards();
		io.sockets.emit('startGame', playerData);
	}
  });

  socket.on('moveTo', function(character, location){
	print('player ' + socket.player.name + ' has moved to the ' + location);
	socket.player.location = location;
	updatePlayerData(socket.player);
	io.sockets.emit('updateBoard', playerData);
  });

  socket.on('endTurn', function(){
  	var nextPlayer = getNextPlayer(socket.player.id + 1);

  	io.sockets.emit('startTurn', nextPlayer);
  });

   socket.on('makeAccusation', function(cards){
	if(cards.suspect == solution.suspect && cards.weapon == solution.weapon && cards.room == solution.room){
		print(socket.player.character + ' won the game');
		io.sockets.emit('endGame', socket.player);
	}
	else{
		print(socket.player.character + ' made an incorrect accusation and will no longer have a turn');
		socket.player.prohibitTurn = true;
		updatePlayerData(socket.player);
		io.sockets.emit('prohibitPlayerMovement', socket.player);

		var nextPlayer = getNextPlayer(socket.player.id + 1);
  		io.sockets.emit('startTurn', nextPlayer);
	}
  });

   socket.on('makeSuggestion', function(cards){
   	suggestion.suggestor = socket.player;
   	suggestion.cards = cards;
	var nextPlayer = socket.player.id + 1;

	var characterToMove = playerData.filter(function(player){
		return player.character == cards.suspect;
	})[0];
	if(characterToMove){
		characterToMove.location = cards.room;
		updatePlayerData(characterToMove);
		io.sockets.emit('updateBoard', playerData);
	}

	if(cards.suspect = solution.suspect && cards.weapon == solution.weapon && cards.room == solution.room){
		print(socket.player.character + ' made a correct suggestion');
		io.sockets.emit('suggestionAnswer', undefined, suggestion);
	}
	else{
		nextPlayer = getNextPlayer(nextPlayer, true);
		io.sockets.emit('askSuggestion', cards, nextPlayer);
	}
  });

   socket.on('answerSuggestion', function(card){
   	var nextPlayer;
	if(card && (suggestion.cards.suspect == card || suggestion.cards.weapon == card || suggestion.cards.room == card)){
		print(socket.player.character + ' proved the suggestion wrong with ' + card);

		io.sockets.emit('suggestionAnswer', card, suggestion);

		nextPlayer = getNextPlayer(suggestion.suggestor.id + 1);
		io.sockets.emit('startTurn', nextPlayer);
	}
	else{
		nextPlayer = getNextPlayer(socket.player.id + 1, true);
		if (nextPlayer.id == suggestion.suggestor.id) {
			io.sockets.emit('suggestionAnswer', undefined, suggestion);
			io.sockets.emit('startTurn', nextPlayer);
		}
		else{
			io.sockets.emit('askSuggestion', suggestion.cards, nextPlayer);
		}
	}
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
*Randomly distibute the cards to the players
*/
function distributeCards() {
	var weaponList = ["Wrench", "Candlestick", "LeadPipe", "Rope", "Revolver", "Knife"];
	var suspectList = ["MrsWhite", "ProfessorPlum", "MissScarlet", "MrGreen", "MrsPeacock", "ColonelMustard"];
	var roomList = ["Conservatory", "Lounge", "Library", "Kitchen", "Ballroom", "Hall", "BilliardRoom", "Study", "DiningRoom"];

	// Randomly choosing a weapon, suspect, and room to be the solution
	solution.weapon = weaponList.splice(Math.floor(Math.random() * weaponList.length), 1);
	solution.suspect = suspectList.splice(Math.floor(Math.random() * suspectList.length), 1);
	solution.room = roomList.splice(Math.floor(Math.random() * roomList.length), 1);


	print('MurderMystery: ' + solution.suspect  + ' with the ' + solution.weapon + ' in the ' + solution.room);

	// Put together the rest of the cards
	var restOfCards = weaponList.concat(suspectList, roomList);

	// Assign the cards randomly to the players
	clearCards();
	var playerId = 0;
	while(restOfCards.length > 0){
		var randomCard = restOfCards.splice(Math.floor(Math.random() * (restOfCards.length-1)), 1)[0];
		playerData[playerId].cards.push(randomCard);
		if(playerId < playerData.length-1){
			playerId++;
		}
		else{
			playerId = 0;
		}
	}
}

/**
*Remove any existing cards
**/
function clearCards(){
	for(var i = 0; i < playerData.length; i++){
		playerData[i].cards = [];
	}
}

function getNextPlayer(playerId, forAnsweringSuggestion) {
	var nextPlayer;
  	
  	while(!nextPlayer){
  		var potentialPlayer = playerData.filter(function(player){
	  		return player.id == playerId;
	  	});

	  	if(potentialPlayer.length > 0 && (forAnsweringSuggestion || !potentialPlayer[0].prohibitTurn)){
	  		nextPlayer = potentialPlayer[0];
	  	}
	  	else if(playerId > 4){
	  		playerId = 0;
	  	}
	  	else{
  			playerId++;
	  	}
	}

	return nextPlayer;
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
    var cards;
    var prohibitTurn;

    /**
    * Player Construtor
    * @param {String} name - name of the player
    * @param {Character} character - the Character the player will be
    **/
    var player = function (name, character) {
        this.name = name;
        this.character = character;
        this.cards = [];
        this.prohibitTurn = false;

        if(character == 'MissScarlet'){
        	this.id = 0;
        	this.location = 'Hall_Lounge';
        }
        else if(character == 'ColonelMustard'){
        	this.id = 1;
        	this.location = 'Lounge_DiningRoom';
        }
        else if(character == 'MrsWhite'){
        	this.id = 2;
        	this.location = 'Ballroom_Kitchen';
        }
        else if(character == 'MrGreen'){
        	this.id = 3;
        	this.location = 'Conservatory_Ballroom';
        }
        else if(character == 'MrsPeacock'){
        	this.id = 4;
        	this.location = 'Library_Conservatory';
        }
        else if(character == 'ProfessorPlum'){
        	this.id = 5;
        	this.location = 'Study_Library';
        }
    };

    return player;
})();