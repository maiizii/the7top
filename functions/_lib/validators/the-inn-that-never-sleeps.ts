import { normalize, matchStepAfter, fail, type ValidationResult } from '../text';

export function validateInn(answerRaw: string): ValidationResult {
  const s = normalize(answerRaw);

  const SAUSAGE = ['sausage','hot sausage','grilled sausage'];
  const T930 = ['9 30','9:30','nine thirty'];
  const LANTERN = ['lantern'];

  const STUDY = ['study'];
  const T955 = ['9 55','9:55','nine fifty five','nine fifty-five'];
  const BEFORE_TEN = ['before ten','before 10']; // 二选一时间条件

  const KEY = ['key','spare key'];
  const DOG = ['hound','dog'];
  const LEAVE = ['leave','escape','get out','go out','exit','open gate','unlock gate','garden gate','gate'];

  let prev = -1; const TOTAL = 6;

  // S1
  const s1 = matchStepAfter(s, [SAUSAGE], prev); if(!s1.ok) return fail(1, TOTAL); prev = s1.pos;
  // S2
  const s2 = matchStepAfter(s, [T930, LANTERN], prev); if(!s2.ok) return fail(2, TOTAL); prev = s2.pos;
  // S3（时间二选一）
  const s3a = matchStepAfter(s, [STUDY, T955], prev);
  const s3b = matchStepAfter(s, [STUDY, BEFORE_TEN], prev);
  const s3 = s3a.ok ? s3a : s3b;
  if(!s3.ok) return fail(3, TOTAL); prev = s3.pos;
  // S4
  const s4 = matchStepAfter(s, [KEY], prev); if(!s4.ok) return fail(4, TOTAL); prev = s4.pos;
  // S5
  const s5 = matchStepAfter(s, [DOG, SAUSAGE], prev); if(!s5.ok) return fail(5, TOTAL); prev = s5.pos;
  // S6
  const s6 = matchStepAfter(s, [LEAVE], prev); if(!s6.ok) return fail(6, TOTAL);

  return { ok:true, score:TOTAL, missingCount:0, orderOk:true };
}
