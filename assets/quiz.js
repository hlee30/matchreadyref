(() => {
  'use strict';
  const topic = document.querySelector('#topic');
  const list = document.querySelector('#quiz');
  const count = document.querySelector('#quiz-count');
  if (!topic || !list || !count) return;
  const cards = [...list.querySelectorAll('.quiz-question')];
  const memberships = card => JSON.parse(card.dataset.topics);
  const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const requested = new URLSearchParams(location.search).get('topic');
  const match = [...topic.options].find(option => slug(option.value) === requested);
  if (match) topic.value = match.value;

  let shown = [];
  let revealed = new Set();
  const shuffle = items => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  function display() {
    cards.forEach(card => {
      card.hidden = true;
      card.querySelector('details').open = false;
    });
    revealed = new Set();
    const matching = cards.filter(card =>
      topic.value === 'all' || memberships(card).includes(topic.value));
    shown = topic.value === 'all' ? shuffle(matching).slice(0, 10) : matching;
    shown.forEach(card => { card.hidden = false; });
    count.textContent = topic.value === 'all'
      ? `Mixed quiz · ${shown.length} questions from both topics`
      : `${topic.value} · ${shown.length} questions`;
    window.mrrTrack?.('quiz_start', {
      quiz_topic: topic.value, question_count: shown.length
    });
  }
  cards.forEach(card => card.querySelector('details').addEventListener('toggle', event => {
    if (!event.target.open || card.hidden || revealed.has(card.id)) return;
    revealed.add(card.id);
    window.mrrTrack?.('quiz_reveal_answer', {
      quiz_topic: topic.value,
      question_id: card.id.slice(5),
      question_number: shown.indexOf(card) + 1
    });
    if (revealed.size === shown.length) {
      window.mrrTrack?.('quiz_complete', {
        quiz_topic: topic.value, question_count: shown.length,
        answers_revealed: revealed.size
      });
    }
  }));
  topic.addEventListener('change', () => {
    const url = new URL(location.href);
    if (topic.value === 'all') url.searchParams.delete('topic');
    else url.searchParams.set('topic', slug(topic.value));
    history.replaceState(null, '', url);
    display();
  });
  display();
})();
