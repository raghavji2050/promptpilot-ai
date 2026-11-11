import { z } from "zod";

// Enforced CSP has no 'unsafe-eval'. Zod's JIT probe (`new Function`) is caught by zod but still
// raises a CSP violation report on every page, so run zod jitless everywhere (Day 15).
z.config({ jitless: true });
