var GRAVITY = 20;
var FLAP = 380;


(function() {

var state = {
    preload: preload,
    create: create,
    update: update
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
    };
    Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(id) {
            game.load[type].apply(game.load, [id].concat(assets[type][id]));
        });
    });
}

var gameStart = false, gameOver = false, bg, birdie, cursors;

function create() {
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xFFFFFF, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    // Add birdie
    birdie = game.add.sprite(game.world.width / 3, game.world.height / 2, 'birdie');
    birdie.anchor.setTo(0.5, 0.5);
    birdie.scale.setTo(2, 2);
    birdie.body.collideWorldBounds = true;
    birdie.animations.add('fly', [0, 1, 2, 3, 2, 1], 30, true);
    birdie.animations.play('fly');
    // Add controls
    game.input.onTap.add(flap);
}

function flap() {
    if (!gameStart) {
        birdie.body.gravity.y = GRAVITY;
        gameStart = true;
    }
    if (!gameOver) {
        birdie.body.velocity.y = -FLAP;
    }
}

function update() {
    // Check game over
    gameOver = birdie.body.bottom >= this.game.world.bounds.bottom;
    // Make birdie dive
    var dvy = birdie.body.velocity.y - FLAP;
    dvy = dvy < 0 ? 0 : dvy;
    birdie.angle = 180 * dvy / (FLAP * 2);
    if (
        gameOver ||
        birdie.angle < 0 ||
        birdie.angle > 90
    ) {
        birdie.angle = 90;
        birdie.animations.stop();
        birdie.frame = 3;
    } else {
        birdie.animations.play('fly');
    }
}

})();
