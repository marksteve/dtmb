var DEBUG = false;
var SPEED = 160;
var GRAVITY = 20;
var FLAP = 400;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 120;


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


function main() {

var state = {
    preload: preload,
    create: create,
    update: update,
    render: render
};

var game = new Phaser.Game(
    window.innerWidth,
    window.innerHeight,
    Phaser.CANVAS,
    'screen',
    state,
    false,
    false
);

function preload() {
    var assets = {
        spritesheet: {
            birdie: ['assets/birdie.png', 23, 18]
        },
        image: {
            finger: ['assets/finger.png']
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
    birdie,
    fingers,
    scoreText,
    fingersTimer;

function create() {
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0x99FFCC, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    // Add birdie
    birdie = game.add.sprite(game.world.width / 3, game.world.height / 2, 'birdie');
    birdie.anchor.setTo(0.5, 0.5);
    birdie.scale.setTo(2, 2);
    birdie.body.collideWorldBounds = true;
    birdie.animations.add('fly', [0, 1, 2, 3, 2, 1], 30, true);
    // Add fingers
    fingers = game.add.group();
    // Add invisible thingies
    invs = game.add.group();
    // Add score text
    scoreText = game.add.text(
        game.world.width / 2,
        64,
        "",
        {
            font: '8px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 3,
            align: 'center'
        }
    );
    scoreText.anchor.setTo(0.5, 0.5);
    // Add controls
    game.input.onDown.add(onDown);
    // RESET!
    reset();
}

function reset() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    scoreText.setText("DON'T TOUCH\nMY BIRDIE\n\nTAP TO START");
    birdie.reset(game.world.width / 3, game.world.height / 2);
    birdie.animations.play('fly');
    birdie.angle = 0;
    birdie.body.gravity.y = 0;
    fingers.removeAll();
    invs.removeAll();
}

function onDown() {
    if (!gameStarted) {
        birdie.body.gravity.y = GRAVITY;
        // SPAWN FINGERS!
        fingersTimer = new Phaser.Timer(game);
        fingersTimer.onEvent.add(spawnFingers);
        fingersTimer.start();
        fingersTimer.add(4);
        // Show score
        scoreText.setText(score);
        // START!
        gameStarted = true;
    }
    if (gameOver) {
        reset();
    } else {
        birdie.body.velocity.y = -FLAP;
    }
}

function spawnFinger(fingerY, flipped) {
    var e = 40;
    var o = OPENING + e;
    var finger = fingers.create(
        game.width - 1,
        fingerY + (flipped ? -o : o) / 2,
        'finger'
    );
    finger.allowGravity = false;
    finger.outOfBoundsKill = true;

    // Flip finger! *GASP*
    finger.scale.setTo(2, flipped ? -2 : 2);
    finger.body.offset.y = flipped ? -finger.body.height * 2 : 0;

    // Creepy action
    if (flipped) {
        finger.body.velocity.y = e;
        finger.body.acceleration.y = -e;
    }  else {
        finger.body.velocity.y = -e;
        finger.body.acceleration.y = e;
    }

    // Move to the left
    finger.body.velocity.x = -SPEED;

    return finger;
}

function spawnFingers() {
    fingersTimer.stop();

    var fingerY = (game.height / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
    // Bottom finger
    var botFinger = spawnFinger(fingerY);
    // Top finger (flipped)
    var topFinger = spawnFinger(fingerY, true);

    // Add invisible thingy
    var inv = invs.create(
        topFinger.x + topFinger.width,
        fingerY - OPENING / 2
    );
    inv.allowGravity = false;
    inv.width = 2;
    inv.height = OPENING;
    inv.body.velocity.x = -SPEED;

    // Make sure birdie is the star
    birdie.bringToTop();

    fingersTimer.start();
    fingersTimer.add(1 / SPAWN_RATE);
}

function addScore(_, inv) {
    inv.kill();
    score += 1;
    scoreText.setText(score);
}

function setGameOver() {
    gameOver = true;
    scoreText.setText('GAME OVER\nSCORE ' + score + '\n\nTAP TO TRY AGAIN');
    // Stop all fingers
    fingers.forEachAlive(function(finger) {
        finger.body.velocity.x = 0;
    });
    invs.forEachAlive(function(inv) {
        inv.body.velocity.x = 0;
    });
    // Stop spawning fingers
    fingersTimer.stop();
}

function update() {
    if (gameStarted) {
        if (!gameOver) {
            // Check game over
            game.physics.overlap(birdie, fingers, setGameOver);
            if (!gameOver && birdie.body.bottom >= game.world.bounds.bottom) {
                // FIXME: Add a floor and check collision there
                setGameOver();
            }
            // Add score
            game.physics.overlap(birdie, invs, addScore);
        }
        // Make birdie dive
        var dvy = FLAP + birdie.body.velocity.y;
        birdie.angle = (215 * dvy / 4 / FLAP) - 45;
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
        // Manually kill invisible thingies
        invs.forEachAlive(function(inv) {
            if (inv.x < game.world.bounds.left) {
                inv.kill();
            }
        });
        // Update timer
        fingersTimer.update();
    }
    // Share score text
    scoreText.scale.setTo(
        2 + 0.1 * Math.cos(game.time.now / 10),
        2 + 0.1 * Math.sin(game.time.now / 10)
    );
}

function render() {
    if (DEBUG) {
        game.debug.renderSpriteBody(birdie);
        fingers.forEachAlive(function(finger) {
            game.debug.renderSpriteBody(finger);
        });
        invs.forEachAlive(function(inv) {
            game.debug.renderSpriteBody(inv);
        });
    }
}

};
