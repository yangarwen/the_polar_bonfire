<template>
  <!-- Top-right: large money capsule (primary mobile readout) -->
  <div
    class="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1.5 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-300/30 backdrop-blur-md sm:gap-2 sm:px-4 sm:py-2"
    :style="safeTop"
  >
    <span class="text-lg sm:text-3xl">💰</span>
    <span class="min-w-[2ch] text-center text-xl font-black tabular-nums text-amber-100 sm:text-4xl">
      {{ stats.money.toLocaleString() }}
    </span>
  </div>

  <!-- Top-left: status chips (HP is shown above the player's head instead) -->
  <div class="absolute left-3 top-[4.5rem] z-10 flex flex-col items-start gap-2">
    <!-- Status chips -->
    <div class="flex flex-wrap gap-2 text-sm sm:text-base">
      <span class="rounded-xl bg-slate-900/55 px-3 py-1.5 font-black text-rose-200 backdrop-blur-md ring-1 ring-cyan-200/15">
        🎒 {{ stats.carried }}
      </span>
      <span class="rounded-xl bg-slate-900/55 px-3 py-1.5 font-black text-amber-200 backdrop-blur-md ring-1 ring-cyan-200/15">
        🥩 {{ stats.counterMeat }}
      </span>
      <!-- Uncollected sales sitting at the register — go pick it up (pulses to draw the eye) -->
      <span
        v-if="stats.cashPending > 0"
        class="rounded-xl bg-amber-500/25 px-3 py-1.5 font-black text-amber-100 backdrop-blur-md ring-1 ring-amber-300/45 animate-pulse"
      >
        🪙 +{{ stats.cashPending }}
      </span>
      <span class="rounded-xl bg-slate-900/55 px-3 py-1.5 font-black text-sky-200 backdrop-blur-md ring-1 ring-cyan-200/15">
        {{ stats.weaponEmoji }} {{ stats.weaponName }}
      </span>
    </div>
  </div>

  <!-- Defense battle: wave label + core breach bar -->
  <div
    v-if="stats.defenseActive"
    class="absolute left-1/2 top-32 z-20 flex -translate-x-1/2 flex-col items-center gap-1"
  >
    <div class="rounded-xl bg-slate-950/65 px-4 py-1.5 text-center text-sm font-black text-cyan-50 backdrop-blur-md ring-1 ring-cyan-200/20 sm:text-base">
      {{ stats.waveLabel }}
    </div>
    <div class="flex items-center gap-2">
      <span class="text-lg">🛡️</span>
      <div class="h-3.5 w-44 overflow-hidden rounded-full bg-slate-900/55 ring-1 ring-cyan-200/15 sm:w-56">
        <div
          class="h-full rounded-full transition-[width] duration-150"
          :class="breachRatio < 0.5 ? 'bg-emerald-400' : breachRatio < 0.8 ? 'bg-amber-400' : 'bg-rose-500'"
          :style="{ width: `${breachRatio * 100}%` }"
        />
      </div>
      <span class="text-xs font-black text-rose-200">{{ stats.breaches }}/{{ stats.breachMax }}</span>
    </div>
    <!-- Bonfire fuel bar: drains at night; refuel with coins beside the fire -->
    <div class="flex items-center gap-2">
      <span class="text-lg">🔥</span>
      <div class="h-3.5 w-44 overflow-hidden rounded-full bg-slate-900/55 ring-1 ring-amber-200/20 sm:w-56">
        <div
          class="h-full rounded-full transition-[width] duration-150"
          :class="fuelRatio > 0.5 ? 'bg-amber-400' : fuelRatio > 0.25 ? 'bg-orange-500' : 'bg-rose-500'"
          :style="{ width: `${fuelRatio * 100}%` }"
        />
      </div>
      <span class="text-xs font-black text-amber-200">{{ stats.fuel }}</span>
    </div>
    <div v-if="stats.cold" class="rounded-lg bg-sky-500/20 px-2.5 py-1 text-xs font-black text-sky-200 ring-1 ring-sky-300/30">
      🥶 Freezing — slowed. Warm up by the core
    </div>
  </div>

  <!-- Defense critical: from 8/10 breaches, pulse a red vignette warning -->
  <div v-if="stats.defenseActive && breachRatio >= 0.8" class="breach-warn pointer-events-none absolute inset-0 z-30" />
  <!-- Freezing: blue vignette around the screen edge -->
  <div v-if="stats.cold" class="cold-warn pointer-events-none absolute inset-0 z-20" />

  <!-- Upgrade prompt (shown larger for mobile when standing on an upgrade pad) -->
  <div
    v-if="stats.nearUpgrade"
    class="pointer-events-none absolute bottom-32 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-slate-950/80 px-6 py-3.5 text-center text-white shadow-2xl ring-1 ring-cyan-200/20 backdrop-blur-md"
  >
    <div class="text-lg font-black sm:text-xl">
      {{ stats.nearUpgrade.emoji }} {{ stats.nearUpgrade.name }}
      <span class="ml-1 text-base text-cyan-300">Lv.{{ stats.nearUpgrade.level }}/{{ stats.nearUpgrade.maxLevel }}</span>
    </div>
    <div v-if="stats.nearUpgrade.maxed" class="mt-1 text-base font-black text-amber-300">Max level ✦</div>
    <div
      v-else
      class="mt-1 text-base font-bold"
      :class="stats.nearUpgrade.affordable ? 'text-emerald-300' : 'text-rose-300'"
    >
      Stand still to upgrade　💰 {{ stats.nearUpgrade.cost }}
      <span v-if="!stats.nearUpgrade.affordable">(not enough coins)</span>
    </div>
  </div>

  <!-- Near a station: info card (explains the ground icons) -->
  <div
    v-if="stats.nearInfo && !stats.nearUpgrade && !stats.selectedTower"
    class="pointer-events-none absolute bottom-32 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-slate-950/80 px-6 py-3 text-center text-white shadow-2xl ring-1 ring-cyan-200/20 backdrop-blur-md"
  >
    <div class="text-lg font-black sm:text-xl">{{ stats.nearInfo.emoji }} {{ stats.nearInfo.name }}</div>
    <div class="mt-0.5 text-sm text-cyan-200">{{ stats.nearInfo.effect }}</div>
    <div class="mt-1 text-xs text-slate-300">{{ stats.nearInfo.hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameStats } from '../game/game';

const props = defineProps<{ stats: GameStats }>();
const breachRatio = computed(() => (props.stats.breachMax > 0 ? Math.max(0, Math.min(1, props.stats.breaches / props.stats.breachMax)) : 0));
const fuelRatio = computed(() => (props.stats.fuelMax > 0 ? Math.max(0, Math.min(1, props.stats.fuel / props.stats.fuelMax)) : 0));
/** Avoid the notch / Dynamic Island */
const safeTop = { top: 'max(0.75rem, env(safe-area-inset-top))' };
</script>

<style scoped>
.breach-warn {
  background: radial-gradient(ellipse at center, transparent 45%, rgba(225, 25, 25, 0.85) 100%);
  animation: breachpulse 0.85s ease-in-out infinite;
}
.cold-warn {
  background: radial-gradient(ellipse at center, transparent 55%, rgba(90, 160, 235, 0.55) 100%);
  animation: breachpulse 1.6s ease-in-out infinite;
}
@keyframes breachpulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.9;
  }
}
</style>
