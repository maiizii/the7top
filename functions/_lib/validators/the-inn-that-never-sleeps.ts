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

  const TOTAL = 6;
  const sequences: Array<'dogThenLeave' | 'leaveThenDog'> = ['dogThenLeave', 'leaveThenDog'];
  let bestFail: ValidationResult | null = null;

  for (const order of sequences) {
    let prev = -1;

    // S1
    const s1 = matchStepAfter(s, [SAUSAGE], prev); if(!s1.ok){ bestFail = pickFail(bestFail, fail(1, TOTAL)); continue; } prev = s1.pos;
    // S2
    const s2 = matchStepAfter(s, [T930, LANTERN], prev); if(!s2.ok){ bestFail = pickFail(bestFail, fail(2, TOTAL)); continue; } prev = s2.pos;
    // S3（时间二选一）
    const s3a = matchStepAfter(s, [STUDY, T955], prev);
    const s3b = matchStepAfter(s, [STUDY, BEFORE_TEN], prev);
    const s3 = s3a.ok ? s3a : s3b;
    if(!s3.ok){ bestFail = pickFail(bestFail, fail(3, TOTAL)); continue; }
    prev = s3.pos;
    // S4
    const s4 = matchStepAfter(s, [KEY], prev); if(!s4.ok){ bestFail = pickFail(bestFail, fail(4, TOTAL)); continue; } prev = s4.pos;

    if(order === 'dogThenLeave'){
      // S5
      const s5 = matchStepAfter(s, [DOG, SAUSAGE], prev); if(!s5.ok){ bestFail = pickFail(bestFail, fail(5, TOTAL)); continue; }
      prev = s5.pos;
      // S6
      const s6 = matchStepAfter(s, [LEAVE], prev); if(!s6.ok){ bestFail = pickFail(bestFail, fail(6, TOTAL)); continue; }
    }else{
      // S5（允许先描述离开）
      const s5 = matchStepAfter(s, [LEAVE], prev); if(!s5.ok){ bestFail = pickFail(bestFail, fail(5, TOTAL)); continue; }
      prev = s5.pos;
      // S6（随后提及给狗香肠）
      const s6 = matchStepAfter(s, [DOG, SAUSAGE], prev); if(!s6.ok){ bestFail = pickFail(bestFail, fail(6, TOTAL)); continue; }
    }

    return { ok:true, score:TOTAL, missingCount:0, orderOk:true };
  }

  return bestFail ?? fail(1, TOTAL);
}

function pickFail(current: ValidationResult | null, candidate: ValidationResult){
  if(!current) return candidate;
  if(candidate.score > current.score) return candidate;
  return current;
}
