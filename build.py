#!/usr/bin/env python3
"""Build the checked-in static pages from original question content. Python 3 only."""
import argparse, html, json, pathlib, re, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parent
Q = json.loads((ROOT / 'questions.json').read_text(encoding='utf-8'))
TOPICS = ["The Start and Restart of Play", "Ball in Play", "The Outcome of a Match"]

def esc(value): return html.escape(str(value), quote=True)
def canon(path, base): return f'<link rel="canonical" href="{esc(base + path)}">' if base else ''
def head(title, description, path, base):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#071b25"><meta name="description" content="{esc(description)}"><meta name="robots" content="index,follow,max-snippet:-1"><title>{esc(title)} | Match Ready Ref</title>{canon(path, base)}<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"></head>'''
def shell(title, description, path, base, body, script=''):
    nav = '<nav aria-label="Main navigation"><a href="/">Home</a><a href="/practice-tests.html">Quiz</a><a href="/about.html">About</a></nav>'
    footer = '<footer><div class="wrap footgrid"><div><strong>MATCH READY REF<span class="lime">.</span></strong><p>Independent football referee study practice. Based on the 2026/27 Laws of the Game.</p></div><div><a href="/editorial-policy.html">Editorial policy</a><a href="/about.html">About</a><a href="https://www.theifab.com/laws-of-the-game-documents/?language=all&amp;year=2026%2F27" rel="noopener">Official IFAB Laws ↗</a></div></div><div class="wrap small">Not affiliated with or endorsed by The IFAB. The official Laws and your competition rules take precedence.</div></footer>'
    return head(title,description,path,base)+f'<body><a class="skip" href="#main">Skip to content</a><header><div class="wrap top"><a class="brand" href="/" aria-label="Match Ready Ref home"><svg class="brand-mark" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false"><rect width="48" height="48" fill="#effa57"/><text x="24" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#071b25">M</text><text x="24" y="29" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#617114">/</text><text x="24" y="43" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#071b25">R</text></svg><span>MATCH<br>READY REF</span></a><button class="menu" id="menu" type="button" aria-controls="site-nav" aria-expanded="false">Menu <span aria-hidden="true">☰</span></button><div id="site-nav">{nav}</div></div></header><main id="main">{body}</main>{footer}<script src="/assets/site.js" defer></script><script src="/assets/analytics.js" defer></script>{script}</body></html>'
def card(q, topic=None):
    return f'<a class="qcard" href="/questions/{q["id"]}.html"><span class="eyebrow">LAW {q["law"]} · {esc(topic or q["topic"])}</span><strong>{esc(q["question"])}</strong><span class="arrow">See decision →</span></a>'

def build(base):
    features = ''.join(f'<a class="topic" href="/practice-tests.html?topic={re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")}"><span>{t}</span><b>{sum(t in q.get("topics", [q["topic"]]) for q in Q):02}</b></a>' for t in TOPICS)
    home = f'''<section class="hero"><div class="wrap hero-grid"><div><p class="kicker"><span class="dot"></span> 2026/27 EDITION · FREE PRACTICE</p><h1>Make the<br><em>right call.</em></h1><p class="lede">Real match moments. Clear decisions. Practice the Laws of the Game one scenario at a time.</p><div class="buttons"><a class="button primary" href="/practice-tests.html">Start a practice test <span>↗</span></a><a class="button outline" href="/practice-tests.html#topic">Explore topics</a></div><div class="hero-meta"><span>{len(Q)} question pages</span><span>{len(TOPICS)} topic groups</span><span>Source-linked explanations</span></div></div><div class="hero-art" aria-hidden="true"><div class="field"><div class="midline"></div><div class="circle"></div><div class="box left"></div><div class="box right"></div><div class="spot one"></div><div class="spot two"></div><div class="spot three"></div><div class="trace"></div></div><div class="art-label">READ THE PLAY <span>↘</span><br>MAKE THE DECISION.</div></div></div></section>'''
    home += f'<section class="section wrap"><div class="section-head"><div><p class="eyebrow">THE TRAINING GROUND</p><h2>Practice how you referee.</h2></div><p>Read a match scenario, decide your call, then reveal the answer and official source.</p></div><div class="steps"><article><b>01 / READ</b><h3>See the moment.</h3><p>Work through a match scenario before viewing the decision.</p></article><article><b>02 / DECIDE</b><h3>Make the call.</h3><p>Form your own answer before revealing the decision.</p></article><article><b>03 / LEARN</b><h3>Check the Law.</h3><p>Read the answer and open the corresponding official Law.</p></article></div></section>'
    home += f'<section class="section topics-section"><div class="wrap"><div class="section-head"><div><p class="eyebrow">FIND YOUR FOCUS</p><h2>Browse by topic.</h2></div><a class="text-link" href="/practice-tests.html">View all questions →</a></div><div class="topic-grid">{features}</div></div></section>'
    home += f'<section class="section wrap"><div class="section-head"><div><p class="eyebrow">FROM THE PITCH</p><h2>Try one now.</h2></div><a class="text-link" href="/practice-tests.html">Take the test →</a></div><div class="cards">{card(Q[1])}{card(Q[4])}{card(Q[8])}</div></section>'
    home += '<section class="closing"><div class="wrap"><p class="eyebrow">READY FOR THE NEXT DECISION?</p><h2>Train the detail.<br>Trust your call.</h2><a class="button primary" href="/practice-tests.html">Start practicing <span>↗</span></a></div></section>'
    (ROOT/'index.html').write_text(shell('Football referee law quizzes 2026/27','Football referee study questions for the 2026/27 Laws of the Game. Scenario quizzes with explanations and official IFAB sources.','/',base,home),encoding='utf-8')
    question_cards = ''.join(
        f'<article class="quiz-question" data-topics="{esc(json.dumps(q.get("topics", [q["topic"]])))}" id="quiz-{esc(q["id"])}">'
        f'<p class="eyebrow">LAW {q["law"]} · {esc(" / ".join(q.get("topics", [q["topic"]])))}</p>'
        f'<h2>{esc(q["question"])}</h2>'
        f'<details class="answer-reveal"><summary class="button primary">See Decision <span aria-hidden="true">↓</span></summary>'
        f'<div class="feedback"><strong>The decision</strong><p>{esc(q["explanation"])}</p>'
        f'<a href="{esc(q["source"])}" target="_blank" rel="noopener">Read official Law {q["law"]} ↗</a></div></details></article>'
        for q in Q
    )
    practice = (
        '<section class="pagehero wrap"><p class="eyebrow">ON-FIELD DECISIONS · 2026/27</p>'
        '<h1>Quiz<span class="lime">.</span></h1><p>Choose a topic. Read each question, make your call, then select See Decision.</p></section>'
        '<section class="wrap quiz-layout"><aside class="quiz-aside"><label for="topic">Choose a topic</label>'
        '<select id="topic"><option value="all">All topics - mixed quiz</option>'
        + ''.join(f'<option value="{esc(t)}">{esc(t)}</option>' for t in TOPICS)
        + '</select><div class="aside-note"><span class="eyebrow">HOW IT WORKS</span>'
        '<p>Mixed shows ten questions across all topics. Choosing a topic shows its full set.</p></div></aside>'
        '<div class="quiz-list" id="quiz-list" aria-live="polite"><p class="quiz-count" id="quiz-count">All questions</p>'
        + question_cards + '</div></section>'
    )
    (ROOT/'practice-tests.html').write_text(shell('Free football referee quiz','Study 2026/27 Law 8, Law 9 and Law 10 match scenarios by topic or mixed quiz. Reveal each decision and check the official IFAB Laws.','/practice-tests.html',base,practice,'<script src="/assets/quiz.js?v=20260924-law10" defer></script>'),encoding='utf-8')
    old_bank = ROOT/'question-bank.html'
    if old_bank.exists(): old_bank.unlink()
    question_dir = ROOT/'questions'
    question_dir.mkdir(exist_ok=True)
    for old_page in question_dir.glob('*.html'):
        if old_page.stem not in {q['id'] for q in Q}:
            old_page.unlink()
    for q in Q:
        path=f'/questions/{q["id"]}.html'
        jsonld=json.dumps({"@context":"https://schema.org","@type":"Question","name":q['question'],"acceptedAnswer":{"@type":"Answer","text":q['explanation']},"about":{"@type":"CreativeWork","name":f"Law {q['law']} · 2026/27 Laws of the Game","url":q['source']}},ensure_ascii=False).replace('</','<\\/')
        body=f'<section class="pagehero wrap narrow"><p class="eyebrow">LAW {q["law"]} · {esc(q["topic"])} · 2026/27</p><h1 class="question-title">{esc(q["question"])}</h1></section><div class="wrap narrow answer-layout"><details class="answer-reveal"><summary class="button primary">See Decision <span aria-hidden="true">↓</span></summary><article class="answer-box"><p class="eyebrow">THE DECISION</p><p>{esc(q["explanation"])}</p><a class="text-link" href="{esc(q["source"])}" rel="noopener" target="_blank">Read official Law {q["law"]} ↗</a></article></details><div class="next-actions"><a class="button primary" href="/practice-tests.html">Take a practice test ↗</a><a class="text-link" href="/practice-tests.html">← Quiz</a></div></div><script type="application/ld+json">{jsonld}</script>'
        (ROOT/path.lstrip('/')).write_text(shell(q['question'],q['explanation'],path,base,body),encoding='utf-8')
    about='''<section class="pagehero wrap narrow"><p class="eyebrow">ABOUT THIS PROJECT</p><h1>Study the moment.<br><span class="lime">Understand the Law.</span></h1><p>Match Ready Ref is an independent practice site for football referees and learners. It presents Law 8, Law 9 and Law 10 match situations as questions with revealable answers and direct links to the official 2026/27 Laws of the Game.</p></section><section class="wrap narrow prose"><h2>How to use it</h2><p>Take a mixed practice round, reveal each answer, then follow the official source for decisions you want to review. The quiz questions and individual answer pages are readable without JavaScript, including by search crawlers and assistive technology.</p><h2>Scope</h2><p>The scenarios assume the 2026/27 Laws of the Game and ordinary 11-a-side play unless a question says otherwise. Some protocols, competition options, and local rules vary. Check the competition regulations before applying a decision in a match.</p><p>This site is not affiliated with, approved by, or endorsed by The International Football Association Board (The IFAB).</p><p><a class="text-link" href="https://www.theifab.com/laws-of-the-game-documents/?language=all&amp;year=2026%2F27" rel="noopener">Open the official 2026/27 Laws ↗</a></p></section>'''
    (ROOT/'about.html').write_text(shell('About','How Match Ready Ref creates independent 2026/27 referee law practice questions and links to the official IFAB Laws.','/about.html',base,about),encoding='utf-8')
    editorial='''<section class="pagehero wrap narrow"><p class="eyebrow">OUR METHOD</p><h1>Editorial policy<span class="lime">.</span></h1><p>Our questions focus on specific match decisions, with the circumstances stated in each scenario.</p></section><section class="wrap narrow prose"><h2>Sources and review</h2><p>The source for this edition is The IFAB’s 2026/27 Laws of the Game, including the Notes and modifications and the protocols where relevant. Each question links to an official Law page. The current Law 8, Law 9 and Law 10 question sets were supplied by the site owner from The IFAB FAQs; answers are attributed by link to the official source.</p><h2>Version and corrections</h2><p>Questions are labeled 2026/27. When The IFAB issues a correction or a new edition, answers should be checked before relabeling the site. Competition-specific rules can differ. The official publication controls if any answer conflicts with it.</p><h2>Independence</h2><p>Match Ready Ref is independently produced. References to The IFAB describe the source of the Laws and do not imply endorsement.</p></section>'''
    (ROOT/'editorial-policy.html').write_text(shell('Editorial policy','How Match Ready Ref questions are sourced, explained, reviewed, and updated against the official 2026/27 Laws.','/editorial-policy.html',base,editorial),encoding='utf-8')
    (ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n'+('Sitemap: '+base+'/sitemap.xml\n' if base else ''),encoding='utf-8')
    sitemap=ROOT/'sitemap.xml'
    if base:
        paths=['/','/practice-tests.html','/about.html','/editorial-policy.html']+[f'/questions/{q["id"]}.html' for q in Q]
        sitemap.write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'<url><loc>{esc(base+p)}</loc></url>\n' for p in paths)+'</urlset>\n',encoding='utf-8')
    elif sitemap.exists(): sitemap.unlink()
    print(f'Built {len(Q)} answer pages. '+('Sitemap and canonical URLs generated.' if base else 'Set --base-url after choosing the final domain to generate sitemap and canonicals.'))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--base-url',help='Final origin, e.g. https://matchreadyref.com (no trailing slash)')
    args=p.parse_args(); base=args.base_url.rstrip('/') if args.base_url else None
    if base and (not re.fullmatch(r'https://[a-zA-Z0-9.-]+(?::[0-9]+)?',base) or base.endswith('.example')): p.error('Use a real HTTPS origin without a path or trailing slash')
    build(base)
