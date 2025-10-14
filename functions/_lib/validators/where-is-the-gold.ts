import { normalize, type ValidationResult } from '../text';

export function validateWhereIsTheGold(answerRaw: string): ValidationResult {
  const s = normalize(answerRaw);

  const GOLD = ['gold', 'gold cup', 'gold cups', 'missing gold', 'golden', '黄金', '金杯', '金子'];
  const BOTTLE = ['bottle', 'glass bottle', 'flask', 'vial', 'beaker', 'container', 'jar', '试剂瓶', '容器', '瓶子', '瓶内', '瓶里', '瓶中', '瓶'];
  const AQUA_REGIA = ['aqua regia', '王水'];

  const required = [GOLD, BOTTLE, AQUA_REGIA];
  let score = 0;

  for (const comp of required) {
    const ok = comp.some((key) => key && s.includes(key));
    if (ok) {
      score += 1;
    }
  }

  if (score === required.length) {
    return { ok: true, score, missingCount: 0, orderOk: true };
  }

  const missingCount = required.length - score;
  return { ok: false, score, missingCount, orderOk: false };
}
