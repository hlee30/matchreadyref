# Match Ready Ref

Static 2026/27 referee study site with a single **Quiz** page. Visitors choose Mixed or one of five topics, read a question, and select **See Decision** to reveal the answer. There are no multiple-choice options or self-reported scores.

- **The Start and Restart of Play:** 50 questions.
- **Ball in Play:** 19 questions, including eight that also belong in The Start and Restart of Play.
- **The Outcome of a Match:** 28 Law 10 questions.
- **Offside:** 73 Law 11 questions, including one that also belongs in The Start and Restart of Play.
- **Fouls and Misconduct:** 298 Law 12 questions, including 29 also found in earlier topics.
- **Mixed:** ten random questions from all 430 unique question records.

Each of the 430 question records has its own crawlable HTML answer page linked in `sitemap.xml`. The Quiz page also contains all questions and explanations in its HTML, so it remains readable without JavaScript. The topic filter and mixed selection run in the browser.

## Accounts and paid saved progress

The Quiz remains free and publicly readable. An account can unlock synced completed-question progress for **$4.99 USD, one time**. After revealing an answer, choose **Mark completed** if you got it right. Leave it unmarked if you want it to appear again. Completed questions are excluded from practice rounds and topic lists; **Review completed questions** lets you select **Practice again** to restore one. Question pages and answers remain public to search engines and AI crawlers. The login page is marked `noindex`.

GitHub Pages cannot store accounts or safely confirm payments on its own. The included Supabase authentication, database policies and Edge Functions use Stripe Checkout to verify a payment before saved progress is enabled. **Accounts and paid progress are inactive until you complete this setup**; the Quiz works without them. Do not publish a checkout link or solicit payments until both test and live purchases have been verified.

1. Create a Supabase project. In **Authentication → URL Configuration**, set the site URL to `https://matchreadyref.com` and add `https://matchreadyref.com/login.html` to Redirect URLs. Enable Email login and email confirmation; configure an SMTP provider and review email delivery limits before launch.
2. Run `supabase/schema.sql` in the Supabase SQL Editor. The database permits users to read only their own purchase and lets only paid users read or update their own question progress. Check the RLS policies are enabled on both tables.
3. In Stripe, create a **one-time USD $4.99 product** with a Price. Copy its `price_...` ID. Start with Stripe test mode; use the matching test secret key and test webhook signing secret. Production requires the live keys, live price and live webhook endpoint.
4. In the Supabase project's Edge Function secrets, set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SIGNING_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`. Never add these values to GitHub or any browser file. Supabase usually supplies `SUPABASE_URL` automatically. Deploy both functions with the Supabase CLI: `supabase functions deploy create-checkout` and `supabase functions deploy stripe-webhook --no-verify-jwt`. A signed-in user must call the first function; the second validates Stripe's signature. The included `supabase/config.toml` records the required JWT configuration.
5. In Stripe, create a webhook destination at `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook` and subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `charge.refunded`. Use that destination's `whsec_...` secret in Supabase. Only a paid $4.99 session for the configured Price grants access; a full refund revokes it.
6. Put the Supabase project URL and **publishable / anon key** into `assets/auth-config.js`. These are the only keys intended for public browser code. Confirm the full flow using a test account: sign up, confirm email, log in, complete a Stripe test purchase, wait for webhook confirmation, mark a question, sign out, log back in and verify progress, then restore it. Test a separate account cannot see that progress. Repeat once with Stripe live mode before offering paid access.

The Checkout return page checks for the webhook grant for about 20 seconds; if processing takes longer, users can reload the account page. A Stripe redirect alone never unlocks progress. If you choose a price other than $4.99 later, change the displayed amount, the Stripe Price, and the webhook's `499` cents verification together. Price, sales tax and refund treatment should be configured in your Stripe account before accepting live payments.

## Upload to GitHub Pages

Upload the **contents of this folder** to the root of the `main` branch of `hlee30/matchreadyref`. Keep `assets/`, `questions/` and `supabase/` as directories. Delete `question-bank.html` from the repository because the Quiz page replaces it. Also remove any older question pages that are absent from this package. A ZIP file uploaded to GitHub is not unpacked by GitHub Pages. The Supabase functions must also be deployed to Supabase as described above; uploading them to GitHub does not run them.

The included canonical URLs, `robots.txt`, and `sitemap.xml` use `https://matchreadyref.com`. GitHub Pages should serve `main` from `/(root)` with this domain configured. Submit the sitemap to search engines. Indexing by search engines and AI crawlers is controlled by those services.

## Edit questions

`questions.json` is the source of truth. Some entries belong to two topics through their `topics` array and have one canonical answer page. To change questions, edit the JSON, then regenerate pages:

```sh
python3 build.py --base-url https://matchreadyref.com
```

The builder removes old generated question pages whose IDs are absent from the JSON. Test locally with `python3 -m http.server 8000` in this folder; opening the HTML directly via `file://` may limit browser behavior.

## Sources

The question-and-answer sets were supplied by the site owner from The IFAB's Law 8, Law 9, Law 10, Law 11 and Law 12 FAQs. Each answer page links to an official source. Match Ready Ref is independent and not affiliated with or endorsed by The IFAB. Consult the official Laws and competition regulations for on-field decisions.

## GA4

`assets/analytics.js` contains Measurement ID `G-3RDDMX0KZW`. Page views and `quiz_start`, `quiz_reveal_answer`, and `quiz_complete` are configured. Reveal events do not tell whether someone answered correctly. Do not install a second tag with the same ID.
