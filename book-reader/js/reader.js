(async function () {
  const params = new URLSearchParams(location.search);
  const chapterId = Number(params.get('ch')) || 1;
  const requestedPart = Number(params.get('part'));

  const titleEl = document.getElementById('chapter-title');
  const tabsEl = document.getElementById('part-tabs');
  const transcriptEl = document.getElementById('transcript');
  const statusEl = document.getElementById('player-status');
  const audioEl = document.getElementById('audio-player');
  const imageEl = document.getElementById('part-image');
  const nextChapterLink = document.getElementById('next-chapter-link');
  const prevChapterLink = document.getElementById('prev-chapter-link');
  const prevChapterLabel = document.getElementById('prev-chapter-label');
  const pdfLink = document.getElementById('pdf-link');

  let data, chapter, activePartIndex = -1, words = [], rafId = null;

  try {
    const res = await fetch('data/book.json');
    data = await res.json();
  } catch (err) {
    titleEl.textContent = 'Could not load book.json';
    console.error(err);
    return;
  }

  chapter = data.chapters.find((c) => c.id === chapterId);
  if (!chapter) {
    titleEl.textContent = 'Chapter not found';
    return;
  }

  document.title = `${chapter.title} — ${data.title}`;
  titleEl.textContent = chapter.title;
  pdfLink.href = chapter.pdf;

  // Wire up Previous / Next chapter links, if they exist.
  const chapterIndex = data.chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = data.chapters[chapterIndex - 1];
  const nextChapter = data.chapters[chapterIndex + 1];

  if (prevChapter) {
    prevChapterLabel.textContent = prevChapter.title;
    prevChapterLink.href = `chapter.html?ch=${prevChapter.id}`;
    prevChapterLink.removeAttribute('hidden');
  }
  if (nextChapter) {
    nextChapterLink.href = `chapter.html?ch=${nextChapter.id}`;
    nextChapterLink.removeAttribute('hidden');
  }

  // Build the Part 1–5 tabs.
  chapter.parts.forEach((part, i) => {
    const btn = document.createElement('button');
    btn.className = 'part-tab';
    btn.type = 'button';
    btn.textContent = part.label || `Part ${i + 1}`;
    btn.addEventListener('click', () => loadPart(i, true));
    tabsEl.appendChild(btn);
  });

  async function loadPart(index, autoplay) {
    if (index < 0 || index >= chapter.parts.length) return;
    activePartIndex = index;

    [...tabsEl.children].forEach((btn, i) => btn.classList.toggle('active', i === index));

    const part = chapter.parts[index];
    statusEl.textContent = `Loading ${part.label || 'part'}…`;
    transcriptEl.innerHTML = '';
    words = [];

    if (part.image) imageEl.src = part.image;

    audioEl.pause();
    audioEl.src = part.audio;

    try {
      const res = await fetch(part.timing);
      const timing = await res.json();
      words = timing.words || [];
    } catch (err) {
      statusEl.textContent = 'No timing file found for this part yet — audio will still play.';
      console.error(err);
    }

    renderTranscript();
    statusEl.textContent = `Playing ${part.label || 'part ' + (index + 1)}`;

    if (autoplay) {
      audioEl.play().catch(() => {
        statusEl.textContent = `${part.label || 'Part'} ready — press play.`;
      });
    }
  }

  let wordSpans = [];

  function renderTranscript() {
    const frag = document.createDocumentFragment();
    wordSpans = [];
    words.forEach((w, i) => {
      if (w.nl && i !== 0) {
        frag.appendChild(document.createElement('br'));
        frag.appendChild(document.createElement('br'));
      }
      const span = document.createElement('span');
      span.className = 'word';
      span.dataset.index = i;
      span.textContent = w.w + ' ';
      frag.appendChild(span);
      wordSpans.push(span);
    });
    transcriptEl.appendChild(frag);
  }

  // Binary search for the word whose [s, e) window contains the given time.
  function findWordIndex(t) {
    let lo = 0, hi = words.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (words[mid].s <= t) { ans = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return ans;
  }

  let lastHighlighted = -1;
  function tick() {
    if (words.length && !audioEl.paused) {
      const idx = findWordIndex(audioEl.currentTime);
      if (idx !== lastHighlighted) {
        if (lastHighlighted >= 0 && wordSpans[lastHighlighted]) {
          wordSpans[lastHighlighted].classList.remove('playing');
          wordSpans[lastHighlighted].classList.add('said');
        }
        if (idx >= 0 && wordSpans[idx]) {
          wordSpans[idx].classList.add('playing');
          wordSpans[idx].classList.remove('said');
          wordSpans[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        lastHighlighted = idx;
      }
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  audioEl.addEventListener('ended', () => {
    wordSpans.forEach((s) => { s.classList.remove('playing'); s.classList.add('said'); });
    if (activePartIndex < chapter.parts.length - 1) {
      loadPart(activePartIndex + 1, true);
    } else if (nextChapter) {
      statusEl.innerHTML = `End of chapter. <a href="chapter.html?ch=${nextChapter.id}" style="color:var(--oxblood);text-decoration:underline;">Start ${nextChapter.title}</a>`;
    } else {
      statusEl.textContent = 'End of chapter.';
    }
  });

  window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId));

  // Mobile Image/Words toggle.
  const readerGrid = document.getElementById('reader-grid');
  const mobileToggle = document.getElementById('mobile-toggle');
  readerGrid.classList.add('view-words');
  mobileToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    const view = btn.dataset.view;
    readerGrid.classList.toggle('view-image', view === 'image');
    readerGrid.classList.toggle('view-words', view === 'words');
    [...mobileToggle.children].forEach((b) => b.classList.toggle('active', b === btn));
  });

  // Start on the requested part (from ?part=N in the URL) if valid, otherwise Part 1.
  const startIndex = (requestedPart >= 1 && requestedPart <= chapter.parts.length)
    ? requestedPart - 1
    : 0;
  loadPart(startIndex, false);
})();
