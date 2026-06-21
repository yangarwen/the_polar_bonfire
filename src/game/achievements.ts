/** 成就系統：解鎖狀態存在 localStorage，首頁顯示成就表 */
export interface AchievementDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}

/** 成就清單（顯示順序＝難度由淺到深） */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'sell', emoji: '🥩', name: '第一筆交易', desc: '賣出獵物肉換得金幣' },
  { id: 'rich', emoji: '💰', name: '富甲一方', desc: '累積賺到 $2000' },
  { id: 'dog', emoji: '🤖', name: '機械夥伴', desc: '啟動一隻機械獵犬' },
  { id: 'hunter', emoji: '🔫', name: '召集獵手', desc: '召集拓荒獵手' },
  { id: 'cashier', emoji: '🧑‍💼', name: '後勤就緒', desc: '雇用補給官' },
  { id: 'pasture2', emoji: '🧨', name: '開疆闢土', desc: '炸開獵場 2' },
  { id: 'house', emoji: '🔥', name: '核心啟動', desc: '啟動能量核心' },
  { id: 'boss', emoji: '👹', name: '異形剋星', desc: '擊殺第一隻巨型異形' },
  { id: 'wave10', emoji: '🛡️', name: '守備新手', desc: '撐過第 10 個寒夜' },
  { id: 'wave20', emoji: '⚔️', name: '守備好手', desc: '撐過第 20 個寒夜' },
  { id: 'win', emoji: '🏆', name: '等到救援', desc: '撐過 30 個寒夜' },
];

const KEY = 'polar-bonfire:achievements';

export function loadAchievements(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return new Set<string>();
  }
}

/** 解鎖一個成就（已解鎖則略過），回傳是否為「首次解鎖」 */
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
