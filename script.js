"use strict";

const MOVE_SPEED = 300; // ms
const TILE_SIZE = 32; // pixels
const GHOST_ALPHA = 0.4; // opacity
const MAX_ZOOM = 16; // map size / canvas size
const MIN_ZOOM = 0.6;
const START_ZOOM = 0.9;
const ZOOM_SPEED = 0.1; // scroll.deltaY?

function Level(title = "untitled", mapSize = 20, tileData = null, spawns = [], finishes = []) {
    this.title = title;
    this.mapSize = mapSize;
    this.tileData = tileData ? tileData : (new Array(mapSize * mapSize)).fill(0);
    this.spawns = spawns;
    this.finishes = finishes;
}

let currentLevel, WORLD_SIZE, players, zoom;

function loadLevel(level = new Level()) {
    currentLevel = level;
    WORLD_SIZE = TILE_SIZE * currentLevel.mapSize;
    players = [];
    zoom = START_ZOOM;
}

let cursor = 0;

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

let keys = {};
window.addEventListener("keydown", function(e) {
    //if(e.key === "r") respawn();
    //console.log(e.key);
    keys[e.key] = true;
});
window.addEventListener("keyup", function(e) {
    keys[e.key] = false;
});
let mouse = { x: 0, y: 0 };
canvas.addEventListener("mousemove", function(e) {
    const rect = canvas.getBoundingClientRect();
    const pX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const pY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const size = canvas.width;
    const scale = (size * zoom) / WORLD_SIZE;

    mouse = {
        x: (pX - size / 2) / scale + WORLD_SIZE / 2,
        y: (pY - size / 2) / scale + WORLD_SIZE / 2
    };
});
let mouseDown = false;
canvas.addEventListener("mousedown", function(e) {
    mouseDown = true;
});
// window mouseup handles mouse leaves
window.addEventListener("mouseup", function(e) {
    mouseDown = false;
});


function applyTransform() {
    const size = canvas.width;

    const scale = (size * zoom) / WORLD_SIZE;

    ctx.setTransform(
        scale, 0,
        0, scale,
        size / 2,
        size / 2
    );
    ctx.translate(-WORLD_SIZE / 2, -WORLD_SIZE / 2);
}

function drawObject(objectID, x, y) {
    if(objectID === 2) ctx.fillStyle = "#3f7828";
    else if(objectID === 3) ctx.fillStyle = "#214015";
    else ctx.fillStyle = "#00ff00";
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
}

function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    applyTransform();

    for(let y = 0; y < currentLevel.mapSize; y++) {
        for(let x = 0; x < currentLevel.mapSize; x++) {
            const tileType = currentLevel.tileData[y * currentLevel.mapSize + x];
            if(tileType > 1)
                drawObject(tileType, x * TILE_SIZE, y * TILE_SIZE);
        }
    }


    cursor = 0;
    if(keys["1"]) cursor = 1;
    if(keys["2"]) cursor = 2;
    if(keys["3"]) cursor = 3;
    if(keys["4"]) cursor = 4;
    if(keys["5"]) cursor = 5;
    if(keys["6"]) cursor = 6;
    if(cursor !== 0) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 4 / zoom;
        ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        if(mouse.x >= 0 && mouse.x < WORLD_SIZE && mouse.y >= 0 && mouse.y < WORLD_SIZE) {
            if(mouseDown) {
                const tile = Math.floor(mouse.y / TILE_SIZE) * currentLevel.mapSize + Math.floor(mouse.x / TILE_SIZE);

                if(cursor <= 3) {
                    currentLevel.tileData[tile] = cursor;
                }
            }
            else {
                ctx.globalAlpha = GHOST_ALPHA;
                drawObject(cursor, Math.floor(mouse.x / TILE_SIZE) * TILE_SIZE, Math.floor(mouse.y / TILE_SIZE) * TILE_SIZE);
                ctx.globalAlpha = 1.0;
            }
        }
    }
    requestAnimationFrame(draw);
}

function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
}
window.addEventListener("resize", resize);


canvas.addEventListener("wheel", function(e) {
    e.preventDefault();
    zoom *= 1 + Math.sign(e.deltaY) * -ZOOM_SPEED;
    if(zoom > MAX_ZOOM) zoom = MAX_ZOOM;
    if(zoom < MIN_ZOOM) zoom = MIN_ZOOM;
})

document.getElementById("levels").onchange = function(e) {
    console.log(e.target.value);
}


resize();
loadLevel();
draw();
