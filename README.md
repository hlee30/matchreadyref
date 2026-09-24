# Match Ready Ref

Static referee study site for the 2026/27 Laws of the Game. The question bank now contains only the 50 Law 8 FAQ question-and-answer pairs supplied by the site owner, under **The Start and Restart of Play**. There are no multiple-choice options. Each question has a Show answer control and a link to the corresponding official IFAB Law 8 page.

The quiz uses ten random questions in the mixed round or the full set when the Law 8 topic is selected. It does not score correctness, since visitors decide on an answer themselves before revealing the ruling. All 50 individual answer pages are HTML with canonical URLs and are listed in `sitemap.xml`; they can be read without JavaScript.

## Upload to GitHub Pages

Upload the **contents of this folder** to the root of the `main` branch of `hlee30/matchreadyref`. Preserve the `assets/` and `questions/` folders. Replacing the entire repository contents is the simplest way to remove the old question pages; do not leave older `questions/*.html` files in the published branch. The site uses `https://matchreadyref.com` in its canonical URLs, sitemap, and internal links.

GitHub Pages settings: deploy from `main`, `/(root)`, with `matchreadyref.com` as the custom domain. Submit `https://matchreadyref.com/sitemap.xml` to search engines. `robots.txt` permits crawlers. Search or AI inclusion is controlled by those services.

## Edit questions

`questions.json` is the source for the quiz and HTML answer pages. To edit or add questions, update that file and run:

```sh
python3 build.py --base-url https://matchreadyref.com
```

The builder removes old generated question pages whose IDs are no longer in the JSON. Run `python3 -m http.server 8000` from this folder to test the quiz locally. Opening the HTML directly from `file://` may prevent it from loading `questions.json`.

## Attribution

These FAQ scenarios and answers were supplied by the site owner from The IFAB's Law 8 page. Every answer page links to the official source. Match Ready Ref is independent and is not affiliated with or endorsed by The IFAB. Check the official Law and competition rules before applying a decision in a match.

## GA4

`assets/analytics.js` is configured for Match Ready Ref's GA4 Measurement ID `G-3RDDMX0KZW`. The site records page views, `quiz_start`, `quiz_reveal_answer`, and `quiz_complete`. Revealing an answer does not indicate whether a user got it right. Do not add a second tag with the same ID, or page views could be duplicated.
