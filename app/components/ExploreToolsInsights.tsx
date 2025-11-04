// app/components/ExploreToolsInsights.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

/* ----------------- shared subtle border ----------------- */
const softBorder = "ring-1 ring-inset ring-[#2F3949]/40";

/* ----------------- data ----------------- */
const CATEGORIES = [
  {
    title: "Passenger Vehicles",
    img: "/images/pass-1.png",
    href: "flash-reports/passenger-vehicle", // ← change as needed
  },
  {
    title: "Commercial Vehicles",
    img: "/images/comm.png",
    href: "/flash-reports/commercial-vehicle",
  },
  {
    title: "Two Wheeler",
    img: "/images/two.png",
    href: "/flash-reports/two-wheeler",
  },
  {
    title: "Three Wheeler",
    img: "/images/three-wheeler.png",
    href: "/flash-reports/three-wheeler",
  },
  {
    title: "Tractor",
    img: "/images/tractor.png",
    href: "/flash-reports/tractor",
  },
  {
    title: "Overall Industry",
    img: "/images/over.png",
    href: "/flash-reports",
  },
];

const FEATURES_LEFT = [
  { label: "Real-time Data", color: "#60A5FA" },
  { label: "Multi-scenario", color: "#E5E7EB" },
];
const FEATURES_RIGHT = [
  { label: "95% Accuracy", color: "#E5E7EB" },
  { label: "Risk Analysis", color: "#EF4444" },
];

const INSIGHTS = [
  {
    tag: "EV Trends",
    delta: "+0.8pp",
    title: "Electric Vehicle Adoption Accelerates",
    body:
      "EV market share increased by 0.8pp in September, driven by policy support and infrastructure expansion.",
  },
  {
    tag: "Commercial",
    delta: "+12%",
    title: "Commercial Vehicle Recovery",
    body:
      "Strong demand in logistics and construction sectors pushes CV sales up 12% month-over-month.",
  },
  {
    tag: "Two-Wheeler",
    delta: "+18%",
    title: "Two-Wheeler Seasonal Uptick",
    body:
      "Festival season drives two-wheeler sales with premium segment showing exceptional growth.",
  },
];

/* ----------------- component ----------------- */
export default function ExploreToolsInsights() {
  return (
    <section className="w-full bg-[#0b1218] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        {/* ---------- Explore Vehicle Categories ---------- */}
        <header className="mb-6">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Explore Vehicle Categories
          </h2>
          <p className="mt-2 max-w-3xl text-white/70">
            Dive into detailed analytics for each automotive segment
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className={`group relative block h-56 overflow-hidden rounded-2xl ${softBorder} bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500/60`}
              aria-label={`Open ${c.title}`}
              prefetch={false}
            >
              <Image
                src={c.img}
                alt={c.title}
                fill
                priority
                className="object-cover transition duration-500 group-hover:scale-[1.03] group-hover:brightness-[.9]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-lg font-semibold drop-shadow">{c.title}</h3>
              </div>
              {/* invisible text for screen readers ensures the whole tile announces as a link */}
              <span className="sr-only">{`Go to ${c.title}`}</span>
            </Link>
          ))}
        </div>

        {/* ---------- AI Powered Forecast Tools ---------- */}
        <div className="mt-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* copy */}
          <div>
            <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              RACE — AI POWERED FORECAST TOOLS
            </h3>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
              Advanced machine learning algorithms analyze market patterns, seasonal
              trends, and economic indicators to deliver precise forecasting with
              confidence intervals and scenario planning.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <ul className="space-y-4">
                {FEATURES_LEFT.map((f) => (
                  <li key={f.label} className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: f.color }}
                    />
                    <span className="text-white/90">{f.label}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-4">
                {FEATURES_RIGHT.map((f) => (
                  <li key={f.label} className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: f.color }}
                    />
                    <span className="text-white/90">{f.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* image */}
          <div className={`relative rounded-3xl ${softBorder} bg-white/5 p-2 shadow-[0_30px_80px_rgba(17,24,39,.45)]`}>
            <div className="relative h-[350px] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/int.png"
                alt="AI Forecast"
                fill
                className="object-cover"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] blur-2xl opacity-30 bg-[radial-gradient(60%_70%_at_70%_50%,#3B82F6,transparent_60%)]" />
          </div>
        </div>

        {/* ---------- Latest Insights ---------- */}
        <div className="mt-16">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight">Latest Insights</h3>
              <p className="mt-2 text-white/70">
                Key market developments and trending analysis
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <CalendarDays className="h-5 w-5" />
              <span>
                Last updated: <span className="text-white/85">September 2025</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {INSIGHTS.map((i) => (
              <article
                key={i.title}
                className={`rounded-2xl ${softBorder} bg-[#0b141f]/70 p-6 shadow-[0_10px_30px_rgba(0,0,0,.45)]`}
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-md bg-blue-500/15 px-3 py-1 text-sm font-medium text-blue-200">
                    {i.tag}
                  </span>
                  <span className="text-sm font-semibold text-white/80">{i.delta}</span>
                </div>
                <h4 className="mt-4 text-xl font-semibold">{i.title}</h4>
                <p className="mt-2 text-white/70 leading-relaxed">{i.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
