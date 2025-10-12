(function(){
  const h1 = document.querySelector('.title');
  if(h1) h1.setAttribute('data-text', h1.textContent.trim());
})();
(function(){
  const els = document.querySelectorAll('.section, .hero .lead, .hero .subtitle, .hero .cta');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.style.transition='opacity .6s ease, transform .6s ease';
        e.target.style.opacity='1';
        e.target.style.transform='translateY(0)';
        io.unobserve(e.target);
      }
    });
  },{threshold:.12});
  els.forEach(el=>{
    el.style.opacity='0';
    el.style.transform='translateY(8px)';
    io.observe(el);
  });
})();
