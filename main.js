var DEBUG = false;
var SPEED = 160;
var GRAVITY = 20;
var FLAP = 400;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 120;


(function() {

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
    state
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

var gameStarted = false,
    gameOver = false,
    bg,
    birdie,
    fingers,
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
    birdie.animations.play('fly');
    // Add fingers
    fingers = game.add.group();
    // Add controls
    game.input.onTap.add(flap);
}

function flap() {
    if (!gameStarted) {
        birdie.body.gravity.y = GRAVITY;
        gameStarted = true;
        fingersTimer = new Phaser.Timer(game);
        fingersTimer.onEvent.add(spawnFingers);
        fingersTimer.start();
        fingersTimer.add(4);
    }
    if (!gameOver) {
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

    if (flipped) {
        finger.body.velocity.y = e;
        finger.body.acceleration.y = -e;
    }  else {
        finger.body.velocity.y = -e;
        finger.body.acceleration.y = e;
    }
    finger.body.velocity.x = -SPEED;
    return finger;
}

function spawnFingers() {
    fingersTimer.stop();

    var fingerY = (game.height / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
    // Bottom finger
    spawnFinger(fingerY);
    // Top finger (flipped)
    spawnFinger(fingerY, true);

    // Make sure birdie is the star
    birdie.bringToTop();

    fingersTimer.start();
    fingersTimer.add(1 / SPAWN_RATE);
}

function setGameOver() {
    gameOver = true;
    // Stop all fingers
    fingers.forEachAlive(function(finger) {
        finger.body.velocity.x = 0;
    });
    // Stop spawning fingers
    fingersTimer.stop();
}

function update() {
    if (gameStarted) {
        // Check game over
        game.physics.overlap(birdie, fingers, setGameOver);
        if (!gameOver && birdie.body.bottom >= this.game.world.bounds.bottom) {
            // FIXME: Add a floor and check collision there
            setGameOver();
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
        // Spawn fingers!!!
        fingersTimer.update();
    }
}

function render() {
    if (DEBUG) {
        game.debug.renderSpriteBody(birdie);
        fingers.forEachAlive(function(finger) {
            game.debug.renderSpriteBody(finger);
        });
    }
}

})();
