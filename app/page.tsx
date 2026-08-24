import itinerary from "../safari_itinerary.json";
import contacts from "../contacts.json";
import { ItineraryApp } from "../components/itinerary-app";

const contactFieldLabels: Record<string, string> = {
  address: "Address",
  phone: "Phone",
  direct_phone: "Direct phone",
  phone_whatsapp: "WhatsApp",
  phone_south_africa: "Phone (South Africa)",
  phone_international: "Phone (International)",
  email: "Email",
  email_reservations: "Reservations email",
  email_wildcard: "Email",
  contact_person: "Contact",
  fax: "Fax",
};

function contactLines(contact: Record<string, string>) {
  return Object.entries(contact ?? {})
    .filter(([key, value]) => contactFieldLabels[key] && value)
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
    Details: redactForPublishing(entry.Details),
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
