/**
 * Class to handle Player functionality
 *
 * @module src/Player
 */

var Player = (function(nameAttr, characterAttr){
    var name;
    var character;
    var playerId = 0;

    debugger;
    
    /**
    * Player Construtor
    * @param {String} name - name of the player
    * @param {Character} character - the Character the player will be
    **/
    var player = function (nameAttr, characterAttr) {
        this.name = nameAttr;
        this.character = characterAttr;
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