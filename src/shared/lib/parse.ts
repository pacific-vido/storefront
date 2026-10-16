export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export function parseBoundedText(
  value: string,
  options: { min: number; max: number; label: string },
): ParseResult<string> {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length < options.min || text.length > options.max) {
    const expectation =
      options.min === 0
        ? `at most ${options.max} characters`
        : `${options.min}–${options.max} characters`;
    return { ok: false, message: `${options.label} must be ${expectation}.` };
  }
  return { ok: true, value: text };
}
