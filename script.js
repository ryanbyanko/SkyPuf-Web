"use strict";

const MOVE_SPEED = 300; // ms
const TILE_SIZE = 32; // pixels
const GHOST_ALPHA = 0.4; // opacity
const MAX_ZOOM = 16; // map size / canvas size
const MIN_ZOOM = 0.6;
const START_ZOOM = 0.9;
const ZOOM_SPEED = 0.1; // scroll.deltaY?

const TILE = {
    NONE: -1,
    AIR: 0,
    PLATFORM: 1,
    WALL: 2,
    SPAWN: 3,
    FINISH: 4,
    PUFLING: 5
};

let currentLevel, WORLD_SIZE, players, zoom, cursor, moving;

function Level(title = "untitled", mapSize = 20, tileData = null, spawns = [], finishes = []) {
    this.title = title;
    this.mapSize = mapSize;
    this.tileData = tileData ? tileData : (new Array(mapSize * mapSize)).fill(TILE.AIR);
    this.spawns = spawns;
    this.finishes = finishes;
}

function loadLevel(level = new Level()) {
    currentLevel = level;
    WORLD_SIZE = TILE_SIZE * currentLevel.mapSize;
    respawn();
    zoom = START_ZOOM;
}

function Player(x, y) {
    this.x = x; // grid coords
    this.y = y;
    this.gx = x;
    this.gy = y;
}

function respawn() {
    moving = 0;
    players = [];
    for(const spawn of currentLevel.spawns)
        players.push(new Player(spawn - Math.floor(spawn / currentLevel.mapSize) * currentLevel.mapSize, Math.floor(spawn / currentLevel.mapSize)));
}

function startMoving(dx, dy) {
    for(const player of players) {
        const px = player.x + dx;
        const py = player.y + dy;
        if(currentLevel.tileData[py * currentLevel.mapSize + px] !== TILE.WALL) {
            moving = MOVE_SPEED;
            player.gx = px;
            player.gy = py;
        }
    }
}

function stopMoving() {
    moving = 0;
    let anyPlayerDead = false;
    let allPlayersFinished = true;
    for(const player of players) {
        player.x = player.gx;
        player.y = player.gy;
        const tile = player.y * currentLevel.mapSize + player.x;
        if(currentLevel.tileData[tile] === TILE.AIR) anyPlayerDead = true;
        if(currentLevel.finishes.indexOf(tile) === -1) allPlayersFinished = false;
    }
    if(anyPlayerDead) {
        alert("You died! Respawning...");
        respawn();
    }
    else if(allPlayersFinished) {
        alert("You won! Respawning...");
        respawn();
    }
}


const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

let keys = {};
window.addEventListener("keydown", function(e) {
    if(e.key === "r") respawn();
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

let GRAPHICS_FANCY = false;

function drawObject(tile, x, y) {
    if(tile === TILE.NONE) return;

    if(GRAPHICS_FANCY) {
        //
    }
    else {
        switch(tile) {
            case TILE.AIR:
                return;
            case TILE.PLATFORM:
                ctx.fillStyle = "#3f7828";
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                break;
            case TILE.WALL:
                ctx.fillStyle = "#214015";
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                break;
            case TILE.SPAWN:
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2,
                        y + TILE_SIZE / 2,
                        TILE_SIZE / 4, 0, 2 * Math.PI);
                ctx.fillStyle = "#ff0000";
                ctx.fill();
                break;
            case TILE.FINISH:
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2,
                        y + TILE_SIZE / 2,
                        TILE_SIZE / 4, 0, 2 * Math.PI);
                ctx.fillStyle = "#ce0de8";
                ctx.fill();
                break;
            case TILE.PLAYER:
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2,
                        y + TILE_SIZE / 2,
                        TILE_SIZE / 2, 0, 2 * Math.PI);
                ctx.fillStyle = "#ff00a6";
                ctx.fill();
                break;
        }
    }
}

let last = 0;

function draw(now) {

    const dt = now - last;
    last = now;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#67f1ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    applyTransform();

    for(let y = 0; y < currentLevel.mapSize; y++) {
        for(let x = 0; x < currentLevel.mapSize; x++) {
            const tileType = currentLevel.tileData[y * currentLevel.mapSize + x];
            if(tileType !== TILE.AIR)
                drawObject(tileType, x * TILE_SIZE, y * TILE_SIZE);
        }
    }

    for(const spawn of currentLevel.spawns)
        drawObject(TILE.SPAWN, (spawn - Math.floor(spawn / currentLevel.mapSize) * currentLevel.mapSize) * TILE_SIZE, Math.floor(spawn / currentLevel.mapSize) * TILE_SIZE);

    for(const finish of currentLevel.finishes)
        drawObject(TILE.FINISH, (finish - Math.floor(finish / currentLevel.mapSize) * currentLevel.mapSize) * TILE_SIZE, Math.floor(finish / currentLevel.mapSize) * TILE_SIZE);

    for(const player of players)
        drawObject(TILE.PLAYER, player.x * TILE_SIZE, player.y * TILE_SIZE);

    if(moving > 0) {
        for(const player of players) {
            const vx = (player.gx - player.x) * dt / MOVE_SPEED;
            const vy = (player.gy - player.y) * dt / MOVE_SPEED;
            player.x += vx;
            player.y += vy;
        }

        moving -= dt;
        if(moving <= 0) stopMoving();
    }
    else {
        if(keys["w"]) startMoving(0, -1);
        else if(keys["a"]) startMoving(-1, 0);
        else if(keys["s"]) startMoving(0, 1);
        else if(keys["d"]) startMoving(1, 0);
    }


    cursor = TILE.NONE;
    if(keys["1"]) cursor = TILE.AIR;
    if(keys["2"]) cursor = TILE.PLATFORM;
    if(keys["3"]) cursor = TILE.WALL;
    if(keys["4"]) cursor = TILE.SPAWN;
    if(keys["5"]) cursor = TILE.FINISH;
    if(keys["6"]) cursor = TILE.PLAYER;
    if(cursor !== TILE.NONE) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 4 / zoom;
        ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        if(mouse.x >= 0 && mouse.x < WORLD_SIZE && mouse.y >= 0 && mouse.y < WORLD_SIZE) {
            if(mouseDown) {
                const tile = Math.floor(mouse.y / TILE_SIZE) * currentLevel.mapSize + Math.floor(mouse.x / TILE_SIZE);

                if((cursor === TILE.AIR || cursor === TILE.PLATFORM || cursor === TILE.WALL) && currentLevel.tileData[tile] !== cursor) {
                    currentLevel.tileData[tile] = cursor; // Edit to be added to edit queue
                }
                else if(cursor === TILE.SPAWN && currentLevel.spawns.indexOf(tile) === -1) {
                    currentLevel.spawns.push(tile);
                }
                else if(cursor === TILE.FINISH && currentLevel.finishes.indexOf(tile) === -1) {
                    currentLevel.finishes.push(tile);
                }
                else if(cursor === TILE.PLAYER) {
                    console.error("unimplemented");
                }
            }
            else {
                ctx.globalAlpha = GHOST_ALPHA;
                drawObject(cursor, Math.floor(mouse.x / TILE_SIZE) * TILE_SIZE, Math.floor(mouse.y / TILE_SIZE) * TILE_SIZE);
                ctx.globalAlpha = 1.0;
            }
        }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000000";
    ctx.fillText(currentLevel.title, 5, 15);

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
});

function saveLevel() {
    const title = prompt("Name your level!", currentLevel.title);
    const saveString = `${title}|${currentLevel.mapSize}|${currentLevel.tileData.join('')}|${currentLevel.spawns.join('.')}|${currentLevel.finishes.join('.')}`;
    currentLevel.title = title;
    addLevel(saveString);
    // Mark level as no unsaved changes
    alert("Copy this save string:\n" + saveString);
}

function importLevel() {
    const saveString = prompt("Enter level save string:");
    try {
        loadLevel(addLevel(saveString));
    }
    catch(e) {
        console.error(e);
        alert("Error importing level, see console for more information");
    }
}

const loadedLevels = {};

function addLevel(saveString) {
    let [title, mapSize, tileData, spawns, finishes] = saveString.split('|');
    mapSize = parseInt(mapSize);
    tileData = tileData.split('').map(t => parseInt(t));
    spawns = spawns.split('.').map(s => parseInt(s));
    finishes = finishes.split('.').map(s => parseInt(s));

    const level = new Level(title, mapSize, tileData, spawns, finishes);
    const levelID = title.split(' ').join('') + '-' + (tileData.reduce((a, v) => a + v) + mapSize);
    loadedLevels[levelID] = level;

    document.getElementById("levels").innerHTML += `<option value="${levelID}">${title}</option>`;

    return level;
}

document.getElementById("levels").onchange = function(e) {
    loadLevel(loadedLevels[e.target.value]);
}

const defaultLevel = addLevel("Level 1|11|0000000000000000000000000000000000001112111000011111210011110000000111100000000000000000000000000000000000000000000000000|67|53");
addLevel("Level 2|12|000000000000000000000000000000000020000000000010021111111110021112111110000000000010000000000010000000000010021111111210021111111110000000000000|62.122|46");
addLevel("Level 3|18|000000000000000000000000000000000000000000000000000000000000000000000000011110000000000010011110000000000211020011111000001111011110001111101100000000011110111100000000011100001000000000000111001000000111111101111000011110012000000000011110000000000000000020000000000000000000000000000000000000000000000000000000000000000000|236.74|88");
addLevel("Level 4|19|0000000000000000000000000000000000000000000000000000000000000000000111111120000000000110000010001111111111000001000111111111100000100000000000010000010000000000001000001000111111001100001100011111200110002100000000100001000010000000010000100001000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000|96.191|73");
addLevel("Level 5|21|000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000011111200000000000000010000000000000000110210000000000111011111110000000000121010000010000000000111010011110000000000001010112000000000000001010100011000000000011010100011111110000011110100010000110000000000100011000000000000000111111000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000|291.193|101");
addLevel("Level 6|21|000000000000000000000001200000000000000000001000000000000000000001000012000000000000001000010000000000000001000010000200000000001000010011100001000021000010000111111200001100010000100001000000100110000100001000000100210000100001000000100010000100001000000100010001100001000000100010001120001000000100010000210011000000111111111111111000000100010000001001000000000020000001111200000000000000000000000000000000000000000000000000000000000000000|23.70.136|164");
//addLevel(""); da screw-driver

loadLevel(defaultLevel);

resize();
requestAnimationFrame(draw);
