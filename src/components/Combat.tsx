import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Swords, Heart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CombatProps {
  language: "en" | "ru";
  onUpdate: () => void;
}

const translations = {
  en: {
    combat: "Combat Arena",
    selectNail: "Select Your Nail",
    noNails: "You don't have any nails! Open cases first.",
    startBattle: "Start Battle",
    yourHealth: "Your Health",
    enemyHealth: "Enemy Health",
    attack: "Attack!",
    victory: "Victory!",
    defeat: "Defeat!",
    youGained: "You gained",
    soul: "Soul",
    dreamPoints: "Dream Points",
    regularBattle: "Regular Battle",
    dreamBattle: "Dream Battle",
    cost: "Cost",
    masks: "Masks",
    damage: "Damage",
    perfectHit: "Perfect Hit!",
    goodHit: "Good Hit",
    missed: "Missed!",
    pressNow: "Press when the bar is in the GREEN zone!",
    noDreamNail: "You need a Dream Nail to enter Dream Battles!",
  },
  ru: {
    combat: "Арена Боя",
    selectNail: "Выберите Гвоздь",
    noNails: "У вас нет гвоздей! Сначала откройте кейсы.",
    startBattle: "Начать Бой",
    yourHealth: "Ваше Здоровье",
    enemyHealth: "Здоровье Врага",
    attack: "Атака!",
    victory: "Победа!",
    defeat: "Поражение!",
    youGained: "Вы получили",
    soul: "Душа",
    dreamPoints: "Очки Снов",
    regularBattle: "Обычный Бой",
    dreamBattle: "Бой Снов",
    cost: "Цена",
    masks: "Маски",
    damage: "Урон",
    perfectHit: "Идеальный Удар!",
    goodHit: "Хороший Удар",
    missed: "Промах!",
    pressNow: "Нажмите, когда полоса в ЗЕЛЕНОЙ зоне!",
    noDreamNail: "Вам нужен Гвоздь Снов для Боя Снов!",
  },
};

export const Combat = ({ language, onUpdate }: CombatProps) => {
  const [nails, setNails] = useState<any[]>([]);
  const [selectedNail, setSelectedNail] = useState<any>(null);
  const [inBattle, setInBattle] = useState(false);
  const [isDreamBattle, setIsDreamBattle] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [battling, setBattling] = useState(false);
  const [timingBar, setTimingBar] = useState(0);
  const [isTimingActive, setIsTimingActive] = useState(false);
  const [timingDirection, setTimingDirection] = useState(1);
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    loadNails();
  }, []);

  useEffect(() => {
    if (!isTimingActive) return;

    const interval = setInterval(() => {
      setTimingBar((prev) => {
        const next = prev + timingDirection * 2;
        if (next >= 100 || next <= 0) {
          setTimingDirection((d) => -d);
        }
        return Math.max(0, Math.min(100, next));
      });
    }, 20);

    return () => clearInterval(interval);
  }, [isTimingActive, timingDirection]);

  const loadNails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_nails")
        .select(`
          *,
          nails (*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setNails(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startBattle = async (isDream: boolean) => {
    if (!selectedNail) return;

    // Check if trying to do dream battle without dream nail
    if (isDream && !selectedNail.is_dream) {
      toast({
        title: t.noDreamNail,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has masks
      const { data: profile } = await supabase
        .from("profiles")
        .select("masks")
        .eq("id", user.id)
        .single();

      if (!profile || profile.masks < 1) {
        toast({
          title: language === "ru" ? "Недостаточно масок" : "Not enough masks",
          variant: "destructive",
        });
        return;
      }

      // Deduct mask
      await supabase
        .from("profiles")
        .update({ masks: profile.masks - 1 })
        .eq("id", user.id);

      setIsDreamBattle(isDream);
      setInBattle(true);
      setPlayerHealth(100);
      setEnemyHealth(100);
      setIsTimingActive(true);
      setTimingBar(0);
      setTimingDirection(1);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const attack = async () => {
    if (battling || !selectedNail || !isTimingActive) return;
    setBattling(true);
    setIsTimingActive(false);

    // Calculate damage based on timing
    let damageMultiplier = 0.5; // Missed
    let hitQuality = t.missed;

    // Perfect zone: 40-60 (green)
    if (timingBar >= 40 && timingBar <= 60) {
      damageMultiplier = 2.0;
      hitQuality = t.perfectHit;
    }
    // Good zone: 30-70
    else if (timingBar >= 30 && timingBar <= 70) {
      damageMultiplier = 1.5;
      hitQuality = t.goodHit;
    }

    const playerDamage = Math.floor(
      (selectedNail.nails.base_damage + Math.floor(Math.random() * 10)) * damageMultiplier
    );
    const enemyDamage = 15 + Math.floor(Math.random() * 10);

    toast({
      title: hitQuality,
      description: `${playerDamage} ${language === "ru" ? "урона" : "damage"}`,
    });

    // Enemy attacks
    const newPlayerHealth = Math.max(0, playerHealth - enemyDamage);
    setPlayerHealth(newPlayerHealth);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Player attacks
    const newEnemyHealth = Math.max(0, enemyHealth - playerDamage);
    setEnemyHealth(newEnemyHealth);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check win/loss
    if (newEnemyHealth <= 0) {
      await handleVictory();
    } else if (newPlayerHealth <= 0) {
      await handleDefeat();
    } else {
      // Continue battle - restart timing
      setIsTimingActive(true);
      setTimingBar(0);
      setTimingDirection(1);
    }

    setBattling(false);
  };

  const handleVictory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const soulGained = 50 + Math.floor(Math.random() * 50);
      const dreamPointsGained = isDreamBattle ? 10 + Math.floor(Math.random() * 20) : 0;

      // Record combat history
      await supabase.from("combat_history").insert({
        user_id: user.id,
        nail_id: selectedNail.nail_id,
        won: true,
        is_dream: isDreamBattle,
        soul_gained: soulGained,
        dream_points_gained: dreamPointsGained,
      });

      // Update profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("soul, dream_points")
        .eq("id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({
          soul: (profile?.soul || 0) + soulGained,
          dream_points: (profile?.dream_points || 0) + dreamPointsGained,
        })
        .eq("id", user.id);

      toast({
        title: t.victory,
        description: `${t.youGained} ${soulGained} ${t.soul}${
          dreamPointsGained > 0 ? ` + ${dreamPointsGained} ${t.dreamPoints}` : ""
        }`,
      });

      setInBattle(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDefeat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("combat_history").insert({
        user_id: user.id,
        nail_id: selectedNail.nail_id,
        won: false,
        is_dream: isDreamBattle,
        soul_gained: 0,
        dream_points_gained: 0,
      });

      toast({
        title: t.defeat,
        variant: "destructive",
      });

      setInBattle(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (inBattle && selectedNail) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-primary">{t.combat}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Player */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-danger" />
              <span className="font-bold">{t.yourHealth}</span>
            </div>
            <Progress value={playerHealth} className="h-4" />
            <p className="text-center text-2xl font-bold">{playerHealth} HP</p>
          </Card>

          {/* Enemy */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <span className="font-bold">{t.enemyHealth}</span>
            </div>
            <Progress value={enemyHealth} className="h-4" />
            <p className="text-center text-2xl font-bold">{enemyHealth} HP</p>
          </Card>
        </div>

        <div className="text-center space-y-4">
          {/* Timing Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <p className="text-sm text-muted-foreground">{t.pressNow}</p>
            <div className="relative h-12 bg-background border-2 border-border rounded-lg overflow-hidden">
              {/* Red zones */}
              <div className="absolute inset-0 bg-danger/20" />
              {/* Yellow zones */}
              <div className="absolute left-[30%] right-[30%] inset-y-0 bg-legendary/30" />
              {/* Green zone (perfect) */}
              <div className="absolute left-[40%] right-[40%] inset-y-0 bg-success/40" />
              
              {/* Moving indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                style={{ left: `${timingBar}%` }}
              />
            </div>
          </div>

          <Button size="lg" onClick={attack} disabled={battling || !isTimingActive}>
            {t.attack}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.combat}</h2>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">{t.selectNail}</h3>
        
        {nails.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <p>{t.noNails}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {nails.map((userNail) => (
              <Card
                key={userNail.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedNail?.id === userNail.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedNail(userNail)}
              >
                <Badge style={{ backgroundColor: `hsl(var(--${userNail.nails.rarity}))` }}>
                  {userNail.nails.rarity}
                </Badge>
                <h4 className="font-bold mt-2" style={{ color: `hsl(var(--${userNail.nails.rarity}))` }}>
                  {language === "ru" ? userNail.nails.name_ru : userNail.nails.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t.damage}: {userNail.nails.base_damage}
                </p>
                {userNail.is_dream && (
                  <div className="flex items-center gap-1 mt-2">
                    <Sparkles className="h-3 w-3 text-dream" />
                    <span className="text-xs text-dream">Dream</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedNail && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-xl">{t.regularBattle}</h3>
            <p className="text-sm text-muted-foreground">
              {language === "ru" ? "Сражайтесь за Душу" : "Battle for Soul"}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.cost}:</span>
              <span className="font-bold">1 {t.masks}</span>
            </div>
            <Button className="w-full" onClick={() => startBattle(false)}>
              {t.startBattle}
            </Button>
          </Card>

          <Card className="p-6 space-y-4 border-dream">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-dream" />
              <h3 className="font-bold text-xl text-dream">{t.dreamBattle}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "ru" ? "Сражайтесь за Душу и Очки Снов (требуется Гвоздь Снов)" : "Battle for Soul and Dream Points (requires Dream Nail)"}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.cost}:</span>
              <span className="font-bold">1 {t.masks}</span>
            </div>
            <Button 
              className="w-full" 
              onClick={() => startBattle(true)}
              disabled={!selectedNail?.is_dream}
            >
              {t.startBattle}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
