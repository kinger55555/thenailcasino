import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Scroll, Swords, MapPin } from "lucide-react";
import { Combat } from "@/components/Combat";

interface StoryProps {
  language: "en" | "ru";
  onUpdateProfile: () => void;
}

interface StoryProgress {
  current_location: string;
  defeated_bosses: string[];
  unlocked_abilities: string[];
  visited_locations: string[];
  has_void_heart: boolean;
}

interface LocationChoice {
  icon: string;
  textEn: string;
  textRu: string;
  action: "navigate" | "combat" | "boss";
  target?: string;
  combatDifficulty?: number;
  soulReward?: number;
  bossId?: string;
  requiresBoss?: string;
}

interface Location {
  id: string;
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  choices: LocationChoice[];
}

const locations: Location[] = [
  {
    id: "awakening",
    title: { en: "Awakening", ru: "Пробуждение" },
    description: {
      en: "You wake in a cave where stones whisper. Your body trembles, and in your hand — a nail, covered in dust. Every echo in the darkness calls you deeper.",
      ru: "Ты просыпаешься в пещере, где камни шепчут. Тело дрожит, а в руке — гвоздь, покрытый пылью. Каждое эхо в темноте зовёт тебя глубже."
    },
    choices: [
      { icon: "⚔️", textEn: "Enter Forgotten Crossroads", textRu: "Войти в Забытые Перекрестки", action: "navigate", target: "crossroads" }
    ]
  },
  {
    id: "crossroads",
    title: { en: "Forgotten Crossroads", ru: "Забытые Перекрестки" },
    description: {
      en: "Stone arches, full of echoing footsteps. Everything seems motionless, but somewhere far away you hear strikes — like someone's training. You feel a slight itch in your fingers — the nail wants blood.",
      ru: "Каменные арки, полные эха шагов. Здесь всё кажется неподвижным, но где-то далеко слышны удары — будто чьи-то тренировки. Ты чувствуешь лёгкий зуд в пальцах — гвоздь хочет крови."
    },
    choices: [
      { icon: "🌿", textEn: "Go to the green light", textRu: "Идти к зелёному свету", action: "combat", target: "greenpath", combatDifficulty: 2, soulReward: 10 },
      { icon: "🕳", textEn: "Descend deeper", textRu: "Спуститься глубже", action: "combat", target: "crossroads", combatDifficulty: 3, soulReward: 15 },
      { icon: "⚒", textEn: "Pass through broken gates", textRu: "Пройти через разрушенные ворота", action: "boss", target: "arena_false", bossId: "false_knight", combatDifficulty: 3 }
    ]
  },
  {
    id: "arena_false",
    title: { en: "Arena of the False", ru: "Арена Ложного" },
    description: {
      en: "Under a dome of stone you hear footsteps. The armor comes to life, as if inside it — the rumble of the earth itself.",
      ru: "Под куполом из камня ты слышишь шаги. Доспех оживает, будто внутри него — гул самой земли."
    },
    choices: [
      { icon: "⬅", textEn: "Return to Crossroads", textRu: "Вернуться в Перекрестки", action: "navigate", target: "crossroads" },
      { icon: "🌿", textEn: "To Greenpath", textRu: "В Зеленый Путь", action: "navigate", target: "greenpath" }
    ]
  },
  {
    id: "greenpath",
    title: { en: "Greenpath", ru: "Зеленый Путь" },
    description: {
      en: "Everything around is alive. Vines move from your breath, and in the distance someone sings — a melody of leaves and wind.",
      ru: "Всё вокруг живое. Лозы двигаются от твоего дыхания, а вдалеке кто-то поёт — мелодия из листьев и ветра."
    },
    choices: [
      { icon: "🌸", textEn: "Descend to the station", textRu: "Спуститься к станции", action: "combat", target: "queens_station", combatDifficulty: 2, soulReward: 12 },
      { icon: "🕸", textEn: "Make your way through the thickets", textRu: "Пробраться сквозь заросли", action: "boss", target: "trial_hornet", bossId: "hornet", combatDifficulty: 3 }
    ]
  },
  {
    id: "trial_hornet",
    title: { en: "Trial of Hornet", ru: "Испытание Хорнет" },
    description: {
      en: "You enter an arena of vines and thorns. She is already waiting. \"Battle is a conversation without words,\" she whispers.",
      ru: "Ты входишь на площадку из лоз и колючек. Она уже ждёт. \"Сражение — это разговор без слов\", — шепчет она."
    },
    choices: [
      { icon: "⬆", textEn: "Return to Greenpath", textRu: "Вернуться в Зеленый Путь", action: "navigate", target: "greenpath" },
      { icon: "🌸", textEn: "To Queen's Station", textRu: "К Станции Королевы", action: "navigate", target: "queens_station" }
    ]
  },
  {
    id: "queens_station",
    title: { en: "Queen's Station", ru: "Станция Королевы" },
    description: {
      en: "There are no people here. Only drops and the rustle of spores. You feel peace, but the air is too thick.",
      ru: "Здесь нет людей. Только капли и шелест спор. Ты чувствуешь покой, но воздух слишком густой."
    },
    choices: [
      { icon: "🍄", textEn: "Go to the fungal wastes", textRu: "Идти к грибным пустошам", action: "combat", target: "fungal_wastes", combatDifficulty: 3, soulReward: 18 },
      { icon: "🕳", textEn: "Descend into the depths", textRu: "Спуститься в глубины", action: "combat", target: "deepnest", combatDifficulty: 4, soulReward: 20, requiresBoss: "hornet" }
    ]
  },
  {
    id: "fungal_wastes",
    title: { en: "Fungal Wastes", ru: "Грибные Пустоши" },
    description: {
      en: "The air is sweet, like a dream. You walk on soft soil, hearing the pops of spores.",
      ru: "Воздух сладкий, будто сон. Ты идёшь по мягкой почве, слыша хлопки спор."
    },
    choices: [
      { icon: "⚒", textEn: "Enter the spore temple", textRu: "Войти в храм спор", action: "boss", target: "mantis_arena", bossId: "mantis_lords", combatDifficulty: 4, requiresBoss: "hornet" },
      { icon: "💧", textEn: "Open the lift to City of Tears", textRu: "Открыть лифт в Город Слёз", action: "combat", target: "city_tears", combatDifficulty: 4, soulReward: 15 }
    ]
  },
  {
    id: "mantis_arena",
    title: { en: "Mantis Arena", ru: "Арена Богомолов" },
    description: {
      en: "You stand among spore columns. Three silhouettes bow in unison and attack.",
      ru: "Ты стоишь среди колонн спор. Три силуэта в унисон кланяются и атакуют."
    },
    choices: [
      { icon: "⬆", textEn: "Return to Queen's Station", textRu: "Вернуться к Станции Королевы", action: "navigate", target: "queens_station" },
      { icon: "💧", textEn: "Descend to City of Tears", textRu: "Спуститься в Город Слёз", action: "navigate", target: "city_tears" }
    ]
  },
  {
    id: "city_tears",
    title: { en: "City of Tears", ru: "Город Слёз" },
    description: {
      en: "The sky cries. You walk across bridges where every drop seems like the step of someone invisible.",
      ru: "Небо плачет. Ты идёшь по мостам, где каждая капля кажется шагом кого-то невидимого."
    },
    choices: [
      { icon: "⚒", textEn: "Enter the mage tower", textRu: "Войти в башню магов", action: "boss", target: "soul_sanctum", bossId: "soul_master", combatDifficulty: 4 },
      { icon: "⬇", textEn: "Descend into the channel", textRu: "Спуститься в канал", action: "combat", target: "ancient_basin", combatDifficulty: 4, soulReward: 25 }
    ]
  },
  {
    id: "soul_sanctum",
    title: { en: "Soul Sanctum", ru: "Святилище Душ" },
    description: {
      en: "The hall is full of whispers. Sparks dance. Mages strike quickly, but chaotically.",
      ru: "Зал полон шёпота. Искры танцуют. Маги бьют быстро, но хаотично."
    },
    choices: [
      { icon: "⬇", textEn: "Descend to Ancient Basin", textRu: "Спуститься в Древний Бассейн", action: "navigate", target: "ancient_basin" }
    ]
  },
  {
    id: "ancient_basin",
    title: { en: "Ancient Basin", ru: "Древний Бассейн" },
    description: {
      en: "You stand on the edge of a mirror. The air is cold, but inside everything boils.",
      ru: "Ты стоишь на краю зеркала. Воздух холодный, но внутри всё кипит."
    },
    choices: [
      { icon: "⚒", textEn: "Enter the hall of the dead vessel", textRu: "Войти в зал мёртвого сосуда", action: "boss", target: "broken_vessel", bossId: "broken_vessel", combatDifficulty: 5 },
      { icon: "⚫", textEn: "Descend into the abyss", textRu: "Спуститься в бездну", action: "navigate", target: "abyss", requiresBoss: "broken_vessel" }
    ]
  },
  {
    id: "broken_vessel",
    title: { en: "Broken Vessel", ru: "Разбитый Сосуд" },
    description: {
      en: "Before you is a reflection — empty, but alive. It attacks as if it wants to die.",
      ru: "Перед тобой отражение — пустое, но живое. Он атакует, как будто хочет умереть."
    },
    choices: [
      { icon: "⚫", textEn: "Descend to Abyss", textRu: "Спуститься в Бездну", action: "navigate", target: "abyss" },
      { icon: "⬆", textEn: "Return to City of Tears", textRu: "Вернуться в Город Слёз", action: "navigate", target: "city_tears" }
    ]
  },
  {
    id: "abyss",
    title: { en: "The Abyss", ru: "Бездна" },
    description: {
      en: "Darkness is dense, like water. You see yourself, many of yourself — all want to kill you.",
      ru: "Тьма плотная, как вода. Ты видишь себя, множества себя — все хотят убить тебя."
    },
    choices: [
      { icon: "⬆", textEn: "Return to Basin", textRu: "Вернуться в Бассейн", action: "navigate", target: "ancient_basin" },
      { icon: "⚒", textEn: "Go to The Black Egg Temple", textRu: "Идти к Храму Чёрного Яйца", action: "navigate", target: "black_egg" }
    ]
  },
  {
    id: "black_egg",
    title: { en: "The Black Egg Temple", ru: "Храм Чёрного Яйца" },
    description: {
      en: "You enter a hall where the air rings like metal. The vessel stands in the middle, motionless, but alive.",
      ru: "Ты входишь в зал, где воздух звонкий, как металл. Сосуд стоит посреди, неподвижный, но живой."
    },
    choices: [
      { icon: "⚔️", textEn: "Fight the Hollow Knight", textRu: "Сразиться с Пустым Рыцарем", action: "boss", target: "black_egg", bossId: "hollow_knight", combatDifficulty: 5 }
    ]
  },
  {
    id: "deepnest",
    title: { en: "Deepnest", ru: "Глубокое Гнездо" },
    description: {
      en: "Web and darkness. Something crawls nearby.",
      ru: "Паутина и темнота. Что-то ползает рядом."
    },
    choices: [
      { icon: "⬆", textEn: "Return to Queen's Station", textRu: "Вернуться к Станции Королевы", action: "navigate", target: "queens_station" }
    ]
  }
];

const translations = {
  en: {
    title: "Chronicle of Hallownest",
    currentLocation: "Current Location",
    progress: "Progress",
    defeatedBosses: "Defeated Bosses",
    abilities: "Unlocked Abilities",
    choices: "Where do you want to go?",
    locked: "Locked",
    requiresBoss: "Requires defeating",
    combat: "Combat",
    abilities_list: {
      dash: "Dash - Dodge chance",
      thread: "Thread of Movement - Slowed time",
      wall_jump: "Wall Jump - Avoid damage",
      vengeful_spirit: "Vengeful Spirit - Reflect damage",
      double_jump: "Double Jump - Death save",
      void_heart: "Void Heart - True Ending key"
    }
  },
  ru: {
    title: "Хроники Халлоунеста",
    currentLocation: "Текущая локация",
    progress: "Прогресс",
    defeatedBosses: "Побеждённые боссы",
    abilities: "Открытые способности",
    choices: "Куда вы хотите пойти?",
    locked: "Заблокировано",
    requiresBoss: "Требуется победить",
    combat: "Бой",
    abilities_list: {
      dash: "Рывок - шанс уворота",
      thread: "Нить движения - замедление времени",
      wall_jump: "Прыжок от стены - избежание урона",
      vengeful_spirit: "Мстительный дух - отражение урона",
      double_jump: "Двойной прыжок - спасение от смерти",
      void_heart: "Сердце Пустоты - ключ к истинному финалу"
    }
  }
};

const bossNames: Record<string, { en: string; ru: string }> = {
  false_knight: { en: "False Knight", ru: "Ложный Рыцарь" },
  hornet: { en: "Hornet", ru: "Хорнет" },
  mantis_lords: { en: "Mantis Lords", ru: "Лорды Богомолов" },
  soul_master: { en: "Soul Master", ru: "Мастер Душ" },
  broken_vessel: { en: "Broken Vessel", ru: "Разбитый Сосуд" },
  hollow_knight: { en: "Hollow Knight", ru: "Пустой Рыцарь" }
};

export const Story = ({ language, onUpdateProfile }: StoryProps) => {
  const [progress, setProgress] = useState<StoryProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [combatOpen, setCombatOpen] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<LocationChoice | null>(null);
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("story_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newProgress, error: insertError } = await supabase
          .from("story_progress")
          .insert({
            user_id: user.id,
            current_location: "awakening",
            defeated_bosses: [],
            unlocked_abilities: [],
            visited_locations: ["awakening"],
            has_void_heart: false
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProgress(newProgress);
      } else {
        setProgress(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading story progress",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choice: LocationChoice) => {
    if (!progress) return;

    if (choice.requiresBoss && !progress.defeated_bosses.includes(choice.requiresBoss)) {
      toast({
        title: t.locked,
        description: `${t.requiresBoss} ${bossNames[choice.requiresBoss][language]}`,
        variant: "destructive"
      });
      return;
    }

    if (choice.action === "navigate" && choice.target) {
      await updateLocation(choice.target);
    } else if (choice.action === "combat" || choice.action === "boss") {
      setCurrentChoice(choice);
      setCombatOpen(true);
    }
  };

  const handleCombatComplete = async (won: boolean) => {
    if (!won || !currentChoice || !progress) {
      setCombatOpen(false);
      setCurrentChoice(null);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let updates: any = {};

      if (currentChoice.action === "boss" && currentChoice.bossId) {
        updates.defeated_bosses = [...progress.defeated_bosses, currentChoice.bossId];
        
        // Add abilities based on boss
        const newAbilities = [...progress.unlocked_abilities];
        if (currentChoice.bossId === "false_knight") newAbilities.push("dash");
        if (currentChoice.bossId === "hornet") newAbilities.push("thread");
        if (currentChoice.bossId === "mantis_lords") newAbilities.push("wall_jump");
        if (currentChoice.bossId === "soul_master") newAbilities.push("vengeful_spirit");
        if (currentChoice.bossId === "broken_vessel") newAbilities.push("double_jump");
        if (currentChoice.bossId === "hollow_knight") {
          newAbilities.push("void_heart");
          updates.has_void_heart = true;
        }
        updates.unlocked_abilities = newAbilities;
      }

      if (currentChoice.target) {
        const visitedLocations = progress.visited_locations.includes(currentChoice.target)
          ? progress.visited_locations
          : [...progress.visited_locations, currentChoice.target];
        
        updates.current_location = currentChoice.target;
        updates.visited_locations = visitedLocations;
      }

      const { error } = await supabase
        .from("story_progress")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      setProgress({
        ...progress,
        ...updates
      });

      toast({
        title: language === "en" ? "Victory!" : "Победа!",
        description: language === "en" ? "You progressed in the story" : "Вы продвинулись в истории"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCombatOpen(false);
      setCurrentChoice(null);
      onUpdateProfile();
    }
  };

  const updateLocation = async (locationId: string) => {
    if (!progress) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const visitedLocations = progress.visited_locations.includes(locationId)
        ? progress.visited_locations
        : [...progress.visited_locations, locationId];

      const { error } = await supabase
        .from("story_progress")
        .update({
          current_location: locationId,
          visited_locations: visitedLocations
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProgress({
        ...progress,
        current_location: locationId,
        visited_locations: visitedLocations
      });

      toast({
        title: language === "en" ? "Location changed" : "Локация изменена"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!progress) return null;

  const currentLocation = locations.find(loc => loc.id === progress.current_location);
  if (!currentLocation) return null;

  const handleResetStory = async () => {
    if (!confirm(language === "en" ? "Are you sure you want to reset your story progress? This cannot be undone!" : "Вы уверены, что хотите сбросить прогресс истории? Это действие нельзя отменить!")) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("story_progress")
        .update({
          current_location: "awakening",
          defeated_bosses: [],
          unlocked_abilities: [],
          visited_locations: ["awakening"],
          has_void_heart: false,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      toast({
        title: language === "en" ? "Story Reset" : "История сброшена",
        description: language === "en" ? "Your story progress has been reset" : "Ваш прогресс истории был сброшен"
      });

      loadProgress();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Scroll className="w-5 h-5" />
              {t.title}
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleResetStory}
            >
              {language === "en" ? "Reset Story" : "Сбросить историю"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              <h3 className="font-semibold">{currentLocation.title[language]}</h3>
            </div>
            <p className="text-muted-foreground italic">
              {currentLocation.description[language]}
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Swords className="w-4 h-4" />
              {t.choices}
            </h4>
            <div className="space-y-2">
              {currentLocation.choices.map((choice, index) => {
                const isLocked = choice.requiresBoss && !progress.defeated_bosses.includes(choice.requiresBoss);
                const choiceText = language === "en" ? choice.textEn : choice.textRu;
                
                return (
                  <Button
                    key={index}
                    variant={isLocked ? "outline" : "default"}
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleChoice(choice)}
                    disabled={isLocked}
                  >
                    <span className="mr-2">{choice.icon}</span>
                    <span className="flex-1">{choiceText}</span>
                    {isLocked && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({t.locked})
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.progress}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">{t.defeatedBosses}:</h4>
            {progress.defeated_bosses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {progress.defeated_bosses.map((boss, i) => (
                  <span key={i} className="px-2 py-1 bg-secondary rounded text-sm">
                    {bossNames[boss]?.[language] || boss}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {language === "en" ? "None yet" : "Пока нет"}
              </p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">{t.abilities}:</h4>
            {progress.unlocked_abilities.length > 0 ? (
              <div className="space-y-1">
                {progress.unlocked_abilities.map((ability, i) => (
                  <div key={i} className="text-sm">
                    • {t.abilities_list[ability as keyof typeof t.abilities_list] || ability}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {language === "en" ? "None yet" : "Пока нет"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={combatOpen} onOpenChange={setCombatOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.combat}</DialogTitle>
          </DialogHeader>
          <Combat 
            language={language} 
            onUpdate={onUpdateProfile}
            storyMode={true}
            storyDifficulty={currentChoice?.combatDifficulty || 2}
            onStoryCombatComplete={handleCombatComplete}
            bossId={currentChoice?.bossId}
            unlockedAbilities={progress.unlocked_abilities}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};