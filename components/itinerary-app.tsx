"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  BedDouble, Binoculars, BusFront, CarFront, Compass,
  ExternalLink, Footprints, Home, Info, Map, MapPin, Plane, Search, Shuffle, X,
  type LucideIcon,
} from "lucide-react";

export type ItineraryEntry = {
  Day: string;
  Date: string;
  Category?: string;
  Description?: string;
  Details?: string;
  Links?: string;
  links?: string;
  contactId?: string;
};

type CategoryKey = "flight" | "stay" | "safari" | "transport" | "transfer" | "trip" | "other";
type NavView = "itinerary" | "info" | "maps";

const categoryMeta: Record<CategoryKey, { label: string; icon: LucideIcon; className: string }> = {
  flight: { label: "Flight", icon: Plane, className: "bg-sky-50 text-sky-800 ring-sky-200" },
  stay: { label: "Stay", icon: BedDouble, className: "bg-rose-50 text-rose-800 ring-rose-200" },
  safari: { label: "Safari", icon: Compass, className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  transport: { label: "Drive", icon: CarFront, className: "bg-amber-50 text-amber-900 ring-amber-200" },
  transfer: { label: "Transfer", icon: Shuffle, className: "bg-violet-50 text-violet-800 ring-violet-200" },
  trip: { label: "Day trip", icon: MapPin, className: "bg-orange-50 text-orange-800 ring-orange-200" },
  other: { label: "Plan", icon: MapPin, className: "bg-stone-100 text-stone-700 ring-stone-200" },
};

const filters: { id: "all" | CategoryKey; label: string }[] = [
  { id: "all", label: "All" }, { id: "flight", label: "Flights" },
  { id: "stay", label: "Stays" }, { id: "safari", label: "Safaris" },
  { id: "transport", label: "On the road" },
];

// GitHub Pages serves this site from /SouthAfrica2026 rather than the domain root.
const publicImage = (path: string) => `${process.env.NODE_ENV === "production" ? "/SouthAfrica2026" : ""}${path}`;

function categoryOf(category?: string): CategoryKey {
  const value = (category ?? "").toLowerCase();
  if (value.includes("flight")) return "flight";
  if (value.includes("accom")) return "stay";
  if (value.includes("safari")) return "safari";
  if (value.includes("car hire") || value === "drive") return "transport";
  if (value.includes("transfer")) return "transfer";
  if (value.includes("day trip")) return "trip";
  return "other";
}

function eventIcon(category?: string): LucideIcon {
  const value = (category ?? "").toLowerCase();
  if (value.includes("walking")) return Footprints;
  if (value.includes("driving safari")) return Binoculars;
  if (value.includes("accom")) return Home;
  if (value.includes("transfer")) return BusFront;
  return categoryMeta[categoryOf(category)].icon;
}

function redactDetails(text?: string) {
  if (!text) return "";
  return text
    .replace(/(confirmation (?:number|code)\s*[:\n]?\s*)[^\s\n]+/gi, "$1••••••")
    .replace(/(pin code\s*[:\n]?\s*)[^\s\n]+/gi, "$1••••")
    .replace(/(booking reference\s*[:\n]?\s*)[^\s\n]+/gi, "$1••••••");
}

function extractUrls(value?: string) {
  return (value?.match(/(?:https?:\/\/|www\.)[^\s)]+/gi) ?? []).map((url) =>
    /^https?:\/\//i.test(url) ? url : `https://${url}`
  );
}

function cleanText(value?: string) {
  return value?.replace(/https?:\/\/[^\s)]+/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function extractAddressLine(value?: string) {
  if (!value) return "";
  const lines = value.split("\n").map(l => l.trim());
  // First try to find a line with "Address:" label
  const labeledAddress = lines.find((line) => /\b(address)\b/i.test(line));
  if (labeledAddress) return labeledAddress.replace(/^[^:]*:\s*/, "").trim();
  // Otherwise, return the first non-empty line (usually the address)
  return lines[0] || "";
}

const contactLinePattern = /\b(address|contact|telephone|tel\b|phone|e-?mail|website|whatsapp|reservations|opening hours|fax)\b/i;
const phoneOnlyPattern = /(?:^|\s)\+?\d[\d\s()-]{6,}\d(?:\s|$)/;

function isContactLine(line: string) {
  return contactLinePattern.test(line) || phoneOnlyPattern.test(line) || extractUrls(line).length > 0;
}

function withoutContactDetails(value?: string) {
  return value
    ?.split("\n")
    .filter((line) => !isContactLine(line))
    .join("\n");
}

type Contact = {
  id: string;
  name: string;
  category?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  image?: string;
  lines: string[];
  urls: string[];
};

function dateKey(entry: ItineraryEntry) {
  return `${entry.Date}-${entry.Day}`;
}

const stages = [
  { id: "arrival", title: "The arrival", subtitle: "Johannesburg", image: "/images/johannesburg.jpg", dates: ["18th Sept", "19th Sept"] },
  { id: "kruger", title: "Into the wild", subtitle: "Kruger National Park", image: "/images/hero-safari.jpg", dates: ["20th Sept", "21st Sept", "22nd Sept", "23rd Sept", "24th Sept", "25th Sept"] },
  { id: "cape", title: "The Cape", subtitle: "Cape Town & the Peninsula", image: "/images/cape-peninsula.jpg", dates: ["26th Sept", "27th Sept", "28th Sept"] },
  { id: "franschhoek", title: "Wine country", subtitle: "Franschhoek", image: "/images/franschhoek.jpg", dates: ["29th Sept", "30th Sept", "1st Oct"] },
  { id: "camps-bay", title: "The coast", subtitle: "Camps Bay", image: "/images/camps-bay.jpg", dates: ["2nd Oct", "3rd Oct", "4th Oct"] },
] as const;

function stageForDate(date: string) {
  return stages.find((stage) => stage.dates.includes(date as never)) ?? stages[0];
}

function EventCard({ entry, overImage = false, onContact }: { entry: ItineraryEntry; overImage?: boolean; onContact?: (contactId: string) => void }) {
  const key = categoryOf(entry.Category);
  const meta = categoryMeta[key];
  const Icon = eventIcon(entry.Category);
  const title = entry.Description || entry.Category || "Travel detail";
  const isAccommodation = key === "stay";
  const detail = isAccommodation
    ? extractAddressLine(redactDetails(entry.Details))
    : cleanText(withoutContactDetails(redactDetails(entry.Details)));

  return (
    <article className={`group rounded-3xl border p-5 shadow-[0_8px_30px_rgb(0,0,0,0.25)] transition duration-200 sm:p-6 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_12px_32px_rgb(0,0,0,0.40)] ${overImage ? "border-white/35 bg-transparent" : "border-white/15 bg-stone-900"}`}>
      <div className="flex items-start gap-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ${meta.className}`}><Icon size={20} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${overImage ? "text-white/75" : "text-stone-400"}`}>{entry.Category || "Travel note"}</p>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ${meta.className}`}>{meta.label}</span>
          </div>
          <h3 className={`mt-2 text-lg font-semibold leading-snug tracking-tight ${overImage ? "text-white" : "text-stone-100"}`}>{title}</h3>
          {detail && <p className={`mt-3 whitespace-pre-line text-sm leading-6 ${overImage ? "text-white/90" : "text-stone-300"}`}>{detail}</p>}
          {entry.contactId && onContact && <button type="button" onClick={() => onContact(entry.contactId!)} className={`mt-4 inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-bold transition ${overImage ? "bg-white/15 text-white hover:bg-[#C86D3B]" : "bg-white/10 text-white hover:bg-[#C86D3B]"}`}>View contact</button>}
        </div>
      </div>
    </article>
  );
}

function ContactsPanel({ contacts, selectedContactId, onClearSelection }: { contacts: Contact[]; selectedContactId?: string; onClearSelection: () => void }) {
  return <section className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-8 lg:pb-10">
    <section aria-labelledby="contacts-heading">
      <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Directory</p><h2 id="contacts-heading" className="mt-2 text-2xl font-semibold tracking-tight text-white">Contacts</h2></div><div className="flex items-center gap-2"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">{contacts.length} providers</span>{selectedContactId && <button type="button" onClick={onClearSelection} className="min-h-9 rounded-xl bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20">Show all</button>}</div></div>
      <div className="mt-5 space-y-3">
        {contacts.filter((contact) => !selectedContactId || contact.id === selectedContactId).map((contact, index) => {
          const Icon = eventIcon(contact.category);
          return <article key={`${contact.name}-${index}`} className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.20)] backdrop-blur-sm">
            <div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#C86D3B]/20 text-orange-200"><Icon size={19} /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">{contact.category || "Provider"}</p><h3 className="mt-1 font-semibold text-white">{contact.name}</h3>{contact.lines.length > 0 && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/80">{contact.lines.join("\n")}</p>}{contact.urls.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{contact.urls.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-[#C86D3B] hover:text-white"><ExternalLink size={14} /> Website</a>)}</div>}</div></div>
            {contact.image && <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl"><Image src={publicImage(contact.image)} alt={`${contact.name} location`} fill sizes="(max-width: 640px) 100vw, 560px" className="object-cover" /></div>}
          </article>;
        })}
      </div>
    </section>
  </section>;
}

function MapsPanel() {
  return <section className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:pb-10">
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Route overview</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Travel map</h2>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-stone-900 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <Image src={publicImage("/images/TravelMap.jpg")} alt="South Africa travel map" width={1600} height={1000} sizes="(max-width: 768px) 100vw, 768px" className="h-auto w-full" />
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-stone-900 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <iframe src="https://www.google.com/maps/d/u/0/embed?mid=1up-zxM2k95smjxfU3pQy8q7KfM5PM0o&ehbc=2E312F" title="Interactive South Africa travel map" loading="lazy" className="aspect-[4/3] h-auto min-h-[360px] w-full border-0 sm:min-h-[480px]" />
      </div>
    </div>
  </section>;
}

export function ItineraryApp({ entries, contacts }: { entries: ItineraryEntry[]; contacts: Contact[] }) {
  const [activeFilter, setActiveFilter] = useState<"all" | CategoryKey>("all");
  const [view, setView] = useState<NavView>("itinerary");
  const [selectedContactId, setSelectedContactId] = useState<string>();
  const [query, setQuery] = useState("");
  const visibleEntries = useMemo(() => entries.filter((entry) => (activeFilter === "all" || categoryOf(entry.Category) === activeFilter) && `${entry.Description} ${entry.Details} ${entry.Category}`.toLowerCase().includes(query.toLowerCase())), [entries, activeFilter, query]);
  const stageGroups = useMemo(() => stages.map((stage) => {
    const stageEntries = visibleEntries.filter((entry) => stageForDate(entry.Date).id === stage.id);
    const days = Object.values(stageEntries.reduce<Record<string, ItineraryEntry[]>>((result, entry) => { const key = dateKey(entry); (result[key] ??= []).push(entry); return result; }, {}));
    return { ...stage, days };
  }).filter((stage) => stage.days.length > 0), [visibleEntries]);
  const chooseItinerary = () => { setView("itinerary"); window.setTimeout(() => document.getElementById("filters")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };
  const chooseContact = (contactId: string) => { setSelectedContactId(contactId); setView("info"); window.setTimeout(() => document.getElementById("contacts-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };

  return <div className="min-h-screen bg-black text-white">
    <aside className="fixed inset-y-0 hidden w-72 flex-col border-r border-white/10 bg-black px-7 py-8 lg:flex">
      <div><p className="eyebrow">Safari journal</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">South Africa<br /><span className="text-[#C86D3B]">2026</span></h1></div>
      <nav className="mt-12 space-y-2" aria-label="Primary navigation"><button onClick={chooseItinerary} className={`nav-button ${view === "itinerary" ? "nav-button-active" : ""}`}><Compass size={19} /> Itinerary</button><button onClick={() => setView("info")} className={`nav-button ${view === "info" ? "nav-button-active" : ""}`}><Info size={19} /> Contacts</button><button onClick={() => setView("maps")} className={`nav-button ${view === "maps" ? "nav-button-active" : ""}`}><Map size={19} /> Maps</button></nav>
      <p className="mt-auto text-xs leading-5 text-white/40">18 Sep — 4 Oct<br />South Africa</p>
    </aside>
    <main className="lg:pl-72">
      <header className={`relative overflow-hidden border-b border-white/10 px-4 text-white sm:px-8 lg:px-12 ${view === "itinerary" ? "min-h-64 py-9 sm:min-h-72 sm:py-12" : "bg-black py-7"}`}>
        {view === "itinerary" && <><Image src={publicImage("/images/top_banner.jpg")} alt="South Africa safari landscape" fill priority sizes="(max-width: 768px) 100vw, 1100px" className="object-contain" /><div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" /></>}
        <div className="relative mx-auto flex min-h-44 max-w-3xl flex-col justify-end"><p className="eyebrow text-orange-200">{view === "itinerary" ? "Safari journal · 18 Sep — 4 Oct 2026" : view === "maps" ? "Route overview" : "Travel directory"}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{view === "itinerary" ? <>South Africa <span className="text-orange-200">2026</span></> : view === "maps" ? "Maps." : "Contacts."}</h1></div>
      </header>
      {view === "info" ? <ContactsPanel contacts={contacts} selectedContactId={selectedContactId} onClearSelection={() => setSelectedContactId(undefined)} /> : view === "maps" ? <MapsPanel /> : <section className="mx-auto max-w-3xl px-4 pb-28 sm:px-8 lg:pb-10 lg:px-12">
        <div id="filters" className="sticky top-0 z-10 -mx-4 border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-200" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search itinerary" aria-label="Search itinerary" className="min-h-12 w-full rounded-2xl border border-white/20 bg-white/10 py-3 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-[#C86D3B] focus:ring-4 focus:ring-[#C86D3B]/20" />{query && <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-white/60 hover:bg-white/10"><X size={18} /></button>}</div><div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">{filters.map((filter) => <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition ${activeFilter === filter.id ? "bg-[#C86D3B] text-white shadow-lg shadow-[#C86D3B]/20" : "border border-white/20 bg-white/10 text-white/80 hover:border-white/40"}`}>{filter.label}</button>)}</div></div>
        <div className="-mx-4 pt-6 sm:-mx-8 lg:-mx-12">{stageGroups.map((stage) => <section key={stage.id} className="relative isolate"><div className="sticky top-0 h-svh bg-black"><div className="relative h-full"><Image src={publicImage(stage.image)} alt="" fill loading={stage.id === "arrival" ? "eager" : "lazy"} sizes="(max-width: 768px) 100vw, 1100px" className="object-contain" /><div className="absolute inset-0 bg-gradient-to-b from-stone-950/75 via-stone-950/30 to-stone-950/70" /></div></div><div className="relative z-10 -mt-[100svh] min-h-svh px-4 py-8 sm:px-8 sm:py-12 lg:px-12"><div className="mx-auto max-w-3xl"><div className="mb-9 max-w-xs text-white drop-shadow-lg"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">{stage.subtitle}</p><h2 className="mt-2 text-4xl font-semibold tracking-tight">{stage.title}</h2></div><div className="space-y-9">{stage.days.map((dayEntries) => <section key={dateKey(dayEntries[0])}><div className="mb-4 flex items-baseline gap-3 px-1 text-white drop-shadow-md"><p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-200">{dayEntries[0].Day}</p><h3 className="text-xl font-semibold tracking-tight">{dayEntries[0].Date}</h3><div className="h-px flex-1 bg-white/35" /></div><div className="space-y-3">{dayEntries.map((entry, index) => <EventCard key={`${dateKey(entry)}-${index}`} entry={entry} overImage onContact={contacts.some((contact) => contact.id === entry.contactId) ? chooseContact : undefined} />)}</div></section>)}</div></div></div></section>)}{visibleEntries.length === 0 && <div className="mx-4 rounded-3xl border border-dashed border-stone-300 p-10 text-center text-stone-500 sm:mx-8 lg:mx-12">No itinerary details match this view.</div>}</div>
      </section>}
    </main>
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-white/10 bg-black/90 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden" aria-label="Mobile navigation"><button onClick={chooseItinerary} className={`mobile-nav ${view === "itinerary" ? "mobile-nav-active" : ""}`}><Compass size={20} />Itinerary</button><button onClick={() => setView("info")} className={`mobile-nav ${view === "info" ? "mobile-nav-active" : ""}`}><Info size={20} />Contacts</button><button onClick={() => setView("maps")} className={`mobile-nav ${view === "maps" ? "mobile-nav-active" : ""}`}><Map size={20} />Maps</button></nav>
  </div>;
}
