const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GW = 500;
const GH = 600;
const BORDER = 8;

let score = 0;
let lives = 3;
let gameRunning = false;

const kittyImg = new Image();
const heartImg = new Image();
const mudImg = new Image();

let imagesLoaded = 0;

const collectSound = document.getElementById('collectSound');
const hitSound = document.getElementById('hitSound');

function checkAllLoaded() { imagesLoaded++; }
kittyImg.onload = checkAllLoaded;
heartImg.onload = checkAllLoaded;
mudImg.onload = checkAllLoaded;

kittyImg.src = 'assets/hello-kitty.png';
heartImg.src = 'assets/heart.png';
mudImg.src = 'assets/mud.png';

const player = { x: GW / 2 - 30, y: GH - 80, width: 60, height: 60, speed: 5 };
const hearts = [];
const muds = [];

function spawnHeart() {
    if (heartImg.complete && heartImg.naturalWidth > 0) {
        hearts.push({ x: Math.random() * (GW - 30), y: -30, width: 30, height: 30, speed: 2 + Math.random() * 2 });
    }
}
function spawnMud() {
    if (mudImg.complete && mudImg.naturalWidth > 0) {
        muds.push({ x: Math.random() * (GW - 40), y: -40, width: 40, height: 40, speed: 2 + Math.random() * 3 });
    }
}

let keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

let lastTouchVirtualX = null;
function clientXToVirtual(x) {
    const rect = canvas.getBoundingClientRect();
    return ((x - rect.left) * GW) / rect.width;
}
canvas.addEventListener('touchstart', e => {
    if (!e.touches.length) return;
    lastTouchVirtualX = clientXToVirtual(e.touches[0].clientX);
}, { passive: true });
canvas.addEventListener('touchmove', e => {
    if (!gameRunning || lastTouchVirtualX === null || !e.touches.length) return;
    const newVirtualX = clientXToVirtual(e.touches[0].clientX);
    const delta = newVirtualX - lastTouchVirtualX;
    player.x += delta;
    if (player.x < 0) player.x = 0;
    if (player.x > GW - player.width) player.x = GW - player.width;
    lastTouchVirtualX = newVirtualX;
    e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchend', () => { lastTouchVirtualX = null; }, { passive: true });

function playSound(sound) {
    if (!sound) return;
    const clone = sound.cloneNode();
    clone.play().catch(() => {});
}

function update() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < GW - player.width) player.x += player.speed;

    for (let i = hearts.length - 1; i >= 0; i--) {
        let h = hearts[i];
        h.y += h.speed;
        if (h.y > GH) hearts.splice(i, 1);
        else if (h.x < player.x + player.width && h.x + h.width > player.x && h.y < player.y + player.height && h.y + h.height > player.y) {
            score++;
            playSound(collectSound);
            hearts.splice(i, 1);
        }
    }

    for (let i = muds.length - 1; i >= 0; i--) {
        let m = muds[i];
        m.y += m.speed;
        if (m.y > GH) muds.splice(i, 1);
        else if (m.x < player.x + player.width && m.x + m.width > player.x && m.y < player.y + player.height && m.y + m.height > player.y) {
            lives--;
            playSound(hitSound);
            muds.splice(i, 1);
        }
    }

    if (lives <= 0) endGame();
    document.getElementById('scoreboard').innerText = `Score: ${score} | Lives: ${lives}`;
}

let heartInterval, mudInterval;
function startSpawning() {
    heartInterval = setInterval(() => { if (gameRunning) spawnHeart(); }, 1500);
    mudInterval = setInterval(() => { if (gameRunning) spawnMud(); }, 2500);
}
function stopSpawning() {
    clearInterval(heartInterval);
    clearInterval(mudInterval);
}

function startGame() {
    score = 0;
    lives = 3;
    hearts.length = 0;
    muds.length = 0;
    player.x = GW / 2 - player.width / 2;
    player.y = GH - 80;
    gameRunning = true;
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
    startSpawning();
    gameLoop();
}

function endGame() {
    gameRunning = false;
    stopSpawning();
    document.getElementById('finalScore').innerText = `Score: ${score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

function draw() {
    ctx.clearRect(0, 0, GW, GH);
    if (kittyImg.complete && kittyImg.naturalWidth > 0) ctx.drawImage(kittyImg, player.x, player.y, player.width, player.height);
    for (let i = 0; i < hearts.length; i++) {
        const h = hearts[i];
        if (heartImg.complete && heartImg.naturalWidth > 0) ctx.drawImage(heartImg, h.x, h.y, h.width, h.height);
    }
    for (let i = 0; i < muds.length; i++) {
        const m = muds[i];
        if (mudImg.complete && mudImg.naturalWidth > 0) ctx.drawImage(mudImg, m.x, m.y, m.width, m.height);
    }
}

function gameLoop() {
    if (gameRunning) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const scoreboardH = document.getElementById('scoreboard').offsetHeight || 0;
    const headerH = document.querySelector('h2').offsetHeight || 0;
    const vPad = 24;
    const maxW = viewportW * 0.95 - BORDER;
    const maxH = Math.max(200, viewportH - scoreboardH - headerH - vPad) - BORDER;
    const scale = Math.min(maxW / GW, maxH / GH);
    const displayW = Math.floor(GW * scale);
    const displayH = Math.floor(GH * scale);
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    canvas.width = Math.floor(displayW * dpr);
    canvas.height = Math.floor(displayH * dpr);
    ctx.setTransform(canvas.width / GW, 0, 0, canvas.height / GH, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 0));
document.addEventListener('DOMContentLoaded', resizeCanvas);

document.getElementById('startButton').addEventListener('click', () => { if (imagesLoaded === 3) startGame(); else alert('Loading assets… please wait!'); });
document.getElementById('restartButton').addEventListener('click', () => { if (imagesLoaded === 3) startGame(); else alert('Loading assets… please wait!'); });
