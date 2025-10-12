import { toNewYorkISOString } from "../../_lib/time";

export const onRequestPost: PagesFunction<{ KV: KVNamespace }> = async (ctx) => {
  const { request, params, env } = ctx;
  const { slug } = params as { slug:string };
  const { solverId, name } = await request.json().catch(()=>({}));

  if(!solverId || typeof name !== 'string') return new Response(JSON.stringify({ ok:false }), { status:400 });

  const solvedKey = `the7:story:${slug}:solvers`;
  const namesKey  = `the7:story:${slug}:names`;

  const solvedRaw = await env.KV.get<string>(solvedKey);
  const solved = new Set((solvedRaw ? JSON.parse(solvedRaw) : []) as string[]);
  if(!solved.has(solverId)) return new Response(JSON.stringify({ ok:false }), { status:403 });

  const clean = name.trim().slice(0,40);
  const nameRaw = await env.KV.get<string>(namesKey);
  const map = (nameRaw ? JSON.parse(nameRaw) : {}) as Record<string, unknown>;

  const claimedAt = toNewYorkISOString();
  map[solverId] = { name: clean, claimedAt };

  await env.KV.put(namesKey, JSON.stringify(map));

  return new Response(JSON.stringify({ ok:true }), { headers:{'content-type':'application/json'} });
};
