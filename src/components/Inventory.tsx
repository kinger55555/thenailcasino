import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2, Gift, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NailCard } from "./NailCard";
import QRCode from "react-qr-code";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InventoryProps {
  language: "en" | "ru";
  onUpdate: () => void;
}

const translations = {
  en: {
    inventory: "Your Inventory",
    empty: "Your inventory is empty. Open cases to get nails!",
    sellNail: "Sell Nail",
    deleteNail: "Delete Nail",
    createTradeLink: "Create Trade Link",
    confirmSell: "Confirm Sale",
    confirmDelete: "Confirm Delete",
    sellDescription: "Are you sure you want to sell this nail?",
    deleteDescription: "Are you sure you want to delete this nail?",
    cancel: "Cancel",
    youWillGet: "You will get",
    tradeLink: "Trade Link",
    tradeLinkCreated: "Trade link created! Share it with others.",
    copyLink: "Copy Link",
    close: "Close",
    linkCopied: "Link copied to clipboard!",
    howItWorks: "How it works",
    tradeExplanation: "When you create a trade link, you immediately lose the nail from your inventory. Share the QR code or link with a friend - they can scan it to receive the nail!",
    scanToReceive: "Scan this QR code to receive the nail",
    warning: "Warning: The nail has already been removed from your inventory!",
  },
  ru: {
    inventory: "Ваш Инвентарь",
    empty: "Ваш инвентарь пуст. Откройте кейсы, чтобы получить гвозди!",
    sellNail: "Продать Гвоздь",
    deleteNail: "Удалить Гвоздь",
    createTradeLink: "Создать Ссылку Обмена",
    confirmSell: "Подтвердить Продажу",
    confirmDelete: "Подтвердить Удаление",
    sellDescription: "Вы уверены, что хотите продать этот гвоздь?",
    deleteDescription: "Вы уверены, что хотите удалить этот гвоздь?",
    cancel: "Отмена",
    youWillGet: "Вы получите",
    tradeLink: "Ссылка Обмена",
    tradeLinkCreated: "Ссылка обмена создана! Поделитесь ей с другими.",
    copyLink: "Копировать Ссылку",
    close: "Закрыть",
    linkCopied: "Ссылка скопирована в буфер обмена!",
    howItWorks: "Как это работает",
    tradeExplanation: "Когда вы создаете ссылку обмена, вы сразу теряете гвоздь из инвентаря. Поделитесь QR-кодом или ссылкой с другом - он может отсканировать её, чтобы получить гвоздь!",
    scanToReceive: "Отсканируйте этот QR-код, чтобы получить гвоздь",
    warning: "Внимание: Гвоздь уже удалён из вашего инвентаря!",
  },
};

export const Inventory = ({ language, onUpdate }: InventoryProps) => {
  const [nails, setNails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNail, setSelectedNail] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [tradeLink, setTradeLink] = useState("");
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_nails")
        .select(`
          *,
          nails (*)
        `)
        .eq("user_id", user.id)
        .order("acquired_at", { ascending: false });

      if (error) throw error;
      setNails(data || []);
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

  const handleSell = async (userNail: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const nail = userNail.nails;
      const sellValue = userNail.is_dream ? nail.dream_sell_value : nail.sell_value;

      // Delete nail from inventory
      const { error: deleteError } = await supabase
        .from("user_nails")
        .delete()
        .eq("id", userNail.id);

      if (deleteError) throw deleteError;

      // Get current profile and add soul
      const { data: profile } = await supabase
        .from("profiles")
        .select("soul")
        .eq("id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({ soul: (profile?.soul || 0) + sellValue })
        .eq("id", user.id);

      toast({
        title: `${t.youWillGet} ${sellValue} ${language === "ru" ? "Души" : "Soul"}`,
      });

      loadInventory();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedNail) return;

    try {
      const { error } = await supabase
        .from("user_nails")
        .delete()
        .eq("id", selectedNail.id);

      if (error) throw error;

      toast({ title: language === "ru" ? "Гвоздь удалён" : "Nail deleted" });
      setShowDeleteDialog(false);
      loadInventory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateTradeLink = async () => {
    if (!selectedNail) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      // First create the trade link
      const { error } = await supabase
        .from("trade_links")
        .insert({
          code,
          from_user_id: user.id,
          user_nail_id: selectedNail.id,
        });

      if (error) throw error;

      // Then delete the nail from user's inventory
      const { error: deleteError } = await supabase
        .from("user_nails")
        .delete()
        .eq("id", selectedNail.id);

      if (deleteError) throw deleteError;

      const link = `${window.location.origin}/trade/${code}`;
      setTradeLink(link);
      setShowTradeDialog(true);
      loadInventory();

      toast({ title: t.tradeLinkCreated });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyTradeLink = () => {
    navigator.clipboard.writeText(tradeLink);
    toast({ title: t.linkCopied });
  };

  if (loading) {
    return <div className="text-center py-10">{language === "ru" ? "Загрузка..." : "Loading..."}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.inventory}</h2>

      {nails.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <p>{t.empty}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {nails.map((userNail) => (
            <Card key={userNail.id} className="p-4 space-y-3 border-border/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge style={{ backgroundColor: `hsl(var(--${userNail.nails.rarity}))` }}>
                    {userNail.nails.rarity}
                  </Badge>
                  {userNail.is_dream && <Sparkles className="h-4 w-4 text-dream" />}
                </div>
                <h3 className="font-bold" style={{ color: `hsl(var(--${userNail.nails.rarity}))` }}>
                  {language === "ru" ? userNail.nails.name_ru : userNail.nails.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === "ru" ? "Урон" : "Damage"}: {userNail.nails.base_damage}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSell(userNail)}
                >
                  {t.sellNail}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedNail(userNail);
                    handleCreateTradeLink();
                  }}
                >
                  <Gift className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedNail(userNail);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t.confirmDelete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trade Link Dialog */}
      <AlertDialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {t.tradeLink}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3 flex items-start gap-2">
                <Info className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{t.warning}</p>
              </div>
              
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm font-semibold mb-2">{t.howItWorks}</p>
                <p className="text-xs text-muted-foreground">{t.tradeExplanation}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCode value={tradeLink} size={200} />
            </div>
            
            <p className="text-center text-sm text-muted-foreground">{t.scanToReceive}</p>
            
            {/* Link */}
            <div className="space-y-2">
              <Label>{t.tradeLink}</Label>
              <div className="flex gap-2">
                <Input value={tradeLink} readOnly className="text-xs" />
                <Button onClick={copyTradeLink} size="sm">{t.copyLink}</Button>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogAction>{t.close}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
