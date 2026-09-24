# Match Ready Ref

A ready-to-upload, static football referee quiz website based on the **2026/27 Laws of the Game**. Includes 20 original scenarios, a mixed/topic quiz, 20 crawlable answer pages, a question bank, About and editorial policy pages, and mobile layouts. No account, subscription, back end, advertising, or “Work With Me” page. GA4 tracking can be activated with this site’s measurement ID.

## Publish

1. Create a new GitHub repository and upload **the contents of this folder** to the repository root, including `questions/`, `assets/`, and `questions.json`. GitHub Pages, Netlify, Cloudflare Pages or any static hosting service can serve it. For GitHub Pages, choose **Settings → Pages → Deploy from a branch → main → /(root)**. A project Pages URL under `/repository-name/` needs a custom domain or an adapted base path because site links start at `/`.
2. The included HTML, `robots.txt`, and `sitemap.xml` already use `https://matchreadyref.com`. Register that domain, point it to your published site, and use `python3 build.py --base-url https://matchreadyref.com` when you edit or add questions. Make your host redirect HTTP to HTTPS and choose one `www` or non-`www` host. Redirect `/index.html` to `/` in hosting settings if supported.
3. Submit `https://matchreadyref.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools after deployment. The site already allows normal indexing and AI crawlers in `robots.txt`. Crawling and inclusion in AI answers are controlled by each crawler and are not guaranteed. If you later add a CDN or firewall, allow the relevant verified crawlers there as well.
4. Do a final check on your published host: home page, practice test, question bank, one question page, `robots.txt`, and `sitemap.xml`.

## Work locally

Run `python3 -m http.server 8000` **from this folder** and visit `http://localhost:8000/`. Opening `index.html` directly with `file://` will not load the quiz data in many browsers.

To edit questions, update `questions.json` and run `python3 build.py` (or with your real `--base-url` if already published). Check that each answer and official source still match the current law. Commit the regenerated answer pages. The quiz reads the same JSON, avoiding separate sets of answers. URLs use stable question IDs: do not change an ID after publishing without a redirect.

## Editorial and identity

This is an independent study site, **not** The IFAB or an official referee exam. Visuals borrow the navy, slate, and electric yellow feel of the 2026/27 publication, with an original name, monogram, and field illustration. Do not add IFAB branding or republish its PDF on this site. The explanations paraphrase the official Laws and link back to The IFAB. Match regulations can modify the application of some protocols and options.

Version: 2026/27. Initial content reviewed against the user-provided IFAB 2026/27 PDF. Recheck when IFAB publishes corrections or the next edition.

## Google Analytics 4

Create a separate GA4 property for Match Ready Ref and a Web data stream with website URL `https://matchreadyref.com`. In Google Analytics, open Admin → Data streams → your Web stream and copy the Measurement ID beginning `G-`.

The site is configured with the Match Ready Ref GA4 web stream ID `G-3RDDMX0KZW` in `assets/analytics.js`. Upload that file to the `assets` folder on the existing `main` branch to activate tracking. Do not add a second tag for the same stream.

The Google tag runs on every generated HTML page and sends default `page_view` data. The quiz also sends `quiz_start`, `quiz_answer`, and `quiz_complete`. The events carry the selected topic; answer events include question ID, Law number, question number, and correctness; completion events include score and question count. No visitor-entered text is sent. Verify in GA4 Realtime or DebugView after publishing. If you already installed a tag for this same GA4 stream through Google Tag Manager or another snippet, use only one installation to avoid duplicate page views.
