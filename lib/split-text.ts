/**
 * Lightweight free replacement for GSAP's premium SplitText.
 * Wraps each grapheme of the element in <span class="char">…</span>
 * preserving whitespace and Arabic ligature behavior.
 *
 * Returns the array of created char elements so GSAP can target them.
 */
export function splitChars(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];

  // If we've already split, return existing chars (idempotent).
  const existing = el.querySelectorAll<HTMLElement>(":scope > .word > .char, :scope > .char");
  if (existing.length > 0) return Array.from(existing);

  const text = el.textContent ?? "";
  
  // Detect Arabic characters to preserve cursive connections/ligatures.
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (hasArabic) {
    return splitWords(el);
  }

  const fragment = document.createDocumentFragment();
  const chars: HTMLElement[] = [];

  // Split into words first to keep word-break sane on RTL.
  const words = text.split(/(\s+)/);
  for (const word of words) {
    if (/^\s+$/.test(word)) {
      fragment.appendChild(document.createTextNode(word));
      continue;
    }
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    wordSpan.style.display = "inline-block";

    // Use Intl.Segmenter when available (correct for ligatured Arabic), fallback to Array.from.
    const segments: string[] = [];
    if (typeof Intl !== "undefined" && (Intl as unknown as { Segmenter?: unknown }).Segmenter) {
      const Segmenter = (Intl as unknown as {
        Segmenter: new (l?: string, o?: { granularity: "grapheme" }) => {
          segment: (s: string) => Iterable<{ segment: string }>;
        };
      }).Segmenter;
      const seg = new Segmenter(undefined, { granularity: "grapheme" });
      for (const part of seg.segment(word)) segments.push(part.segment);
    } else {
      segments.push(...Array.from(word));
    }

    for (const ch of segments) {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      wordSpan.appendChild(span);
      chars.push(span);
    }
    fragment.appendChild(wordSpan);
  }

  el.textContent = "";
  el.appendChild(fragment);
  return chars;
}

/**
 * Word-only split — returns word spans for stagger reveals where char-level is overkill.
 */
export function splitWords(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  const existing = el.querySelectorAll<HTMLElement>(":scope > .word");
  if (existing.length > 0) return Array.from(existing);

  const text = el.textContent ?? "";
  const fragment = document.createDocumentFragment();
  const words: HTMLElement[] = [];

  for (const part of text.split(/(\s+)/)) {
    if (/^\s+$/.test(part)) {
      fragment.appendChild(document.createTextNode(part));
      continue;
    }
    const span = document.createElement("span");
    span.className = "word";
    span.style.display = "inline-block";
    span.textContent = part;
    fragment.appendChild(span);
    words.push(span);
  }

  el.textContent = "";
  el.appendChild(fragment);
  return words;
}
