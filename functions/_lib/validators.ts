import { normalize, hasAny } from './text';

export function validateInn(answerRaw: string){
  const s = normalize(answerRaw);
  const a = s.includes('study') && hasAny(s,['9 30','9:30','nine thirty','before ten','10','ten']) && hasAny(s,['lantern','book']);
  const b = hasAny(s,['ladder','hollow']) && s.includes('key') && hasAny(s,['box','rafters','beam']);
  const c = hasAny(s,['hound','dog']) && hasAny(s,['sausage','hot sausage','grilled sausage']);
  const d = hasAny(s,['garden gate','gate']);
  const e = hasAny(s,['innkeeper','keeper','host']) && hasAny(s,['five minutes fast','fast watch','fast clock','runs fast','fast']) && hasAny(s,['sleep','asleep','sleeps']);
  const ok = a && b && c && d && e;
  const score = [a,b,c,d,e].filter(Boolean).length;
  return { ok, score };
}

export function validateBySlug(slug:string, answer:string){
  switch(slug){
    case 'the-inn-that-never-sleeps': return validateInn(answer);
    default: return { ok:false, score:0 };
  }
}
