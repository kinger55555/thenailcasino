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
  coins: number;
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
    notEnough: "Not enough coins",
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
    notEnough: "Недостаточно монет",
    opening: "Открываем...",
    youGot: "Вы получили",
    dreamVersion: "Версия Снов",
  },
};

const BASIC_CASE_COST = 50;
const LEGENDARY_CASE_COST = 150;

export const CaseOpening = ({ language, coins, onOpenSuccess }: CaseOpeningProps) => {
  const [opening, setOpening] = useState(false);
  const [openedNail, setOpenedNail] = useState<any>(null);
  const [isDream, setIsDream] = useState(false);
  const { toast } = useToast();
  const t = translations[language];

  const openCase = async (caseType: "basic" | "legendary") => {
    const cost = caseType === "basic" ? BASIC_CASE_COST : LEGENDARY_CASE_COST;
    
    if (coins < cost) {
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

      // Simulate opening animation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get current profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deduct coins
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ coins: coins - cost })
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
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.cases}</h2>

      {openedNail && (
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
            <span className="font-bold text-legendary">{BASIC_CASE_COST} {language === "ru" ? "Монет" : "Coins"}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => openCase("basic")}
            disabled={opening || coins < BASIC_CASE_COST}
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
            <span className="font-bold text-legendary">{LEGENDARY_CASE_COST} {language === "ru" ? "Монет" : "Coins"}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => openCase("legendary")}
            disabled={opening || coins < LEGENDARY_CASE_COST}
          >
            {opening ? t.opening : t.openCase}
          </Button>
        </Card>
      </div>
    </div>
  );
};
