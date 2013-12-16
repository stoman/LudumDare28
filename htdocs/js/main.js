/*jslint browser: true*/
/*global  $, console, PIXI, requestAnimFrame*/

// global variables
var canvas;
var renderer;
var stage;
var game;

// user input
var keysPressed = [];
var mouseDown = false;

// preloader
$(document).ready(
        function() {
            // load assets
            var loader = new PIXI.AssetLoader([
            	// images
                'img/pixi.js.png',
                
            	// sprites
                'img/sprites.json',
                
                // tileset
                'levels/tileset.json'
            ]);
            loader.addEventListener('onComplete', function(event) {
                // finished -> start game
                var time = 200;
                $('#loading').fadeOut(time, function() {
                    $('#game-canvas').fadeIn(time);
                    playBackgroundMusic();
                    setup();
                    initialize();
                });
            });
            
            // loading progress
            var loadCount = 0;
            loader.addEventListener('onProgress', function(event) {
                $('#loading p').html(
                        Math.round(100 * ++loadCount / loader.assetURLs.length)
                                + '%');
            });
            
            // start loading
            loader.load();
            $('#js-error').hide();
            $('#loading').show();
        });

function setup() {
    // setup renderer and stage
    canvas = $('#game-canvas');
    renderer = new PIXI.autoDetectRenderer(canvas.width(), canvas.height(),
            canvas[0]);
    
    // handle keyboard input
    document.onkeydown = function(event) {
        keysPressed.push(event.keyCode);
        return true;
    };
    document.onkeyup = function(event) {
        while (-1 < keysPressed.indexOf(event.keyCode)) {
            keysPressed.splice(keysPressed.indexOf(event.keyCode), 1);
        }
        return true;
    };
    
    // handle mouse input
    canvas[0].onmousedown = function() {
        mouseDown = true;
    };
    canvas[0].onmouseup = function() {
        mouseDown = false;
    };
}

/**
 * This function runs the game. It creates the renderer, the stage, the sprites
 * and so on.
 */
function initialize() {
    // game data
    game = {
    	activeKey: undefined,
    	level: [],
    	player: {
    		sprite: undefined,
    		position: undefined,
    		positionTile: undefined,
    		speed: 1,
    		movingDirection: undefined,
    		inputDirection: undefined
    	},
        speed: 1,
        sprites: []
    };

	// load player    
    var playerFrames = [
    	'player.png',
    	'player_1l.png',
    	'player_2l.png',
    	'player_1l.png',
    	'player.png',
    	'player_1r.png',
    	'player_2r.png',
    	'player_1r.png'
    ];
    var playerTextures = [];
    for(var i = 0; i < playerFrames.length; i++) {
		playerTextures.push(PIXI.Texture.fromFrame(playerFrames[i]));
    }
    game.player.sprite = new PIXI.MovieClip(playerTextures);
    game.player.sprite.anchor.x = 0.5;
    game.player.sprite.anchor.y = 0.5;
    game.player.sprite.animationSpeed = 0;
    game.player.sprite.gotoAndPlay(0);
    game.sprites.push(game.player);

    // load level
    loadLevel('level1');
}

/**
 * This function is called in every tick of the game, usually 30 times per
 * second. All position updates and so on go here.
 */
function animate() {
	// read user input
	game.player.inputDirection = undefined;
	if(-1 < keysPressed.indexOf(38)) {
		game.player.inputDirection = 'north';	
	}
	if(-1 < keysPressed.indexOf(39)) {
		game.player.inputDirection = 'east';	
	}
	if(-1 < keysPressed.indexOf(40)) {
		game.player.inputDirection = 'south';	
	}
	if(-1 < keysPressed.indexOf(37)) {
		game.player.inputDirection = 'west';	
	}
	
    
    var tileset = game.level.tilesets[0];
    // update sprites
	$.each(game.sprites, function(i, agent) {
        // move
        var max;
        switch(agent.movingDirection) {
        	case 'west':
        		max = (tileset.tilewidth/2 + agent.position.x) % tileset.tilewidth;
        		if(agent.speed * game.speed < max) {
        			agent.position.x -= agent.speed * game.speed;
        		}
        		else {
        			agent.position.x -= max;
        			agent.movingDirection = undefined;
        			if(agent === game.player) {
        				arriveOnTile(agent.positionTile.x, agent.positionTile.y);
        			}
        		}
        		break;
        		
        	case 'east':
        		max = tileset.tilewidth - ((tileset.tilewidth/2 + agent.position.x) % tileset.tilewidth);
        		if(agent.speed * game.speed < max) {
        			agent.position.x += agent.speed * game.speed;
        		}
        		else {
        			agent.position.x += max;
        			agent.movingDirection = undefined;
        			if(agent === game.player) {
        				arriveOnTile(agent.positionTile.x, agent.positionTile.y);
        			}
        		}
        		break;

        	case 'north':
        		max = (tileset.tileheight/2 + agent.position.y) % tileset.tileheight;
        		if(agent.speed * game.speed < max) {
        			agent.position.y -= agent.speed * game.speed;
        		}
        		else {
        			agent.position.y -= max;
        			agent.movingDirection = undefined;
        			if(agent === game.player) {
        				arriveOnTile(agent.positionTile.x, agent.positionTile.y);
        			}

        		}
        		break;
        		
        	case 'south':
        		max = tileset.tileheight - ((tileset.tileheight/2 + agent.position.y) % tileset.tileheight);
        		if(agent.speed * game.speed < max) {
        			agent.position.y += agent.speed * game.speed;
        		}
        		else {
        			agent.position.y += max;
        			agent.movingDirection = undefined;
        			if(agent === game.player) {
        				arriveOnTile(agent.positionTile.x, agent.positionTile.y);
        			}
        		}
        		break;
		}
		
		// start moving
		if(agent.movingDirection === undefined) {
			switch(agent.inputDirection) {
				case 'west':
					if(agent.positionTile.x > 0 && tileProperty('walkable', agent.positionTile.x-1, agent.positionTile.y) === '1') {
						agent.movingDirection = agent.inputDirection;
						agent.positionTile.x--;
						agent.position.x -= Math.min(agent.speed * game.speed, tileset.tilewidth/2);
						agent.sprite.animationSpeed = 0.1 * agent.speed * game.speed;
					}
					else {
						if(!muted) {
							sound.bump.play();	
						}
					}
					agent.sprite.rotation = -Math.PI/2;
					break;

				case 'east':
					if(agent.positionTile.x < game.level.width-1 && tileProperty('walkable', agent.positionTile.x+1, agent.positionTile.y) === '1') {
						agent.movingDirection = agent.inputDirection;
						agent.positionTile.x++;
						agent.position.x += Math.min(agent.speed * game.speed, tileset.tilewidth/2);
						agent.sprite.animationSpeed = 0.1 * agent.speed * game.speed;
					}
					else {
						if(!muted) {
							sound.bump.play();	
						}
					}
					agent.sprite.rotation = Math.PI/2;
					break;

				case 'north':
					if(agent.positionTile.y > 0 && tileProperty('walkable', agent.positionTile.x, agent.positionTile.y-1) === '1') {
						agent.movingDirection = agent.inputDirection;
						agent.positionTile.y--;
						agent.position.y -= Math.min(agent.speed * game.speed, tileset.tileheight/2);
						agent.sprite.animationSpeed = 0.1 * agent.speed * game.speed;
					}
					else {
						if(!muted) {
							sound.bump.play();	
						}
					}
					agent.sprite.rotation = 0;
					break;

				case 'south':
					if(agent.positionTile.y < game.level.height-1 && tileProperty('walkable', agent.positionTile.x, agent.positionTile.y+1) === '1') {
						agent.movingDirection = agent.inputDirection;
						agent.positionTile.y++;
						agent.position.y += Math.min(agent.speed * game.speed, tileset.tileheight/2);
						agent.sprite.animationSpeed = 0.1 * agent.speed * game.speed;
					}
					else {
						if(!muted) {
							sound.bump.play();	
						}
					}
					agent.sprite.rotation = Math.PI;
					break;
			}
		}
		
		// still not moving
		if(agent.movingDirection === undefined) {
   			agent.sprite.animationSpeed = 0;
		    game.player.sprite.gotoAndPlay(0);
		}
	});    
	
	// position all objects
	var offset = {
		x: Math.max(Math.min(0, -game.player.position.x + canvas.width()/2), canvas.width() - game.level.width * tileset.tilewidth),
		y: Math.max(Math.min(0, -game.player.position.y + canvas.height()/2), canvas.height() - game.level.height * tileset.tileheight)
	};

	// set position of tile
	for(var x = 0; x < game.level.width; x++) {
		for(var y = 0; y < game.level.height; y++) {
			game.level.sprites[x][y].position.x = offset.x + x * tileset.tilewidth;
			game.level.sprites[x][y].position.y = offset.y + y * tileset.tileheight;
		}
	}
	
	// set position of agents
	$.each(game.sprites, function(i, agent) {
		agent.sprite.position.x = offset.x + agent.position.x;
		agent.sprite.position.y = offset.y + agent.position.y;
	});
	

	
    // render
    renderer.render(stage);
    
    requestAnimFrame(animate);
}

// sound
var sound = {
    background: new Audio('audio/level1.wav'),
    bump: new Audio('audio/bump.wav'),
    pickup: new Audio('audio/pickup.wav')
};
var muted = true;

/**
 * This function initializes the background music and plays it if it is not
 * muted. Otherwise, the music is paused.
 */
function playBackgroundMusic() {
    // check for setup
    if (sound.background === undefined) {
        return;
    }
    
    // setup sound.background
    sound.background.loop = true;
    
    // play or pause
    if (muted) {
        sound.background.pause();
    }
    else {
        sound.background.play();
    }
}

/**
 * This function mutes the background music and stops the replay.
 */
function mute() {
    muted = true;
    $('#mute').html('Unmute').addClass('muted').removeClass('mute');
    playBackgroundMusic();
}

/**
 * This function unmutes the background music and restart the replay.
 */
function unmute() {
    muted = false;
    $('#mute').html('Mute').addClass('mute').removeClass('muted');
    playBackgroundMusic();
}

/**
 * This function toggles the background music and therefore mutes respectively
 * unmutes it.
 */
function toggleMute() {
    if (muted) {
        unmute();
    }
    else {
        mute();
    }
}

/**
 * This function computes the directory of the game's main html file. Prepend
 * this to paths to remove relative paths.
 * 
 * @returns the main html file's directory
 */
function getBasePath() {
    var pathname = window.location.pathname;
    var directory;
    if (pathname.indexOf('/') === -1) {
        if (pathname.indexOf('.') === -1) {
            // directory at top level
            directory = pathname + '/';
        }
        else {
            // file at top level
            directory = '/';
        }
    }
    else {
        if (pathname.lastIndexOf('.') < pathname.lastIndexOf('/')) {
            // directory at nested level
            directory = pathname
                    + (pathname.lastIndexOf('/') === pathname.length - 1 ? ''
                            : '/');
        }
        else {
            // file at nested level
            directory = pathname.substring(0, pathname.lastIndexOf('/') + 1);
        }
    }
    return window.location.origin + directory;
}

/**
 * This function loads a level from a level file and displays it.
 * @param name is the level's name without file ending
 * @param callback is a function to be called when the level is loaded
 */
function loadLevel(name, callback) {
	$.ajax({
		url: 'levels/' + name  + '.json',
		dataType: 'json',
		success: function(level) {
			stage = new PIXI.Stage(0x260b01);
			game.level = level;
			game.level.sprites = [];
			$.each(level.layers, function(i, layer) {
				$.each(layer.data, function(i, tile) {
					if(tile !== 0) {
						// find position
						var x = i % layer.width;
						var y = (i - x) / layer.width;

						// add sprite
						setLevelTile(x, y, tile);

						// find start
						if(tileProperty('start', x, y) === '1') {
							game.player.positionTile = {
								x: x,
								y: y
							};
							var tileset = game.level.tilesets[0];
							game.player.position = {
								x: (x + 0.5) * tileset.tilewidth,
								y: (y + 0.5) * tileset.tileheight
							};
							game.player.sprite.rotation = Math.PI/2;
						}
					}
				});
			});
			
			// add sprites
			$.each(game.sprites, function(i, sprite) {
				stage.addChild(sprite.sprite);
			});

			// callback
			if(callback !== undefined) {
				callback();	
			}

		    // animate
		    requestAnimFrame(animate);
		}
	});
}

/**
 * This function sets a data value for a tile of the current level.
 * @param x is the first coordinate
 * @param y is the second coordinate
 * @param tile is the new tile value
 */
function setLevelTile(x, y, tile) {
	// create array
	if(game.level.sprites[x] === undefined) {
		game.level.sprites[x] = [];
	}
	
	// set level data
	game.level.layers[0].data[x + y*game.level.layers[0].width] = tile;
	
	// load sprite
	var texture = PIXI.Texture.fromFrame('tile_'+(tile < 10 ? '0' : '')+tile+'.png');
	var sprite = new PIXI.Sprite(texture);
	
	// add sprite
	if(game.level.sprites[x][y] !== undefined) {
		// remove old sprite
		stage.addChildAt(sprite, stage.children.indexOf(game.level.sprites[x][y]));
		stage.removeChild(game.level.sprites[x][y]);
		game.level.sprites[x][y] = sprite;
	}
	else {
		stage.addChild(sprite);
	}
	game.level.sprites[x][y] = sprite;
}

/**
 * This function finds properties of a tile at given coordinates.
 * @param prop is the name of the property to look for
 * @param x is the first coordinate
 * @param y is the second coordinate
 * @returns the value of the property
 */
function tileProperty(prop, x, y) {
	// special case: walkable on key tiles
	if(prop === 'walkable' && game.activeKey !== undefined && tileProperty('key', x, y) !== undefined) {
		return '0';
	}
	
	// special case: walkable on lock tiles
	if(prop === 'walkable' && tileProperty('lock', x, y) !== undefined) {
		return game.activeKey === tileProperty('lock', x, y) ? '1' : '0';
	}
	
	// find value
	var layer = game.level.layers[0];
	var tile = layer.data[x + y*layer.width];
	var tileset = game.level.tilesets[0];
	if((tile-1) in tileset.tileproperties && prop in tileset.tileproperties[tile-1]) {
		return tileset.tileproperties[tile-1][prop];
	}
	else {
		return tileset.properties[prop];
	}
}

/**
 * This function is called on each tile the player steps on
 * @param x is the first coordinate of the new tile
 * @param y is the second coordinate of the new tile
 */
function arriveOnTile(x, y) {
	// pickup key
	if(game.activeKey === undefined) {
		if(tileProperty('key', x, y) !== undefined) {
			// pickup key
			game.activeKey = tileProperty('key', x, y);
			$('img.activeKey').attr('src', 'img/key_'+game.activeKey+'.png');
			
			// play sound
			if(!muted) {
				sound.pickup.play();	
			}
			
			// remove key from map
			setLevelTile(x, y, game.level.properties.tile_empty);
		}
	}

	// lock	
	if(tileProperty('lock', x, y) !== undefined && game.activeKey === tileProperty('lock', x, y)) {
		console.log('win');
	}
}