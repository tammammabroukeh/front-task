/** Format a number as USD currency. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/** Capitalize the first letter of each word (for category labels). */
export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
