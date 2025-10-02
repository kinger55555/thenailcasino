import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import dreamSymbol from "@/assets/dream-symbol.png";

const translations = {
  en: {
    welcome: "Welcome, Knight",
    signIn: "Sign In",
    signUp: "Sign Up",
    nickname: "Nickname",
    password: "Password",
    enterNickname: "Enter your nickname",
    enterPassword: "Enter your password",
    signInBtn: "Sign In",
    signUpBtn: "Create Account",
    forgotPassword: "Forgot Password?",
    language: "Language",
    signInSuccess: "Welcome back, Knight!",
    signUpSuccess: "Account created! Welcome to Hallownest.",
    authError: "Authentication failed. Please try again.",
  },
  ru: {
    welcome: "Добро пожаловать, Рыцарь",
    signIn: "Вход",
    signUp: "Регистрация",
    nickname: "Никнейм",
    password: "Пароль",
    enterNickname: "Введите никнейм",
    enterPassword: "Введите пароль",
    signInBtn: "Войти",
    signUpBtn: "Создать аккаунт",
    forgotPassword: "Забыли пароль?",
    language: "Язык",
    signInSuccess: "С возвращением, Рыцарь!",
    signUpSuccess: "Аккаунт создан! Добро пожаловать в Халлоунест.",
    authError: "Ошибка авторизации. Попробуйте снова.",
  },
};

const Auth = () => {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<"en" | "ru">("en");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignIn = async () => {
    if (!nickname || !password) return;
    setLoading(true);

    try {
      // Convert nickname to email format internally (invisible to user)
      const email = `${nickname.toLowerCase()}@example.com`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({ title: t.signInSuccess });
      navigate("/");
    } catch (error: any) {
      toast({
        title: t.authError,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!nickname || !password) return;
    setLoading(true);

    try {
      // Convert nickname to email format internally (invisible to user)
      const email = `${nickname.toLowerCase()}@example.com`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({ title: t.signUpSuccess });
      navigate("/");
    } catch (error: any) {
      toast({
        title: t.authError,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant={language === "en" ? "default" : "outline"}
          size="sm"
          onClick={() => setLanguage("en")}
        >
          EN
        </Button>
        <Button
          variant={language === "ru" ? "default" : "outline"}
          size="sm"
          onClick={() => setLanguage("ru")}
        >
          RU
        </Button>
      </div>

      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center space-y-4">
          <img src={dreamSymbol} alt="Dream Symbol" className="w-20 h-20 mx-auto dream-glow" />
          <CardTitle className="text-3xl text-primary">{t.welcome}</CardTitle>
          <CardDescription>{t.language}: {language.toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t.signIn}</TabsTrigger>
              <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signin-nickname">{t.nickname}</Label>
                <Input
                  id="signin-nickname"
                  placeholder={t.enterNickname}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">{t.password}</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder={t.enterPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSignIn}
                disabled={loading || !nickname || !password}
              >
                {t.signInBtn}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-nickname">{t.nickname}</Label>
                <Input
                  id="signup-nickname"
                  placeholder={t.enterNickname}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">{t.password}</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder={t.enterPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSignUp}
                disabled={loading || !nickname || !password}
              >
                {t.signUpBtn}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
