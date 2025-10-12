import { validateBySlug } from '../../_lib/validators';

export const onRequestPost: PagesFunction<{ KV: KVNamespace }> = async (ctx) => {
  const { request, params, env } = ctx;
  const { slug } = params as { slug: string };
  const { answer, clientFP } = await request.json().catch(()=>({}));

  // 简单限流（1 分钟窗口）
  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const fp = `${clientFP || 'na'}:${ip.split('.').slice(0,3).join('.')}`;
  const minute = new Date().toISOString().slice(0,16);
  const fpKey = `the7:story:${slug}:fps:${minute}`;
  const existed = await env.KV.get<string>(fpKey);
  const set = new Set((existed ? JSON.parse(existed) : []) as string[]);
  if(set.size > 50) return new Response(JSON.stringify({ ok:false, hint:'Too frequent' }), { headers:{'content-type':'application/json'} });
  set.add(fp);
  await env.KV.put(fpKey, JSON.stringify([...set]), { expirationTtl: 120 });

  // 校验
  const res = validateBySlug(slug, String(answer||''));
  if(!res.ok){
    return new Response(JSON.stringify({ ok:false, score:res.score }), { headers:{'content-type':'application/json'} });
  }

  // 正确：计算排名（去重）
  const ua = request.headers.get('user-agent') || '';
  const idRaw = `${slug}:${ua}:${ip}`;
  const idBytes = new TextEncoder().encode(idRaw);
  const hashBuf = await crypto.subtle.digest('SHA-256', idBytes);
  const solverId = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');

  const solvedKey = `the7:story:${slug}:solvers`;
  const counterKey = `the7:story:${slug}:counter`;

  const solvedRaw = await env.KV.get<string>(solvedKey);
  const solvedSet = new Set((solvedRaw ? JSON.parse(solvedRaw) : []) as string[]);
  let rank:number;

  if(solvedSet.has(solverId)){
    rank = Number(await env.KV.get(counterKey)) || solvedSet.size;
  }else{
    solvedSet.add(solverId);
    rank = solvedSet.size;
    await env.KV.put(solvedKey, JSON.stringify([...solvedSet]));
    await env.KV.put(counterKey, String(rank));
  }

  return new Response(JSON.stringify({ ok:true, rank, solverId }), { headers:{'content-type':'application/json'} });
};
