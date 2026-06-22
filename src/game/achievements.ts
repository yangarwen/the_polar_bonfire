/** Achievements: unlock state stored in localStorage; shown on the home page */
export interface AchievementDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}

/** Achievement list (display order = easiest to hardest) */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'sell', emoji: '🥩', name: 'First Sale', desc: 'Sell meat for coins' },
  { id: 'rich', emoji: '💰', name: 'Well Off', desc: 'Earn $2000 in total' },
  { id: 'dog', emoji: '🤖', name: 'Mechanical Partner', desc: 'Deploy a robo-hound' },
  { id: 'hunter', emoji: '🔫', name: 'Rally a Hunter', desc: 'Hire a frontier hunter' },
  { id: 'cashier', emoji: '🧑‍💼', name: 'Logistics Ready', desc: 'Hire a quartermaster' },
  { id: 'pasture2', emoji: '🧨', name: 'Break New Ground', desc: 'Blast open Hunting Ground 2' },
  { id: 'house', emoji: '🔥', name: 'Core Online', desc: 'Activate the energy core' },
  { id: 'boss', emoji: '👹', name: 'Alien Bane', desc: 'Kill your first giant alien' },
  { id: 'wave10', emoji: '🛡️', name: 'Rookie Defender', desc: 'Survive the 10th cold night' },
  { id: 'wave20', emoji: '⚔️', name: 'Veteran Defender', desc: 'Survive the 20th cold night' },
  { id: 'win', emoji: '🏆', name: 'Rescue Arrives', desc: 'Survive 30 cold nights' },
];

const KEY = 'polar-bonfire:achievements';

export function loadAchievements(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return new Set<string>();
  }
}

/** Unlock an achievement (skips if already unlocked); returns whether this was the first unlock */
export function unlockAchievement(id: string): boolean {
  const s = loadAchievements();
  if (s.has(id)) return false;
  s.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
  return true;
}
