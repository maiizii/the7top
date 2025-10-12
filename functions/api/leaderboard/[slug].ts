export const onRequestGet: PagesFunction<{ KV: KVNamespace }> = async (ctx) => {
  const { params, env } = ctx;
  const { slug } = params as { slug:string };

  const solvedKey = `the7:story:${slug}:solvers`;
  const namesKey  = `the7:story:${slug}:names`;

  const solvedRaw = await env.KV.get<string>(solvedKey);
  const namesRaw  = await env.KV.get<string>(namesKey);
  const solved = (solvedRaw ? JSON.parse(solvedRaw) : []) as string[];
  const names  = (namesRaw ? JSON.parse(namesRaw) : {}) as Record<string,string>;

  const data = solved.slice(0,20).map((id, i)=>({ rank:i+1, name: names[id] || '—' }));
  return new Response(JSON.stringify({ data }), { headers:{'content-type':'application/json'} });
};
