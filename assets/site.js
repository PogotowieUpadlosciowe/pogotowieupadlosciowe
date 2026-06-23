
document.querySelectorAll('[data-menu-toggle]').forEach(button=>button.addEventListener('click',()=>{const menu=document.getElementById('main-menu');const open=menu.classList.toggle('open');button.setAttribute('aria-expanded',String(open));}));
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
