/**
 * Jasmine helper to silence console output during test runs.
 *
 * This is automatically loaded by Jasmine if listed in `jasmine.json` under the `helpers` section.
 * It disables `console.log`, `console.warn`, and `console.error` using Jasmine's `spyOn` mechanism,
 * while still allowing assertions (e.g., `expect(console.log).toHaveBeenCalled()`).
 *
 * You can override behavior per test using:
 *     console.log.and.callThrough(); // Re-enable logging temporarily
 */

beforeAll(() => {
    spyOn(console, "log").and.stub();
    spyOn(console, "warn").and.stub();
    spyOn(console, "error").and.stub();
});
