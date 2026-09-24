const menu=document.querySelector('#menu');const nav=document.querySelector('#site-nav');if(menu&&nav){menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}})}

// Keep the account link in sync on every page, including after sign-in or sign-out.
const accountLink = nav?.querySelector('a[href="/login.html"]');
if (accountLink) {
  import('./auth-client.js').then(async ({ authConfigured, getClient }) => {
    if (!authConfigured) return;
    const client = await getClient();
    const showSession = session => {
      accountLink.textContent = session?.user ? 'Account · Signed in' : 'Log in';
      accountLink.setAttribute('aria-label', session?.user ? 'Account, signed in' : 'Log in');
    };
    client.auth.onAuthStateChange((_event, session) => showSession(session));
    const { data, error } = await client.auth.getSession();
    if (!error) showSession(data.session);
  }).catch(() => {});
}
