(function(){
  const cache = new Map();

  async function loadPartial(name){
    if(!name) return null;
    if(cache.has(name)) return cache.get(name);

    const path = `/partials/${name}.html`;
    try{
      const response = await fetch(path, {credentials:'same-origin'});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      cache.set(name, html);
      return html;
    }catch(err){
      console.error(`[partials] Failed to load "${name}":`, err);
      cache.set(name, null);
      return null;
    }
  }

  async function inject(el){
    const name = el.dataset.include?.trim();
    if(!name) return;
    const html = await loadPartial(name);
    if(!html) return;
    const range = document.createRange();
    const fragment = range.createContextualFragment(html);
    el.replaceWith(fragment);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const targets = document.querySelectorAll('[data-include]');
    targets.forEach(el=>{ inject(el); });
  });
})();
