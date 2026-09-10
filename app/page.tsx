import itinerary from "../config/safari_itinerary.json";
import contacts from "../config/contacts.json";
import fieldConfig from "../config/field-config.json";
import { ItineraryApp } from "../components/itinerary-app";

function getContactFieldLabels() {
  const labels: Record<string, string> = {};
  Object.entries(fieldConfig.fields).forEach(([key, field]) => {
    if ((field.displayOn as string[]).includes("contacts")) {
      labels[key] = field.label;
    }
  });
  return labels;
}

const contactFieldLabels = getContactFieldLabels();

function contactLines(contact: Record<string, string>) {
  return Object.entries(contact ?? {})
    .filter(([key, value]) => contactFieldLabels[key] && value && key !== "website" && key !== "image")
    .map(([key, value]) => `${contactFieldLabels[key]}: ${value}`);
}

function contactWebsite(value?: string) {
  if (!value || !/^(?:https?:\/\/|www\.)/i.test(value)) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function redactForPublishing(details?: string) {
  return details
    ?.replace(/(confirmation (?:number|code)\s*[:\n]?\s*)[^\s\n]+/gi, "$1••••••")
    .replace(/(pin code\s*[:\n]?\s*)[^\s\n]+/gi, "$1••••")
    .replace(/(booking reference\s*[:\n]?\s*)[^\s\n]+/gi, "$1••••••");
}

export default function Home() {
  // Redact before serialising data into the static client payload; this protects
  // codes in the deployed site, not merely their visual presentation.
  const publicEntries = itinerary.map((entry) => ({
    ...entry,
    comment: redactForPublishing(entry.comment),
  }));

  const publicContacts = Object.entries(contacts as Record<string, Record<string, string>>).map(([id, contact]) => ({
    id,
    name: contact.name || "Travel provider",
    category: contact.category,
    image: contact.image?.replace(/^\/public/, ""),
    lines: contactLines(contact),
    urls: contactWebsite(contact.website) ? [contactWebsite(contact.website)!] : [],
  }));

  return <ItineraryApp entries={publicEntries} contacts={publicContacts} />;
}
