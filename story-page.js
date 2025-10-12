(function(){
  const slug = document.documentElement.getAttribute('data-slug');
  const form = document.querySelector('.verify-form');
  const input = document.getElementById('answer');
  const statusEl = document.getElementById('status');
  const btnClear = document.getElementById('btn-clear');

  const claimForm = document.querySelector('.claim-form');
  const claimName = document.getElementById('claim-name');
  const claimStatus = document.getElementById('claim-status');
  const btnClaim = document.getElementById('btn-claim');

  const clientFP = (() => {
    try{
      const key = 'the7.fp';
      const v = localStorage.getItem(key) || (Math.random().toString(36).slice(2)+Date.now().toString(36));
      localStorage.setItem(key, v);
      return navigator.userAgent.slice(0,64) + ':' + v;
    }catch(_){ return navigator.userAgent.slice(0,64); }
  })();

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    statusEl.className = 'status'; statusEl.textContent = 'Verifying...';
    const res = await fetch(`/api/verify/${slug}`, {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ answer: input.value || '', clientFP })
    });
    const data = await res.json();
    if(data.ok){
      statusEl.className = 'status ok';
      statusEl.textContent = `Verified. Congratulations — you are #${data.rank}.`;
      claimForm.hidden = false;
      claimForm.dataset.solverId = data.solverId;
      claimName.focus();
    }else{
      statusEl.className = 'status no';
      statusEl.textContent = 'Not verified.';
    }
  });

  btnClear?.addEventListener('click', ()=>{
    input.value=''; statusEl.className='status'; statusEl.textContent='';
  });

  claimForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const solverId = claimForm.dataset.solverId;
    const name = claimName.value || '';
    claimStatus.className = 'status'; claimStatus.textContent = 'Recording...';
    const res = await fetch(`/api/claim/${slug}`, {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ solverId, name })
    });
    const ok = (await res.json()).ok;
    if(ok){ claimStatus.className='status ok'; claimStatus.textContent='Name recorded.'; }
    else{ claimStatus.className='status no'; claimStatus.textContent='Failed to record.'; }
  });
})();
