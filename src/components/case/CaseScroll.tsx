import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Sparkles } from "lucide-react";

interface CaseScrollProps {
  items: any[];
  winningKey: string;
  language: "en" | "ru";
  durationMs?: number;
}

// Dimensions used in CaseOpening list items (w-32 => 128px, gap-4 => 16px)
const ITEM_W = 128;
const ITEM_H = 160; // h-40 => 160px (not used in calc, but here for clarity)
const GAP = 16;
const PADDING_X = 16; // px-4 => 16px (left padding used in calc)

export const CaseScroll: React.FC<CaseScrollProps> = ({
  items,
  winningKey,
  language,
  durationMs = 5000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const winningIndex = useMemo(
    () => Math.max(0, items.findIndex((it) => it.key === winningKey)),
    [items, winningKey]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    const containerW = container.clientWidth;
    const step = ITEM_W + GAP;
    const winCenterX = PADDING_X + winningIndex * step + ITEM_W / 2;

    // Final position so that winning item is perfectly centered under the marker
    const finalX = Math.round(containerW / 2 - winCenterX);

    // Start off-screen to the right for a smooth long scroll
    // Then transition to the final position
    strip.style.willChange = "transform";
    strip.style.transform = `translateX(${containerW}px)`;
    strip.style.transition = "none";

    // Next frame, apply transition to the target
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        strip.style.transition = `transform ${durationMs}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
        strip.style.transform = `translateX(${finalX}px)`;
      });
    });
  }, [items, winningIndex, durationMs]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 overflow-hidden rounded-lg border-2 border-primary bg-background/50 backdrop-blur"
    >
      {/* Central marker */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary z-20 shadow-[0_0_20px_hsl(var(--primary)/0.8)]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-primary z-20" />

      {/* Strip */}
      <div
        ref={stripRef}
        className="absolute top-1/2 -translate-y-1/2 flex gap-4 px-4"
        style={{ left: 0 }}
      >
        {items.map((item) => {
          const isWinning = item.key === winningKey;
          return (
            <div
              key={item.key}
              className={`flex-shrink-0 w-32 h-40 rounded-lg p-2 flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all ${
                isWinning ? "scale-110 z-10" : ""
              }`}
              style={{
                borderWidth: isWinning ? "3px" : "2px",
                borderStyle: "solid",
                borderColor: `hsl(var(--${item.rarity}))`,
                backgroundColor: item.isDream
                  ? `hsl(var(--${item.rarity}) / 0.2)`
                  : `hsl(var(--${item.rarity}) / 0.1)`,
                boxShadow: isWinning
                  ? `0 0 30px hsl(var(--${item.rarity}) / 0.8)`
                  : `0 0 20px hsl(var(--${item.rarity}) / 0.4)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--${item.rarity})) 0%, transparent 100%)`,
                }}
              />
              <span
                className="text-xs font-bold text-center relative z-10"
                style={{ color: `hsl(var(--${item.rarity}))` }}
              >
                {language === "ru" ? item.name_ru : item.name}
              </span>
              {item.isDream && (
                <Sparkles className="h-4 w-4 text-dream relative z-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};