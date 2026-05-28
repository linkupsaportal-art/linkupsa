/**
 * Avatar upload constants — kept in a plain module (not the actions file)
 * because Next.js server-action modules can only export async functions.
 */

export const AVATAR_ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/** Map MIME → file extension used in the storage path. */
export function avatarExtension(mime: string): "png" | "webp" | "jpg" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}
