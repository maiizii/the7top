import { AdminAuthError, requireAdminKey } from "../../../_lib/admin";

type Env = {
  KV: KVNamespace;
  adminKey?: string;
};

type LeaderboardEntry = {
  solverId: string;
  name?: string | null;
  claimedAt?: string | null;
};

type PutBody = {
  entries?: LeaderboardEntry[];
};

const readLeaderboard = async (slug: string, env: Env) => {
  const solvedKey = `the7:story:${slug}:solvers`;
  const namesKey = `the7:story:${slug}:names`;
  const solvedRaw = await env.KV.get<string>(solvedKey);
  const namesRaw = await env.KV.get<string>(namesKey);
  const solved = (solvedRaw ? JSON.parse(solvedRaw) : []) as string[];
  const names = (namesRaw ? JSON.parse(namesRaw) : {}) as Record<string, unknown>;
  const entries = solved.map((solverId) => {
    const record = names[solverId];
    if (record && typeof record === 'object') {
      const { name, claimedAt } = record as { name?: string; claimedAt?: string };
      return {
        solverId,
        name: typeof name === 'string' ? name : '',
        claimedAt: typeof claimedAt === 'string' ? claimedAt : ''
      };
    }
    if (typeof record === 'string') {
      return { solverId, name: record, claimedAt: '' };
    }
    return { solverId, name: '', claimedAt: '' };
  });
  return { entries, solvedKey, namesKey };
};

const sanitizeEntries = (payload: PutBody["entries"]) => {
  if (!Array.isArray(payload)) {
    throw new Response('Invalid payload', { status: 400 });
  }
  const seen = new Set<string>();
  const sanitized: { solverId: string; name: string; claimedAt: string | null }[] = [];
  for (const item of payload) {
    const solverIdRaw = item?.solverId;
    const solverId = typeof solverIdRaw === 'string' ? solverIdRaw.trim() : '';
    if (!solverId) {
      throw new Response('solverId required', { status: 400 });
    }
    if (seen.has(solverId)) {
      throw new Response(`Duplicate solverId: ${solverId}`, { status: 400 });
    }
    seen.add(solverId);
    const nameRaw = item?.name;
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    const claimedRaw = item?.claimedAt;
    let claimedAt: string | null = null;
    if (typeof claimedRaw === 'string' && claimedRaw.trim()) {
      const parsed = new Date(claimedRaw);
      if (Number.isNaN(parsed.getTime())) {
        throw new Response(`Invalid claimedAt: ${claimedRaw}`, { status: 400 });
      }
      claimedAt = parsed.toISOString();
    }
    sanitized.push({ solverId, name, claimedAt });
  }
  return sanitized;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  try {
    requireAdminKey(request, env);
    const { slug } = params as { slug: string };
    if (!slug) {
      return new Response('Missing slug', { status: 400 });
    }
    const { entries } = await readLeaderboard(slug, env);
    return new Response(JSON.stringify({ data: entries }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return new Response(error.message, { status: error.status });
    }
    if (error instanceof Response) {
      return error;
    }
    console.error(error);
    return new Response('Failed to load leaderboard', { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  try {
    requireAdminKey(request, env);
    const { slug } = params as { slug: string };
    if (!slug) {
      return new Response('Missing slug', { status: 400 });
    }
    const body = (await request.json().catch(() => ({}))) as PutBody;
    const sanitized = sanitizeEntries(body.entries);
    const { solvedKey, namesKey } = await readLeaderboard(slug, env);
    const solved = sanitized.map((entry) => entry.solverId);
    const namesPayload: Record<string, unknown> = {};
    for (const entry of sanitized) {
      const { solverId, name, claimedAt } = entry;
      const record: Record<string, string> = {};
      if (name) record.name = name;
      if (claimedAt) record.claimedAt = claimedAt;
      if (Object.keys(record).length === 0) {
        record.name = '';
      }
      namesPayload[solverId] = record;
    }
    await Promise.all([
      env.KV.put(solvedKey, JSON.stringify(solved)),
      env.KV.put(namesKey, JSON.stringify(namesPayload))
    ]);
    return new Response(JSON.stringify({ ok: true, count: solved.length }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return new Response(error.message, { status: error.status });
    }
    if (error instanceof Response) {
      return error;
    }
    console.error(error);
    return new Response('Failed to save leaderboard', { status: 500 });
  }
};
