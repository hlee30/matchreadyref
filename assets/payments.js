export async function hasProgressAccess(client, userId) {
  const { data, error } = await client.from('account_entitlements')
    .select('user_id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function startProgressCheckout(client, button, say) {
  button.disabled = true;
  say('Opening secure checkout…');
  try {
    const { data, error } = await client.functions.invoke('create-checkout', { body: {} });
    if (error || data?.error) throw new Error(data?.error || error?.message || 'Checkout is unavailable');
    if (data.alreadyPurchased) {
      say('Your purchase is active. Reload the page to use saved progress.');
      return;
    }
    if (!data?.url || !data.url.startsWith('https://checkout.stripe.com/')) throw new Error('Unexpected checkout URL');
    location.assign(data.url);
  } catch (error) {
    say(`Could not start checkout: ${error.message}`);
  } finally {
    button.disabled = false;
  }
}
