(function(){
  const slug = document.documentElement.getAttribute('data-slug');
  const form = document.querySelector('.verify-form');
  const input = document.getElementById('answer');
  const statusEl = document.getElementById('status');
  const btnVerify = document.getElementById('btn-verify');
  const btnClear = document.getElementById('btn-clear');

  const claimForm = document.querySelector('.claim-form');
  const claimName = document.getElementById('claim-name');
  const claimStatus = document.getElementById('claim-status');

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
    statusEl.className = 'status pending';
    statusEl.textContent = 'Verifying...';
    btnVerify?.setAttribute('disabled', 'true');
    try{
      const res = await fetch(`/api/verify/${slug}`, {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ answer: input.value || '', clientFP })
      });

      if(!res.ok){
        const message = await res.text().catch(()=> '');
        throw new Error(`Verify failed: ${res.status} ${message}`.trim());
      }

      const data = await res.json();
      if(data?.ok){
        statusEl.className = 'status ok';
        statusEl.textContent = `Verified. Congratulations — you are #${data.rank}.`;
        if(claimForm){
          claimForm.hidden = false;
          claimForm.dataset.solverId = data.solverId;
        }
        if(claimStatus){
          claimStatus.className = 'status';
          claimStatus.textContent = '';
        }
        claimName?.focus();
      }else{
        statusEl.className = 'status no';
        statusEl.textContent = data?.hint ? String(data.hint) : 'Not verified.';
        if(claimForm){
          claimForm.hidden = true;
          delete claimForm.dataset.solverId;
        }
      }
    }catch(err){
      console.error(err);
      statusEl.className = 'status warn';
      statusEl.textContent = 'Verification unavailable. Try again later.';
      if(claimForm){
        claimForm.hidden = true;
        delete claimForm.dataset.solverId;
      }
    }finally{
      btnVerify?.removeAttribute('disabled');
    }
  });

  btnClear?.addEventListener('click', ()=>{
    input.value=''; statusEl.className='status'; statusEl.textContent='';
    btnVerify?.removeAttribute('disabled');
    if(claimForm){
      claimForm.hidden = true;
      delete claimForm.dataset.solverId;
    }
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
