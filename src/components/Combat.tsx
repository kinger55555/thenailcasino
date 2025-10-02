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
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    loadNails();
  }, []);

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
    if (battling || !selectedNail) return;
    setBattling(true);

    const playerDamage = selectedNail.nails.base_damage + Math.floor(Math.random() * 10);
    const enemyDamage = 15 + Math.floor(Math.random() * 10);

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

        <div className="text-center">
          <Button size="lg" onClick={attack} disabled={battling}>
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
              {language === "ru" ? "Сражайтесь за Душу и Очки Снов" : "Battle for Soul and Dream Points"}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.cost}:</span>
              <span className="font-bold">1 {t.masks}</span>
            </div>
            <Button className="w-full" onClick={() => startBattle(true)}>
              {t.startBattle}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
