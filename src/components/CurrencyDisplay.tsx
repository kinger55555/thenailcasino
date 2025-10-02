import { Coins, Sparkles, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import maskImage from "@/assets/mask.webp";

interface CurrencyDisplayProps {
  soul: number;
  coins: number;
  dreamPoints: number;
  masks: number;
  language: "en" | "ru";
}

const translations = {
  en: {
    soul: "Soul",
    coins: "Coins",
    dreamPoints: "Dream Points",
    masks: "Masks",
  },
  ru: {
    soul: "Душа",
    coins: "Монеты",
    dreamPoints: "Очки Снов",
    masks: "Маски",
  },
};

export const CurrencyDisplay = ({ soul, coins, dreamPoints, masks, language }: CurrencyDisplayProps) => {
  const t = translations[language];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="p-3 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-soul" />
            <span className="text-sm text-muted-foreground">{t.soul}</span>
          </div>
          <span className="font-bold text-soul">{soul}</span>
        </div>
      </Card>

      <Card className="p-3 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-legendary" />
            <span className="text-sm text-muted-foreground">{t.coins}</span>
          </div>
          <span className="font-bold text-legendary">{coins}</span>
        </div>
      </Card>

      <Card className="p-3 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-dream dream-glow" />
            <span className="text-sm text-muted-foreground">{t.dreamPoints}</span>
          </div>
          <span className="font-bold text-dream">{dreamPoints}</span>
        </div>
      </Card>

      <Card className="p-3 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={maskImage} alt="Mask" className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">{t.masks}</span>
          </div>
          <span className="font-bold text-mask">{masks}</span>
        </div>
      </Card>
    </div>
  );
};
