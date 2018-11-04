var DEBUG = false;
var SPEED = 180;
var GRAVITY = 18;
var FLAP = 420;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 144;

function init(parent) {

var state = {
    preload: preload,
    create: create,
    update: update,
    render: render
};

var game = new Phaser.Game(
    480,
    700,
    Phaser.CANVAS,
    parent,
    state,
    false,
    false
);

function preload() {
    var assets = {
        spritesheet: {
            axe: ['assets/axe.png', 48, 24],
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
    clouds,
    fingers,
    invs,
    axe,
    fence,
    scoreText,
    instText,
    gameOverText,
    flapSnd,
    scoreSnd,
    hurtSnd,
    fingersTimer,
    cloudsTimer,
	cobraMode = 0,
    gameOvers = 0;

function create() {
    game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
    game.stage.scale.setScreenSize(true);
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xDDEEFF, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    // Add clouds group
    clouds = game.add.group();
    // Add fingers
    fingers = game.add.group();
    // Add invisible thingies
    invs = game.add.group();
    // Add axe
    axe = game.add.sprite(0, 0, 'axe');
    axe.anchor.setTo(0.5, 0.5);
    axe.animations.add('fly', [0, 1, 2, 3], 10, true);
    axe.inputEnabled = true;
    axe.body.collideWorldBounds = true;
    axe.body.gravity.y = GRAVITY;
    // Add fence
    fence = game.add.tileSprite(0, game.world.height - 32, game.world.width, 32, 'fence');
    fence.tileScale.setTo(2, 2);
    // Add score text
    scoreText = game.add.text(
        game.world.width / 2,
        game.world.height / 4,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 4,
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
            font: '8px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 4,
            align: 'center'
        }
    );
    instText.anchor.setTo(0.5, 0.5);
    // Add game over text
    gameOverText = game.add.text(
        game.world.width / 2,
        game.world.height / 2,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 4,
            align: 'center'
        }
    );
    gameOverText.anchor.setTo(0.5, 0.5);
    gameOverText.scale.setTo(2, 2);
    // Add sounds
    flapSnd = game.add.audio('flap');
    scoreSnd = game.add.audio('score');
    hurtSnd = game.add.audio('hurt');
    // Add controls
    game.input.onDown.add(flap);
    game.input.keyboard.addCallbacks(game, onKeyDown, onKeyUp);
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
    scoreText.setText("FLAPPY AXE");
    instText.setText("PRESS SPACE OR RIGHT MOUSE BUTTON\nTO START THE GAME");
    gameOverText.renderable = false;
    axe.body.allowGravity = false;
    axe.angle = 0;
    axe.reset(game.world.width / 4, game.world.height / 2);
    axe.scale.setTo(2, 2);
    axe.animations.play('fly');
    fingers.removeAll();
    invs.removeAll();
}

function start() {
    axe.body.allowGravity = true;
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
        axe.body.velocity.y = -FLAP;
        flapSnd.play();
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
    instText.setText("TOUCH THE AXE\nTO TRY AGAIN");
    instText.renderable = true;
    var hiscore = window.localStorage.getItem('hiscore');
    hiscore = hiscore ? hiscore : score;
    hiscore = score > parseInt(hiscore, 10) ? score : hiscore;
    window.localStorage.setItem('hiscore', hiscore);
    gameOverText.setText("GAME OVER");
    gameOverText.renderable = true;
    // Stop all fingers
    fingers.forEachAlive(function(finger) {
        finger.body.velocity.x = 0;
    });
    invs.forEach(function(inv) {
        inv.body.velocity.x = 0;
    });
    // Stop spawning fingers
    fingersTimer.stop();
    // Make axe reset the game
    axe.events.onInputDown.addOnce(reset);
    hurtSnd.play();
    gameOvers++;
}

function update() {
    if (gameStarted) {
        if (gameOver) {
            if (axe.scale.x < 4) {
                axe.scale.setTo(
                    axe.scale.x * 1.2,
                    axe.scale.y * 1.2
                );
            }
        } else {
            // Check game over
            if (cobraMode < 1) {
                game.physics.overlap(axe, fingers, setGameOver);
                if (!gameOver && axe.body.bottom >= game.world.bounds.bottom) {
                    setGameOver();
                }
            }
            // Add score
            game.physics.overlap(axe, invs, addScore);
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
        axe.y = (game.world.height / 2) + 8 * Math.cos(game.time.now / 200);
    }
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
        game.debug.renderSpriteBody(axe);
        fingers.forEachAlive(function(finger) {
            game.debug.renderSpriteBody(finger);
        });
        invs.forEach(function(inv) {
            game.debug.renderSpriteBody(inv);
        });
    }
}

function onKeyDown(e) { }

function onKeyUp(e) {
    if (Phaser.Keyboard.SPACEBAR == e.keyCode) {
        flap();
    }
}

};
