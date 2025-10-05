import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NailCard } from "./NailCard";
import { CaseScroll } from "./case/CaseScroll";

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
    dreamCase: "Dream Case",
    canDrop: "Can drop any Nail",
    canDropLegendary: "Can drop all except Old Nail",
    canDropDream: "Can drop all except Old Nail (regular version only)",
    dreamChance: "10% chance for Dream Nail",
    noDreamChance: "No Dream Nail - regular only",
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
    dreamCase: "Кейс Снов",
    canDrop: "Может выпасть любой Гвоздь",
    canDropLegendary: "Может выпасть все кроме Старого Гвоздя",
    canDropDream: "Может выпасть все кроме Старого Гвоздя (только обычная версия)",
    dreamChance: "10% шанс Гвоздя Снов",
    noDreamChance: "Без Гвоздя Снов - только обычные",
    cost: "Цена",
    openCase: "Открыть Кейс",
    notEnough: "Недостаточно души",
    opening: "Открываем...",
    youGot: "Вы получили",
    dreamVersion: "Версия Снов",
  },
};

const BASIC_CASE_COST = 100;
const LEGENDARY_CASE_COST = 300;
const DREAM_CASE_COST = 500;

export const CaseOpening = ({ language, soul, onOpenSuccess }: CaseOpeningProps) => {
  const [opening, setOpening] = useState(false);
  const [openedNail, setOpenedNail] = useState<any>(null);
  const [isDream, setIsDream] = useState(false);
  const [scrollItems, setScrollItems] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const t = translations[language];

  const openCase = async (caseType: "basic" | "legendary" | "dream") => {
    const cost = caseType === "basic" ? BASIC_CASE_COST : 
                 caseType === "legendary" ? LEGENDARY_CASE_COST : 
                 DREAM_CASE_COST;
    
    if (soul < cost) {
      toast({
        title: t.notEnough,
        variant: "destructive",
      });
      return;
    }

    setOpening(true);
    setOpenedNail(null);

    try {
      // Get all nails
      const { data: nails, error: nailsError } = await supabase
        .from("nails")
        .select("*")
        .order("order_index");

      if (nailsError) throw nailsError;

      // Filter nails based on case type
      const availableNails = (caseType === "legendary" || caseType === "dream"
        ? nails!.filter((n: any) => n.order_index > 1)
        : nails!) as any[];

      // Weight function: earlier order_index => much higher chance; highest index is very rare
      const weightFor = (n: any) => {
        const idx = Math.max(1, Number(n.order_index) || 1);
        // Exponential decay; index 1 ~ 100, 2 ~ 62, 3 ~ 39, 4 ~ 24, 5 ~ 15, 6 ~ 9 ...
        return Math.max(1, Math.round(100 / Math.pow(1.6, idx - 1)));
      };

      const totalWeight = availableNails.reduce((sum, n) => sum + weightFor(n), 0);
      let roll = Math.random() * totalWeight;
      let selectedNail = availableNails[0];
      for (const n of availableNails) {
        roll -= weightFor(n);
        if (roll <= 0) { selectedNail = n; break; }
      }

      // Roll for Dream Nail (10% chance for basic/legendary, 0% for dream case)
      const dreamRoll = caseType === "dream" ? false : Math.random() < 0.1;
      setIsDream(dreamRoll);

      // Generate scroll strip (50 items)
      const strip = [];
      for (let i = 0; i < 50; i++) {
        if (i === 45) {
          // Position 45 will be centered - place winning nail here
          strip.push({ ...selectedNail, isDream: dreamRoll, key: 'winning-item' });
        } else {
          const randomNail = availableNails[Math.floor(Math.random() * availableNails.length)];
          const randomDream = Math.random() < 0.1;
          strip.push({ ...randomNail, isDream: randomDream, key: `item-${i}` });
        }
      }
      
      setScrollItems(strip);
      setIsAnimating(true);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setIsAnimating(false);

      // Get current profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deduct soul
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ soul: soul - cost })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Add nail to inventory - USE THE SELECTED NAIL (not from strip)
      const { error: insertError } = await supabase
        .from("user_nails")
        .insert({
          user_id: user.id,
          nail_id: selectedNail.id,
          is_dream: dreamRoll,
        });

      if (insertError) throw insertError;

      setOpenedNail(selectedNail);
      toast({
        title: `${t.youGot} ${language === "ru" ? selectedNail.name_ru : selectedNail.name}!`,
        description: dreamRoll ? t.dreamVersion : undefined,
      });
      
      onOpenSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.cases}</h2>

      {/* Case Opening Animation */}
      {isAnimating && scrollItems.length > 0 && (
        <CaseScroll items={scrollItems} winningKey="winning-item" language={language} durationMs={5000} />
      )}

      {openedNail && !isAnimating && (
        <div className="case-reveal space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4" style={{ color: `hsl(var(--${openedNail.rarity}))` }}>
              {t.youGot}
            </h3>
            <div className="inline-block p-6 rounded-xl border-2" style={{
              borderColor: `hsl(var(--${openedNail.rarity}))`,
              backgroundColor: isDream 
                ? `hsl(var(--${openedNail.rarity}) / 0.15)` 
                : `hsl(var(--${openedNail.rarity}) / 0.1)`,
              boxShadow: `0 0 40px hsl(var(--${openedNail.rarity}) / 0.5)`
            }}>
              <NailCard nail={openedNail} isDream={isDream} language={language} />
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
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
            <span className="font-bold text-legendary">{BASIC_CASE_COST} {language === "ru" ? "Души" : "Soul"}</span>
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
            <span className="font-bold text-legendary">{LEGENDARY_CASE_COST} {language === "ru" ? "Души" : "Soul"}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => openCase("legendary")}
            disabled={opening || soul < LEGENDARY_CASE_COST}
          >
            {opening ? t.opening : t.openCase}
          </Button>
        </Card>

        <Card className="p-6 space-y-4 border-dream">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-dream" />
            <div>
              <h3 className="font-bold text-xl text-dream">{t.dreamCase}</h3>
              <p className="text-sm text-muted-foreground">{t.canDropDream}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {t.noDreamChance}
          </Badge>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t.cost}:</span>
            <span className="font-bold text-dream">{DREAM_CASE_COST} {language === "ru" ? "Души" : "Soul"}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => openCase("dream")}
            disabled={opening || soul < DREAM_CASE_COST}
          >
            {opening ? t.opening : t.openCase}
          </Button>
        </Card>
      </div>
    </div>
  );
};
