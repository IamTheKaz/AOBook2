(async function () {
  const book = document.getElementById('book');
  const coverBtn = document.getElementById('cover');
  const coverArt = document.getElementById('cover-art');
  const library = document.getElementById('library');
  const titleEl = document.getElementById('book-title');
  const subtitleEl = document.getElementById('book-subtitle');
  const tocList = document.getElementById('toc-list');

  let data;
  try {
    const res = await fetch('data/book.json');
    data = await res.json();
  } catch (err) {
    tocList.innerHTML = '<li style="padding:1em 0;">Could not load book.json — check the console.</li>';
    console.error(err);
    return;
  }

  titleEl.textContent = data.title || 'Untitled';
  subtitleEl.textContent = data.subtitle || '';
  if (data.cover) coverArt.src = data.cover;

  data.chapters.forEach((ch, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `chapter.html?ch=${ch.id}`;
    a.innerHTML = `
      <span class="toc-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="toc-title">${ch.title}</span>
      <span class="toc-arrow" aria-hidden="true">&rarr;</span>
    `;
    li.appendChild(a);

    if (ch.parts && ch.parts.length) {
      const partsRow = document.createElement('div');
      partsRow.className = 'toc-parts';
      ch.parts.forEach((part, pi) => {
        const pa = document.createElement('a');
        pa.href = `chapter.html?ch=${ch.id}&part=${pi + 1}`;
        pa.textContent = pi + 1;
        pa.title = part.label || `Part ${pi + 1}`;
        partsRow.appendChild(pa);
      });
      li.appendChild(partsRow);
    }

    tocList.appendChild(li);
  });

  function openBook() {
    if (book.classList.contains('open')) return;
    book.classList.add('open');
    coverBtn.setAttribute('aria-expanded', 'true');
    // Wait for the cover-opening transition to finish, then reveal the TOC.
    setTimeout(() => {
      document.getElementById('stage').setAttribute('hidden', '');
      library.removeAttribute('hidden');
      requestAnimationFrame(() => library.classList.add('visible'));
      tocList.querySelector('a')?.focus();
    }, 950);
  }

  // Coming back from a chapter page (?toc=1): skip the cover animation
  // entirely and land straight on the table of contents.
  if (new URLSearchParams(location.search).get('toc') === '1') {
    document.getElementById('stage').setAttribute('hidden', '');
    library.removeAttribute('hidden');
    library.classList.add('visible');
  } else {
    coverBtn.addEventListener('click', openBook);
    coverBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBook();
      }
    });
  }
})();
