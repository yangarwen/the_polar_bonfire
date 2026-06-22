<template>
  <div class="relative h-full w-full overflow-hidden bg-[#0b1020]">
    <canvas ref="canvasRef" class="block h-full w-full outline-none" />

    <hud :stats="stats" />

    <!-- Top-left: mute + Debug (small icons; top-right is reserved for money) -->
    <div class="absolute left-3 top-3 z-10 flex items-center gap-2" :style="safeTop">
      <button
        class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/55 text-xl text-white backdrop-blur-md transition hover:bg-slate-800/70 active:scale-95"
        @click="onToggleMute"
      >
        {{ muted ? '🔇' : '🔊' }}
      </button>
      <button
        class="flex h-11 w-11 items-center justify-center rounded-full text-xl text-white backdrop-blur-md transition active:scale-95"
        :class="showDebug ? 'bg-fuchsia-500' : 'bg-slate-900/55 hover:bg-slate-800/70'"
        @click="onToggleDebug"
      >
        🛠️
      </button>
      <!-- FPS (kept in this row, always above the debug panel so it isn't covered) -->
      <span
        class="flex h-11 items-center rounded-full bg-slate-900/55 px-3 text-sm font-black backdrop-blur-md"
        :class="stats.fps >= 50 ? 'text-lime-300' : stats.fps >= 30 ? 'text-amber-300' : 'text-rose-300'"
      >
        ⚡ {{ stats.fps }}
      </span>
      <!-- Game time -->
      <span class="flex h-11 items-center rounded-full bg-slate-900/55 px-3 text-sm font-black text-cyan-100 backdrop-blur-md tabular-nums">
        ⏱️ {{ timeText }}
      </span>
    </div>

    <!-- Second row (right side, clear of the left status column): quality selector -->
    <div class="absolute right-3 top-[4.5rem] z-10 flex gap-1">
      <select
        v-model.number="quality"
        @change="onQuality"
        class="h-9 rounded-full bg-slate-900/55 px-2 text-xs font-bold text-white backdrop-blur-md outline-none"
        title="Quality: pick Smooth if it stutters"
      >
        <option :value="1">🖥️ High</option>
        <option :value="1.5">🖥️ Standard</option>
        <option :value="2">🖥️ Smooth</option>
        <option :value="2.5">🖥️ Power Saver</option>
      </select>
    </div>

    <!-- Debug panel: camera parameters -->
    <div
      v-if="showDebug"
      class="absolute left-3 top-16 z-40 w-64 rounded-2xl bg-slate-950/85 p-3 text-xs text-white shadow-2xl ring-1 ring-cyan-200/15 backdrop-blur-md"
    >
      <div class="mb-2 text-sm font-black text-fuchsia-300">🎥 Camera Debug</div>
      <div class="mb-3">
        <div class="flex justify-between"><span>Zoom (distance)</span><span class="font-bold">{{ camRadius.toFixed(0) }}</span></div>
        <input type="range" class="w-full accent-fuchsia-400" min="8" max="75" step="0.5" v-model.number="camRadius" @input="onCamRadius" />
      </div>
      <div class="mb-3">
        <div class="flex justify-between"><span>Rotation (degrees)</span><span class="font-bold">{{ camAngle.toFixed(0) }}°</span></div>
        <input type="range" class="w-full accent-fuchsia-400" min="-180" max="180" step="1" v-model.number="camAngle" @input="onCamAngle" />
      </div>

      <div class="mb-2 text-sm font-black text-fuchsia-300">💰 Money Debug</div>
      <div class="mb-3">
        <div class="flex justify-between"><span>Set money</span><span class="font-bold">{{ moneyDebug.toLocaleString() }}</span></div>
        <input type="range" class="w-full accent-fuchsia-400" min="0" max="5000" step="50" v-model.number="moneyDebug" @input="onMoney" />
      </div>

      <div class="mb-2 text-sm font-black text-fuchsia-300">🧟 Wave Debug</div>
      <div>
        <div class="flex justify-between"><span>Jump to wave</span><span class="font-bold">Wave {{ waveDebug }}</span></div>
        <input type="range" class="w-full accent-fuchsia-400" min="1" max="50" step="1" v-model.number="waveDebug" />
        <button class="mt-2 w-full rounded-lg bg-fuchsia-600 py-1.5 text-sm font-black text-white active:scale-95" @click="onWave">
          ▶ Jump to wave {{ waveDebug }} (auto-builds the core)
        </button>
      </div>
    </div>

    <!-- Controls hint -->
    <div
      v-if="showHint"
      class="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-xl bg-slate-950/60 px-4 py-2 text-center text-xs text-cyan-50/90 ring-1 ring-cyan-200/15 backdrop-blur-md sm:text-sm"
    >
      In camp, step on 🪓🗡️🔫 to swap weapons → enter the 🐔 hunting ground → carry meat back to 🥩 base to display → after settlers pay, collect coins at the 💲 cash box → step on upgrade pads to grow stronger
    </div>

    <!-- Tower upgrade menu -->
    <div
      v-if="stats.selectedTower"
      class="absolute bottom-28 left-1/2 z-30 w-64 -translate-x-1/2 rounded-2xl bg-slate-950/85 p-3 text-center text-white shadow-2xl ring-1 ring-cyan-200/20 backdrop-blur-md"
    >
      <button
        class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm hover:bg-white/30"
        @click="onTowerClose"
      >
        ✕
      </button>
      <div class="text-lg font-black">
        {{ stats.selectedTower.type === 'cannon' ? '💣 Plasma Cannon' : stats.selectedTower.type === 'slow' ? '❄️ Cryo Field Tower' : '🏹 Laser Tower' }}
        <span class="ml-1 text-cyan-300">Lv.{{ stats.selectedTower.level }}/{{ stats.selectedTower.maxLevel }}</span>
      </div>
      <div class="mt-1 text-sm font-black text-cyan-200">Now {{ stats.selectedTower.detail }}</div>
      <div class="text-[11px] text-white/60">{{ stats.selectedTower.type === 'slow' ? 'Slow strength / range scale with level' : 'Damage / fire rate / shots scale with level' }}</div>
      <button
        v-if="!stats.selectedTower.maxed"
        class="mt-2.5 w-full rounded-xl px-4 py-2.5 text-base font-black transition active:scale-95"
        :class="stats.selectedTower.affordable ? 'bg-cyan-500 text-white hover:bg-cyan-400' : 'bg-white/15 text-white/50'"
        @click="onTowerUpgrade"
      >
        ⬆️ Upgrade　💰 {{ stats.selectedTower.cost.toLocaleString() }}
      </button>
      <div v-else class="mt-2.5 rounded-xl bg-amber-500/30 px-4 py-2.5 text-base font-black text-amber-200">Max level ✦</div>
    </div>

    <joystick class="absolute bottom-8 left-8 z-10" @move="onJoyMove" @end="onJoyEnd" />


    <!-- Defense intro (pops up after the core is built) -->
    <div v-if="stats.showDefenseIntro" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-5 backdrop-blur-md">
      <div class="w-full max-w-sm rounded-2xl bg-slate-900/95 p-5 text-center text-slate-100 shadow-2xl ring-1 ring-cyan-300/30">
        <div class="mb-2 text-4xl">🔥❄️</div>
        <div class="mb-1 text-xl font-black text-cyan-200">Energy core online!</div>
        <p class="mb-4 text-sm leading-relaxed text-slate-300">
          The deep cold sets in and aliens are coming! Build 🏹 Laser Towers / 💣 Plasma Cannons / ❄️ Cryo Field Towers around camp to intercept them,<br />
          don't let <span class="font-black text-rose-300">10</span> aliens breach the core's defenses,<br />
          survive <span class="font-black text-amber-300">30 cold nights</span> and rescue will arrive!
        </p>
        <div class="mb-4 rounded-xl bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-200 ring-1 ring-cyan-300/20">
          ⏱️ The first cold night arrives <span class="text-amber-300">1 minute</span> after you confirm
        </div>
        <button
          v-if="stats.money >= 5000"
          class="w-full rounded-xl bg-cyan-500 py-3 text-lg font-black text-white shadow-lg transition hover:bg-cyan-400 active:scale-95"
          @click="onStartDefense"
        >
          Confirm, activate the core!
        </button>
        <button
          v-else
          disabled
          class="w-full cursor-not-allowed rounded-xl bg-white/10 py-3 text-base font-black text-rose-300/80"
        >
          Need 💰5000 on hand to start (currently {{ stats.money.toLocaleString() }})
        </button>
      </div>
    </div>

    <!-- Game over / victory -->
    <div v-if="stats.gameOver || stats.won" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-5 backdrop-blur-md">
      <div class="w-full max-w-sm rounded-2xl bg-slate-900/95 p-6 text-center text-slate-100 shadow-2xl ring-1" :class="stats.won ? 'ring-amber-300/40' : 'ring-rose-400/40'">
        <div class="mb-2 text-5xl">{{ stats.won ? '🏆' : '💀' }}</div>
        <div class="mb-1 text-2xl font-black" :class="stats.won ? 'text-amber-300' : 'text-rose-300'">
          {{ stats.won ? 'Rescue arrived!' : 'The core went dark!' }}
        </div>
        <p class="mb-3 text-sm text-slate-300">
          {{ stats.won ? 'You survived 30 cold nights, the core held, and rescue arrived!' : '10 aliens breached the core defenses…' }}
        </p>
        <div class="mb-5 flex justify-center gap-3">
          <div class="rounded-xl bg-white/5 px-4 py-2 ring-1 ring-white/10">
            <div class="text-2xl font-black text-cyan-300">{{ stats.wave }}</div>
            <div class="text-[11px] text-slate-400">Nights survived</div>
          </div>
          <div class="rounded-xl bg-white/5 px-4 py-2 ring-1 ring-white/10">
            <div class="text-2xl font-black text-rose-300">{{ stats.breaches }}/{{ stats.breachMax }}</div>
            <div class="text-[11px] text-slate-400">Breaches</div>
          </div>
        </div>
        <button
          class="mb-2 w-full rounded-xl bg-cyan-500 py-3 text-lg font-black text-white shadow-lg transition hover:bg-cyan-400 active:scale-95"
          @click="onRestart"
        >
          Play again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { createGame, type GameHandle, type GameStats } from '../game/game';
import { sound } from '../game/sound';
import Hud from './hud.vue';
import Joystick from './joystick.vue';

const canvasRef = ref<HTMLCanvasElement>();
const stats = reactive<GameStats>({
  fps: 0,
  gameTime: 0,
  money: 0,
  carried: 0,
  carryCap: 0,
  counterMeat: 0,
  counterCap: 0,
  cashPending: 0,
  customers: 0,
  weaponEmoji: '🗡️',
  weaponName: 'Cleaver',
  nearUpgrade: null,
  nearInfo: null,
  defenseActive: false,
  breaches: 0,
  breachMax: 10,
  wave: 0,
  gameOver: false,
  won: false,
  waveLabel: '',
  selectedTower: null,
  showDefenseIntro: false,
  fuel: 100,
  fuelMax: 100,
  cold: false,
});

let game: GameHandle | undefined;

const MUTE_KEY = 'polar-bonfire:muted';
const muted = ref(localStorage.getItem(MUTE_KEY) === '1');

/** Quality (render resolution scale): 1 = high quality; higher = smoother/blurrier. Player-chosen and remembered */
const QUALITY_KEY = 'polar-bonfire:quality';
const quality = ref(Number(localStorage.getItem(QUALITY_KEY) ?? '1') || 1);
function onQuality() {
  game?.setHardwareScaling(quality.value);
  localStorage.setItem(QUALITY_KEY, String(quality.value));
}


/** Background music: always plays the "Cheerful" track (dropdown removed) */
const HAPPY_TRACK = Math.max(0, sound.musicTracks().indexOf('Cheerful'));

const showHint = ref(true);
let hintTimer: number | undefined;
/** Avoid the notch / Dynamic Island */
const safeTop = { top: 'max(0.75rem, env(safe-area-inset-top))' };

/** Debug panel toggle */
const showDebug = ref(false);
/** Opening Debug requires the message-board delete password; closing does not */
function onToggleDebug() {
  if (showDebug.value) {
    showDebug.value = false;
    return;
  }
  const k = window.prompt('Enter debug password (= message-board delete code):') || '';
  if (!k) return;
  if (k === '19840501') showDebug.value = true;
  else window.alert('Wrong password');
}
/** Camera: zoom (radius) and rotation (degrees); defaults match config (radius 34, alpha -90°) */
const camRadius = ref(34);
const camAngle = ref(-90);
function onCamRadius() {
  game?.setCameraRadius(camRadius.value);
}
function onCamAngle() {
  game?.setCameraAlpha((camAngle.value * Math.PI) / 180);
}
/** Debug: set money directly (slider value = target, not live money) */
const moneyDebug = ref(0);
function onMoney() {
  game?.setMoney(moneyDebug.value);
}
/** Debug: jump to a given wave to feel the difficulty */
const waveDebug = ref(10);
function onWave() {
  game?.setWave(waveDebug.value);
}

onMounted(() => {
  if (!canvasRef.value) return;
  game = createGame(canvasRef.value, {
    onStats: (s) => Object.assign(stats, s),
  });
  game.setMuted(muted.value);
  game.setHardwareScaling(quality.value); // apply the last chosen quality
  /** Always play "Cheerful" (actual playback waits for the first tap/move to unlock audio) */
  sound.setMusic(HAPPY_TRACK);
  hintTimer = window.setTimeout(() => (showHint.value = false), 9000);
});

onBeforeUnmount(() => {
  if (hintTimer !== undefined) clearTimeout(hintTimer);
  game?.dispose();
});

function onJoyMove(dir: { x: number; z: number }) {
  game?.setJoystick(dir.x, dir.z);
}
function onJoyEnd() {
  game?.setJoystick(0, 0);
}
function onTowerUpgrade() {
  game?.upgradeSelectedTower();
}
function onTowerClose() {
  game?.deselectTower();
}
function onStartDefense() {
  sound.enable();
  game?.startDefense();
}
function onRestart() {
  location.reload();
}
const timeText = computed(() => {
  const t = Math.floor(stats.gameTime);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
});
function onToggleMute() {
  muted.value = !muted.value;
  localStorage.setItem(MUTE_KEY, muted.value ? '1' : '0');
  game?.setMuted(muted.value);
}
</script>
