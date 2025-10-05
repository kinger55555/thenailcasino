import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus } from "lucide-react";
import maskImage from "@/assets/mask.webp";
import soulIcon from "@/assets/soul-icon.png";
import dreamIcon from "@/assets/dream-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CurrencyDisplayProps {
  soul: number;
  dreamPoints: number;
  masks: number;
  language: "en" | "ru";
  onUpdate?: () => void;
}

const translations = {
  en: {
    soul: "Soul",
    dreamPoints: "Dream Points",
    masks: "Masks",
  },
  ru: {
    soul: "Душа",
    dreamPoints: "Очки Снов",
    masks: "Маски",
  },
};

export const CurrencyDisplay = ({ soul, dreamPoints, masks, language, onUpdate }: CurrencyDisplayProps) => {
  const t = translations[language];
  const { toast } = useToast();

  const handleResetDreamPoints = async () => {
    if (dreamPoints <= 0) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ dream_points: Math.max(0, dreamPoints - 1) })
        .eq("id", user.id);

      // Record deduction for admin stats
      await supabase.from("dream_points_deductions").insert({
        user_id: user.id,
        amount: 1,
      });

      toast({ 
        title: language === "ru" ? "Очко снов потеряно" : "Dream point lost" 
      });
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="p-3 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={soulIcon} alt="Soul" className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">{t.soul}</span>
          </div>
          <span className="font-bold text-soul">{soul}</span>
        </div>
      </Card>

      <Card className="p-3 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={dreamIcon} alt="Dream Points" className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">{t.dreamPoints}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-dream">{dreamPoints}</span>
            {dreamPoints > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleResetDreamPoints}
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
          </div>
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
