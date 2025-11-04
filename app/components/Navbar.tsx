"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Hexagon } from "lucide-react";
import LoginNavButton from "@/app/flash-reports/components/Login/LoginAuthButton";

/* ---------- Fixed header with auto spacer (keeps layout) ---------- */
function StickyLikeHeader({ children }: React.PropsWithChildren) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [h, setH] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      <div style={{ height: h }} aria-hidden />
      <div
        ref={ref}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black"
      >
        {children}
      </div>
    </>
  );
}

/* ---------- CTA buttons ---------- */
function FlashOutlineButton({
  href,
  children,
}: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link
      id="flash-report-btn"
      href={href}
      className="relative inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0b1324] px-5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)] transition hover:ring-white/40"
      style={{ color: "#fff" }} // hard guarantee the text stays white
    >
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-20" />
      <Hexagon className="h-4 w-4 text-amber-300" />
      {children}
    </Link>
  );
}

function YellowButton({
  href,
  children,
}: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center rounded-2xl bg-gradient-to-b from-yellow-400 to-amber-500 px-5 text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(245,158,11,.35)] transition hover:from-yellow-300 hover:to-amber-400"
    >
      {children}
    </Link>
  );
}

/* ---------- NavBar ---------- */
export default function NavBar() {
  return (
    <>
      <StickyLikeHeader>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="RACE Analytics"
              width={360}
              height={88}
              className="h-20 w-auto shrink-0 lg:h-24"
              priority
            />
          </div>

          {/* Center nav */}
          <nav id="site-nav" className="hidden items-center gap-16 md:flex">
            <Link
              className="text-sm font-extrabold tracking-wide text-white hover:text-white"
              href="https://raceautoindia.com/"
            >
              NEWS
            </Link>
            <Link
              className="text-sm font-extrabold tracking-wide text-white hover:text-white"
              href="https://raceautoindia.com/magazine"
            >
              MAGAZINE
            </Link>
            <Link
              className="text-sm font-extrabold tracking-wide text-white hover:text-white"
              href="https://raceautoindia.com/page/contact"
            >
              CONTACT&nbsp;US
            </Link>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <FlashOutlineButton href="/flash-reports">Flash Report</FlashOutlineButton>
            <YellowButton href="https://raceautoindia.com/subscription">
              Subscribe
            </YellowButton>
            <LoginNavButton />
          </div>
        </div>
      </StickyLikeHeader>

      {/* Force white for nav + Flash Report label (beats any global dimming) */}
      <style jsx global>{`
        #site-nav,
        #site-nav * {
          color: #ffffff !important;
          opacity: 1 !important;
          filter: none !important;
          mix-blend-mode: normal !important;
        }
        #site-nav a::before,
        #site-nav a:before,
        #site-nav a + a::before,
        #site-nav li::before {
          content: none !important;
          display: none !important;
        }
        #site-nav ul,
        #site-nav li {
          list-style: none !important;
        }
        #flash-report-btn,
        #flash-report-btn * {
          color: #ffffff !important;
          opacity: 1 !important;
          filter: none !important;
          mix-blend-mode: normal !important;
        }
      `}</style>
    </>
  );
}
