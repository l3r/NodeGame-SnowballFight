
/**
File:
	AbstractGameController
Created By:
	Mario Gonzalez
Project	:
	Ogilvy Holiday Card 2010
Abstract:
	This is the most basic version of the GameController.
	It keeps track of the gameclock, and tells its objects to update
	It is subclassed by ServerGameController and ClientGameController.
Basic Usage: 
	 See subclasses
*/

var init = function( Vector, Rectangle, SortedLookupTable, FieldController, GameEntityFactory, GameEntity, Character, ClientControlledCharacter)
{
	return new JS.Class(
	{
		include: JS.StackTrace,
		
		initialize: function(config)
		{
			this.config = config;

			// our game takes place in a field
			this.fieldController = new FieldController( this );
			this.fieldController.tick();

			// This is the Factory that will create all the entities for us
			this.entityFactory = new GameEntityFactory(this.fieldController);

			// intervalFramerate, is used to determin how often to call settimeout - we can set to lower numbers for slower computers
			// this.targetDelta, Milliseconds between frames 16ms means 60FPS - it's the framerate the game is designed against
			this.intervalFramerate = 60; // Try to call our tick function this often
			this.targetDelta = Math.floor( 1000/this.intervalFramerate );

			// Loop
			this.clockActualTime = new Date().getTime();
			this.clockGame = 0;									// Our game clock is relative
			
			var that = this; // Temporarily got rid of bind (had some bug with it), feel free to add back in -
			this.gameTick = setInterval(function(){that.tick()}, this.targetDelta);
		},
		
		/**
		 * Tick tock, the clock is running! Make everyone do stuff.
		 */
		tick: function()
		{
			// Store the previous clockTime, then set it to whatever it is no, and compare time
			var oldTime = this.clockActualTime;
			var now = this.clockActualTime = new Date().getTime();
			var delta = ( now - oldTime );			// Note (var framerate = 1000/delta);

			// Our clock is zero based, so if for example it says 10,000 - that means the game started 10 seconds ago 
			this.clockGame += delta;
			
			// Framerate independent motion
			// Any movement should take this value into account,
			// otherwise faster machines which can update themselves more accurately will have an advantage
			var speedFactor = delta / ( this.targetDelta );
			if (speedFactor <= 0) speedFactor = 1;

			this.fieldController.tick(speedFactor);
		},
		
		/**
		* Adding and removing players
		*/
		addClient: function( aClientID, nickName )
		{

		},
		
		setNickNameForClientID: function(aNickName, aClientID) 
		{
			this.log( '(AbstractGame) setting client nickname to: ' + aNickName + ' for clientID: ' + aClientID );
			this.fieldController.players.objectForKey(aClientID).setNickName(aNickName);
		},


		shouldAddPlayer: function (anObjectID, aClientID, playerType)
		{
			var aNewCharacter = this.entityFactory.createCharacter(anObjectID, aClientID, playerType, this.fieldController);
			this.fieldController.addPlayer( aNewCharacter );
			return aNewCharacter;
		},
		
		/**
		 * Events from other players
		 */
		onPlayerMoved: function(data)
		{
			var targetCharacter = this.players.get(data.id);
			
			if(targetCharacter == null) 
			{
//				console.log('(AbstractGameController#onPlayerMoved) - targetPlayer not found! Ignoring...\nMessageData:', (sys) ? sys.inspect(data) : data );
				return;
			}
			
//			targetCharacter.serverPosition.x = data.x;
//			targetCharacter.serverPosition.y = data.y;
//
//			if (Math.abs(targetCharacter.position.x - data.x) > 0.01 || Math.abs(targetCharacter.position.y - targetCharacter.serverPosition.y) > 0.01)
//			{
//				var difference = new Vector(targetCharacter.serverPosition.x-targetCharacter.position.x, targetCharacter.serverPosition.y-targetCharacter.position.y);
//				difference.mul(0.1);
//
//				targetCharacter.position.add(difference);
//			}

			targetCharacter.velocity.x = data.vx;
			targetCharacter.velocity.y = data.vy;
		}
	});
};

if (typeof window === 'undefined') 
{
	require('../lib/Vector.js');
	require('../lib/Rectangle.js');
	require('../lib/SortedLookupTable.js');
	require('./FieldController.js');
	require('../factories/GameEntityFactory');
	require('./entities/GameEntity');
	require('./entities/Character');
	require('./entities/ClientControlledCharacter');
	require('../lib/jsclass/core.js');
	var sys = require("sys");
	AbstractGame = init( Vector, Rectangle, SortedLookupTable, FieldController, GameEntityFactory, GameEntity, Character, ClientControlledCharacter);
}
else 
{
	define(['lib/Vector',
		'lib/Rectangle',
		'lib/SortedLookupTable',
		'controllers/FieldController',
		'factories/GameEntityFactory',
		'controllers/entities/GameEntity',
		'controllers/entities/Character',
		'controllers/entities/ClientControlledCharacter',
		'lib/jsclass/core'], init);
}