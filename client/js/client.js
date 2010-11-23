/**
File:
	Client.js
Created By:
	Adam Kirschner
Project	:
	Ogilvy Holiday Card 2010
Abstract:
	This is the main class of the game on the client side.
Basic Usage:
 	See index.html // TODO: Update basic usage.
*/
//ClientGameController, config, Animal
require(['controllers/ClientGame','config', 'scratchpad/Animal'], function(ClientGame, config, Animal) {
	// Everything ready - start the game client
    require.ready(function() {

		// Testing JS.Class
		var animal = new Animal('Max');
		console.log('Animal', animal.speak("BARKING!!!") ); // Should output: Animal My name is Max and I like BARKING!!!

	   var gameController = new ClientGame(config);
    });
});