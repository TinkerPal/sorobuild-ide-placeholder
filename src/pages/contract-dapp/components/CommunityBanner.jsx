import React from "react";
import { Globe, Phone, Mail, Linkedin, MapPin, Users } from "lucide-react";

/**
 * LinkedIn-style Professional Banner (matches the uploaded layout closely)
 *
 * ✅ Drop-in ready — only replace images/text via props
 * ✅ Fully responsive & mobile-first
 * ✅ Tailwind-only styles (no custom CSS)
 */

const defaults = {
  // BACKGROUND (stage/purple lights)
  backgroundImage:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop",

  // LEFT: Logo/mark panel (like DrD block). You can swap for an actual image.
  logoPanel: {
    logoTextTop: "DrD",
    logoTextBottom: "DEWETT",
    site: "DrDewett.com",
    phone: "+1.800.401.2926",
    email: "todd@drdewett.com",
  },

  // RIGHT: Badges (stacked on desktop, scroll on mobile)
  badges: [
    {
      label: "CERTIFIED VIRTUAL PRESENTER",
      image: "https://placehold.co/160x160/png?text=Badge+1",
    },
    {
      label: "LINKEDIN LEARNING AUTHOR",
      image: "https://placehold.co/160x160/png?text=Badge+2",
    },
  ],

  // BOTTOM CARD CONTENT
  portraitImage: "https://placehold.co/300x300/png?text=Your+Photo",
  name: "Todd Dewett, PhD",
  connectionLevel: "2nd",
  headline:
    "Live & Virtual Keynote Speaker around the Globe, Best‑selling Author, top LinkedIn Learning author, Leadership and Authenticity Guru, 4xTEDx speaker",
  orgs: [
    { name: "TVA Inc.", logo: "https://placehold.co/48x48/png?text=TVA" },
    {
      name: "Texas A&M University",
      logo: "https://placehold.co/48x48/png?text=TAMU",
    },
  ],
  tags: ["#growth", "#careers", "#success", "#leadership", "#motivation"],
  location: "Houston, Texas, United States",
  contactHref: "#contact",
  website: "https://example.com",
  phone: "+1 (800) 401‑2926",
  email: "you@example.com",
  linkedin: "https://linkedin.com/in/yourprofile",
  followers: 48331,
  connections: 500,
};

function formatNumber(n) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

export default function CommunityBanner(props) {
  const cfg = { ...defaults, ...props };

  return (
    <section className="relative w-full overflow-hidden rounded-2xl shadow-lg">
      {/* Background image */}
      <div
        className="h-[260px] sm:h-[300px] md:h-[330px] lg:h-[360px] w-full bg-center bg-cover"
        style={{ backgroundImage: `url(${cfg.backgroundImage})` }}
        aria-hidden="true"
      />

      {/* Dark gradient wash for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />

      {/* TOP LEFT — Logo/mark panel (like DrD block) */}
      <div className="absolute left-3 top-3 sm:left-4 sm:top-4 z-10">
        <div className="flex items-stretch gap-3">
          {/* Black tile with mark */}
          <div className="flex items-center gap-3 rounded-lg bg-black/90 px-3 py-2 ring-1 ring-white/10">
            <div className="rounded-md bg-white/95 px-2 py-2 text-black font-extrabold leading-none text-base sm:text-lg shadow">
              <div>DrD</div>
            </div>
            <div className="hidden sm:block text-white">
              <div className="text-sm font-semibold tracking-wide">TODD</div>
              <div className="text-sm -mt-0.5 font-extrabold">DEWETT</div>
            </div>
          </div>

          {/* Contact block (condensed on mobile) */}
          <div className="hidden sm:flex flex-col justify-center rounded-lg bg-black/75 px-3 py-2 text-white text-xs ring-1 ring-white/10">
            <div className="font-medium">{cfg.logoPanel.site}</div>
            <div>{cfg.phone}</div>
            <div>{cfg.email}</div>
          </div>
        </div>
      </div>

      {/* TOP RIGHT — Badges */}
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 lg:overflow-visible lg:pb-0 lg:flex-col">
          {cfg.badges?.map((b, i) => (
            <div
              key={i}
              className="shrink-0 rounded-xl bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 p-2 sm:p-3 shadow-xl flex items-center gap-3 lg:flex-col lg:text-center"
            >
              <img
                src={b.image}
                alt={b.label}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-md object-cover border border-gray-200 bg-white"
                loading="lazy"
              />
              <p className="text-[10px] sm:text-xs font-medium text-gray-800 max-w-[160px]">
                {b.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM — Main info card */}
      <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 z-20">
        <div className="relative rounded-2xl bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 p-4 sm:p-5 md:p-6 shadow-2xl">
          {/* Portrait bubble */}
          <div className="absolute -top-10 left-4 sm:-top-12 sm:left-6">
            <img
              src={cfg.portraitImage}
              alt={`${cfg.name} portrait`}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white shadow-xl object-cover bg-white"
              loading="lazy"
            />
          </div>

          {/* Content grid */}
          <div className="md:ml-28 sm:ml-32 ml-28">
            {/* Name & connection level */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                {cfg.name}
              </h1>
              {cfg.connectionLevel && (
                <span className="rounded-full bg-gray-900 text-white text-[10px] px-2 py-0.5">
                  {cfg.connectionLevel}
                </span>
              )}
            </div>

            {/* Orgs row */}
            <div className="mt-2 flex items-center gap-3">
              {cfg.orgs?.map((o, i) => (
                <div key={i} className="inline-flex items-center gap-2">
                  <img
                    src={o.logo}
                    alt={o.name}
                    className="h-6 w-6 rounded object-cover border border-gray-200 bg-white"
                    loading="lazy"
                    title={o.name}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    {o.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Headline */}
            <p className="mt-2 text-[13px] sm:text-sm md:text-base leading-relaxed text-gray-700">
              {cfg.headline}
            </p>

            {/* Talks about tags */}
            {cfg.tags?.length > 0 && (
              <div className="mt-2 text-[12px] sm:text-sm text-gray-600">
                <span className="font-medium text-gray-800">Talks about</span>{" "}
                {cfg.tags.join(" ")}
              </div>
            )}

            {/* Location + Contact */}
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden /> {cfg.location}
                </span>
                <span className="hidden sm:inline">•</span>
                <a
                  href={cfg.contactHref}
                  className="underline decoration-dotted underline-offset-2 hover:text-gray-900"
                >
                  Contact info
                </a>
                <span className="hidden md:inline">•</span>
                <a
                  href={cfg.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-gray-900"
                >
                  <Globe className="h-4 w-4" aria-hidden /> Website
                </a>
                <a
                  href={`tel:${cfg.phone?.replace(/[^0-9+]/g, "")}`}
                  className="inline-flex items-center gap-1 hover:text-gray-900"
                >
                  <Phone className="h-4 w-4" aria-hidden /> Call
                </a>
                <a
                  href={`mailto:${cfg.email}`}
                  className="inline-flex items-center gap-1 hover:text-gray-900"
                >
                  <Mail className="h-4 w-4" aria-hidden /> Email
                </a>
                <a
                  href={cfg.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-gray-900"
                >
                  <Linkedin className="h-4 w-4" aria-hidden /> LinkedIn
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-700">
                <span>
                  <strong className="text-gray-900">
                    {formatNumber(cfg.followers)}
                  </strong>{" "}
                  followers
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <strong className="text-gray-900">
                    {formatNumber(cfg.connections)}+
                  </strong>{" "}
                  connections
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
