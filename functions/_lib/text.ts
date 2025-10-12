export const normalize = (t: string) =>
  (t||'').toLowerCase()
    .replace(/['"’‘“”()[\],.!?;:—–-]/g,' ')
    .replace(/\s+/g,' ').trim();

export const hasAny = (s:string, arr:string[]) => arr.some(k=>s.includes(k));
export const hasAll = (s:string, arr:string[]) => arr.every(k=>s.includes(k));
