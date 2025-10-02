import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { CaseOpening } from "@/components/CaseOpening";
import { Inventory } from "@/components/Inventory";
import { Combat } from "@/components/Combat";
import { Shop } from "@/components/Shop";
import { AdminPanel } from "@/components/AdminPanel";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { useToast } from "@/hooks/use-toast";
import dreamSymbol from "@/assets/dream-symbol.png";

const translations = {
  en: {
    cases: "Cases",
    inventory: "Inventory",
    combat: "Combat",
    shop: "Shop",
    admin: "Admin",
    logout: "Logout",
    loading: "Loading...",
  },
  ru: {
    cases: "Кейсы",
    inventory: "Инвентарь",
    combat: "Бой",
    shop: "Магазин",
    admin: "Админ",
    logout: "Выход",
    loading: "Загрузка...",
  },
};

const Game = () => {
  const [language, setLanguage] = useState<"en" | "ru">("en");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setLanguage((data.language === "ru" ? "ru" : "en") as "en" | "ru");
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleLanguageChange = async (newLang: "en" | "ru") => {
    setLanguage(newLang);
    if (profile) {
      await supabase
        .from("profiles")
        .update({ language: newLang })
        .eq("id", profile.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={dreamSymbol} alt="Loading" className="w-20 h-20 mx-auto dream-glow float-anim" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dreamSymbol} alt="Symbol" className="w-12 h-12 dream-glow" />
            <div>
              <h1 className="text-2xl font-bold text-primary">{profile.nickname}</h1>
              <p className="text-sm text-muted-foreground">Hollow Knight Nails</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange("en")}
            >
              EN
            </Button>
            <Button
              variant={language === "ru" ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange("ru")}
            >
              RU
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Currency Display */}
        <CurrencyDisplay
          soul={profile.soul}
          dreamPoints={profile.dream_points}
          masks={profile.masks}
          language={language}
          onUpdate={loadProfile}
        />

        {/* Currency Converter */}
        <CurrencyConverter
          language={language}
          soul={profile.soul}
          dreamPoints={profile.dream_points}
          onUpdate={loadProfile}
        />

        {/* Main Content */}
        <Tabs defaultValue="cases" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="cases">{t.cases}</TabsTrigger>
            <TabsTrigger value="inventory">{t.inventory}</TabsTrigger>
            <TabsTrigger value="combat">{t.combat}</TabsTrigger>
            <TabsTrigger value="shop">{t.shop}</TabsTrigger>
            <TabsTrigger value="admin">{t.admin}</TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="mt-6">
            <CaseOpening
              language={language}
              soul={profile.soul}
              onOpenSuccess={loadProfile}
            />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <Inventory language={language} onUpdate={loadProfile} />
          </TabsContent>

          <TabsContent value="combat" className="mt-6">
            <Combat language={language} onUpdate={loadProfile} />
          </TabsContent>

          <TabsContent value="shop" className="mt-6">
            <Shop
              language={language}
              soul={profile.soul}
              dreamPoints={profile.dream_points}
              masks={profile.masks}
              onUpdate={loadProfile}
            />
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <AdminPanel language={language} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Game;
