/** Lighthouse CI — Day 11.
 * Acceptance: categories.performance ≥ 0.9 on `/` (mobile emulation).
 * Separate CI job (does not fail the main `check` job on flake).
 * Threshold is documented here: error below 0.9; re-run if score is 0.88–0.89.
 */
module.exports = {
  ci: {
    collect: {
      url: ["http://127.0.0.1:3100/"],
      numberOfRuns: 1,
      settings: {
        formFactor: "mobile",
        screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleFactor: 2, disabled: false },
        throttlingMethod: "simulate",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
