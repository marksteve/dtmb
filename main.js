var DEBUG = false;
var SPEED = 180;
var GRAVITY = 18;
var FLAP = 420;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 144;


WebFontConfig = {
    google: { families: [ 'Press+Start+2P::latin' ] },
    active: main
};
(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
      '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})(); 

// Load in Clay.io API
var Clay = Clay || {};
Clay.gameKey = "dtmb";
Clay.readyFunctions = [];
Clay.ready = function( fn ) {
    Clay.readyFunctions.push( fn );
};
( function() {
    var clay = document.createElement("script"); clay.async = true;
    clay.src = "http://cdn.clay.io/api.js"; 
    var tag = document.getElementsByTagName("script")[0]; tag.parentNode.insertBefore(clay, tag);
} )();

function main() {

var state = {
    preload: preload,
    create: create,
    update: update,
    render: render
};

var parent = document.querySelector('#screen');

var game = new Phaser.Game(
    0,
    0,
    Phaser.CANVAS,
    parent,
    state,
    false,
    false
);


function clayLoaded() {
    // Set up the menu items
    var options = {
        items: [
            { title: 'View High Scores', handler: showScores }
        ]
    };
    Clay.UI.Menu.init(options);
    
    leaderboard = new Clay.Leaderboard({ id: 2797 });
}
Clay.ready(clayLoaded);

function showScores() {
    if (leaderboard) {
        leaderboard.show({ best: true });
    }
}
function kikThis() {
    Clay.Kik.post( { message: 'I just scored ' + score + ' in Snappy Bird! Think you can beat my score?', title: 'Snappy Bird!' } );
}
function postScore() {
    if( postingScore ) // skip if it's already trying to post the score...
        return;
    postScoreText.setText('...');
    postingScore = true;
    
    var post = function() {
    	if(!leaderboard) return;
        leaderboard.post({ score: score }, function() {
            showScores();
            postScoreText.setText('POST\nSCORE!');
            postingScore = false;
        });
    }
    
    if (Clay.Environment.platform == 'kik') {
	    Clay.Kik.connect({}, function(response) {
	        if (response.success) {
	            Clay.Player.onUserReady( post );
	        } else {
	            postScoreText.setText('POST\nSCORE!');            
	            postingScore = false;
	        }
	    });
    } else {
    	post();
    }
    	
}
function preload() {
    var assets = {
        spritesheet: {
            birdie: ['assets/birdie.png', 24, 24],
            clouds: ['assets/clouds.png', 128, 64]
        },
        image: {
            finger: ['assets/finger.png'],
            fence: ['assets/fence.png']
        },
        audio: {
            flap: ['assets/flap.wav'],
            score: ['assets/score.wav'],
            hurt: ['assets/hurt.wav']
        }
    };
    Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(id) {
            game.load[type].apply(game.load, [id].concat(assets[type][id]));
        });
    });
}

var gameStarted,
    gameOver,
    score,
    bg,
    credits,
    clouds,
    fingers,
    invs,
    birdie,
    fence,
    scoreText,
    instText,
    gameOverText,
    kikThisText,
    kikThisClickArea,
    postScoreClickArea,
    postingScore,
    leaderboard,
    flapSnd,
    scoreSnd,
    hurtSnd,
    fingersTimer,
    cloudsTimer;

function create() {
    // Set world dimensions
    var screenWidth = parent.clientWidth > window.innerWidth ? window.innerWidth : parent.clientWidth;
    var screenHeight = parent.clientHeight > window.innerHeight ? window.innerHeight : parent.clientHeight;
    game.world.width = screenWidth;
    game.world.height = screenHeight;
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xDDEEFF, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    // Credits 'yo
    credits = game.add.text(
        game.world.width / 2,
        10,
        'marksteve.com/dtmb\n@themarksteve',
        {
            font: '8px "Press Start 2P"',
            fill: '#fff',
            align: 'center'
        }
    );
    credits.anchor.x = 0.5;
    // Add clouds group
    clouds = game.add.group();
    // Add fingers
    fingers = game.add.group();
    // Add invisible thingies
    invs = game.add.group();
    // Add birdie
    birdie = game.add.sprite(0, 0, 'birdie');
    birdie.anchor.setTo(0.5, 0.5);
    birdie.animations.add('fly', [0, 1, 2, 3], 10, true);
    birdie.inputEnabled = true;
    birdie.body.collideWorldBounds = true;
    birdie.body.gravity.y = GRAVITY;
    // Add fence
    fence = game.add.tileSprite(0, game.world.height - 32, game.world.width, 32, 'fence');
    fence.tileScale.setTo(2, 2);
    // Add score text
    scoreText = game.add.text(
        game.world.width / 2,
        game.world.height / 8,
        "",
        {
            font: '32px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 8,
            align: 'center'
        }
    );
    scoreText.anchor.setTo(0.5, 0.5);
    // Add instructions text
    instText = game.add.text(
        game.world.width / 2,
        game.world.height - game.world.height / 4,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 8,
            align: 'center'
        }
    );
    instText.anchor.setTo(0.5, 0.5);
    // Add game over text
    gameOverText = game.add.text(
        game.world.width / 2,
        game.world.height / 4,
        "",
        {
            font: '32px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 8,
            align: 'center'
        }
    );
    gameOverText.anchor.setTo(0.5, 0.5);
    //gameOverText.scale.setTo(2, 2);
    
    
    // Add kik this text (hidden until game is over)
    postScoreText = game.add.text(
        game.world.width / 4,
        game.world.height / 2,
        "",
        {
            font: '20px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 8,
            align: 'center'
        }
    );
    postScoreText.setText("POST\nSCORE!");
    postScoreText.anchor.setTo(0.5, 0.5);
    postScoreText.renderable = false;
    //postScoreText.scale.setTo(2, 2);
    // So we can have clickable text... we check if the mousedown/touch event is within this rectangle inside flap()
    postScoreClickArea = new Phaser.Rectangle(postScoreText.x - postScoreText.width / 2, postScoreText.y - postScoreText.height / 2, postScoreText.width, postScoreText.height);
    
    // Add kik this text (hidden until game is over)
    kikThisText = game.add.text(
        3 * game.world.width / 4,
        game.world.height / 2,
        "",
        {
            font: '20px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 8,
            align: 'center'
        }
    );
    kikThisText.setText("KIK\nTHIS!");
    kikThisText.anchor.setTo(0.5, 0.5);
    kikThisText.renderable = false;
    //kikThisText.scale.setTo(2, 2);
    // So we can have clickable text... we check if the mousedown/touch event is within this rectangle inside flap()
    kikThisClickArea = new Phaser.Rectangle(kikThisText.x - kikThisText.width / 2, kikThisText.y - kikThisText.height / 2, kikThisText.width, kikThisText.height);
    
    
    // Add sounds
    flapSnd = game.add.audio('flap');
    scoreSnd = game.add.audio('score');
    hurtSnd = game.add.audio('hurt');
    // Add controls
    game.input.onDown.add(flap);
    // Start clouds timer
    cloudsTimer = new Phaser.Timer(game);
    cloudsTimer.onEvent.add(spawnCloud);
    cloudsTimer.start();
    cloudsTimer.add(Math.random());
    // RESET!
    reset();
}

function reset() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    credits.renderable = true;
    scoreText.setText("SNAPPY\nBIRD");
    instText.setText("TOUCH TO FLAP\nBIRDIE WINGS");
    gameOverText.renderable = false;
    postScoreText.renderable = false;
    kikThisText.renderable = false;
    birdie.body.allowGravity = false;
    birdie.angle = 0;
    birdie.reset(game.world.width / 4, game.world.height / 2);
    birdie.scale.setTo(2, 2);
    birdie.animations.play('fly');
    fingers.removeAll();
    invs.removeAll();
}

function start() {
    credits.renderable = false;
    birdie.body.allowGravity = true;
    // SPAWN FINGERS!
    fingersTimer = new Phaser.Timer(game);
    fingersTimer.onEvent.add(spawnFingers);
    fingersTimer.start();
    fingersTimer.add(2);
    // Show score
    scoreText.setText(score);
    instText.renderable = false;
    // START!
    gameStarted = true;
}

function flap() {
    if (!gameStarted) {
        start();
    }
    if (!gameOver) {
        birdie.body.velocity.y = -FLAP;
        flapSnd.play();
    } else {
        // Check if the touch event is within our text for posting a score
        if (postScoreClickArea && Phaser.Rectangle.contains(postScoreClickArea, game.input.x, game.input.y)) {
            postScore();
        }
        // Check if the touch event is within our text for sending a kik message
        else if (Clay.Environment.platform == 'kik' && kikThisClickArea && Phaser.Rectangle.contains(kikThisClickArea, game.input.x, game.input.y)) {
            kikThis();
        }
    }
}

function spawnCloud() {
    cloudsTimer.stop();

    var cloudY = Math.random() * game.height / 2;
    var cloud = clouds.create(
        game.width,
        cloudY,
        'clouds',
        Math.floor(4 * Math.random())
    );
    var cloudScale = 2 + 2 * Math.random();
    cloud.alpha = 2 / cloudScale;
    cloud.scale.setTo(cloudScale, cloudScale);
    cloud.body.allowGravity = false;
    cloud.body.velocity.x = -SPEED / cloudScale;
    cloud.anchor.y = 0;

    cloudsTimer.start();
    cloudsTimer.add(4 * Math.random());
}

function o() {
    return OPENING + 60 * ((score > 50 ? 50 : 50 - score) / 50);
}

function spawnFinger(fingerY, flipped) {
    var finger = fingers.create(
        game.width,
        fingerY + (flipped ? -o() : o()) / 2,
        'finger'
    );
    finger.body.allowGravity = false;

    // Flip finger! *GASP*
    finger.scale.setTo(2, flipped ? -2 : 2);
    finger.body.offset.y = flipped ? -finger.body.height * 2 : 0;

    // Move to the left
    finger.body.velocity.x = -SPEED;

    return finger;
}

function spawnFingers() {
    fingersTimer.stop();

    var fingerY = ((game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
    // Bottom finger
    var botFinger = spawnFinger(fingerY);
    // Top finger (flipped)
    var topFinger = spawnFinger(fingerY, true);

    // Add invisible thingy
    var inv = invs.create(topFinger.x + topFinger.width, 0);
    inv.width = 2;
    inv.height = game.world.height;
    inv.body.allowGravity = false;
    inv.body.velocity.x = -SPEED;

    fingersTimer.start();
    fingersTimer.add(1 / SPAWN_RATE);
}

function addScore(_, inv) {
    invs.remove(inv);
    score += 1;
    scoreText.setText(score);
    scoreSnd.play();
}

function setGameOver() {
    gameOver = true;
    instText.setText("TOUCH BIRDIE\nTO TRY AGAIN");
    instText.renderable = true;
    var hiscore = window.localStorage.getItem('hiscore');
    hiscore = hiscore ? hiscore : score;
    hiscore = score > parseInt(hiscore, 10) ? score : hiscore;
    window.localStorage.setItem('hiscore', hiscore);
    // removed GAMEOVER\n\n
    gameOverText.setText("HISCORE\n" + hiscore);
    gameOverText.renderable = true;
    
    postScoreText.renderable = true;
    if (Clay.Environment.platform == 'kik') {
        kikThisText.renderable = true;
    }
    
    // Stop all fingers
    fingers.forEachAlive(function(finger) {
        finger.body.velocity.x = 0;
    });
    invs.forEach(function(inv) {
        inv.body.velocity.x = 0;
    });
    // Stop spawning fingers
    fingersTimer.stop();
    // Make birdie reset the game
    birdie.events.onInputDown.addOnce(reset);
    hurtSnd.play();
}

function update() {
    if (gameStarted) {
        // Make birdie dive
        var dvy = FLAP + birdie.body.velocity.y;
        birdie.angle = (90 * dvy / FLAP) - 180;
        if (birdie.angle < -30) {
            birdie.angle = -30;
        }
        if (
            gameOver ||
            birdie.angle > 90 ||
            birdie.angle < -90
        ) {
            birdie.angle = 90;
            birdie.animations.stop();
            birdie.frame = 3;
        } else {
            birdie.animations.play('fly');
        }
        // Birdie is DEAD!
        if (gameOver) {
            if (birdie.scale.x < 4) {
                birdie.scale.setTo(
                    birdie.scale.x * 1.2,
                    birdie.scale.y * 1.2
                );
            }
            // Shake game over text
            gameOverText.angle = Math.random() * 5 * Math.cos(game.time.now / 100);
        } else {
            // Check game over
            game.physics.overlap(birdie, fingers, setGameOver);
            if (!gameOver && birdie.body.bottom >= game.world.bounds.bottom) {
                setGameOver();
            }
            // Add score
            game.physics.overlap(birdie, invs, addScore);
        }
        // Remove offscreen fingers
        fingers.forEachAlive(function(finger) {
            if (finger.x + finger.width < game.world.bounds.left) {
                finger.kill();
            }
        });
        // Update finger timer
        fingersTimer.update();
    } else {
        birdie.y = (game.world.height / 2) + 8 * Math.cos(game.time.now / 200);
    }
    if (!gameStarted || gameOver) {
        // Shake instructions text
        instText.scale.setTo(
            1 + 0.1 * Math.sin(game.time.now / 100),
            1 + 0.1 * Math.cos(game.time.now / 100)
        );
    }
    // Shake score text
    scoreText.scale.setTo(
        1 + 0.1 * Math.cos(game.time.now / 100),
        1 + 0.1 * Math.sin(game.time.now / 100)
    );
    // Update clouds timer
    cloudsTimer.update();
    // Remove offscreen clouds
    clouds.forEachAlive(function(cloud) {
        if (cloud.x + cloud.width < game.world.bounds.left) {
            cloud.kill();
        }
    });
    // Scroll fence
    if (!gameOver) {
        fence.tilePosition.x -= game.time.physicsElapsed * SPEED / 2;
    }
}

function render() {
    if (DEBUG) {
        game.debug.renderSpriteBody(birdie);
        fingers.forEachAlive(function(finger) {
            game.debug.renderSpriteBody(finger);
        });
        invs.forEach(function(inv) {
            game.debug.renderSpriteBody(inv);
        });
    }
}

};
