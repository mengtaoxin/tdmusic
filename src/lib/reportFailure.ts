/** Print a failure to the console. Durable English diagnostics use `appendAppLog` separately. */
export function reportFailure(detail: unknown): void {
  console.error(detail)
}
