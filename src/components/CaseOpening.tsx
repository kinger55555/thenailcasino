import { useState } from "react";
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

export const CaseOpening = ({ language, soul, onOpenSuccess }: CaseOpeningProps) => {
  const [opening, setOpening] = useState(false);
  const [openedNail, setOpenedNail] = useState<any>(null);
  const [isDream, setIsDream] = useState(false);
  const [scrollItems, setScrollItems] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const t = translations[language];

  const openCase = async (caseType: "basic" | "legendary") => {
    const cost = caseType === "basic" ? BASIC_CASE_COST : LEGENDARY_CASE_COST;
    
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
      const availableNails = caseType === "legendary" 
        ? nails!.filter(n => n.order_index > 1)
        : nails!;

      // Roll for Dream Nail (10% chance)
      const dreamRoll = Math.random() < 0.1;
      setIsDream(dreamRoll);

      // Select random nail
      const selectedNail = availableNails[Math.floor(Math.random() * availableNails.length)];

      // Generate scroll strip (50 items)
      const strip = [];
      for (let i = 0; i < 50; i++) {
        const randomNail = availableNails[Math.floor(Math.random() * availableNails.length)];
        const randomDream = Math.random() < 0.1;
        strip.push({ ...randomNail, isDream: randomDream, key: `item-${i}` });
      }
      // Place winning item at position 45 (near the end)
      strip[45] = { ...selectedNail, isDream: dreamRoll, key: 'winning-item' };
      setScrollItems(strip);

      // Start animation
      setIsAnimating(true);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get current profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deduct soul
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ soul: soul - cost })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Add nail to inventory
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
      setIsAnimating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.cases}</h2>

      {/* CS:GO Style Animation */}
      {isAnimating && scrollItems.length > 0 && (
        <div className="relative w-full h-48 overflow-hidden rounded-lg border-2 border-primary bg-background/50 backdrop-blur">
          {/* Central Selector */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary z-20 shadow-[0_0_20px_rgba(var(--primary),0.8)]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-primary z-20" />
          
          {/* Scrolling Strip */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 flex gap-4 px-4"
            style={{
              animation: 'case-scroll 5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
              left: '100%'
            }}
          >
            {scrollItems.map((item, idx) => (
              <div
                key={item.key}
                className="flex-shrink-0 w-32 h-40 rounded-lg p-2 flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                style={{
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: `hsl(var(--${item.rarity}))`,
                  backgroundColor: item.isDream 
                    ? `hsl(var(--${item.rarity}) / 0.2)` 
                    : `hsl(var(--${item.rarity}) / 0.1)`,
                  boxShadow: `0 0 20px hsl(var(--${item.rarity}) / 0.4)`
                }}
              >
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ 
                    background: `linear-gradient(135deg, hsl(var(--${item.rarity})) 0%, transparent 100%)` 
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
            ))}
          </div>
        </div>
      )}

      {openedNail && !isAnimating && (
        <div className="case-reveal">
          <NailCard nail={openedNail} isDream={isDream} language={language} />
        </div>
      )}

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
      </div>
    </div>
  );
};
