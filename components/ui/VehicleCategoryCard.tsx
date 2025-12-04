"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Award,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { MiniBarComparison } from "@/components/charts/MiniBarComparison";
import { ProgressRing } from "@/components/charts/ProgressRing";
import type { LucideIcon } from "lucide-react";

interface VehicleCategoryCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  subCategories?: string[];
  metrics: {
    salesVolume: number;
    momGrowth: number;
    yoyGrowth: number;
    marketShare: number;
    topOEM: string;
    evPenetration?: number;
    currentMonthSales: number;
    previousMonthSales: number;
    trendData: number[];
    rank: number;
    targetProgress: number;
  };
  index: number;
}

export function VehicleCategoryCard({
  id,
  title,
  description,
  icon: Icon,
  color,
  bgColor,
  subCategories,
  metrics,
  index,
}: VehicleCategoryCardProps) {
  // const isGrowing = metrics.momGrowth >= 0;
  const sparklineData = metrics.trendData.map((value) => ({ value }));

  const colorMap: Record<string, string> = {
    "text-blue-400": "#007AFF",
    "text-green-400": "#2ECC71",
    "text-purple-400": "#8B5CF6",
    "text-amber-400": "#FFC043",
    "text-red-400": "#FF5B5B",
    "text-orange-400": "#FF8C42",
    "text-teal-400": "#1ABC9C",
  };

  const chartColor = colorMap[color] || "#007AFF";
  const isTopPerformer = metrics.rank <= 2;
  const hasHighGrowth = metrics.momGrowth > 5;

  const formatPct = (value: number) =>
    Number.isNaN(value) ? "–" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const hasMom = !Number.isNaN(metrics.momGrowth);
  const isGrowing = hasMom && metrics.momGrowth >= 0;

  const hasYoy = !Number.isNaN(metrics.yoyGrowth);

  return (
    <Link
      href={`/flash-reports/${id}`}
      className="group block animate-fade-in hover-lift"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative bg-card border border-border rounded-xl p-6 h-full hover:bg-card/80 transition-all duration-300 overflow-hidden hover:shadow-xl hover:border-primary/30">
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${chartColor}20 0%, transparent 100%)`,
          }}
        />

        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div
            className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-3 rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                  bgColor
                )}
              >
                <Icon className={cn("w-6 h-6", color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {isTopPerformer && <Award className="w-4 h-4 text-warning" />}
                  {hasHighGrowth && <Zap className="w-4 h-4 text-success" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
          </div>

          {/* Badges Section */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              #{metrics.rank} in Growth
            </span>
            {hasHighGrowth && (
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                Trending
              </span>
            )}
            {subCategories && subCategories.length > 0 && (
              <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                {subCategories.length} segments
              </span>
            )}
          </div>

          {/* Metrics Grid Section */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Sales Volume
              </div>
              <div className="text-2xl font-bold">
                {(metrics.salesVolume / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-muted-foreground">units</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                MoM Growth
              </div>
              <div
                className={cn(
                  "text-2xl font-bold flex items-center gap-1",
                  hasMom
                    ? isGrowing
                      ? "text-success"
                      : "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {hasMom ? (
                  <>
                    {isGrowing ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    {formatPct(metrics.momGrowth)}
                  </>
                ) : (
                  <span>–</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Market Share
              </div>
              <div className="text-xl font-bold">
                {metrics.marketShare.toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                YoY Growth
              </div>
              <div
                className={cn(
                  "text-xl font-bold",
                  hasYoy
                    ? metrics.yoyGrowth >= 0
                      ? "text-success"
                      : "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {hasYoy ? formatPct(metrics.yoyGrowth) : "–"}
              </div>
            </div>
          </div>

          {/* Top OEM Badge */}
          <div className="mb-4 p-2 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">
              Leading OEM
            </div>
            <div className="text-sm font-semibold">{metrics.topOEM}</div>
          </div>

          {/* Charts Section */}
          <div className="space-y-4 mb-4">
            {/* Sparkline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  6-Month Trend
                </span>
                <ProgressRing
                  percentage={Math.round(metrics.targetProgress)}
                  size={40}
                  strokeWidth={3}
                  color={chartColor}
                  label={`${Math.round(metrics.targetProgress)}%`}
                />
              </div>
              <MiniSparkline
                data={sparklineData}
                color={chartColor}
                height={48}
              />
            </div>

            {/* Mini Bar Comparison */}
            <MiniBarComparison
              current={metrics.currentMonthSales}
              previous={metrics.previousMonthSales}
              color={chartColor}
              height={28}
            />
          </div>

          {/* Optional EV Penetration */}
          {metrics.evPenetration !== undefined && (
            <div className="mt-auto pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    EV Share
                  </span>
                </div>
                <span className="text-sm font-semibold text-success">
                  {metrics.evPenetration.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
