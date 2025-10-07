import { ADS } from "./ads.js";

const cvs = document.getElementById("game");
const ctx = cvs.getContext("2d");
const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const overlay = document.getElementById("overlay");
const scEl = document.getElementById("sc");
const finalEl = document.getElementById("final");
const btnRetry = document.getElementById("btnRetry");
const btnReward = document.getElementById("btnReward");

let state = "menu"; // menu | playing | paused | over
let last = 0;
let score = 0;
let pipes = [];
let player, gravity, pipeGap, pipeEveryMs, speed, interstitialGate;

function reset() {
  score = 0;
  pipes = [];
  player = { x: 80, y: cvs.height / 2, vy: 0, r: 12 };
  gravity = 0.35;
  pipeGap = 140;
  pipeEveryMs = 1500;
  speed = 2.3;
  interstitialGate = { lastShownAt: 0, gamesSince: 0 };
  scEl.textContent = "0";
  hideOverlay();
}

function flap() {
  if (state === "menu") { state = "playing"; }
  if (state === "playing") { player.vy = -6.8; }
}

function spawnPipe() {
  const holeY = 100 + Math.random() * (cvs.height - 200 - pipeGap);
  pipes.push({ x: cvs.width + 20, holeY });
}

function update(dt) {
  if (state !== "playing") return;
  // pipes spawn
  if (pipes._t == null) pipes._t = 0;
  pipes._t += dt;
  if (pipes._t > pipeEveryMs) { pipes._t = 0; spawnPipe(); }

  // move pipes
  for (const p of pipes) p.x -= speed;
  pipes = pipes.filter(p => p.x > -60);

  // player physics
  player.vy += gravity;
  player.y += player.vy;

  // collisions & scoring
  for (const p of pipes) {
    // score when passed center of pipe once
    if (!p.passed && p.x + 30 < player.x - player.r) {
      p.passed = true; score += 1; scEl.textContent = String(score);
    }
    // collide: top or bottom body
    const inX = player.x + player.r > p.x && player.x - player.r < p.x + 50;
    const hitTop = player.y - player.r < p.holeY;
    const hitBottom = player.y + player.r > p.holeY + pipeGap;
    if (inX && (hitTop || hitBottom)) return gameOver();
  }
  // ground / ceiling
  if (player.y + player.r >= cvs.height - 2 || player.y - player.r <= 2) {
    return gameOver();
  }
}

function draw() {
  // bg
  ctx.fillStyle = "#151822";
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  // stripes
  ctx.fillStyle = "#11131a";
  for (let i = 0; i < cvs.height; i += 32) ctx.fillRect(0, i, cvs.width, 16);
  // pipes
  for (const p of pipes) {
    ctx.fillStyle = "#2ec27e";
    ctx.fillRect(p.x, 0, 50, p.holeY);
    ctx.fillRect(p.x, p.holeY + pipeGap, 50, cvs.height - (p.holeY + pipeGap));
  }
  // player
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = "#f6c945";
  ctx.fill();
}

function loop(ts) {
  const dt = last ? ts - last : 0;
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function gameOver() {
  state = "over";
  finalEl.textContent = String(score);
  showOverlay();

  // interstitial: en az 30sn ara + her 2 oyundan sonra
  const now = Date.now();
  interstitialGate.gamesSince++;
  const longEnough = now - interstitialGate.lastShownAt > 30_000;
  const gateOk = interstitialGate.gamesSince >= 2 && longEnough;
  if (gateOk) {
    ADS.showInterstitial().finally(() => {
      interstitialGate.gamesSince = 0;
      interstitialGate.lastShownAt = Date.now();
    });
  }
}

function showOverlay(){ overlay.classList.add("show"); }
function hideOverlay(){ overlay.classList.remove("show"); }

// input
btnStart.addEventListener("click", flap);
btnPause.addEventListener("click", () => {
  if (state === "playing") state = "paused";
  else if (state === "paused") state = "playing";
});
cvs.addEventListener("pointerdown", flap);
window.addEventListener("keydown", (e) => { if (e.code === "Space" || e.code === "ArrowUp") flap(); });

// overlay actions
btnRetry.addEventListener("click", () => { reset(); state = "playing"; });
btnReward.addEventListener("click", async () => {
  // gönüllü ödüllü reklam: kullanıcı isterse izler → 3 can/puan bonusu ile devam
  const rewarded = await ADS.showRewarded();
  if (rewarded) {
    hideOverlay();
    state = "playing";
    player.y = cvs.height / 2;
    player.vy = -4;
    score += 3; scEl.textContent = String(score);
  }
});

reset();
requestAnimationFrame(loop);

// AdMob (yerli platformda çalışır, web preview'da sessizce atlar)
ADS.init();
