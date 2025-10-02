import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NailCard } from "./NailCard";

interface CaseOpeningProps {
  language: "en" | "ru";
  soul: number;
  onOpenSuccess: () => void;
}

const translations = {
  en: {
    cases: "Cases",
    basicCase: "Basic Case",
    legendaryCase: "Legendary Case",
    canDrop: "Can drop any Nail",
    canDropLegendary: "Can drop all except Old Nail",
    dreamChance: "10% chance for Dream Nail",
    cost: "Cost",
    openCase: "Open Case",
    notEnough: "Not enough soul",
    opening: "Opening...",
    youGot: "You got",
    dreamVersion: "Dream Version",
  },
  ru: {
    cases: "Кейсы",
    basicCase: "Базовый Кейс",
    legendaryCase: "Легендарный Кейс",
    canDrop: "Может выпасть любой Гвоздь",
    canDropLegendary: "Может выпасть все кроме Старого Гвоздя",
    dreamChance: "10% шанс Гвоздя Снов",
    cost: "Цена",
    openCase: "Открыть Кейс",
    notEnough: "Недостаточно души",
    opening: "Открываем...",
    youGot: "Вы получили",
    dreamVersion: "Версия Снов",
  },
};

const BASIC_CASE_COST = 50;
const LEGENDARY_CASE_COST = 150;
const STRIP_LENGTH = 60; // количество айтемов в ленте

export const CaseOpening = ({ language, soul, onOpenSuccess }: CaseOpeningProps) => {
  const [opening, setOpening] = useState(false);
  const [openedNail, setOpenedNail] = useState<any>(null);
  const [isDream, setIsDream] = useState(false);
  const [stripItems, setStripItems] = useState<any[]>([]);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transform, setTransform] = useState<string>("translateX(0px)");
  const [transition, setTransition] = useState<string>("none");

  const stripRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const t = translations[language];

  // Получить все гвозди (кэшируем в памяти компонента)
  const getAllNails = async () => {
    const { data, error } = await supabase
      .from("nails")
      .select("*")
      .order("order_index");
    if (error) throw error;
    return data!;
  };

  const buildStrip = (available: any[], selected: any, dreamRoll: boolean) => {
    const items: any[] = new Array(STRIP_LENGTH).fill(null).map((_, i) => {
      const rnd = available[Math.floor(Math.random() * available.length)];
      const rndDream = Math.random() < 0.1;
      return { ...rnd, isDream: rndDream, key: `item-${i}` };
    });
    // Выберем индекс, который хотим остановить по центру (чуть ближе к концу)
    const winIdx = STRIP_LENGTH - 8; // например 52 при 60
    items[winIdx] = { ...selected, isDream: dreamRoll, key: "winning-item" };
    return { items, winIdx } as const;
  };

  // Запуск физической анимации: плавный скролл к центру выигрышного айтема
  const animateToCenter = () => {
    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip || winningIndex == null) return;

    // Найти DOM-элемент выигрышной карточки
    const winningEl = strip.querySelector(`[data-key="winning-item"]`) as HTMLElement | null;
    if (!winningEl) return;

    const containerRect = container.getBoundingClientRect();
    const winningRect = winningEl.getBoundingClientRect();

    // Текущая позиция полосы относительно контейнера
    // Наша цель — совместить центр winningEl с центром контейнера
    const containerCenter = containerRect.left + containerRect.width / 2;
    const winningCenter = winningRect.left + winningRect.width / 2;

    const delta = containerCenter - winningCenter; // сколько сместить ленту

    // Сбрасываем переход, устанавливаем текущее смещение как старт
    setTransition("none");
    // Оставляем как есть (полоса уже отрисована в начальной позиции)

    // В следующем кадре — запускаем плавный переход к целевой позиции
    requestAnimationFrame(() => {
      setTransition("transform 4.2s cubic-bezier(0.22, 0.61, 0.36, 1)");
      setTransform(`translateX(calc(${delta}px))`);
    });
  };

  // Когда transition закончился — фиксируем результат, выдаем предмет, проводим транзакции
  const handleTransitionEnd = async () => {
    if (!isAnimating || winningIndex == null) return;

    try {
      const winningItem = stripItems[winningIndex];
      setOpenedNail(winningItem);
      setIsAnimating(false);

      // Провести списание души и выдачу гвоздя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Определяем цену по последнему открытому типу (сохраняем в ref или вычисляем по strip?)
      // Проще сохранять в состоянии последнюю стоимость
    } catch (e) {
      // ничего, обработаем ниже в openCase
    }
  };

  // Открытие кейса
  const openCase = async (caseType: "basic" | "legendary") => {
    const cost = caseType === "basic" ? BASIC_CASE_COST : LEGENDARY_CASE_COST;

    if (soul < cost) {
      toast({ title: t.notEnough, variant: "destructive" });
      return;
    }

    setOpening(true);
    setOpenedNail(null);

    try {
      const all = await getAllNails();
      const available = caseType === "legendary" ? all.filter((n) => n.order_index > 1) : all;

      // Roll for Dream Nail (10% chance)
      const dreamRoll = Math.random() < 0.1;
      setIsDream(dreamRoll);

      // Выбираем выигрышный гвоздь
      const selected = available[Math.floor(Math.random() * available.length)];

      // Собираем ленту, где выигрыш гарантированно окажется по центру
      const { items, winIdx } = buildStrip(available, selected, dreamRoll);
      setStripItems(items);
      setWinningIndex(winIdx);

      // Запускаем анимацию
      setIsAnimating(true);

      // Отложим запуск вычисления до рендера DOM
      setTimeout(() => {
        animateToCenter();
      }, 50);

      // Дождемся окончания анимации
      const waitMs = 4500; // немного больше transition
      await new Promise((r) => setTimeout(r, waitMs));

      // Выдать награду (после остановки анимации)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Списываем душу
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ soul: soul - cost })
        .eq("id", user.id);
      if (updateError) throw updateError;

      // Добавляем гвоздь
      const { error: insertError } = await supabase
        .from("user_nails")
        .insert({
          user_id: user.id,
          nail_id: selected.id,
          is_dream: dreamRoll,
        });
      if (insertError) throw insertError;

      setOpenedNail(selected);
      toast({
        title: `${t.youGot} ${language === "ru" ? selected.name_ru : selected.name}!`,
        description: dreamRoll ? t.dreamVersion : undefined,
      });

      onOpenSuccess();
    } catch (error: any) {
      setIsAnimating(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setOpening(false);
      // Сбросим transform для следующего открытия
      setTransform("translateX(0px)");
      setTransition("none");
    }
  };

  // Стилизатор карточки по редкости
  const rarityStyles = (rarity: string, isDreamItem: boolean) => ({
    borderColor: `hsl(var(--${rarity}))`,
    backgroundColor: isDreamItem
      ? `hsl(var(--${rarity}) / 0.20)`
      : `hsl(var(--${rarity}) / 0.10)`,
    boxShadow: `0 0 20px hsl(var(--${rarity}) / 0.40)`,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.cases}</h2>

      {/* Полоса анимации */}
      {isAnimating && stripItems.length > 0 && (
        <div ref={containerRef} className="relative w-full h-48 overflow-hidden rounded-lg border-2 border-primary bg-background/50 backdrop-blur">
          {/* Центральный селектор */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary z-20" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-primary z-20" />

          {/* Лента */}
          <div
            ref={stripRef}
            className="absolute top-1/2 -translate-y-1/2 flex gap-4 px-4 will-change-transform"
            style={{ transform, transition }}
            onTransitionEnd={handleTransitionEnd}
          >
            {stripItems.map((item, i) => {
              const isWin = item.key === "winning-item";
              return (
                <div
                  key={item.key}
                  data-key={item.key}
                  className={`flex-shrink-0 w-32 h-40 rounded-lg p-2 flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all ${
                    isWin ? "scale-110 z-10" : ""
                  }`}
                  style={{
                    borderWidth: isWin ? "3px" : "2px",
                    borderStyle: "solid",
                    ...rarityStyles(item.rarity, item.isDream),
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
                  {item.isDream && <Sparkles className="h-4 w-4 text-dream relative z-10" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Плашка с результатом */}
      {openedNail && !isAnimating && (
        <div className="case-reveal space-y-4">
          <div className="text-center">
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: `hsl(var(--${openedNail.rarity}))` }}
            >
              {t.youGot}
            </h3>
            <div
              className="inline-block p-6 rounded-xl border-2"
              style={{
                borderColor: `hsl(var(--${openedNail.rarity}))`,
                backgroundColor: isDream
                  ? `hsl(var(--${openedNail.rarity}) / 0.15)`
                  : `hsl(var(--${openedNail.rarity}) / 0.10)`,
                boxShadow: `0 0 40px hsl(var(--${openedNail.rarity}) / 0.50)`,
              }}
            >
              <NailCard nail={openedNail} isDream={isDream} language={language} />
            </div>
          </div>
        </div>
      )}

      {/* Карточки кейсов */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 space-y-4 border-border/50">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-common" />
            <div>
              <h3 className="font-bold text-xl">{t.basicCase}</h3>
              <p className="text-sm text-muted-foreground">{t.canDrop}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-dream">
            <Sparkles className="h-3 w-3 mr-1" />
            {t.dreamChance}
          </Badge>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t.cost}:</span>
            <span className="font-bold text-legendary">
              {BASIC_CASE_COST} {language === "ru" ? "Души" : "Soul"}
            </span>
          </div>
          <Button
            className="w-full"
            onClick={() => openCase("basic")}
            disabled={opening || soul < BASIC_CASE_COST}
          >
            {opening ? t.opening : t.openCase}
          </Button>
        </Card>

        <Card className="p-6 space-y-4 border-legendary">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-legendary" />
            <div>
              <h3 className="font-bold text-xl text-legendary">{t.legendaryCase}</h3>
              <p className="text-sm text-muted-foreground">{t.canDropLegendary}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-dream">
            <Sparkles className="h-3 w-3 mr-1" />
            {t.dreamChance}
          </Badge>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t.cost}:</span>
            <span className="font-bold text-legendary">
              {LEGENDARY_CASE_COST} {language === "ru" ? "Души" : "Soul"}
            </span>
          </div>
          <Button
            className="w-full"
            onClick={() => openCase("legendary")}
            disabled={opening || soul < LEGENDARY_CASE_COST}
          >
            {opening ? t.opening : t.openCase}
          </Button>
        </Card>
      </div>
    </div>
  );
};
