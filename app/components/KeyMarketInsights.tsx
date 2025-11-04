// app/components/KeyMarketInsights.tsx
"use client";

import React from "react";
import {
  TrendingUp,
  Badge,
  Gauge,
  Activity,
  Globe2,
  Target,
} from "lucide-react";

// shared subtle border (grey-blue hairline)
const softBorder = "ring-1 ring-inset ring-[#2F3949]/40";

const Card = ({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) => (
  <div
    className={`rounded-2xl ${softBorder} p-6 md:p-7 shadow-[0_10px_40px_rgba(0,0,0,.45)] backdrop-blur ${className}`}
  >
    {children}
  </div>
);

const KeyMarketInsights: React.FC = () => {
  return (
    <section className="w-full bg-[#0b1218] text-white py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4">
        {/* Heading */}
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Key Market Insights
        </h2>
        <p className="mt-2 max-w-3xl text-white/70">
          AI-generated insights from current market data analysis
        </p>

        {/* Cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:mt-10 md:grid-cols-2 xl:grid-cols-3">
          {/* 1. Top Growing Category */}
          <Card className="bg-white/[0.05]">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/8 text-white/90">
                <TrendingUp className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Top Growing Category</h3>
                <p className="mt-2 text-white/80 leading-relaxed">
                  Two-Wheeler segment leads growth with{" "}
                  <span className="font-semibold text-white">+7.1%</span>{" "}
                  month-over-month, driven by festive season demand and new
                  electric model launches.
                </p>
              </div>
            </div>
          </Card>

          {/* 2. Best Performing OEM */}
          <Card className="bg-[#091628]/70">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                <Badge className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Best Performing OEM</h3>
                <p className="mt-2 text-white/80 leading-relaxed">
                  <span className="font-semibold text-white">Hyundai</span>{" "}
                  maintains market leadership with{" "}
                  <span className="font-semibold text-white">50,883</span> units
                  and <span className="font-semibold text-white">+10.7%</span>{" "}
                  growth rate.
                </p>
              </div>
            </div>
          </Card>

          {/* 3. EV Adoption Accelerating */}
          <Card className="bg-[#2a1d07]/70">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                <Gauge className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">EV Adoption Accelerating</h3>
                <p className="mt-2 text-white/80 leading-relaxed">
                  Electric vehicle market share reached{" "}
                  <span className="font-semibold text-white">4.2%</span>, up{" "}
                  0.8 percentage points from last month with continued
                  infrastructure expansion.
                </p>
              </div>
            </div>
          </Card>

          {/* 4. Seasonal Trend Detected */}
          <Card className="bg-[#1a1230]/70">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300">
                <Activity className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Seasonal Trend Detected</h3>
                <p className="mt-2 text-white/80 leading-relaxed">
                  Festival season driving{" "}
                  <span className="font-semibold text-white">15–20%</span> sales
                  uptick across all categories, particularly strong in Passenger
                  and Two-Wheeler segments.
                </p>
              </div>
            </div>
          </Card>

          {/* 5. Regional Performance */}
          <Card className="bg-[#0c1f17]/70">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <Globe2 className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Regional Performance</h3>
                <p className="mt-2 text-white/80 leading-relaxed">
                  India market showing robust performance with balanced growth
                  across urban and rural segments.
                </p>
              </div>
            </div>
          </Card>

          {/* 6. Emerging Opportunities */}
          <Card className="bg-[#2a1316]/70">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-400/15 text-rose-300">
                <Target className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Emerging Opportunities</h3>
                <p className="mt-2 text-white/80 leading-relaxed">
                  Premium segment and alternative fuel vehicles showing{" "}
                  <span className="font-semibold text-white">
                    2× market average
                  </span>{" "}
                  growth, indicating shifting consumer preferences.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default KeyMarketInsights;
