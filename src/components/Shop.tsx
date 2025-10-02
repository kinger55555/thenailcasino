import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShopProps {
  language: "en" | "ru";
  soul: number;
  dreamPoints: number;
  masks: number;
  onUpdate: () => void;
}

const translations = {
  en: {
    shop: "Shop",
    buyMasks: "Buy Masks",
    maskDescription: "Masks allow you to enter combat battles",
    buy: "Buy",
    notEnough: "Not enough",
    purchased: "Purchased!",
    adminLinks: "Admin Links",
    enterCode: "Enter Admin Link Code",
    code: "Code",
    claim: "Claim",
    linkClaimed: "Link claimed successfully!",
    invalidCode: "Invalid or already claimed code",
    youGet: "You get",
  },
  ru: {
    shop: "Магазин",
    buyMasks: "Купить Маски",
    maskDescription: "Маски позволяют вам участвовать в боях",
    buy: "Купить",
    notEnough: "Недостаточно",
    purchased: "Куплено!",
    adminLinks: "Админ Ссылки",
    enterCode: "Введите Код Админ Ссылки",
    code: "Код",
    claim: "Получить",
    linkClaimed: "Ссылка успешно активирована!",
    invalidCode: "Неверный код или уже активирована",
    youGet: "Вы получаете",
  },
};

const MASK_COST = 20; // soul per mask

export const Shop = ({ language, soul, dreamPoints, masks, onUpdate }: ShopProps) => {
  const [maskQuantity, setMaskQuantity] = useState(1);
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const t = translations[language];

  const buyMasks = async () => {
    const cost = MASK_COST * maskQuantity;
    
    if (soul < cost) {
      toast({
        title: `${t.notEnough} ${language === "ru" ? "души" : "soul"}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({
          soul: soul - cost,
          masks: masks + maskQuantity,
        })
        .eq("id", user.id);

      toast({ title: t.purchased });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const claimAdminLink = async () => {
    if (!adminCode.trim()) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if link exists and is available
      const { data: link, error: linkError } = await supabase
        .from("admin_links")
        .select("*, admin_link_claims(count)")
        .eq("code", adminCode.trim().toUpperCase())
        .single();

      if (linkError || !link) {
        toast({
          title: t.invalidCode,
          variant: "destructive",
        });
        return;
      }

      // Check if already claimed by this user
      const { data: existingClaim } = await supabase
        .from("admin_link_claims")
        .select("*")
        .eq("link_id", link.id)
        .eq("user_id", user.id)
        .single();

      if (existingClaim) {
        toast({
          title: language === "ru" ? "Вы уже активировали эту ссылку" : "You already claimed this link",
          variant: "destructive",
        });
        return;
      }

      // Check uses remaining
      const claimCount = link.admin_link_claims?.[0]?.count || 0;
      if (link.uses_remaining !== null && claimCount >= link.uses_remaining) {
        toast({
          title: t.invalidCode,
          variant: "destructive",
        });
        return;
      }

      // Claim the link
      await supabase.from("admin_link_claims").insert({
        link_id: link.id,
        user_id: user.id,
      });

      // Update user profile
      await supabase
        .from("profiles")
        .update({
          soul: soul + (link.soul_amount || 0),
          dream_points: dreamPoints + (link.dream_points_amount || 0),
        })
        .eq("id", user.id);

      toast({
        title: t.linkClaimed,
        description: `${t.youGet} ${link.soul_amount || 0} Soul, ${link.dream_points_amount || 0} Dream Points`,
      });

      setAdminCode("");
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.shop}</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Buy Masks */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-danger" />
            <h3 className="font-bold text-xl">{t.buyMasks}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t.maskDescription}</p>
          
          <div className="space-y-2">
            <Label>{language === "ru" ? "Количество" : "Quantity"}</Label>
            <Input
              type="number"
              min="1"
              value={maskQuantity}
              onChange={(e) => setMaskQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{language === "ru" ? "Цена" : "Cost"}:</span>
            <span className="font-bold">{MASK_COST * maskQuantity} {language === "ru" ? "Души" : "Soul"}</span>
          </div>

          <Button className="w-full" onClick={buyMasks} disabled={loading || soul < MASK_COST * maskQuantity}>
            {t.buy}
          </Button>
        </Card>
      </div>

      {/* Admin Links */}
      <Card className="p-6 space-y-4 border-primary">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-dream" />
          <h3 className="font-bold text-xl text-dream">{t.adminLinks}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t.enterCode}</p>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={t.code}
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && claimAdminLink()}
            />
          </div>
          <Button onClick={claimAdminLink} disabled={loading || !adminCode.trim()}>
            {t.claim}
          </Button>
        </div>
      </Card>
    </div>
  );
};
