export declare function generateAuth(authMode?: string): string;
/**
 * Default feature-flag source. Reads flags from `FLAG_<UPPER_SNAKE>` env vars.
 * Emitted as its own module so users can override a single file to plug in
 * LaunchDarkly / Unleash / GrowthBook without touching the generated authz.
 */
export declare function generateFlags(): string;
//# sourceMappingURL=auth.d.ts.map