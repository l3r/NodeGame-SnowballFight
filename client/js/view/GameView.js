/**
File:
	GameView.js
Created By:
	Mario Gonzalez
Project	:
	Ogilvy Holiday Card 2010
Abstract:
	This is class represents the View in the MVC architecture for the game.
	It must not OWN any data, not even a little :) 
	It is allowed to HOLD data transiently 
	
Basic Usage: 
	this.view = new ClientGameView(this);
	this.view.showJoinGame();
*/
define( ['lib/Rectangle', 'managers/OverlayManager', 'factories/HTMLFactory', 'lib/jsclass/core'], function(Rectangle, OverlayManager, HTMLFactory )
{
	return new JS.Class(
	{
		initialize: function( controller, gameModel )
		{
			this.gameController = controller;
			this.overlayManager = new OverlayManager( controller, gameModel );
			this.showNav();
		},

		showNav: function()
		{
	      HTMLFactory.navigation()
			.appendTo("body");
		},

		showJoinGame: function()
		{
			var that = this,
				$joinGameDialog = HTMLFactory.joinGameDialog();

			$joinGameDialog
				.find("form")
				.submit( function(e) { return that.joinGame(e); } );
			
			this.overlayManager.show( $joinGameDialog );
		},
	
		serverOffline: function()
		{
			var $unavailableEle = HTMLFactory.serverUnavailableDialog();
			this.overlayManager.show( $unavailableEle );
		},
	
		joinGame: function(e)
		{	
			var nickName = $("#nickname").val();
			
			if( nickName.length <= 0)
			{
				nickName = 'NoName' + Math.floor( Math.random() * 1000 );
			}

			this.gameController.joinGame(nickName);
			
			$("#join-game").remove();
			this.overlayManager.hide();
			
			return false;
		},

		destroy: function()
		{
			this.element.remove();
		}
	});
});