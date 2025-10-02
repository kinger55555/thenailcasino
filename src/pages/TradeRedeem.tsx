import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dreamSymbol from "@/assets/dream-symbol.png";

const TradeRedeem = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [tradeData, setTradeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    loadTradeLink();
  }, [code]);

  const loadTradeLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("trade_links")
        .select(`
          *,
          user_nails!inner (
            id,
            is_dream,
            nails (*)
          )
        `)
        .eq("code", code)
        .single();

      if (fetchError || !data) {
        setError("Trade link not found or expired");
        return;
      }

      if (data.claimed_by) {
        setError("This trade link has already been claimed");
        return;
      }

      if (data.from_user_id === user.id) {
        setError("You cannot claim your own trade link");
        return;
      }

      setTradeData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!tradeData) return;

    setClaiming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create new user_nail for the recipient
      const { error: insertError } = await supabase
        .from("user_nails")
        .insert({
          user_id: user.id,
          nail_id: tradeData.user_nails.nails.id,
          is_dream: tradeData.user_nails.is_dream,
        });

      if (insertError) throw insertError;

      // Mark trade link as claimed
      const { error: updateError } = await supabase
        .from("trade_links")
        .update({
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", tradeData.id);

      if (updateError) throw updateError;

      setClaimed(true);
      toast({
        title: "Nail claimed successfully!",
        description: "Check your inventory to see your new nail.",
      });

      setTimeout(() => {
        navigate("/game");
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Error claiming nail",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <img src={dreamSymbol} alt="Loading" className="w-20 h-20 mx-auto dream-glow float-anim" />
          <p className="text-muted-foreground">Loading trade link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <XCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold text-destructive">Invalid Trade Link</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/game")} className="w-full">
            Go to Game
          </Button>
        </Card>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-green-500">Success!</h2>
          <p className="text-muted-foreground">
            You've successfully claimed the nail. Redirecting to game...
          </p>
        </Card>
      </div>
    );
  }

  if (!tradeData) return null;

  const nail = tradeData.user_nails.nails;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Gift className="h-16 w-16 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-primary">You've Received a Gift!</h2>
          <p className="text-muted-foreground">
            Someone has shared a nail with you
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 border border-border/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Badge style={{ backgroundColor: `hsl(var(--${nail.rarity}))` }}>
                {nail.rarity}
              </Badge>
              {tradeData.user_nails.is_dream && (
                <span className="text-xs text-dream flex items-center gap-1">
                  <img src={dreamSymbol} alt="Dream" className="h-4 w-4 dream-glow" />
                  Dream Variant
                </span>
              )}
            </div>
            
            <h3 
              className="text-xl font-bold" 
              style={{ color: `hsl(var(--${nail.rarity}))` }}
            >
              {nail.name}
            </h3>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Damage: {nail.base_damage}</p>
              <p>
                Value: {tradeData.user_nails.is_dream ? nail.dream_sell_value : nail.sell_value} Soul
              </p>
            </div>
          </div>

          <Button 
            onClick={handleClaim} 
            disabled={claiming}
            className="w-full"
            size="lg"
          >
            {claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Claim Nail
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By claiming this nail, it will be added to your inventory
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TradeRedeem;
