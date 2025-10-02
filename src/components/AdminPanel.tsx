import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Link as LinkIcon, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  },
};

export const AdminPanel = ({ language }: AdminPanelProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soulAmount, setSoulAmount] = useState(100);
  const [dreamPointsAmount, setDreamPointsAmount] = useState(50);
  const [usesRemaining, setUsesRemaining] = useState<number | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!error && data) {
        setIsAdmin(true);
        loadLinks();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("admin_links")
        .select(`
          *,
          admin_link_claims (count)
        `)
        .eq("created_by", user.id)
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

  if (loading) {
    return <div className="text-center py-10">{language === "ru" ? "Загрузка..." : "Loading..."}</div>;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-primary">{t.admin}</h2>
        <Card className="p-10 text-center text-muted-foreground">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted" />
          <p>{t.notAdmin}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.admin}</h2>

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
