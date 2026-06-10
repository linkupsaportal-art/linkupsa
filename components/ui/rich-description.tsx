"use client";

/**
 * RichDescription — renders free text with YouTube links embedded inline.
 *
 * Merchants write the product explanation as one flowing text and paste
 * YouTube links wherever a video belongs:
 *
 *   شرح الخطوة الأولى…
 *   https://youtu.be/abc123def45
 *   وعند حدوث مشكلة شاهد:
 *   https://www.youtube.com/watch?v=xyz987uvw65
 *
 * Each link becomes a playable embedded player at its exact position.
 */

/** Matches YouTube watch/short/embed URLs anywhere inside a text blob. */
const YOUTUBE_URL_PATTERN =
  /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*/g;

/** Extracts a YouTube video ID from common URL formats (or a bare ID). */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/(?:watch\?[^\s]*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function YoutubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-[hsl(var(--hairline))] bg-black"
      style={{ aspectRatio: "16/9" }}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

/** Splits the text into alternating text/video segments. */
export function splitDescription(text: string): Array<
  { kind: "text"; value: string } | { kind: "video"; videoId: string }
> {
  const segments: Array<{ kind: "text"; value: string } | { kind: "video"; videoId: string }> = [];
  let cursor = 0;
  for (const match of text.matchAll(YOUTUBE_URL_PATTERN)) {
    const index = match.index ?? 0;
    const before = text.slice(cursor, index).trim();
    if (before) segments.push({ kind: "text", value: before });
    segments.push({ kind: "video", videoId: match[1] });
    cursor = index + match[0].length;
  }
  const tail = text.slice(cursor).trim();
  if (tail) segments.push({ kind: "text", value: tail });
  return segments;
}

export function RichDescription({ text, className = "" }: { text: string; className?: string }) {
  const segments = splitDescription(text);
  if (segments.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {segments.map((segment, i) =>
        segment.kind === "text" ? (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {segment.value}
          </p>
        ) : (
          <YoutubeEmbed key={i} videoId={segment.videoId} />
        ),
      )}
    </div>
  );
}
