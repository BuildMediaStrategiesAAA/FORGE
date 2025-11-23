/**
 * Generates the next revision string based on the current revision.
 *
 * @param current - The current revision string (e.g., "Rev A", "Rev B")
 * @returns The next revision string
 *
 * Rules:
 * - If current is undefined, null, empty, or whitespace → return "Rev A"
 * - If current matches "Rev X" where X is A-Z → return next letter
 * - If current is "Rev Z" → return "Rev Z" (no rollover)
 * - If current format is invalid → return "Rev A"
 */
export function nextRevision(current?: string): string {
  // Handle undefined, null, empty, or whitespace
  if (!current || current.trim() === '') {
    return 'Rev A';
  }

  // Check if current matches "Rev X" pattern where X is A-Z
  const match = current.match(/^Rev ([A-Z])$/);

  if (!match) {
    // Invalid format, return "Rev A"
    return 'Rev A';
  }

  const letter = match[1];

  // If already at Z, stay at Z
  if (letter === 'Z') {
    return 'Rev Z';
  }

  // Return next letter
  const nextCharCode = letter.charCodeAt(0) + 1;
  const nextLetter = String.fromCharCode(nextCharCode);
  return `Rev ${nextLetter}`;
}
