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
  storyMode?: boolean;
  storyDifficulty?: number;
  onStoryCombatComplete?: (won: boolean) => void;
  bossId?: string;
  unlockedAbilities?: string[];
}

type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

interface DifficultyStats {
  enemyHealth: number;
  enemyDamage: number;
  soulReward: number;
  dreamReward: number;
  label: string;
  labelRu: string;
}

const difficultySettings: Record<DifficultyLevel, DifficultyStats> = {
  1: { enemyHealth: 80, enemyDamage: 10, soulReward: 40, dreamReward: 5, label: "Easy", labelRu: "Легко" },
  2: { enemyHealth: 100, enemyDamage: 15, soulReward: 75, dreamReward: 10, label: "Normal", labelRu: "Нормально" },
  3: { enemyHealth: 130, enemyDamage: 20, soulReward: 120, dreamReward: 18, label: "Hard", labelRu: "Сложно" },
  4: { enemyHealth: 170, enemyDamage: 25, soulReward: 180, dreamReward: 30, label: "Very Hard", labelRu: "Очень Сложно" },
  5: { enemyHealth: 220, enemyDamage: 35, soulReward: 300, dreamReward: 50, label: "Extreme", labelRu: "Экстремально" },
};

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
    selectDifficulty: "Select Difficulty",
    rewards: "Rewards",
    bonusAttack: "Bonus Attack! Hit green again!",
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
    selectDifficulty: "Выберите Сложность",
    rewards: "Награды",
    bonusAttack: "Бонусная Атака! Попадите в зеленую снова!",
  },
};

export const Combat = ({ language, onUpdate, storyMode = false, storyDifficulty = 2, onStoryCombatComplete, bossId, unlockedAbilities = [] }: CombatProps) => {
  const [nails, setNails] = useState<any[]>([]);
  const [selectedNail, setSelectedNail] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(storyMode ? (storyDifficulty as DifficultyLevel) : 2);
  const [inBattle, setInBattle] = useState(false);
  const [isDreamBattle, setIsDreamBattle] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [battling, setBattling] = useState(false);
  const [timingBar, setTimingBar] = useState(0);
  const [isTimingActive, setIsTimingActive] = useState(false);
  const [timingDirection, setTimingDirection] = useState(1);
  const [hasUsedDeathSave, setHasUsedDeathSave] = useState(false);
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    loadNails();
  }, []);

  useEffect(() => {
    if (!isTimingActive) return;

    const interval = setInterval(() => {
      setTimingBar((prev) => {
        const next = prev + timingDirection * 2.75; // Средняя скорость между 4 и 1.5
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

      const diffStats = difficultySettings[difficulty];
      
      setIsDreamBattle(isDream);
      setInBattle(true);
      setPlayerHealth(100);
      setEnemyHealth(diffStats.enemyHealth);
      setIsTimingActive(true);
      setTimingBar(0);
      setTimingDirection(1);
      setHasUsedDeathSave(false); // Reset death save for new battle
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
    let isPerfectHit = false;

    // Thread ability: slows time (bigger perfect zone)
    const hasThread = unlockedAbilities.includes("thread");
    const perfectZoneSize = hasThread ? 15 : 10; // 45-60 instead of 45-55
    const perfectZoneStart = 45;
    const perfectZoneEnd = perfectZoneStart + perfectZoneSize;

    // Perfect zone: 45-55 (or 45-60 with thread)
    if (timingBar >= perfectZoneStart && timingBar <= perfectZoneEnd) {
      damageMultiplier = 2.5;
      hitQuality = t.perfectHit;
      isPerfectHit = true;
    }
    // Good zone: 35-65
    else if (timingBar >= 35 && timingBar <= 65) {
      damageMultiplier = 1.5;
      hitQuality = t.goodHit;
    }

    const diffStats = difficultySettings[difficulty];
    let playerDamage = Math.floor(
      (selectedNail.nails.base_damage + Math.floor(Math.random() * 10)) * damageMultiplier
    );

    // Boss-specific mechanics
    let bossMessage = "";
    if (bossId === "false_knight") {
      // Heavy armor - reduces damage by 30%
      playerDamage = Math.floor(playerDamage * 0.7);
      bossMessage = language === "ru" ? "Тяжелая броня!" : "Heavy armor!";
    } else if (bossId === "hornet") {
      // Fast and precise - if player misses, takes extra damage
      if (damageMultiplier === 0.5) {
        bossMessage = language === "ru" ? "Хорнет контратакует!" : "Hornet counterattacks!";
      }
    } else if (bossId === "mantis_lords") {
      // Three lords - attacks 3 times, but each weaker
      bossMessage = language === "ru" ? "Три силуэта атакуют!" : "Three silhouettes attack!";
    } else if (bossId === "soul_master") {
      // Magic - random teleport makes timing harder
      if (Math.random() > 0.7) {
        bossMessage = language === "ru" ? "Мастер телепортировался!" : "Master teleported!";
      }
    } else if (bossId === "hollow_knight") {
      // Final boss - more aggressive
      bossMessage = language === "ru" ? "Финальный босс!" : "Final boss!";
    }

    toast({
      title: hitQuality,
      description: `${playerDamage} ${language === "ru" ? "урона" : "damage"}${bossMessage ? ` - ${bossMessage}` : ""}`,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Player attacks enemy
    const newEnemyHealth = Math.max(0, enemyHealth - playerDamage);
    setEnemyHealth(newEnemyHealth);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if enemy is defeated
    if (newEnemyHealth <= 0) {
      await handleVictory();
      setBattling(false);
      return;
    }

    // If perfect hit, give bonus attack
    if (isPerfectHit) {
      toast({
        title: t.bonusAttack,
        description: language === "ru" ? "Враг не атакует!" : "Enemy doesn't attack!",
      });
      
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Restart timing for bonus attack
      setIsTimingActive(true);
      setTimingBar(0);
      setTimingDirection(1);
      setBattling(false);
      return;
    }

    // Calculate enemy damage
    let enemyDamage = diffStats.enemyDamage + Math.floor(Math.random() * 8);

    // Boss-specific damage modifications
    if (bossId === "hornet" && damageMultiplier === 0.5) {
      enemyDamage = Math.floor(enemyDamage * 1.5); // Hornet counterattack
    } else if (bossId === "mantis_lords") {
      // Mantis Lords attack 3 times but each weaker
      enemyDamage = Math.floor(enemyDamage * 0.4 * 3);
    } else if (bossId === "hollow_knight") {
      enemyDamage = Math.floor(enemyDamage * 1.2); // Final boss hits harder
    }

    // Dash ability: chance to dodge (15% chance)
    const hasDash = unlockedAbilities.includes("dash");
    if (hasDash && Math.random() < 0.15) {
      toast({
        title: language === "ru" ? "Уворот!" : "Dodge!",
        description: language === "ru" ? "Вы увернулись от атаки!" : "You dodged the attack!",
      });
      enemyDamage = 0;
    }

    // Wall Jump ability: avoid damage (20% damage reduction)
    const hasWallJump = unlockedAbilities.includes("wall_jump");
    if (hasWallJump && enemyDamage > 0) {
      const reducedAmount = Math.floor(enemyDamage * 0.2);
      enemyDamage -= reducedAmount;
      toast({
        title: language === "ru" ? "Прыжок от стены!" : "Wall Jump!",
        description: language === "ru" ? `Урон снижен на ${reducedAmount}` : `Damage reduced by ${reducedAmount}`,
      });
    }

    // Vengeful Spirit ability: reflect damage (25% of damage taken)
    const hasVengefulSpirit = unlockedAbilities.includes("vengeful_spirit");
    if (hasVengefulSpirit && enemyDamage > 0) {
      const reflectedDamage = Math.floor(enemyDamage * 0.25);
      const newEnemyHealthAfterReflect = Math.max(0, enemyHealth - reflectedDamage);
      setEnemyHealth(newEnemyHealthAfterReflect);
      toast({
        title: language === "ru" ? "Мстительный дух!" : "Vengeful Spirit!",
        description: language === "ru" ? `Отражено ${reflectedDamage} урона` : `Reflected ${reflectedDamage} damage`,
      });

      // Check if enemy died from reflection
      if (newEnemyHealthAfterReflect <= 0) {
        await handleVictory();
        setBattling(false);
        return;
      }
    }

    // Enemy attacks (only if not perfect hit)
    let newPlayerHealth = Math.max(0, playerHealth - enemyDamage);
    
    // Double Jump ability: death save (once per battle)
    const hasDoubleJump = unlockedAbilities.includes("double_jump");
    if (newPlayerHealth <= 0 && hasDoubleJump && !hasUsedDeathSave) {
      newPlayerHealth = 30; // Save with 30 HP
      setHasUsedDeathSave(true);
      toast({
        title: language === "ru" ? "Двойной прыжок!" : "Double Jump!",
        description: language === "ru" ? "Вы спаслись от смерти!" : "You saved yourself from death!",
      });
    }

    setPlayerHealth(newPlayerHealth);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if player is defeated
    if (newPlayerHealth <= 0) {
      await handleDefeat();
      setBattling(false);
      return;
    }

    // Continue battle - restart timing
    setIsTimingActive(true);
    setTimingBar(0);
    setTimingDirection(1);
    setBattling(false);
  };

  const handleVictory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const diffStats = difficultySettings[difficulty];
      const soulGained = diffStats.soulReward + Math.floor(Math.random() * 20);
      const dreamPointsGained = isDreamBattle ? diffStats.dreamReward + Math.floor(Math.random() * 10) : 0;

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

      // If in story mode, call the callback
      if (storyMode && onStoryCombatComplete) {
        onStoryCombatComplete(true);
      }
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

      // Record combat history
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
      onUpdate();

      // If in story mode, call the callback
      if (storyMode && onStoryCombatComplete) {
        onStoryCombatComplete(false);
      }
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
              <div className="absolute left-[35%] right-[35%] inset-y-0 bg-legendary/30" />
              {/* Green zone (perfect) - smaller */}
              <div className="absolute left-[45%] right-[45%] inset-y-0 bg-success/40" />
              
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
        <>
          {/* Difficulty Selection */}
          {!storyMode && (
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-xl">{t.selectDifficulty}</h3>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => {
                  const stats = difficultySettings[level];
                  return (
                    <Button
                      key={level}
                      variant={difficulty === level ? "default" : "outline"}
                      onClick={() => setDifficulty(level)}
                      className="flex flex-col h-auto p-3"
                    >
                      <span className="font-bold text-lg">{level}</span>
                      <span className="text-xs">{language === "ru" ? stats.labelRu : stats.label}</span>
                    </Button>
                  );
                })}
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>{language === "ru" ? "Здоровье врага" : "Enemy Health"}:</strong> {difficultySettings[difficulty].enemyHealth}</p>
                <p><strong>{language === "ru" ? "Урон врага" : "Enemy Damage"}:</strong> {difficultySettings[difficulty].enemyDamage}</p>
                <p><strong>{t.rewards}:</strong> {difficultySettings[difficulty].soulReward}+ {t.soul}{isDreamBattle ? `, ${difficultySettings[difficulty].dreamReward}+ ${t.dreamPoints}` : ""}</p>
              </div>
            </Card>
          )}

          {storyMode ? (
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-xl">{language === "ru" ? "Начать бой" : "Start Battle"}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "ru" 
                  ? `Сложность: ${difficultySettings[difficulty].labelRu}` 
                  : `Difficulty: ${difficultySettings[difficulty].label}`}
              </p>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>{language === "ru" ? "Здоровье врага" : "Enemy Health"}:</strong> {difficultySettings[difficulty].enemyHealth}</p>
                <p><strong>{language === "ru" ? "Урон врага" : "Enemy Damage"}:</strong> {difficultySettings[difficulty].enemyDamage}</p>
                <p><strong>{t.rewards}:</strong> {difficultySettings[difficulty].soulReward}+ {t.soul}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.cost}:</span>
                <span className="font-bold">1 {t.masks}</span>
              </div>
              <Button className="w-full" onClick={() => startBattle(false)}>
                {t.startBattle}
              </Button>
            </Card>
          ) : (
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
        </>
      )}
    </div>
  );
};
