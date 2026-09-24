import { authConfigured, getClient } from './auth-client.js';
import { hasProgressAccess, startProgressCheckout } from './payments.js';

const topic = document.querySelector('#topic');
const list = document.querySelector('#quiz-list');
const count = document.querySelector('#quiz-count');
const progressStatus = document.querySelector('#progress-status');
const progressViews = document.querySelector('#progress-views');
const practiceLink = document.querySelector('#practice-remaining');
const reviewLink = document.querySelector('#review-completed');
const upgrade = document.querySelector('#progress-upgrade');
const cards = [...list.querySelectorAll('.quiz-question')];
const membership = card => JSON.parse(card.dataset.topics);
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const params = new URLSearchParams(location.search);
const selected = [...topic.options].find(option => slug(option.value) === params.get('topic'));
if (selected) topic.value = selected.value;
const review = params.get('completed') === '1';
let shown = [];
let revealed = new Set();
let completed = new Set();
let user = null;
let client = null;
let progressReady = false;
const empty = document.createElement('p');
empty.className = 'quiz-empty';
list.append(empty);
const shuffle = items => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
function display() {
  for (const card of cards) {
    card.hidden = true;
    card.querySelector('details').open = false;
  }
  revealed = new Set();
  const matching = cards.filter(card => (!review || progressReady) && (topic.value === 'all' || membership(card).includes(topic.value)) &&
    (!progressReady || !user || (review ? completed.has(card.id.slice(5)) : !completed.has(card.id.slice(5)))));
  shown = topic.value === 'all' && !review ? shuffle(matching).slice(0, 10) : matching;
  for (const card of shown) card.hidden = false;
  count.textContent = review && user ? `Completed questions · ${shown.length} shown`
    : topic.value === 'all' ? `Mixed quiz · ${shown.length} questions across all topics`
      : `${topic.value} · ${shown.length} questions`;
  empty.textContent = shown.length ? '' : review && !progressReady
    ? 'Sign in and unlock saved progress to review completed questions.' : review && user
    ? 'No completed questions for this topic yet. Return to the quiz to practice.'
    : user ? 'You completed all questions in this topic. Review completed questions or choose another topic.'
      : 'No questions available for this topic.';
  empty.hidden = shown.length > 0;
  if (!review) window.mrrTrack?.('quiz_start', { quiz_topic: topic.value, question_count: shown.length });
}
function updateProgress() {
  progressStatus.textContent = `${completed.size} completed · ${cards.length - completed.size} left to practice. Unmarked questions will reappear in quizzes.`;
  progressViews.hidden = false;
  const topicParam = topic.value === 'all' ? '' : `topic=${encodeURIComponent(slug(topic.value))}`;
  practiceLink.href = `/practice-tests.html${topicParam ? `?${topicParam}` : ''}`;
  reviewLink.href = `/practice-tests.html?completed=1${topicParam ? `&${topicParam}` : ''}`;
  for (const [link, active] of [[practiceLink, !review], [reviewLink, review]]) {
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  reviewLink.textContent = `Completed questions (${completed.size})`;
}
for (const card of cards) {
  const details = card.querySelector('details');
  const actions = card.querySelector('.decision-actions');
  const button = card.querySelector('.mark-complete');
  const message = card.querySelector('.save-status');
  details.addEventListener('toggle', () => {
    if (!details.open || card.hidden || revealed.has(card.id)) return;
    revealed.add(card.id);
    window.mrrTrack?.('quiz_reveal_answer', {
      quiz_topic: topic.value, question_id: card.id.slice(5), question_number: shown.indexOf(card) + 1
    });
    if (revealed.size === shown.length) window.mrrTrack?.('quiz_complete', {
      quiz_topic: topic.value, question_count: shown.length, answers_revealed: revealed.size
    });
  });
  button.addEventListener('click', async () => {
    if (!client || !user) return;
    const id = card.id.slice(5);
    const wasCompleted = completed.has(id);
    button.disabled = true;
    message.textContent = 'Saving…';
    try {
      const { error } = wasCompleted
        ? await client.from('question_progress').delete().eq('user_id', user.id).eq('question_id', id)
        : await client.from('question_progress').upsert({ user_id: user.id, question_id: id, completed: true }, { onConflict: 'user_id,question_id' });
      if (error) throw error;
      if (wasCompleted) completed.delete(id); else completed.add(id);
      updateProgress();
      window.mrrTrack?.(wasCompleted ? 'quiz_restore_question' : 'quiz_mark_completed', { question_id: id });
      display();
    } catch (error) {
      message.textContent = `Could not save: ${error.message || 'please try again'}`;
    } finally {
      button.disabled = false;
    }
  });
  actions.hidden = true;
}
topic.addEventListener('change', () => {
  const url = new URL(location.href);
  if (topic.value === 'all') url.searchParams.delete('topic');
  else url.searchParams.set('topic', slug(topic.value));
  history.replaceState(null, '', url);
  if (progressReady) updateProgress();
  display();
});
display();
if (authConfigured) {
  try {
    client = await getClient();
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    user = session?.user || null;
    if (user) {
      const paid = await hasProgressAccess(client, user.id);
      if (!paid) {
        progressStatus.textContent = 'Unlock saved progress for $4.99, paid once. The Quiz is free.';
        upgrade.hidden = false;
        upgrade.querySelector('button').addEventListener('click', event =>
          startProgressCheckout(client, event.currentTarget, message => { progressStatus.textContent = message; }));
        display();
      } else {
      const { data, error } = await client.from('question_progress').select('question_id').eq('user_id', user.id).eq('completed', true);
      if (error) throw error;
      completed = new Set(data.map(row => row.question_id));
      progressReady = true;
      for (const card of cards) {
        card.querySelector('.decision-actions').hidden = false;
        card.querySelector('.mark-complete').textContent = review ? 'Practice again ↩' : 'Mark completed ✓';
      }
      updateProgress();
      display();
      }
    } else {
      progressStatus.innerHTML = '<a href="/login.html">Log in or create an account</a> to unlock saved progress for $4.99, paid once.';
      display();
    }
  } catch (error) {
    progressStatus.textContent = 'Saved progress is temporarily unavailable. You can still practice without signing in.';
  }
} else {
  progressStatus.textContent = 'Account progress is being set up. You can still use the Quiz.';
}
