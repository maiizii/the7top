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

  const btnLeaderboard = document.getElementById('btn-leaderboard');
  const leaderboardModal = document.getElementById('leaderboard-modal');
  const leaderboardClose = document.getElementById('leaderboard-close');
  const leaderboardStatus = document.getElementById('leaderboard-status');
  const leaderboardList = document.getElementById('leaderboard-list');
  const leaderboardWindow = leaderboardModal?.querySelector('.leaderboard-modal__window');
  if(leaderboardWindow && !leaderboardWindow.hasAttribute('tabindex')){
    leaderboardWindow.setAttribute('tabindex','-1');
  }
  let leaderboardLoading = false;
  let leaderboardPrevFocus = null;

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
    if(ok){
      claimStatus.className='status ok';
      claimStatus.textContent='Name recorded.';
      if(leaderboardModal && !leaderboardModal.hidden && !leaderboardLoading){
        openLeaderboard();
      }
    }
    else{ claimStatus.className='status no'; claimStatus.textContent='Failed to record.'; }
  });

  const openLeaderboard = async () => {
    if(!leaderboardModal) return;
    leaderboardPrevFocus = document.activeElement;
    leaderboardModal.hidden = false;
    document.body.classList.add('modal-open');
    if(leaderboardStatus){
      leaderboardStatus.textContent = 'Loading…';
      leaderboardStatus.hidden = false;
    }
    leaderboardList?.setAttribute('hidden', '');
    leaderboardWindow?.focus({ preventScroll:true });
    if(!leaderboardLoading){
      leaderboardLoading = true;
      try{
        const res = await fetch(`/api/leaderboard/${slug}`);
        if(!res.ok) throw new Error(`Failed to load leaderboard: ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        if(list.length === 0){
          if(leaderboardStatus){
            leaderboardStatus.textContent = 'No verified solvers yet.';
            leaderboardStatus.hidden = false;
          }
          if(leaderboardList){
            leaderboardList.innerHTML = '';
            leaderboardList.setAttribute('hidden', '');
          }
        }else if(leaderboardList){
          if(leaderboardStatus){
            leaderboardStatus.textContent = '';
            leaderboardStatus.hidden = true;
          }
          const fmtTime = (iso)=>{
            if(!iso) return '';
            const date = new Date(iso);
            if(Number.isNaN(date.getTime())) return '';
            const formatted = date.toLocaleString('en-US', { hour12:false, timeZone:'America/New_York' });
            return formatted;
          };
          leaderboardList.innerHTML = list.map((item)=>{
            const name = (item?.name || '—');
            const rank = item?.rank ?? '';
            const timeText = fmtTime(item?.claimedAt);
            const timeHtml = timeText ? `<span class="leaderboard-time">${timeText}</span>` : '';
            return `<li><strong>#${rank}</strong><span class="leaderboard-name">${name}</span>${timeHtml}</li>`;
          }).join('');
          leaderboardList.removeAttribute('hidden');
        }
      }catch(err){
        console.error(err);
        if(leaderboardStatus){
          leaderboardStatus.textContent = 'Unable to load leaderboard. Try again later.';
          leaderboardStatus.hidden = false;
        }
        if(leaderboardList){
          leaderboardList.innerHTML = '';
          leaderboardList.setAttribute('hidden', '');
        }
      }finally{
        leaderboardLoading = false;
      }
    }
  };

  const closeLeaderboard = () => {
    if(!leaderboardModal || leaderboardModal.hidden) return;
    leaderboardModal.hidden = true;
    document.body.classList.remove('modal-open');
    if(leaderboardPrevFocus && typeof leaderboardPrevFocus.focus === 'function'){
      leaderboardPrevFocus.focus();
    }
  };

  btnLeaderboard?.addEventListener('click', openLeaderboard);
  leaderboardClose?.addEventListener('click', closeLeaderboard);
  leaderboardModal?.addEventListener('click', (event)=>{
    if(event.target === leaderboardModal){
      closeLeaderboard();
    }
  });
  document.addEventListener('keydown', (event)=>{
    if(event.key === 'Escape'){
      closeLeaderboard();
    }
  });
})();
