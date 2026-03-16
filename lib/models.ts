/**
 * Centralized model selection.
 *
 * Change model IDs here and every API route picks them up automatically.
 */

const SONNET = "claude-sonnet-4-6";
const HAIKU  = "claude-haiku-4-5-20251001";

/**
 * Claim extraction — Pro gets Sonnet for higher accuracy,
 * free/guest gets Haiku to reduce cost.
 */
export function claimExtractionModel(isPro: boolean): string {
  return isPro ? SONNET : HAIKU;
}

/**
 * Relevance scoring — Haiku for everyone; the task is structured
 * enough that the larger model adds little value.
 */
export function relevanceScoringModel(): string {
  return HAIKU;
}

/**
 * Omakase rewrite — Pro-only feature, uses Haiku for fast structured output.
 */
export function omakaseModel(): string {
  return HAIKU;
}
