/**
 File:
 	WorldEntityDescription.js
 Created By:
 	Mario Gonzalez
 Project:
 	Ogilvy Holiday Card 2010
 Abstract:
	A world entity description is a full description of the current world state.

 	ServerGame creates this
 		-> NetChannel passes it to each Client
 			-> Each client does 'delta compression' (removes unchanged stuff)
 				-> If ready, each client sends the customized WorldEntityDescription to it's connection
 Basic Usage:
 // TODO: FILL OUT
 */
require('js/lib/jsclass/core.js');
require('js/lib/SortedLookupTable.js');
require('js/controllers/entities/GameEntity');
require('controllers/ServerGame');

var init = function()
{
	return new JS.Class(
	{
		initialize: function( aGameInstance )
		{
			var fieldController = aGameInstance.fieldController;
			this.entities = new SortedLookupTable();
			this.gameClock = aGameInstance.gameClock;
			this.gameTick = aGameInstance.gameTick;
			
			// Construct players
			fieldController.allEntities.forEach( function(key, entity)
			{
				this.entities.setObjectForKey( entity.constructEntityDescription(), entity.objectID );
			}, this );
		}
	});
};

// Export
WorldEntityDescription = init();


