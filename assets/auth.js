import { authConfigured, getClient } from './auth-client.js';
import { hasProgressAccess, startProgressCheckout } from './payments.js';

const status = document.querySelector('#auth-status');
const form = document.querySelector('#auth-form');
const forms = document.querySelector('#auth-forms');
const account = document.querySelector('#account-panel');
const emailDisplay = document.querySelector('#account-email');
const passwordField = document.querySelector('#password-field');
const password = document.querySelector('#auth-password');
const submit = document.querySelector('#auth-submit');
const newPasswordForm = document.querySelector('#new-password-form');
const tabs = [...document.querySelectorAll('[data-auth-mode]')];
const upgrade = document.querySelector('#account-upgrade');
const accountLinks = document.querySelector('#account-links');
const accountProgress = document.querySelector('#account-progress');
const say = (message, error = false) => {
  status.textContent = message;
  status.classList.toggle('error', error);
};

if (!authConfigured) {
  forms.hidden = true;
  say('Account sign-in is being set up. You can use the Quiz without an account.');
} else {
  try {
    const client = await getClient();
    let mode = 'signin';
    let recovering = false;
    const redirectTo = `${location.origin}/login.html`;

    const showAccount = user => {
      forms.hidden = Boolean(user);
      account.hidden = !user || recovering;
      if (user) emailDisplay.textContent = user.email || 'Account';
      if (!user) { upgrade.hidden = true; accountLinks.hidden = true; accountProgress.textContent = ''; }
    };
    async function loadPurchase(user) {
      if (!user || recovering) return;
      upgrade.hidden = true;
      accountLinks.hidden = true;
      accountProgress.textContent = 'Checking saved progress access…';
      try {
        const paid = await hasProgressAccess(client, user.id);
        if (account.hidden || emailDisplay.textContent !== (user.email || 'Account')) return;
        upgrade.hidden = paid;
        accountLinks.hidden = !paid;
        accountProgress.textContent = paid ? 'Saved progress is active for your account.' : 'The Quiz is free. Saved progress is a one-time purchase.';
      } catch {
        accountProgress.textContent = 'Could not check purchase status. Please reload this page.';
      }
    }
    const chooseMode = next => {
      mode = next;
      tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.authMode === mode)));
      passwordField.hidden = next === 'reset';
      password.required = next !== 'reset';
      password.autocomplete = next === 'signup' ? 'new-password' : 'current-password';
      submit.textContent = next === 'signin' ? 'Log in ↗' : next === 'signup' ? 'Create account ↗' : 'Send reset link ↗';
      say('');
    };
    tabs.forEach(tab => tab.addEventListener('click', () => chooseMode(tab.dataset.authMode)));

    client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovering = true;
        forms.hidden = true;
        account.hidden = true;
        newPasswordForm.hidden = false;
        say('Enter a new password to finish resetting your account.');
      } else if (!recovering) {
        showAccount(session?.user);
        if (session?.user) void loadPurchase(session.user);
        if (event === 'SIGNED_IN') say('You are signed in.');
      }
    });

    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!recovering) showAccount(session?.user);
    if (session?.user && !recovering) void loadPurchase(session.user);
    if (new URLSearchParams(location.search).get('payment') === 'success') {
      say('Payment received. Confirming saved progress access…');
      if (session?.user) {
        for (let attempt = 0; attempt < 10; attempt++) {
          if (await hasProgressAccess(client, session.user.id)) { await loadPurchase(session.user); say('Saved progress is unlocked.'); break; }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        if (upgrade.hidden === false) say('Payment confirmation is still processing. Reload this page shortly.');
      } else {
        say('Sign in with the account used at checkout to view your purchase.');
      }
      history.replaceState(null, '', '/login.html');
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const email = form.elements.email.value.trim();
      submit.disabled = true;
      say('Working…');
      try {
        let result;
        if (mode === 'signin') result = await client.auth.signInWithPassword({ email, password: password.value });
        if (mode === 'signup') result = await client.auth.signUp({ email, password: password.value, options: { emailRedirectTo: redirectTo } });
        if (mode === 'reset') result = await client.auth.resetPasswordForEmail(email, { redirectTo });
        if (result.error) throw result.error;
        if (mode === 'signup' && !result.data.session) say('Check your email for a confirmation link.');
        else if (mode === 'reset') say('If an account exists for that email, a reset link is on its way.');
        else if (mode === 'signin') say('You are signed in.');
        password.value = '';
      } catch (error) {
        say(error.message || 'Something went wrong. Please try again.', true);
      } finally {
        submit.disabled = false;
      }
    });

    newPasswordForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = newPasswordForm.querySelector('button');
      button.disabled = true;
      say('Saving your password…');
      const { error } = await client.auth.updateUser({ password: newPasswordForm.querySelector('input').value });
      button.disabled = false;
      if (error) return say(error.message, true);
      recovering = false;
      newPasswordForm.hidden = true;
      const { data: { user } } = await client.auth.getUser();
      showAccount(user);
      if (user) void loadPurchase(user);
      say('Password updated. You are signed in.');
      history.replaceState(null, '', '/login.html');
    });

    document.querySelector('#sign-out').addEventListener('click', async () => {
      const { error } = await client.auth.signOut();
      if (error) return say(error.message, true);
      showAccount(null);
      chooseMode('signin');
      say('You are signed out.');
    });
    document.querySelector('[data-start-checkout]').addEventListener('click', event =>
      startProgressCheckout(client, event.currentTarget, message => say(message)));
  } catch (error) {
    forms.hidden = true;
    say('Account sign-in is temporarily unavailable. Please try again later.', true);
  }
}
