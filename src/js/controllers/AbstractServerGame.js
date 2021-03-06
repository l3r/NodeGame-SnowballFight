/**
File:
	SnowGame.js
Created By:
	Mario Gonzalez
Project:
	Ogilvy Holiday Card 2010
Abstract:
	This is the GameController that is specific to OgilvyHolidayGame 2010
Basic Usage:
	var gameController = new ServerGameController({
	    'port': Math.abs(ArgHelper.getArgumentByNameOrSetDefault('port', 28785)),
	    'status': false,
	    'recordFile': './../record[date].js',
	    'record': false,
	    'server': null
	});
	gameController.run();

Version:
	1.0
*/



define([
		'lib/jsclass-core',
		'events',
		'controllers/AbstractGame',
		'lib/Joystick',
		'factories/GameEntityFactory',
		'model/FieldEntityModel',
		'network/ServerNetChannel',
		'model/WorldEntityDescription',
		'lib/Logger'
	],

	function( JS, EVENTS, AbstractGame, Joystick, GameEntityFactory, FieldEntityModel, ServerNetChannel, WorldEntityDescription, Logger )
	{
		return new JS.Class(AbstractGame, {
			initialize: function(config, portNumber)
			{
				this.callSuper();

				this.eventEmitter = new EVENTS.EventEmitter();

				this.nextEntityID = 1; 	// Each time we create an entity we increment this
				this.gameID = this.config.SERVER_SETTING.NEXT_GAME_ID;

				this.portNumber = portNumber;
				this.fieldController.createPackedCircleManager();

				// Each ServerNetChannel is owned by a single ServerGameInstance
				this.netChannel = new ServerNetChannel(this, this.config, portNumber);

				this.logger = new Logger({time: this.gameClock, showStatus: false }, this);

				this.isDeallocated = false;
				this.startGameClock();
			},

			// the Server has access to all the games and our logger
			// amongst other things that the entire server would need, it also requests
			// the server for the next available game port when the game ends.
			setServer: function( aServer )
			{
				this.server = aServer;
			},
			/**
			 * Main loop
			 * Calls super.tick()
			 * Creates a WorldEntityDescription which it sends to NetChannel
			 */
			tick: function()
			{
				this.callSuper();

				this.fieldController.packedCircleManager.forceCirclesToMatchViewPositions();
				this.fieldController.packedCircleManager.handleCollisions();

				// Create a new world-entity-description, could be some room for optimization here but it only happens once per game loop anyway
				var worldEntityDescription = new WorldEntityDescription( this );

				this.netChannel.tick( this.gameClock, worldEntityDescription );

				this.logger.tick();

				if( this.gameClock > this.model.gameDuration)
				{
					this.shouldEndGame();
				}
			},

			/**
			 * A generic client command has been received.
			 * @param clientID
			 * @param aDecodedMessage
			 */
			onGenericCommand: function(clientID, aDecodedMessage)
			{
				this.CMD_TO_FUNCTION[aDecodedMessage.cmds.cmd].apply(this, [aDecodedMessage]);
			},

			/**
			 * A client has sent input inside of a message.
			 * Grab the cmdData from the message, and the player via cmdData.objectID
			 * Send the input bitmask to the playerEntity
			 * @param clientID
			 * @param aDecodedMessage
			 */
			onPlayerMoveCommand: function(clientID, aDecodedMessage)
			{
				if(!this.isGameActive()) {
					console.log("(AbstractServerGame)::onPlayerMoveCommand - Ignoring move CMD, game is over (" + this.gameClock - this.model.gameDuration + ")ms old. Sent from clientID: " + clientID);
					return;
				} else if(!this.fieldController.allEntities) { // Should not occur! debug
	//				debugger;
					return;
				}

				var cmdData = aDecodedMessage.cmds.data;
				var playerEntity = this.fieldController.allEntities.objectForKey(cmdData.objectID);

				var ping = this.gameClock - aDecodedMessage.t;
				if(ping < 10) ping = 10;
				playerEntity.stats.ping = ping;
				playerEntity.input.deconstructInputBitmask( cmdData.input );
			},

			/**
			 * Called when the gameClock has passed model.gameDuration
			 */
			shouldEndGame: function()
			{
				var nextGamePort = this.server.getNextAvailablePort();

				this.gameOver = true;
				this.stopGameClock();

				console.log("(AbstractServerGame) ENDING THE GAME!");
				// Create a message to send to all clients
				var endGameMessage = {
					seq: 1,
					gameClock: this.gameClock,
					cmds: {
						cmd: this.config.CMDS.SERVER_END_GAME,
						data: {
							nextGamePort: nextGamePort,
							stats: this.fieldController.getPlayerStats()
						}
					}
				};

				this.netChannel.broadcastMessage(endGameMessage);
				this.dealloc();
			},

			dealloc: function()
			{
				this.isDeallocated = true;

				this.netChannel.dealloc();
				this.fieldController.dealloc();

				// Tell the world!
				this.eventEmitter.emit(this.config.EVENTS.ON_GAME_ENDED, this);
			},

			/**
			 * Calls super.shouldAddPlayer to create the character and attaches a Joystick to it
			 * @param anEntityID	An Entity ID for this Character, we created this right before this was called
			 * @param aClientID		Connection ID of the client
			 * @param aCharacterModel 	A character model
			 */
			shouldAddPlayer: function (anEntityID, aClientID, aCharacterModel)
			{
				var aNewCharacter = this.callSuper();
				if(aNewCharacter == null) return; // No charactnode node mainer created for whatever reason. Room full?

				aNewCharacter.setInput( new Joystick( this.config ) );

				return aNewCharacter;
			},

			/**
			 * Remove a player from the game via their ConnectionID
			 * @param connectionID
			 */
			removePlayer: function (connectionID)
			{
				this.fieldController.removePlayer( connectionID );
			},

			/**
			 * Start the netChannel and start the game.
			 */
			start: function()
			{
				this.netChannel.start();
			},

			log: function(aMessage)
			{
				if(this.logger.options.showStatus)
					this.logger.log(aMessage);
				else
					console.log(aMessage);
			},

			/**
			 * Internal game events
			 */
			/**
			 * Accessors
			 */
			getNextEntityID: function()
			{
				return this.nextEntityID++;
			},

			canAddPlayer: function()
			{
				var gameClockLessThanDuration = ( (this.gameClock + this.config.GAME_MODEL.ROUND_INTERMISSION_DURATION) < this.model.gameDuration);
				var netChannelCanAcceptConnection = this.netChannel.canAddConnection();

				var gameCanAddPlayer = netChannelCanAcceptConnection && gameClockLessThanDuration;

				console.log("(AbsractServerGame)::canAddPlayer - GameID '"+ this.portNumber +" canAdd= " + gameCanAddPlayer + "  [netchannel has " + this.netChannel.clients.count() + " connections.  GameClock: " + (this.gameClock+this.config.GAME_MODEL.ROUND_INTERMISSION_DURATION) + " GameDuration: " + this.model.gameDuration + "]");
				return gameCanAddPlayer;
			}
		});
	}
);
