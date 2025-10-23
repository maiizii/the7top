import { normalize, type ValidationResult } from '../text';

const MAILMAN_KEYWORDS = [
  'mailman',
  'mail man',
  'mailmen',
  'mailwoman',
  'mail woman',
  'mailwomen',
  'mail carrier',
  'mail carriers',
  'letter carrier',
  'letter carriers',
  'postal worker',
  'postal workers',
  'postal carrier',
  'postal carriers',
  'postman',
  'post man',
  'postmen',
  'postwoman',
  'post woman',
  'postwomen',
  'mail deliverer',
  'mail deliverers',
  'mail deliveryman',
  'mail delivery man',
  'mail deliverymen',
  'mail delivery person',
  'mail delivery people',
  'mail courier',
  'mail couriers',
  'post courier',
  'post couriers',
  '邮递员',
  '邮差',
  '邮政员工',
  '邮政人员',
  '邮政快递员',
  '送信人',
  '送信员',
  '送邮件的人'
];

export function validateUnknownKidnapper(answerRaw: string): ValidationResult {
  const s = normalize(answerRaw);
  const matched = MAILMAN_KEYWORDS.some((k) => s.includes(k));

  if (matched) {
    return { ok: true, score: 1, missingCount: 0, orderOk: true };
  }

  return { ok: false, score: 0, missingCount: 1, orderOk: false };
}
