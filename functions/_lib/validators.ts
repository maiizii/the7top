import { normalize } from './text';

/** 工具 */
const anyIndex = (s: string, keys: string[]) => {
  let p = -1;
  for (const k of keys) {
    const i = s.indexOf(k);
    if (i !== -1) p = p === -1 ? i : Math.min(p, i);
  }
  return p;
};
const hasAny = (s: string, keys: string[]) => keys.some(k => s.includes(k));

/**
 * 放宽版 + 强顺序（The Inn That Never Sleeps）
 *
 * 仅硬性校验“必选要素与时间”，并强制按 S1→S2→S3→S4→S5→S6 的文本出现顺序递增；
 * 可选要素不影响通过。
 *
 * S1【必】sausage（可选：feast/kitchen/dinner）
 * S2【必】9:30 + lantern（可选：book）
 * S3【必】study + (9:55 | before ten)（可选：innkeeper|boss / fast watch / sleep）
 * S4【必】key（可选：ladder + (box|rafters)）
 * S5【必】(dog|hound) + sausage（可选：hot|grilled）
 * S6【必】leave/escape/exit/open gate/garden gate
 */
export function validateInn(answerRaw: string) {
  const s = normalize(answerRaw);

  // 关键词集合
  const DINNER = ['dinner', 'feast', 'kitchen'];
  const SAUSAGE = ['sausage', 'hot sausage', 'grilled sausage'];

  const T930 = ['9 30', '9:30', 'nine thirty'];
  const LANTERN = ['lantern'];
  const BOOK = ['book', 'read', 'reading'];

  const STUDY = ['study'];
  const T955 = ['9 55', '9:55', 'nine fifty five', 'nine fifty-five'];
  const BEFORE_TEN = ['before ten', 'before 10'];

  const KEEPER = ['innkeeper', 'boss', 'keeper', 'host']; // 可选
  const FAST = ['five minutes fast', 'fast watch', 'fast clock', 'runs fast', 'fast']; // 可选
  const SLEEP = ['sleep', 'asleep', 'sleeps']; // 可选

  const LADDER = ['ladder', 'folding ladder', 'hollow ladder', 'hollow']; // 可选
  const BOX = ['box', 'rafters', 'rafter', 'beam']; // 可选
  const KEY = ['key', 'spare key'];

  const DOG = ['hound', 'dog'];
  const HOT = ['hot', 'grilled']; // 可选

  const LEAVE = ['leave', 'escape', 'get out', 'go out', 'exit', 'open gate', 'unlock gate', 'garden gate', 'gate'];

  // S1：必须 sausage
  const s1_req = hasAny(s, SAUSAGE);
  const s1_pos = s1_req ? anyIndex(s, SAUSAGE) : -1;

  // S2：必须 9:30 + lantern
  const s2_req = hasAny(s, T930) && hasAny(s, LANTERN);
  const s2_pos = s2_req ? Math.min(anyIndex(s, T930), anyIndex(s, LANTERN)) : -1;

  // S3：必须 study + (9:55 | before ten)
  const s3_time = hasAny(s, T955) || hasAny(s, BEFORE_TEN);
  const s3_req = hasAny(s, STUDY) && s3_time;
  const s3_pos = s3_req
    ? Math.min(anyIndex(s, STUDY), anyIndex(s, T955.concat(BEFORE_TEN)))
    : -1;

  // S4：必须 key
  const s4_req = hasAny(s, KEY);
  const s4_pos = s4_req ? anyIndex(s, KEY) : -1;

  // S5：必须 dog/hound + sausage
  const s5_req = hasAny(s, DOG) && hasAny(s, SAUSAGE);
  const s5_pos = s5_req ? Math.min(anyIndex(s, DOG), anyIndex(s, SAUSAGE)) : -1;

  // S6：必须 离开/开门
  const s6_req = hasAny(s, LEAVE);
  const s6_pos = s6_req ? anyIndex(s, LEAVE) : -1;

  const stepsReq = [s1_req, s2_req, s3_req, s4_req, s5_req, s6_req];
  const stepsPos = [s1_pos, s2_pos, s3_pos, s4_pos, s5_pos, s6_pos];

  const allRequiredOk = stepsReq.every(Boolean);
  const orderOk = allRequiredOk && stepsPos.every((p, i, arr) => i === 0 || arr[i - 1] < p);

  return {
    ok: allRequiredOk && orderOk,
    score: stepsReq.filter(Boolean).length,    // 通过的必选步骤数（满分 6）
    missingCount: stepsReq.filter(x => !x).length,
    orderOk
  };
}

export function validateBySlug(slug: string, answer: string) {
  switch (slug) {
    case 'the-inn-that-never-sleeps': return validateInn(answer);
    default: return { ok: false, score: 0, missingCount: 6, orderOk: false };
  }
}
