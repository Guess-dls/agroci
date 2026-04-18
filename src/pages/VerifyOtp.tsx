import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail, ShieldCheck } from "lucide-react";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const initialEmail = (location.state as any)?.email || "";
  const initialType = (location.state as any)?.type || "signup";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [type] = useState<"signup" | "recovery">(initialType);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (!initialEmail) {
      // Pas d'email fourni → renvoyer vers /auth
      navigate("/auth");
    }
  }, [initialEmail, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast({ title: "Erreur", description: "Le code doit contenir 6 chiffres", variant: "destructive" });
      return;
    }

    if (type === "recovery") {
      if (newPassword.length < 6) {
        toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp-code", {
        body: { email, code, type, newPassword: type === "recovery" ? newPassword : undefined },
      });

      if (error || data?.error) {
        toast({
          title: "Erreur",
          description: data?.error || error?.message || "Code invalide",
          variant: "destructive",
        });
        if (data?.expired) setCode("");
      } else {
        toast({
          title: "Succès",
          description: type === "signup" ? "Compte vérifié ! Vous pouvez vous connecter." : "Mot de passe réinitialisé !",
        });
        navigate("/auth");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp-code", {
        body: { email, type },
      });
      if (error || data?.error) {
        toast({
          title: "Erreur",
          description: data?.error || error?.message || "Impossible d'envoyer le code",
          variant: "destructive",
        });
      } else {
        toast({ title: "Code envoyé", description: "Vérifiez votre boîte mail" });
        setCooldown(60);
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="border-2 border-primary/10 shadow-elegant">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Vérification du code</CardTitle>
            <CardDescription>
              Entrez le code à 6 chiffres envoyé à <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {type === "recovery" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-pwd">Nouveau mot de passe</Label>
                    <Input
                      id="new-pwd"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pwd">Confirmer le mot de passe</Label>
                    <Input
                      id="confirm-pwd"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification...</>
                ) : (
                  type === "signup" ? "Activer mon compte" : "Réinitialiser le mot de passe"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : resending ? "Envoi..." : "Renvoyer un nouveau code"}
                </button>
              </div>

              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/auth")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la connexion
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOtp;
