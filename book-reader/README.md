# Aeonic Odyssey — Web Reader

A static site (HTML/CSS/JS, no build step) for hosting on GitHub Pages:
book-opening animation on the home page → table of contents → per-chapter
reader with the chapter PDF alongside karaoke-style, word-by-word
highlighted narration, split into 5 audio parts per chapter.

## Folder structure

```
book-reader/
├── index.html              Home page (cover animation + TOC)
├── chapter.html             Chapter reader (PDF + synced transcript)
├── css/style.css
├── js/app.js                 Home page logic
├── js/reader.js              Reader page logic
├── data/book.json            Chapter list & file paths — EDIT THIS to add/change chapters
├── assets/
│   ├── cover-placeholder.svg     Swap for your real cover art
│   ├── pdf/chapterN.pdf          One PDF per chapter
│   ├── audio/chapterN/part1.mp3 … part5.mp3
│   └── timings/chapterN_partM.json    Word-timing files (see below)
└── scripts/generate_timings.py   Local script to auto-generate timing files
```

## Adding a chapter

1. Drop the chapter PDF into `assets/pdf/`.
2. Drop its 5 narration audio files into `assets/audio/chapterN/`.
3. Generate the matching timing JSON files (see below) into `assets/timings/`.
4. Add an entry to `data/book.json`, following the pattern already there.
   The `id` is what's used in the chapter URL (`chapter.html?ch=3`), and
   the order chapters appear in the JSON is the order they appear in the
   table of contents.

## Generating the word-timing files (karaoke highlighting)

The highlighting needs to know, for every word, when it starts and ends
in the audio. Rather than typing that by hand, `scripts/generate_timings.py`
transcribes and times your narration automatically using speech
recognition. Run this on your own machine (not in the browser):

```bash
pip install faster-whisper
python scripts/generate_timings.py assets/audio/chapter1/part1.mp3 assets/timings/chapter1_part1.json
```

Repeat for each of the 5 parts per chapter. It occasionally misspells an
unusual name — if so, just correct the `"w"` text in the JSON afterward;
the timing itself is derived from the audio and will still be accurate.

A demo file already exists at `assets/timings/chapter1_part1.json` so you
can see the highlighting work before generating your real ones — replace
it once you run the script.

## Replacing the cover

Swap `assets/cover-placeholder.svg` for your real cover image (JPG, PNG,
or SVG all work), and update the `"cover"` path in `data/book.json` if you
rename the file. The wax seal that cracks open as the book animates is
drawn in CSS, not part of the cover art, so it will still overlay any
cover image you use.

## Running it locally

Browsers block `fetch()` on files opened directly from disk, so serve the
folder instead of double-clicking `index.html`:

```bash
cd book-reader
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this folder's contents to it
   (the repo root should be `index.html`, `css/`, `js/`, etc. — not a
   subfolder, unless you configure Pages for that path).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a
   branch," pick your default branch (e.g. `main`) and the `/ (root)`
   folder.
4. Save. GitHub will publish the site at
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

Large audio/PDF files are fine for GitHub Pages, but GitHub repos have a
soft 1GB / hard 5GB size ceiling — if the full book's audio ever gets
close to that, consider hosting the audio files elsewhere (e.g. an S3
bucket or Backblaze B2) and pointing the `audio` paths in `book.json` at
those URLs instead; everything else in the site works the same way.

## Notes on the reader

- The PDF pane uses the browser's built-in PDF viewer (`<embed>`), so
  chapter PDFs display exactly as exported, with no extra library needed.
- The transcript pane is a separate, synced reading of the same text —
  this is what lets word-by-word highlighting work reliably, since PDFs
  don't expose clean word boundaries for highlighting directly on the page.
- Audio auto-advances from Part 1 → 5 as each finishes.
