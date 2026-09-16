const selectScreen = document.getElementById("selectScreen");
const gameScreen = document.getElementById("gameScreen");
const heroTitle = document.getElementById("heroTitle");
const heroCopy = document.getElementById("heroCopy");
const statusLabel = document.getElementById("statusLabel");
const statusValue = document.getElementById("statusValue");
const playBtn = document.getElementById("playBtn");
const cycleBtn = document.getElementById("cycleBtn");
const rematchBtn = document.getElementById("rematchBtn");
const nameSwapBtn = document.getElementById("nameSwapBtn");
const soundToggle = document.getElementById("soundToggle");

const playerPortrait = document.getElementById("playerPortrait");
const enemyPortrait = document.getElementById("enemyPortrait");
const playerName = document.getElementById("playerName");
const enemyName = document.getElementById("enemyName");
const playerTag = document.getElementById("playerTag");
const enemyTag = document.getElementById("enemyTag");
const playerHealth = document.getElementById("playerHealth");
const enemyHealth = document.getElementById("enemyHealth");
const playerAmmo = document.getElementById("playerAmmo");
const enemyAmmo = document.getElementById("enemyAmmo");
const playerSuper = document.getElementById("playerSuper");
const enemySuper = document.getElementById("enemySuper");
const scoreValue = document.getElementById("scoreValue");
const roundValue = document.getElementById("roundValue");
const timeValue = document.getElementById("timeValue");
const modeLabel = document.getElementById("modeLabel");
const announcement = document.getElementById("announcement");
const arena = document.getElementById("arena");
const arenaEffects = document.getElementById("arenaEffects");
const stormRing = document.getElementById("stormRing");
const pickupLayer = document.getElementById("pickupLayer");
const objectivePill = document.getElementById("objectivePill");
const playerBrawler = document.getElementById("playerBrawler");
const enemyBrawler = document.getElementById("enemyBrawler");
const joystickPad = document.getElementById("joystickPad");
const joystickKnob = document.getElementById("joystickKnob");

const pickCards = document.querySelectorAll(".pick-card");
const touchButtons = document.querySelectorAll(".pad-btn");

const brawlers = {
  stormy: {
    key: "stormy",
    name: "Stormy",
    portrait: "stormy.png",
    role: "Staff storm caster",
    maxHp: 5200,
    speed: 0.245,
    attackDamage: 760,
    superDamage: 240,
    attackRange: 0.48,
    attackCooldown: 680,
    ammoMax: 3,
    reloadTime: 1200,
    superName: "Storm Field",
    blurb:
      "Stormy fires lightning bolts from a staff and drops storm clouds that punish anyone standing still.",
    color: "cyan",
  },
  kenji: {
    key: "kenji",
    name: "Kenji",
    portrait: "kenji.png",
    role: "Red blade striker",
    maxHp: 6200,
    speed: 0.295,
    attackDamage: 920,
    superDamage: 1280,
    attackRange: 0.16,
    attackCooldown: 430,
    ammoMax: 3,
    reloadTime: 920,
    superName: "Blade Rush",
    blurb:
      "Kenji fights up close with quick slashes and a brutal dash super that breaks lines and deletes space.",
    color: "red",
  },
};

const arenaObjects = [
  { x: 0.19, y: 0.34, w: 0.09, h: 0.07 },
  { x: 0.42, y: 0.23, w: 0.06, h: 0.16 },
  { x: 0.62, y: 0.59, w: 0.1, h: 0.07 },
  { x: 0.77, y: 0.33, w: 0.06, h: 0.16 },
  { x: 0.12, y: 0.18, w: 0.14, h: 0.05 },
  { x: 0.68, y: 0.22, w: 0.14, h: 0.05 },
  { x: 0.22, y: 0.62, w: 0.12, h: 0.05 },
  { x: 0.66, y: 0.6, w: 0.14, h: 0.05 },
];

const state = {
  selected: "stormy",
  namesSwapped: false,
  running: false,
  paused: false,
  soundOn: true,
  lastFrame: performance.now(),
  lastAnnouncementAt: 0,
  timeLeft: 90,
  matchOver: false,
  playerScore: 0,
  enemyScore: 0,
  mouseX: 0.7,
  mouseY: 0.5,
  joystick: {
    x: 0,
    y: 0,
    active: false,
    pointerId: null,
  },
  keys: new Set(),
  effects: [],
  projectiles: [],
  zones: [],
  pickups: [],
  pickupSpawnAt: 0,
  storm: {
    centerX: 0.5,
    centerY: 0.5,
    radius: 0.46,
    minRadius: 0.23,
    shrinkPerSecond: 0.0026,
    damagePerSecond: 78,
    phase: 0,
  },
  player: null,
  enemy: null,
};

function createBrawler(config, role) {
  return {
    key: config.key,
    role,
    name: config.name,
    portrait: config.portrait,
    maxHp: config.maxHp,
    hp: config.maxHp,
    speed: config.speed,
    attackDamage: config.attackDamage,
    superDamage: config.superDamage,
    attackRange: config.attackRange,
    attackCooldown: 0,
    reloadTime: config.reloadTime,
    ammoMax: config.ammoMax,
    ammo: config.ammoMax,
    ammoCooldowns: Array.from({ length: config.ammoMax }, () => 0),
    superCharge: 0,
    superReady: false,
    x: role === "player" ? 0.28 : 0.72,
    y: role === "player" ? 0.72 : 0.28,
    vx: 0,
    vy: 0,
    faceX: role === "player" ? 1 : -1,
    faceY: 0,
    downUntil: 0,
    invulnUntil: 0,
    attackWindup: 0,
    attackType: null,
    superWindup: 0,
    superType: null,
    slowUntil: 0,
    aiThink: 0,
    stormDamageTickAt: 0,
  };
}

function setAnnouncement(text, force = false) {
  const now = performance.now();
  if (!force && now - state.lastAnnouncementAt < 500) return;
  state.lastAnnouncementAt = now;
  announcement.textContent = text;
}

function updateSelectionCopy() {
  const current = brawlers[state.selected];
  const other = state.selected === "stormy" ? brawlers.kenji : brawlers.stormy;
  const currentName = state.namesSwapped ? other.name : current.name;
  const otherName = state.namesSwapped ? current.name : other.name;
  heroTitle.textContent = `${current.name} is ready.`;
  heroCopy.textContent = current.blurb;
  statusLabel.textContent = "Selected fighter";
  statusValue.textContent = `${currentName} vs ${otherName}`;
  playerPortrait.src = current.portrait;
  playerName.textContent = currentName;
  playerTag.textContent = currentName;
  enemyPortrait.src = state.selected === "stormy" ? brawlers.kenji.portrait : brawlers.stormy.portrait;
  enemyName.textContent = otherName;
  enemyTag.textContent = otherName;
}

function setSelection(key) {
  state.selected = key;
  pickCards.forEach((card) => card.classList.toggle("selected", card.dataset.brawler === key));
  updateSelectionCopy();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = `Sound: ${state.soundOn ? "On" : "Off"}`;
  if (state.soundOn) chime("soft");
}

function makeAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

const audio = makeAudio();

function tone(freq, duration = 0.08, type = "triangle", gainValue = 0.03) {
  if (!state.soundOn || !audio) return;
  if (audio.state === "suspended") audio.resume();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainValue;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

function chime(kind = "soft") {
  if (kind === "hit") {
    tone(760, 0.05, "triangle", 0.025);
    window.setTimeout(() => tone(980, 0.05, "triangle", 0.018), 40);
  } else if (kind === "super") {
    tone(240, 0.08, "sawtooth", 0.02);
    window.setTimeout(() => tone(660, 0.14, "triangle", 0.025), 80);
  } else if (kind === "ko") {
    tone(160, 0.15, "sawtooth", 0.02);
    window.setTimeout(() => tone(110, 0.16, "sine", 0.02), 80);
  } else {
    tone(560, 0.06, "triangle", 0.018);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function centerOf(entity) {
  return { x: entity.x, y: entity.y };
}

function arenaSize() {
  return arena.getBoundingClientRect();
}

function worldToPx(x, y) {
  const box = arenaSize();
  return { x: x * box.width, y: y * box.height };
}

function pxToWorld(x, y) {
  const box = arenaSize();
  return { x: x / box.width, y: y / box.height };
}

function addEffect(effect) {
  state.effects.push(effect);
}

function spawnBurst(x, y, text, kind = "good") {
  const label = document.createElement("div");
  label.className = `fx-burst ${kind}`;
  label.textContent = text;
  const px = worldToPx(x, y);
  label.style.left = `${px.x}px`;
  label.style.top = `${px.y}px`;
  arenaEffects.appendChild(label);
  window.setTimeout(() => label.remove(), 760);
}

function spawnHit(x, y) {
  const spark = document.createElement("div");
  spark.className = "fx-hit";
  const px = worldToPx(x, y);
  spark.style.left = `${px.x}px`;
  spark.style.top = `${px.y}px`;
  arenaEffects.appendChild(spark);
  window.setTimeout(() => spark.remove(), 360);
}

function spawnZone(x, y, radius, color = "cyan", ttl = 2800) {
  const zone = { x, y, radius, color, bornAt: performance.now(), ttl, lastTick: 0 };
  state.zones.push(zone);
  const visual = document.createElement("div");
  visual.className = "fx-zone";
  const px = worldToPx(x, y);
  visual.style.left = `${px.x - radius * arenaSize().width}px`;
  visual.style.top = `${px.y - radius * arenaSize().height}px`;
  visual.style.width = `${radius * 2 * arenaSize().width}px`;
  visual.style.height = `${radius * 2 * arenaSize().height}px`;
  arenaEffects.appendChild(visual);
  zone.node = visual;
  return zone;
}

function spawnPickup(type, x, y) {
  const pickup = {
    type,
    x,
    y,
    bornAt: performance.now(),
    ttl: 16000,
    node: null,
  };
  const node = document.createElement("div");
  node.className = `pickup ${type}`;
  node.title = type;
  const px = worldToPx(x, y);
  node.style.left = `${px.x}px`;
  node.style.top = `${px.y}px`;
  pickupLayer.appendChild(node);
  pickup.node = node;
  state.pickups.push(pickup);
  return pickup;
}

function updatePickupNode(pickup) {
  if (!pickup.node) return;
  const px = worldToPx(pickup.x, pickup.y);
  pickup.node.style.left = `${px.x}px`;
  pickup.node.style.top = `${px.y}px`;
}

function randomPickupType() {
  const roll = Math.random();
  if (roll < 0.45) return "heal";
  if (roll < 0.8) return "super";
  return "shield";
}

function findPickupSpawnPoint() {
  for (let i = 0; i < 20; i += 1) {
    const x = rand(0.14, 0.86);
    const y = rand(0.14, 0.84);
    if (!isInsideObstacle(x, y)) {
      const distToCenter = Math.hypot(x - state.storm.centerX, y - state.storm.centerY);
      if (distToCenter <= state.storm.radius - 0.03) {
        return { x, y };
      }
    }
  }
  return { x: 0.5, y: 0.5 };
}

function spawnSupply() {
  if (state.pickups.length >= 4 || !state.running || state.paused || state.matchOver) return;
  const spot = findPickupSpawnPoint();
  spawnPickup(randomPickupType(), spot.x, spot.y);
  state.pickupSpawnAt = performance.now() + rand(6500, 9500);
}

function pickupLabel(type) {
  if (type === "heal") return "Heal";
  if (type === "super") return "Charge";
  return "Shield";
}

function applyPickupEffect(entity, pickup) {
  const now = performance.now();
  if (pickup.type === "heal") {
    entity.hp = clamp(entity.hp + 980, 0, entity.maxHp);
    spawnBurst(entity.x, entity.y - 0.04, "+HP", "good");
  } else if (pickup.type === "super") {
    entity.superCharge = clamp(entity.superCharge + 42, 0, 100);
    entity.superReady = entity.superCharge >= 100;
    entity.ammo = Math.min(entity.ammoMax, entity.ammo + 1);
    spawnBurst(entity.x, entity.y - 0.04, "+Super", "good");
  } else {
    entity.invulnUntil = now + 1100;
    entity.hp = clamp(entity.hp + 260, 0, entity.maxHp);
    spawnBurst(entity.x, entity.y - 0.04, "Shield", "good");
  }
  if (entity === state.player) {
    setAnnouncement(`Picked up ${pickupLabel(pickup.type)}!`, true);
  }
  chime("soft");
}

function updatePickups() {
  const now = performance.now();
  if (state.running && !state.paused && !state.matchOver && now >= state.pickupSpawnAt) {
    spawnSupply();
  }

  state.pickups = state.pickups.filter((pickup) => {
    const expired = now - pickup.bornAt > pickup.ttl;
    if (expired) {
      pickup.node?.remove();
      return false;
    }

    const playerHit = distance(pickup, state.player) < 0.05;
    const enemyHit = distance(pickup, state.enemy) < 0.05;
    if (playerHit || enemyHit) {
      const entity = playerHit ? state.player : state.enemy;
      applyPickupEffect(entity, pickup);
      pickup.node?.remove();
      return false;
    }

    updatePickupNode(pickup);
    return true;
  });
}

function buildMatchActors() {
  const playerConfig = brawlers[state.selected];
  const enemyConfig = state.selected === "stormy" ? brawlers.kenji : brawlers.stormy;
  state.player = createBrawler(playerConfig, "player");
  state.enemy = createBrawler(enemyConfig, "enemy");
  if (state.namesSwapped) {
    const tempName = state.player.name;
    state.player.name = state.enemy.name;
    state.enemy.name = tempName;
  }
  setSpawnPositions();
  updateBrawlerViews();
}

function startMatch() {
  buildMatchActors();
  state.storm.radius = 0.46;
  state.storm.phase = 0;
  state.pickups.forEach((pickup) => pickup.node?.remove());
  state.pickups = [];
  state.pickupSpawnAt = performance.now() + 2800;
  state.running = true;
  state.paused = false;
  state.matchOver = false;
  state.timeLeft = 90;
  state.playerScore = 0;
  state.enemyScore = 0;
  state.projectiles = [];
  state.zones = [];
  state.effects = [];
  arenaEffects.innerHTML = "";
  pickupLayer.innerHTML = "";
  playBtn.textContent = "Battle Now";
  gameScreen.classList.remove("hidden");
  selectScreen.classList.add("hidden");
  setAnnouncement(`Stormy Brawl! ${state.player.name} vs ${state.enemy.name}`, true);
  objectivePill.textContent = "Grab supplies before the storm closes in.";
  updateHud();
  updateBrawlerViews();
  chime("soft");
}

function restartMatch() {
  selectScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  startMatch();
}

function finishMatch() {
  state.matchOver = true;
  state.running = false;
  const winner =
    state.playerScore > state.enemyScore
      ? state.player.name
      : state.enemyScore > state.playerScore
      ? state.enemy.name
      : "Draw";
  setAnnouncement(winner === "Draw" ? "Draw!" : `${winner} wins the brawl!`, true);
  objectivePill.textContent = "Match over. Hit Rematch for another round.";
  statusLabel.textContent = "Match over";
  statusValue.textContent = winner === "Draw" ? "Tie game" : `${winner} takes it`;
  chime("ko");
}

function updateHud() {
  playerHealth.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
  enemyHealth.style.width = `${(state.enemy.hp / state.enemy.maxHp) * 100}%`;
  playerAmmo.textContent = String(state.player.ammo);
  enemyAmmo.textContent = String(state.enemy.ammo);
  playerSuper.textContent = `${Math.round(state.player.superCharge)}%`;
  enemySuper.textContent = `${Math.round(state.enemy.superCharge)}%`;
  scoreValue.textContent = `${state.playerScore} - ${state.enemyScore}`;
  roundValue.textContent = "First to 3 KOs";
  timeValue.textContent = String(Math.max(0, Math.ceil(state.timeLeft)));
  modeLabel.textContent = state.paused ? "Paused" : state.matchOver ? "Match Ended" : "Brawl Mode";
  if (state.matchOver) {
    objectivePill.textContent = "Match over. Hit Rematch for another round.";
  } else if (state.running) {
    objectivePill.textContent = `Supplies live: ${state.pickups.length} on the field.`;
  } else {
    objectivePill.textContent = "Grab supplies, then push the storm.";
  }
}

function updateBrawlerViews() {
  playerPortrait.src = state.player.portrait;
  playerName.textContent = state.player.name;
  playerTag.textContent = state.player.name;
  enemyPortrait.src = state.enemy.portrait;
  enemyName.textContent = state.enemy.name;
  enemyTag.textContent = state.enemy.name;
}

function syncBrawler(entity, node) {
  const px = worldToPx(entity.x, entity.y);
  node.style.left = `${px.x}px`;
  node.style.top = `${px.y}px`;
  node.style.opacity = performance.now() < entity.downUntil ? "0.35" : "1";
  node.style.transform = `translate(-50%, -50%) scale(${entity.hp <= 0 ? 0.92 : 1})`;
  node.classList.toggle("frozen", performance.now() < entity.downUntil);
}

function setSpawnPositions() {
  state.player.x = 0.24;
  state.player.y = 0.72;
  state.enemy.x = 0.76;
  state.enemy.y = 0.28;
}

function updateSelectionCardImages() {
  pickCards.forEach((card) => {
    const key = card.dataset.brawler;
    const config = brawlers[key];
    card.querySelector(".pick-art").src = config.portrait;
  });
}

function moveEntity(entity, dx, dy, dt) {
  const speed = entity.speed * (entity.slowUntil > performance.now() ? 0.55 : 1);
  entity.x += dx * speed * dt;
  entity.y += dy * speed * dt;
  entity.x = clamp(entity.x, 0.08, 0.92);
  entity.y = clamp(entity.y, 0.1, 0.9);
}

function pointTo(entity, target) {
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  const len = Math.hypot(dx, dy) || 1;
  entity.faceX = dx / len;
  entity.faceY = dy / len;
  return { dx: dx / len, dy: dy / len, distance: len };
}

function updateJoystickVisual() {
  const rect = joystickPad.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const radius = rect.width * 0.34;
  const knobX = centerX + state.joystick.x * radius;
  const knobY = centerY + state.joystick.y * radius;
  joystickKnob.style.left = `${knobX}px`;
  joystickKnob.style.top = `${knobY}px`;
  joystickKnob.style.transform = `translate(-50%, -50%) scale(${state.joystick.active ? 1.05 : 1})`;
}

function setJoystickFromPoint(clientX, clientY) {
  const rect = joystickPad.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const radius = rect.width * 0.34;
  const length = Math.hypot(dx, dy);
  const scale = length > radius ? radius / length : 1;
  state.joystick.x = clamp((dx * scale) / radius, -1, 1);
  state.joystick.y = clamp((dy * scale) / radius, -1, 1);
  updateJoystickVisual();
}

function resetJoystick() {
  state.joystick.x = 0;
  state.joystick.y = 0;
  state.joystick.active = false;
  state.joystick.pointerId = null;
  updateJoystickVisual();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestPickup(entity) {
  let best = null;
  let bestDistance = Infinity;
  state.pickups.forEach((pickup) => {
    const d = distance(entity, pickup);
    if (d < bestDistance) {
      best = pickup;
      bestDistance = d;
    }
  });
  return best ? { pickup: best, distance: bestDistance } : null;
}

function isInsideObstacle(x, y) {
  return obstacles.some((ob) => x > ob.x && x < ob.x + ob.w && y > ob.y && y < ob.y + ob.h);
}

function resolveObstacle(entity, oldX, oldY) {
  if (!isInsideObstacle(entity.x, entity.y)) return;
  entity.x = oldX;
  entity.y = oldY;
}

function canAct(entity) {
  return entity.downUntil <= performance.now() && !state.paused && !state.matchOver;
}

function refillAmmo(entity, dt) {
  for (let i = 0; i < entity.ammoCooldowns.length; i += 1) {
    if (entity.ammoCooldowns[i] > 0) {
      entity.ammoCooldowns[i] -= dt;
      if (entity.ammoCooldowns[i] <= 0 && entity.ammo < entity.ammoMax) {
        entity.ammo += 1;
        entity.ammoCooldowns[i] = 0;
      }
    }
  }
}

function spendAmmo(entity) {
  if (entity.ammo <= 0) return false;
  entity.ammo -= 1;
  const slot = entity.ammoCooldowns.findIndex((t) => t <= 0);
  if (slot !== -1) {
    entity.ammoCooldowns[slot] = entity.reloadTime;
  }
  return true;
}

function chargeSuper(entity, amount) {
  entity.superCharge = clamp(entity.superCharge + amount, 0, 100);
  entity.superReady = entity.superCharge >= 100;
}

function applyDamage(attacker, defender, amount) {
  if (performance.now() < defender.invulnUntil) return;
  defender.hp = clamp(defender.hp - amount, 0, defender.maxHp);
  chargeSuper(attacker, attacker.key === "stormy" ? 18 : 22);
  defender.invulnUntil = performance.now() + 220;
  const px = worldToPx(defender.x, defender.y);
  spawnHit(defender.x, defender.y);
  spawnBurst(defender.x, defender.y - 0.04, `-${amount}`, "bad");
  nodePunch(defender === state.player ? playerBrawler : enemyBrawler);
  chime("hit");
  if (defender.hp <= 0) {
    defender.downUntil = performance.now() + 1800;
    defender.hp = 0;
    const scorer = attacker === state.player ? "player" : "enemy";
    if (scorer === "player") state.playerScore += 1;
    else state.enemyScore += 1;
    setAnnouncement(`${attacker.name} scores!`, true);
    spawnBurst(defender.x, defender.y, "KO", "bad");
    if (state.playerScore >= 3 || state.enemyScore >= 3) {
      finishMatch();
    }
  }
}

function nodePunch(node) {
  node.animate(
    [
      { transform: node.style.transform || "translate(-50%, -50%) scale(1)" },
      { transform: "translate(-50%, -50%) scale(1.08)" },
      { transform: "translate(-50%, -50%) scale(1)" },
    ],
    { duration: 180, easing: "ease-out" }
  );
}

function playerAttack() {
  if (!canAct(state.player)) return;
  if (!spendAmmo(state.player)) {
    setAnnouncement("No ammo yet!", false);
    return;
  }

  const aim = pointTo(state.player, state.enemy);
  state.player.attackCooldown = state.player.key === "stormy" ? 330 : 240;
  if (state.player.key === "stormy") {
    const projectile = {
      owner: state.player,
      x: state.player.x,
      y: state.player.y,
      vx: aim.dx * 0.66,
      vy: aim.dy * 0.66,
      damage: state.player.attackDamage,
      radius: 0.022,
      ttl: 1400,
      kind: "bolt",
    };
    state.projectiles.push(projectile);
    spawnBurst(state.player.x, state.player.y - 0.02, "Zap", "good");
  } else {
    state.player.attackWindup = 120;
    state.player.attackType = "slash";
    state.player.faceX = aim.dx;
    state.player.faceY = aim.dy;
    if (aim.distance < state.player.attackRange + 0.05) {
      applyDamage(state.player, state.enemy, state.player.attackDamage);
      state.player.x += aim.dx * 0.03;
      state.player.y += aim.dy * 0.03;
    } else {
      state.player.x += aim.dx * 0.04;
      state.player.y += aim.dy * 0.04;
    }
    spawnBurst(state.player.x, state.player.y - 0.02, "Slash", "good");
  }
  chime("soft");
}

function usePlayerSuper() {
  if (!canAct(state.player) || !state.player.superReady) return;
  state.player.superCharge = 0;
  state.player.superReady = false;
  const aim = pointTo(state.player, state.enemy);
  if (state.player.key === "stormy") {
    const zone = spawnZone(state.enemy.x, state.enemy.y, 0.14, "cyan", 3200);
    zone.owner = state.player;
    spawnBurst(state.enemy.x, state.enemy.y - 0.02, "Storm!", "good");
  } else {
    state.player.superWindup = 180;
    state.player.superType = "dash";
    const dashDist = clamp(aim.distance + 0.08, 0.12, 0.24);
    state.player.x = clamp(state.player.x + aim.dx * dashDist, 0.08, 0.92);
    state.player.y = clamp(state.player.y + aim.dy * dashDist, 0.1, 0.9);
    applyDamage(state.player, state.enemy, state.player.superDamage);
    spawnBurst(state.player.x, state.player.y, "Blade Rush", "bad");
  }
  chime("super");
}

function attackAI(entity, target) {
  if (!canAct(entity)) return;
  if (entity.attackCooldown > 0) return;
  if (entity.ammo <= 0) return;

  const aim = pointTo(entity, target);
  const wantsFar = entity.key === "stormy";
  const shouldAttack =
    (wantsFar && aim.distance < 0.72) || (!wantsFar && aim.distance < 0.28);

  if (!shouldAttack) return;

  spendAmmo(entity);
  entity.attackCooldown = entity.key === "stormy" ? 340 : 240;

  if (entity.key === "stormy") {
    state.projectiles.push({
      owner: entity,
      x: entity.x,
      y: entity.y,
      vx: aim.dx * 0.62,
      vy: aim.dy * 0.62,
      damage: entity.attackDamage,
      radius: 0.022,
      ttl: 1400,
      kind: "bolt",
    });
  } else if (aim.distance <= entity.attackRange + 0.04) {
    applyDamage(entity, target, entity.attackDamage);
    entity.x = clamp(entity.x + aim.dx * 0.03, 0.08, 0.92);
    entity.y = clamp(entity.y + aim.dy * 0.03, 0.1, 0.9);
  } else {
    entity.x = clamp(entity.x + aim.dx * 0.025, 0.08, 0.92);
    entity.y = clamp(entity.y + aim.dy * 0.025, 0.1, 0.9);
  }
}

function superAI(entity, target) {
  if (!canAct(entity) || !entity.superReady) return;
  const aim = pointTo(entity, target);
  if (entity.key === "stormy" && aim.distance < 0.62) {
    entity.superCharge = 0;
    entity.superReady = false;
    const zone = spawnZone(target.x, target.y, 0.14, "cyan", 3000);
    zone.owner = entity;
    spawnBurst(target.x, target.y - 0.02, "Storm!", "good");
    chime("super");
  } else if (entity.key === "kenji" && aim.distance < 0.55) {
    entity.superCharge = 0;
    entity.superReady = false;
    entity.x = clamp(entity.x + aim.dx * 0.16, 0.08, 0.92);
    entity.y = clamp(entity.y + aim.dy * 0.16, 0.1, 0.9);
    applyDamage(entity, target, entity.superDamage);
    spawnBurst(entity.x, entity.y, "Blade Rush", "bad");
    chime("super");
  }
}

function updateAI(dt) {
  const enemy = state.enemy;
  const player = state.player;
  const aim = pointTo(enemy, player);
  const pickupTarget = nearestPickup(enemy);
  enemy.aiThink -= dt;
  if (enemy.aiThink <= 0) {
    enemy.aiThink = rand(160, 300);
    const keepDistance = enemy.key === "stormy" ? 0.5 : 0.16;
    const moveAway = aim.distance < keepDistance && enemy.key === "stormy";
    const moveToward = aim.distance > keepDistance + 0.08 || enemy.key === "kenji";
    const dirX = moveAway ? -aim.dx : aim.dx;
    const dirY = moveAway ? -aim.dy : aim.dy;
    if (pickupTarget && (enemy.hp < enemy.maxHp * 0.72 || enemy.superCharge < 60)) {
      const pickupAim = pointTo(enemy, pickupTarget.pickup);
      moveEntity(enemy, pickupAim.dx, pickupAim.dy, dt * 0.52);
    } else if (moveToward) {
      moveEntity(enemy, dirX, dirY, dt * 0.42);
    } else {
      const strafe = Math.random() > 0.5 ? 1 : -1;
      moveEntity(enemy, -aim.dy * strafe * 0.35, aim.dx * strafe * 0.35, dt * 0.36);
    }
    if (enemy.hp < enemy.maxHp * 0.35 && Math.random() > 0.4) {
      enemy.slowUntil = performance.now() + 250;
    }
    superAI(enemy, player);
    attackAI(enemy, player);
  }
}

function updateProjectiles(dt) {
  const now = performance.now();
  state.projectiles = state.projectiles.filter((projectile) => {
    projectile.ttl -= dt;
    projectile.x += projectile.vx * (dt / 1000);
    projectile.y += projectile.vy * (dt / 1000);

    if (projectile.x < 0.04 || projectile.x > 0.96 || projectile.y < 0.06 || projectile.y > 0.94) {
      spawnHit(projectile.x, projectile.y);
      return false;
    }

    const target = projectile.owner === state.player ? state.enemy : state.player;
    if (distance(projectile, target) < projectile.radius + 0.03) {
      applyDamage(projectile.owner, target, projectile.damage);
      spawnHit(projectile.x, projectile.y);
      return false;
    }

    if (projectile.ttl <= 0) return false;
    if (now < target.downUntil) return projectile.ttl > 0;
    return true;
  });
}

function updateZones(dt) {
  const now = performance.now();
  state.zones = state.zones.filter((zone) => {
    if (zone.node) {
      const elapsed = now - zone.bornAt;
      const progress = clamp(elapsed / zone.ttl, 0, 1);
      zone.node.style.opacity = String(0.85 - progress * 0.85);
    }

    const expired = now - zone.bornAt > zone.ttl;
    if (expired && zone.node) zone.node.remove();

    const target = zone.owner === state.player ? state.enemy : state.player;
    if (!expired && distance(zone, target) < zone.radius + 0.015 && now > target.invulnUntil) {
      if (now - zone.lastTick > 480) {
        const tick = zone.owner.key === "stormy" ? 140 : 70;
        zone.lastTick = now;
        applyDamage(zone.owner, target, tick);
        target.slowUntil = now + 320;
      }
    }
    return !expired;
  });
}

function updateStorm(dt) {
  const storm = state.storm;
  if (state.running && !state.paused && !state.matchOver) {
    storm.radius = Math.max(
      storm.minRadius,
      storm.radius - storm.shrinkPerSecond * (dt / 1000)
    );
  }

  const diameter = storm.radius * 2;
  stormRing.style.left = `${(storm.centerX - storm.radius) * 100}%`;
  stormRing.style.top = `${(storm.centerY - storm.radius) * 100}%`;
  stormRing.style.width = `${diameter * 100}%`;
  stormRing.style.height = `${diameter * 100}%`;
  stormRing.style.opacity = state.running ? "0.72" : "0.35";

  const now = performance.now();
  const phase = storm.radius < 0.28 ? 2 : storm.radius < 0.36 ? 1 : 0;
  if (state.running && phase > storm.phase) {
    storm.phase = phase;
    setAnnouncement(phase === 2 ? "Final storm phase!" : "Storm is closing in!", true);
  }

  if (!state.running || state.paused || state.matchOver) return;

  [state.player, state.enemy].forEach((entity) => {
    const dist = Math.hypot(entity.x - storm.centerX, entity.y - storm.centerY);
    if (dist > storm.radius && now > entity.stormDamageTickAt) {
      entity.stormDamageTickAt = now + 260;
      const damage = storm.damagePerSecond * 0.26;
      entity.hp = clamp(entity.hp - damage, 0, entity.maxHp);
      entity.slowUntil = now + 120;
      spawnBurst(entity.x, entity.y - 0.04, "-storm", "bad");
      if (entity === state.player) {
        nodePunch(playerBrawler);
      } else {
        nodePunch(enemyBrawler);
      }
      if (entity.hp <= 0) {
        entity.downUntil = now + 900;
      }
    }
  });
}

function updateBrawler(entity, dt) {
  const now = performance.now();
  if (now < entity.downUntil) return;

  entity.attackCooldown = Math.max(0, entity.attackCooldown - dt);
  entity.attackWindup = Math.max(0, entity.attackWindup - dt);
  entity.superWindup = Math.max(0, entity.superWindup - dt);

  refillAmmo(entity, dt);

  if (entity.superCharge >= 100) entity.superReady = true;

  if (entity === state.player) {
    handlePlayerMovement(dt);
  } else {
    handleEnemyMovement(dt);
  }

  entity.vx *= 0.9;
  entity.vy *= 0.9;
  const oldX = entity.x;
  const oldY = entity.y;
  entity.x += entity.vx * (dt / 1000);
  entity.y += entity.vy * (dt / 1000);
  entity.x = clamp(entity.x, 0.08, 0.92);
  entity.y = clamp(entity.y, 0.1, 0.9);
  resolveObstacle(entity, oldX, oldY);
}

function handlePlayerMovement(dt) {
  const entity = state.player;
  let dx = 0;
  let dy = 0;
  if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) dx -= 1;
  if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) dx += 1;
  if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) dy -= 1;
  if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) dy += 1;
  dx += state.joystick.x;
  dy += state.joystick.y;
  const len = Math.hypot(dx, dy) || 1;
  const magnitude = clamp(len, 0, 1);
  entity.vx += (dx / len) * entity.speed * 0.72 * magnitude;
  entity.vy += (dy / len) * entity.speed * 0.72 * magnitude;

  if (state.keys.has("Space")) {
    state.keys.delete("Space");
    playerAttack();
  }
  if (state.keys.has("ShiftLeft") || state.keys.has("ShiftRight")) {
    if (entity.superReady) {
      state.keys.delete("ShiftLeft");
      state.keys.delete("ShiftRight");
      usePlayerSuper();
    }
  }
  if (state.keys.has("Tab")) {
    state.keys.delete("Tab");
    dodge(entity);
  }

  const aimTarget = pxToWorld(state.mouseX, state.mouseY);
  const aim = pointTo(entity, aimTarget);
  entity.faceX = aim.dx;
  entity.faceY = aim.dy;
}

function handleEnemyMovement(dt) {
  const enemy = state.enemy;
  const player = state.player;
  const aim = pointTo(enemy, player);
  const ideal = enemy.key === "stormy" ? 0.48 : 0.18;
  if (aim.distance > ideal + 0.05) {
    moveEntity(enemy, aim.dx, aim.dy, dt * 0.72);
  } else if (aim.distance < ideal - 0.05) {
    moveEntity(enemy, -aim.dx, -aim.dy, dt * 0.55);
  } else {
    moveEntity(enemy, -aim.dy * 0.3, aim.dx * 0.3, dt * 0.45);
  }
  superAI(enemy, player);
  attackAI(enemy, player);
}

function dodge(entity) {
  if (!canAct(entity)) return;
  const aim = entity === state.player ? pxToWorld(state.mouseX, state.mouseY) : state.player;
  const dir = pointTo(entity, aim);
  entity.vx += dir.dx * 0.08;
  entity.vy += dir.dy * 0.08;
  entity.invulnUntil = performance.now() + 180;
  spawnBurst(entity.x, entity.y - 0.03, "Dash", "good");
}

function handleKeyboard(e, down) {
  const keys = [
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Space",
    "ShiftLeft",
    "ShiftRight",
    "Tab",
  ];
  if (keys.includes(e.code)) e.preventDefault();
  if (down) {
    if (e.repeat && ["Space", "ShiftLeft", "ShiftRight", "Tab", "Escape"].includes(e.code)) {
      return;
    }
    state.keys.add(e.code);
    if (e.code === "Space") playerAttack();
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") usePlayerSuper();
    if (e.code === "Tab") dodge(state.player);
    if (e.code === "Escape") togglePause();
  } else {
    state.keys.delete(e.code);
  }
}

function togglePause() {
  if (!state.running && !state.matchOver) return;
  state.paused = !state.paused;
  statusLabel.textContent = state.paused ? "Paused" : "Battle";
  statusValue.textContent = state.paused ? "Take a breather" : `${state.player.name} vs ${state.enemy.name}`;
  setAnnouncement(state.paused ? "Paused" : "Back in the brawl!", true);
}

function useTouchAction(action) {
  if (!state.running && !state.matchOver) startMatch();
  if (action === "attack") playerAttack();
  if (action === "super") usePlayerSuper();
  if (action === "dodge") dodge(state.player);
  if (action === "left") state.keys.add("KeyA");
  if (action === "right") state.keys.add("KeyD");
  if (action === "up") state.keys.add("KeyW");
  if (action === "down") state.keys.add("KeyS");
  window.setTimeout(() => {
    if (action === "left") state.keys.delete("KeyA");
    if (action === "right") state.keys.delete("KeyD");
    if (action === "up") state.keys.delete("KeyW");
    if (action === "down") state.keys.delete("KeyS");
  }, 120);
}

function updateTimer(dt) {
  if (!state.running || state.paused || state.matchOver) return;
  state.timeLeft -= dt / 1000;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    finishMatch();
  }
}

function renderObstacles() {
  const nodes = Array.from(document.querySelectorAll("[data-obstacle]"));
  nodes.forEach((node, index) => {
    const ob = arenaObjects[index];
    const box = arenaSize();
    node.style.left = `${ob.x * 100}%`;
    node.style.top = `${ob.y * 100}%`;
    node.style.width = `${ob.w * box.width}px`;
    node.style.height = `${ob.h * box.height}px`;
  });
}

function gameLoop(now) {
  const dt = Math.min(34, now - state.lastFrame);
  state.lastFrame = now;

  if (state.running && !state.paused && !state.matchOver) {
    updateTimer(dt);
    updateBrawler(state.player, dt);
    updateBrawler(state.enemy, dt);
    updateProjectiles(dt);
    updateZones(dt);
    updatePickups();
    updateStorm(dt);
    updateHud();
  } else {
    updateStorm(0);
    updatePickups();
  }

  syncBrawler(state.player, playerBrawler);
  syncBrawler(state.enemy, enemyBrawler);
  updateHud();
  requestAnimationFrame(gameLoop);
}

function resetMatchState() {
  state.running = false;
  state.paused = false;
  state.matchOver = false;
  state.timeLeft = 90;
  state.playerScore = 0;
  state.enemyScore = 0;
  state.projectiles = [];
  state.zones = [];
  state.effects = [];
  state.keys = new Set();
  resetJoystick();
  state.lastFrame = performance.now();
  state.storm.radius = 0.46;
  state.storm.phase = 0;
  buildMatchActors();
  updateHud();
  setAnnouncement("Pick a fighter and battle!", true);
}

function swapNames() {
  state.namesSwapped = !state.namesSwapped;
  nameSwapBtn.textContent = `Swap Names: ${state.namesSwapped ? "On" : "Off"}`;
  updateSelectionCopy();
  if (state.player && state.enemy) {
    updateBrawlerViews();
  }
}

pickCards.forEach((card) => {
  card.addEventListener("click", () => setSelection(card.dataset.brawler));
});

playBtn.addEventListener("click", () => {
  if (gameScreen.classList.contains("hidden")) {
    startMatch();
    return;
  }
  if (!state.running || state.matchOver) {
    resetMatchState();
    startMatch();
  } else {
    state.paused = false;
  }
});

nameSwapBtn.addEventListener("click", swapNames);

cycleBtn.addEventListener("click", () => {
  setSelection(state.selected === "stormy" ? "kenji" : "stormy");
});

rematchBtn.addEventListener("click", () => {
  gameScreen.classList.add("hidden");
  selectScreen.classList.remove("hidden");
  resetMatchState();
});

soundToggle.addEventListener("click", toggleSound);

arena.addEventListener("pointermove", (event) => {
  const rect = arena.getBoundingClientRect();
  const local = pxToWorld(event.clientX - rect.left, event.clientY - rect.top);
  state.mouseX = clamp(event.clientX - rect.left, 0, rect.width);
  state.mouseY = clamp(event.clientY - rect.top, 0, rect.height);
  state.mouseWorld = local;
});

arena.addEventListener("pointerdown", (event) => {
  const rect = arena.getBoundingClientRect();
  state.mouseX = clamp(event.clientX - rect.left, 0, rect.width);
  state.mouseY = clamp(event.clientY - rect.top, 0, rect.height);
  if (!state.running && !state.matchOver) startMatch();
});

joystickPad.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  state.joystick.active = true;
  state.joystick.pointerId = event.pointerId;
  joystickPad.setPointerCapture?.(event.pointerId);
  setJoystickFromPoint(event.clientX, event.clientY);
});

joystickPad.addEventListener("pointermove", (event) => {
  if (!state.joystick.active || state.joystick.pointerId !== event.pointerId) return;
  setJoystickFromPoint(event.clientX, event.clientY);
});

const releaseJoystick = (event) => {
  if (state.joystick.pointerId !== null && event.pointerId !== state.joystick.pointerId) return;
  resetJoystick();
};

joystickPad.addEventListener("pointerup", releaseJoystick);
joystickPad.addEventListener("pointercancel", releaseJoystick);
joystickPad.addEventListener("pointerleave", releaseJoystick);

document.addEventListener("keydown", (e) => handleKeyboard(e, true));
document.addEventListener("keyup", (e) => handleKeyboard(e, false));

touchButtons.forEach((button) => {
  let activeId = null;
  const release = () => {
    const action = button.dataset.action;
    if (action === "left") state.keys.delete("KeyA");
    if (action === "right") state.keys.delete("KeyD");
    if (action === "up") state.keys.delete("KeyW");
    if (action === "down") state.keys.delete("KeyS");
    activeId = null;
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activeId = event.pointerId;
    button.setPointerCapture?.(activeId);
    useTouchAction(button.dataset.action);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

window.addEventListener("resize", () => {
  renderObstacles();
});

function init() {
  updateSelectionCardImages();
  setSelection("stormy");
  resetMatchState();
  renderObstacles();
  updateJoystickVisual();
  requestAnimationFrame(gameLoop);
}

init();
