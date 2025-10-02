import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import nailsSprite from "@/assets/nails-sprite.png";

interface NailCardProps {
  nail: {
    id: string;
    name: string;
    name_ru: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    base_damage: number;
    sell_value: number;
    dream_sell_value: number;
    order_index?: number;
  };
  isDream?: boolean;
  language: "en" | "ru";
  onClick?: () => void;
  className?: string;
}

const rarityColors = {
  common: "text-common border-common",
  uncommon: "text-uncommon border-uncommon",
  rare: "text-rare border-rare",
  epic: "text-epic border-epic",
  legendary: "text-legendary border-legendary",
};

export const NailCard = ({ nail, isDream, language, onClick, className }: NailCardProps) => {
  const nailName = language === "ru" ? nail.name_ru : nail.name;
  const sellValue = isDream ? nail.dream_sell_value : nail.sell_value;

  return (
    <Card
      className={`p-4 relative overflow-hidden cursor-pointer transition-all hover:scale-105 border-2 ${
        rarityColors[nail.rarity]
      } ${isDream ? "dream-glow" : ""} ${className}`}
      onClick={onClick}
    >
      {isDream && (
        <div className="absolute top-2 right-2">
          <Sparkles className="h-5 w-5 text-dream animate-pulse" />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex justify-center mb-3">
          <div 
            className="w-16 h-32 bg-contain bg-no-repeat bg-center"
            style={{
              backgroundImage: `url(${nailsSprite})`,
              backgroundPosition: `${(nail.order_index || 0) * -64}px 0px`,
              backgroundSize: `${64 * 5}px 128px`
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{nailName}</h3>
          <Badge variant="outline" className={rarityColors[nail.rarity]}>
            {nail.rarity}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>{language === "ru" ? "Урон" : "Damage"}:</span>
            <span className="text-foreground font-semibold">{nail.base_damage}</span>
          </div>
          <div className="flex justify-between">
            <span>{language === "ru" ? "Продажа" : "Sell"}:</span>
            <span className="text-soul font-semibold">{sellValue} {language === "ru" ? "Душа" : "Soul"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
