/**
 * "How did you hear about us?" enquiry-source options.
 *
 * Single source of truth, shared by the property websites' enquiry forms
 * and the CRM. The first 11 values are the categories the venue team
 * tracks; "other" is a safety net so a stray answer never pollutes a
 * real category. Keep this list in step with the matching file in the
 * salomons and owp repos.
 */

export interface HearAboutUsOption {
  value: string;
  label: string;
}

export const HEAR_ABOUT_US_OPTIONS: HearAboutUsOption[] = [
  { value: "bridebook", label: "Bridebook" },
  { value: "google", label: "Google" },
  { value: "hitched", label: "Hitched" },
  { value: "owp-website", label: "One Warwick Park Website" },
  { value: "salomons-website", label: "Salomons Estate Website" },
  { value: "local-client", label: "Local Client" },
  { value: "passing-by", label: "Passing By" },
  { value: "employee-referral", label: "Employee Referral" },
  { value: "recommendation", label: "Recommendation" },
  { value: "repeat-client", label: "Repeat Client" },
  { value: "social-media", label: "Social Media" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

/**
 * Map a stored value back to its display label. Returns an empty string
 * for an empty/missing value, and falls back to the raw value if it is
 * not a recognised option.
 */
export function hearAboutUsLabel(value?: string | null): string {
  if (!value) return "";
  const match = HEAR_ABOUT_US_OPTIONS.find((o) => o.value === value);
  return match ? match.label : value;
}
