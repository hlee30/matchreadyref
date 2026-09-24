(() => {
  'use strict';
  const box = document.querySelector('#quiz');
  const topic = document.querySelector('#topic');
  if (!box || !topic) return;

  let bank = [];
  let round = [];
  let index = 0;
  let reveals = 0;

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function link(href, label) {
    const node = element('a', '', label);
    node.href = href;
    return node;
  }
  function shuffled(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function start() {
    const available = bank.filter(q => topic.value === 'all' || q.topic === topic.value);
    round = shuffled(available).slice(0, topic.value === 'all' ? 10 : available.length);
    index = 0;
    reveals = 0;
    window.mrrTrack?.('quiz_start', {quiz_topic: topic.value, question_count: round.length});
    show();
  }
  function show() {
    box.replaceChildren();
    if (index >= round.length) {
      window.mrrTrack?.('quiz_complete', {
        quiz_topic: topic.value, question_count: round.length, answers_revealed: reveals
      });
      box.append(
        element('p', 'eyebrow', 'ROUND COMPLETE'),
        element('h2', '', `You reviewed ${round.length} questions.`),
        element('p', 'score', `Answers revealed: ${reveals}`)
      );
      const actions = element('div', 'quiz-actions');
      const again = element('button', 'button primary', 'Try another round ↗');
      again.type = 'button';
      again.addEventListener('click', start);
      actions.append(again, link('/question-bank.html', 'Browse all questions →'));
      box.append(actions);
      return;
    }
    const q = round[index];
    const heading = element('div', 'quiz-top');
    heading.append(
      element('span', 'eyebrow', `LAW ${q.law} · ${q.topic}`),
      element('span', 'eyebrow', `${index + 1} / ${round.length}`)
    );
    const progress = element('div', 'progress');
    const bar = element('span');
    bar.style.width = (index / round.length * 100) + '%';
    progress.append(bar);
    box.append(heading, progress, element('h2', '', q.question));

    const details = element('details', 'answer-reveal');
    const summary = element('summary', 'button primary', 'Show answer ↓');
    const answer = element('div', 'feedback');
    answer.append(element('strong', '', 'The decision'), element('p', '', q.explanation));
    const official = link(q.source, 'Read official Law 8 ↗');
    official.target = '_blank';
    official.rel = 'noopener';
    answer.append(official);
    details.append(summary, answer);
    let counted = false;
    details.addEventListener('toggle', () => {
      if (details.open && !counted) {
        counted = true;
        reveals++;
        window.mrrTrack?.('quiz_reveal_answer', {
          quiz_topic: topic.value, question_id: q.id,
          law_number: q.law, question_number: index + 1
        });
      }
    });
    const actions = element('div', 'quiz-actions');
    const next = element('button', 'button outline',
      index === round.length - 1 ? 'Finish round →' : 'Next question →');
    next.type = 'button';
    next.addEventListener('click', () => {
      index++;
      show();
      box.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
    actions.append(next, link('/questions/' + q.id + '.html', 'Question page ↗'));
    box.append(details, actions);
  }
  fetch('/questions.json')
    .then(response => {
      if (!response.ok) throw Error('Unable to load questions');
      return response.json();
    })
    .then(data => {
      bank = data;
      topic.addEventListener('change', start);
      start();
    })
    .catch(() => {
      box.replaceChildren(
        element('h2', '', 'The quiz could not load.'),
        element('p', '', 'Open the published site or run a local web server.'),
        link('/question-bank.html', 'Browse all questions →')
      );
    });
})();
