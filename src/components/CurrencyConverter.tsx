import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import soulIcon from "@/assets/soul-icon.png";
import dreamIcon from "@/assets/dream-icon.png";

interface CurrencyConverterProps {
  language: "en" | "ru";
  soul: number;
  dreamPoints: number;
  onUpdate: () => void;
}

const translations = {
  en: {
    title: "Currency Converter",
    convert: "Convert",
    from: "From",
    to: "To",
    amount: "Amount",
    soul: "Soul",
    dreamPoints: "Dream Points",
    insufficientFunds: "Insufficient funds",
    conversionSuccess: "Conversion successful!",
    rate: "Exchange Rate: 1 Soul = 1 Dream Point",
  },
  ru: {
    title: "Конвертер Валют",
    convert: "Конвертировать",
    from: "Из",
    to: "В",
    amount: "Количество",
    soul: "Душа",
    dreamPoints: "Очки Снов",
    insufficientFunds: "Недостаточно средств",
    conversionSuccess: "Конвертация успешна!",
    rate: "Курс обмена: 1 Душа = 1 Очко Снов",
  },
};

export const CurrencyConverter = ({ language, soul, dreamPoints, onUpdate }: CurrencyConverterProps) => {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState<"soul" | "dream">("soul");
  const { toast } = useToast();
  const t = translations[language];

  const handleConvert = async () => {
    const convertAmount = parseInt(amount);
    if (!convertAmount || convertAmount <= 0) {
      toast({
        title: language === "ru" ? "Введите количество" : "Enter amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (fromCurrency === "soul") {
        if (soul < convertAmount) {
          toast({ title: t.insufficientFunds, variant: "destructive" });
          return;
        }

        await supabase
          .from("profiles")
          .update({
            soul: soul - convertAmount,
            dream_points: dreamPoints + convertAmount,
          })
          .eq("id", user.id);
      } else {
        if (dreamPoints < convertAmount) {
          toast({ title: t.insufficientFunds, variant: "destructive" });
          return;
        }

        await supabase
          .from("profiles")
          .update({
            dream_points: dreamPoints - convertAmount,
            soul: soul + convertAmount,
          })
          .eq("id", user.id);
      }

      toast({ title: t.conversionSuccess });
      setAmount("");
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const switchCurrency = () => {
    setFromCurrency(fromCurrency === "soul" ? "dream" : "soul");
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-xl font-bold text-primary">{t.title}</h3>
      
      <p className="text-sm text-muted-foreground">{t.rate}</p>

      <div className="space-y-4">
        <div className="flex items-end gap-4">
          {/* From Currency */}
          <div className="flex-1 space-y-2">
            <Label>{t.from}</Label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <img 
                src={fromCurrency === "soul" ? soulIcon : dreamIcon} 
                alt={fromCurrency} 
                className="h-6 w-6" 
              />
              <span className="font-semibold">
                {fromCurrency === "soul" ? t.soul : t.dreamPoints}
              </span>
              <span className="ml-auto text-muted-foreground">
                {fromCurrency === "soul" ? soul : dreamPoints}
              </span>
            </div>
          </div>

          {/* Switch Button */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={switchCurrency}
            className="mb-0"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          {/* To Currency */}
          <div className="flex-1 space-y-2">
            <Label>{t.to}</Label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <img 
                src={fromCurrency === "dream" ? soulIcon : dreamIcon} 
                alt={fromCurrency === "dream" ? "soul" : "dream"} 
                className="h-6 w-6" 
              />
              <span className="font-semibold">
                {fromCurrency === "dream" ? t.soul : t.dreamPoints}
              </span>
              <span className="ml-auto text-muted-foreground">
                {fromCurrency === "dream" ? soul : dreamPoints}
              </span>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>{t.amount}</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="1"
          />
        </div>

        {/* Convert Button */}
        <Button onClick={handleConvert} className="w-full">
          {t.convert}
        </Button>
      </div>
    </Card>
  );
};
