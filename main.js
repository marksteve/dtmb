var GRAVITY = 20;
var JUMP = 380;


(function() {

var state = {
    preload: preload,
    create: create,
    update: update
};

var game = new Phaser.Game(480, 640, Phaser.AUTO, 'screen', state, false, false);

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

var birdie, cursors;

function create() {
    birdie = game.add.sprite(game.world.width / 3, 0, 'birdie');
    birdie.anchor.setTo(0.5, 0.5);
    birdie.scale.setTo(2, 2);
    birdie.body.gravity.y = GRAVITY;
    birdie.body.collideWorldBounds = true;
    birdie.animations.add('fly', [0, 1, 2, 3, 2, 1], 30, true);
    birdie.animations.play('fly');
    cursors = game.input.keyboard.createCursorKeys();
}

function update() {
    if (cursors.up.isDown) {
        birdie.body.velocity.y = -JUMP;
    }
    var dvy = birdie.body.velocity.y - JUMP;
    dvy = dvy < 0 ? 0 : dvy;
    birdie.angle = 180 * dvy / JUMP;
    if (birdie.angle < 0 || birdie.angle > 90) {
        birdie.angle = 90;
        birdie.animations.stop();
        birdie.frame = 3;
    } else {
        birdie.animations.play('fly');
    }
}

})();
