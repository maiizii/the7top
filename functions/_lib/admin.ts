export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
    this.name = 'AdminAuthError';
  }
}

const timingSafeCompare = (a: string, b: string) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const len = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i += 1) {
    const ca = a.charCodeAt(i) || 0;
    const cb = b.charCodeAt(i) || 0;
    mismatch |= ca ^ cb;
  }
  return mismatch === 0;
};

export const requireAdminKey = (request: Request, env: { adminKey?: string }) => {
  const configured = env.adminKey;
  if (!configured) {
    throw new AdminAuthError('Admin key not configured.', 500);
  }
  const provided = request.headers.get('x-admin-key') || '';
  if (!provided || !timingSafeCompare(provided, configured)) {
    throw new AdminAuthError('Unauthorized', 401);
  }
};

export const verifyAdminPassword = (password: string | null, env: { adminKey?: string }) => {
  const configured = env.adminKey;
  if (!configured) {
    throw new AdminAuthError('Admin key not configured.', 500);
  }
  if (!password || !timingSafeCompare(password, configured)) {
    throw new AdminAuthError('Unauthorized', 401);
  }
};
