import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Link as LinkIcon, Copy, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ADMIN_PASSWORD = "6767676767";

interface AdminPanelProps {
  language: "en" | "ru";
}

const translations = {
  en: {
    admin: "Admin Panel",
    notAdmin: "You don't have admin privileges",
    createLink: "Create Admin Link",
    soulAmount: "Soul Amount",
    dreamPointsAmount: "Dream Points Amount",
    usesRemaining: "Uses Remaining",
    unlimited: "Unlimited",
    create: "Create Link",
    generatedLinks: "Generated Links",
    code: "Code",
    uses: "Uses",
    copyLink: "Copy Link",
    linkCopied: "Link copied to clipboard!",
    linkCreated: "Admin link created!",
    enterPassword: "Enter Admin Password",
    password: "Password",
    unlock: "Unlock",
    wrongPassword: "Wrong password",
    accessDenied: "Access Denied",
  },
  ru: {
    admin: "Админ Панель",
    notAdmin: "У вас нет прав администратора",
    createLink: "Создать Админ Ссылку",
    soulAmount: "Количество Души",
    dreamPointsAmount: "Количество Очков Снов",
    usesRemaining: "Осталось Использований",
    unlimited: "Неограничено",
    create: "Создать Ссылку",
    generatedLinks: "Созданные Ссылки",
    code: "Код",
    uses: "Использований",
    copyLink: "Копировать Ссылку",
    linkCopied: "Ссылка скопирована в буфер обмена!",
    linkCreated: "Админ ссылка создана!",
    enterPassword: "Введите Пароль Админа",
    password: "Пароль",
    unlock: "Разблокировать",
    wrongPassword: "Неверный пароль",
    accessDenied: "Доступ Запрещен",
  },
};

export const AdminPanel = ({ language }: AdminPanelProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [soulAmount, setSoulAmount] = useState(100);
  const [dreamPointsAmount, setDreamPointsAmount] = useState(50);
  const [usesRemaining, setUsesRemaining] = useState<number | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [totalClaims, setTotalClaims] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    if (isAuthenticated) {
      loadLinks();
      loadTotalClaims();
      loadTotalDeductions();
    }
  }, [isAuthenticated]);

  const loadTotalClaims = async () => {
    try {
      const { count, error } = await supabase
        .from("admin_link_claims")
        .select("*", { count: 'exact', head: true });

      if (error) throw error;
      setTotalClaims(count || 0);
    } catch (error: any) {
      console.error(error);
    }
  };

  const loadTotalDeductions = async () => {
    try {
      const { count, error } = await supabase
        .from("dream_points_deductions")
        .select("*", { count: 'exact', head: true });

      if (error) throw error;
      setTotalDeductions(count || 0);
    } catch (error: any) {
      console.error(error);
    }
  };

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_links")
        .select(`
          *,
          admin_link_claims (count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error } = await supabase.from("admin_links").insert({
        code,
        created_by: user.id,
        soul_amount: soulAmount,
        dream_points_amount: dreamPointsAmount,
        uses_remaining: usesRemaining,
      });

      if (error) throw error;

      toast({ title: t.linkCreated });
      loadLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyLinkCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: t.linkCopied });
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordInput("");
    } else {
      toast({
        title: t.wrongPassword,
        variant: "destructive",
      });
    }
  };

  // Password Check
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-primary">{t.admin}</h2>
        <Card className="p-10 max-w-md mx-auto">
          <div className="space-y-6 text-center">
            <Lock className="h-16 w-16 mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="font-bold text-xl">{t.accessDenied}</h3>
              <p className="text-sm text-muted-foreground">{t.enterPassword}</p>
            </div>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder={t.password}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              />
              <Button className="w-full" onClick={handlePasswordSubmit}>
                {t.unlock}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.admin}</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Total Claims Stats */}
        <Card className="p-6 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "ru" ? "Всего активаций админ-ссылок" : "Total Admin Link Claims"}
              </p>
              <p className="text-3xl font-bold text-primary">{totalClaims}</p>
            </div>
            <Shield className="h-12 w-12 text-primary opacity-50" />
          </div>
        </Card>

        {/* Total Deductions Stats */}
        <Card className="p-6 bg-destructive/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "ru" ? "Всего нажатий на минус" : "Total Dream Points Deductions"}
              </p>
              <p className="text-3xl font-bold text-destructive">{totalDeductions}</p>
            </div>
            <Shield className="h-12 w-12 text-destructive opacity-50" />
          </div>
        </Card>
      </div>

      {/* Create Link */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          {t.createLink}
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{t.soulAmount}</Label>
            <Input
              type="number"
              min="0"
              value={soulAmount}
              onChange={(e) => setSoulAmount(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.dreamPointsAmount}</Label>
            <Input
              type="number"
              min="0"
              value={dreamPointsAmount}
              onChange={(e) => setDreamPointsAmount(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.usesRemaining}</Label>
            <Input
              type="number"
              min="0"
              placeholder={t.unlimited}
              value={usesRemaining || ""}
              onChange={(e) =>
                setUsesRemaining(e.target.value ? parseInt(e.target.value) || null : null)
              }
            />
          </div>
        </div>

        <Button onClick={createLink}>{t.create}</Button>
      </Card>

      {/* Generated Links */}
      <div className="space-y-4">
        <h3 className="font-bold text-xl">{t.generatedLinks}</h3>
        
        <div className="grid gap-4">
          {links.map((link) => {
            const claimCount = link.admin_link_claims?.[0]?.count || 0;
            return (
              <Card key={link.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{link.code}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyLinkCode(link.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Soul: {link.soul_amount} | Dream Points: {link.dream_points_amount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.uses}: {claimCount}
                      {link.uses_remaining !== null ? ` / ${link.uses_remaining}` : ` (${t.unlimited})`}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
