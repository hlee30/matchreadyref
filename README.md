# Match Ready Ref

Static 2026/27 referee study site with a single **Quiz** page. Visitors choose Mixed or one of two topics, read a question, and select **See Decision** to reveal the answer. There are no multiple-choice options or self-reported scores.

- **The Start and Restart of Play:** 50 questions.
- **Ball in Play:** 19 questions, including eight that also belong in The Start and Restart of Play.
- **Mixed:** ten random questions from the 61 question records, including both topics.

Each of the 61 question records has its own crawlable HTML answer page linked in `sitemap.xml`. The Quiz page also contains all questions and explanations in its HTML, so it remains readable without JavaScript. The topic filter and mixed selection run in the browser.

## Upload to GitHub Pages

Upload the **contents of this folder** to the root of the `main` branch of `hlee30/matchreadyref`. Keep `assets/` and `questions/` as directories. Delete `question-bank.html` from the repository because the Quiz page replaces it. Also remove any older question pages that are absent from this package. A ZIP file uploaded to GitHub is not unpacked by GitHub Pages.

The included canonical URLs, `robots.txt`, and `sitemap.xml` use `https://matchreadyref.com`. GitHub Pages should serve `main` from `/(root)` with this domain configured. Submit the sitemap to search engines. Indexing by search engines and AI crawlers is controlled by those services.

## Edit questions

`questions.json` is the source of truth. Some entries belong to both topics through their `topics` array and have one canonical answer page. To change questions, edit the JSON, then regenerate pages:

```sh
python3 build.py --base-url https://matchreadyref.com
```

The builder removes old generated question pages whose IDs are absent from the JSON. Test locally with `python3 -m http.server 8000` in this folder; opening the HTML directly via `file://` may limit browser behavior.

## Sources

The question-and-answer sets were supplied by the site owner from The IFAB's Law 8 and Law 9 FAQs. Each answer page links to an official source. Match Ready Ref is independent and not affiliated with or endorsed by The IFAB. Consult the official Laws and competition regulations for on-field decisions.

## GA4

`assets/analytics.js` contains Measurement ID `G-3RDDMX0KZW`. Page views and `quiz_start`, `quiz_reveal_answer`, and `quiz_complete` are configured. Reveal events do not tell whether someone answered correctly. Do not install a second tag with the same ID.
