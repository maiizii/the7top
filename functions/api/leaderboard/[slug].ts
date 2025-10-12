export const onRequestGet: PagesFunction<{ KV: KVNamespace }> = async (ctx) => {
  const { params, env } = ctx;
  const { slug } = params as { slug:string };

  const solvedKey = `the7:story:${slug}:solvers`;
  const namesKey  = `the7:story:${slug}:names`;

  const solvedRaw = await env.KV.get<string>(solvedKey);
  const namesRaw  = await env.KV.get<string>(namesKey);
  const solved = (solvedRaw ? JSON.parse(solvedRaw) : []) as string[];
  const names  = (namesRaw ? JSON.parse(namesRaw) : {}) as Record<string, unknown>;

  const data = solved.slice(0,20).map((id, i)=>{
    const entry = names[id];
    if(entry && typeof entry === 'object'){
      const { name, claimedAt } = entry as { name?: string; claimedAt?: string };
      return { rank:i+1, name: name?.trim() ? name : '—', claimedAt: claimedAt || null };
    }
    const name = typeof entry === 'string' ? entry : '';
    return { rank:i+1, name: name.trim() ? name : '—', claimedAt: null };
  });
  return new Response(JSON.stringify({ data }), { headers:{'content-type':'application/json'} });
};
