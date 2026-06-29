
const menuButton=document.querySelector('[data-menu-toggle]');
const menu=document.getElementById('main-menu');
function closeMenu(){if(!menuButton||!menu)return;menu.classList.remove('open');menuButton.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
if(menuButton&&menu){menuButton.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));window.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});window.addEventListener('resize',()=>{if(window.innerWidth>900)closeMenu();});}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
