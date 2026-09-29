/**
 * Utility: combine class names (lightweight cn helper)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
