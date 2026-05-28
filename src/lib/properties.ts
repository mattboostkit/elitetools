// Single source of truth for the venues (properties) the CRM tracks.
//
// This MUST mirror the `propertyValidator` union in convex/schema.ts. When a
// new venue is onboarded, update the schema validator AND this file together.
//
// Why this file exists: the property -> label map used to be copy-pasted into
// the leads page, the enquiry drawer, the deals page, the create-deal dialog
// and the dashboard. Several copies only listed owp + salomons, so Bewl Water
// leads (correctly stored as property "bewl-water") fell through a
// `?? "owp"` fallback and were mislabelled as "One Warwick Park". Centralising
// the list here means a missing venue can never silently masquerade as another.

export type Property = "owp" | "salomons" | "bewl-water" | "bewl-adventures";

export interface PropertyMeta {
  label: string;
  /** Tailwind bg-* class for the status dot shown next to the label. */
  dot: string;
}

/** Display order for dropdowns, legends and tables. */
export const PROPERTY_ORDER: Property[] = [
  "owp",
  "salomons",
  "bewl-water",
  "bewl-adventures",
];

export const PROPERTY_META: Record<Property, PropertyMeta> = {
  owp: { label: "One Warwick Park", dot: "bg-amber-500" },
  salomons: { label: "Salomons Estate", dot: "bg-emerald-500" },
  "bewl-water": { label: "Bewl Water", dot: "bg-sky-500" },
  "bewl-adventures": { label: "Bewl Adventures", dot: "bg-orange-500" },
};

const PROPERTY_SET = new Set<string>(PROPERTY_ORDER);

/** Narrow an arbitrary value to a known Property. */
export function isProperty(value: string | null | undefined): value is Property {
  return value != null && PROPERTY_SET.has(value);
}

/**
 * Human label for a property value. Returns the real label for a known
 * property and "Unknown" for anything unrecognised or missing.
 *
 * It deliberately never falls back to a specific venue. The old
 * `PROPERTY_LABEL[prop] ?? PROPERTY_LABEL.owp` pattern relabelled every
 * unrecognised property (including Bewl Water) as One Warwick Park.
 */
export function propertyLabel(value: string | null | undefined): string {
  return isProperty(value) ? PROPERTY_META[value].label : "Unknown";
}

/** Status-dot colour class for a property; neutral grey when unknown. */
export function propertyDot(value: string | null | undefined): string {
  return isProperty(value) ? PROPERTY_META[value].dot : "bg-zinc-400";
}
