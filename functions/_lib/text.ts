export type ValidationResult = {
  ok: boolean;
  score: number;        // 通过的必选步骤数
  missingCount: number; // 未通过的必选步骤数
  orderOk: boolean;     // 顺序是否满足
};

/** 归一化：小写、去标点、压缩空白 */
export const normalize = (t: string) =>
  (t||'').toLowerCase()
    .replace(/['"’‘“”()[\],.!?;:—–-]/g,' ')
    .replace(/\s+/g,' ').trim();

/** 在 from 之后寻找任一关键词的首次位置；找不到返回 -1 */
const anyIndexAfter = (s: string, keys: string[], from: number) => {
  let p = -1;
  for (const k of keys) {
    const i = s.indexOf(k, from + 1);
    if (i !== -1) p = p === -1 ? i : Math.min(p, i);
  }
  return p;
};

/** 逐步匹配：每步由若干“必选组件”，每个组件是一组同义词（取其一）；成功返回本步代表位置=各组件位置的最大值 */
export const matchStepAfter = (s: string, requiredComponents: string[][], from: number) => {
  const positions: number[] = [];
  for (const comp of requiredComponents) {
    const pos = anyIndexAfter(s, comp, from);
    if (pos === -1) return { ok:false, pos:-1 };
    positions.push(pos);
  }
  return { ok:true, pos: Math.max(...positions) };
};

/** 失败结果（用于早停返回） */
export const fail = (step: number, total: number): ValidationResult => ({
  ok:false,
  score:Math.min(step-1, total),
  missingCount:Math.max(total-(step-1),0),
  orderOk:false
});
