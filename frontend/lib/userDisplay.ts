/** Two-letter initials for avatar display from a person's full name. */
export function userInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? "";
    const b = parts[parts.length - 1][0] ?? "";
    return (a + b).toUpperCase() || "?";
  }
  const w = parts[0] || "?";
  return w.slice(0, 2).toUpperCase();
}

/** First letter of the first name/word for compact avatars (Unicode-safe first grapheme). */
export function userFirstInitial(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const word = parts[0];
  if (!word) return "?";
  const ch = [...word][0];
  if (!ch) return "?";
  return ch.toLocaleUpperCase();
}
