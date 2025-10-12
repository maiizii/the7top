import type { ValidationResult } from '../text';
import { validateInn } from './the-inn-that-never-sleeps';

type Validator = (answerRaw: string) => ValidationResult;

const REGISTRY: Record<string, Validator> = {
  'the-inn-that-never-sleeps': validateInn,
  // 在此注册后续故事：
  // 'room-214': validateRoom214,
  // 'tunnel-signal': validateTunnelSignal,
};

export function validateBySlug(slug: string, answer: string): ValidationResult {
  const fn = REGISTRY[slug];
  return fn ? fn(answer) : { ok:false, score:0, missingCount:0, orderOk:false };
}
