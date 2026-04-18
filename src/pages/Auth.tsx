import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Leaf, ShoppingCart, Loader2, ArrowLeft, Mail } from "lucide-react";
import { countries, getCountryByCode } from "@/data/countries";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nom: "",
    prenom: "",
    pays: "",
    region: "",
    whatsapp: "",
    phoneCode: "+225", // Code par défaut pour la Côte d'Ivoire
    userType: "acheteur" as "producteur" | "acheteur",
    typeActivite: ""
  });

  // Fonction pour mettre à jour le code téléphonique quand le pays change
  const handleCountryChange = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    if (country) {
      setSignupForm({
        ...signupForm,
        pays: country.name,
        phoneCode: country.phoneCode,
        whatsapp: country.phoneCode + " " // Reset le numéro avec le nouveau code
      });
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.log('Vérification de session ignorée');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        // Si email non confirmé → rediriger vers vérification OTP
        if (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not confirmed')) {
          // Envoyer un nouveau code OTP automatiquement
          await supabase.functions.invoke('send-otp-code', {
            body: { email: loginForm.email, type: 'signup' }
          });
          toast({
            title: "Compte non vérifié",
            description: "Un code de vérification vient d'être envoyé à votre email",
          });
          navigate('/verify-otp', { state: { email: loginForm.email, type: 'signup' } });
          return;
        }
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erreur de connexion",
            description: "Email ou mot de passe incorrect",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive"
          });
        }
      } else if (data.session) {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Fehi !",
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer votre adresse email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp-code', {
        body: { email: forgotPasswordEmail, type: 'recovery' }
      });

      if (error || data?.error) {
        toast({
          title: "Erreur",
          description: data?.error || error?.message || "Impossible d'envoyer le code",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Code envoyé",
          description: "Vérifiez votre email pour le code à 6 chiffres",
        });
        navigate('/verify-otp', { state: { email: forgotPasswordEmail, type: 'recovery' } });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (signupForm.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Inscription SANS emailRedirectTo (on évite le lien Lovable)
      const { error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            nom: signupForm.nom,
            prenom: signupForm.prenom,
            pays: signupForm.pays,
            region: signupForm.region,
            whatsapp: signupForm.whatsapp,
            user_type: signupForm.userType,
            type_activite: signupForm.typeActivite
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Compte existant",
            description: "Un compte existe déjà avec cet email",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erreur d'inscription",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        // Envoyer le code OTP custom
        const { data: otpData, error: otpError } = await supabase.functions.invoke('send-otp-code', {
          body: { email: signupForm.email, type: 'signup' }
        });

        if (otpError || otpData?.error) {
          toast({
            title: "Compte créé",
            description: "Mais l'envoi du code a échoué. Réessayez depuis la page de vérification.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Code envoyé",
            description: "Un code à 6 chiffres a été envoyé à votre email",
          });
        }
        navigate('/verify-otp', { state: { email: signupForm.email, type: 'signup' } });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Fehi
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous à votre compte ou créez-en un nouveau
          </p>
        </div>

        <Card className="border-2 border-primary/10 shadow-elegant">
          <CardHeader className="text-center pb-4">
            <CardTitle>Authentification</CardTitle>
            <CardDescription>
              Accédez à votre espace personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center mb-4">
                      <Mail className="h-12 w-12 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Entrez votre adresse email pour recevoir un code à 6 chiffres
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        'Envoyer le code'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour à la connexion
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Mot de passe</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom</Label>
                      <Input
                        id="nom"
                        placeholder="Nom"
                        value={signupForm.nom}
                        onChange={(e) => setSignupForm({ ...signupForm, nom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom</Label>
                      <Input
                        id="prenom"
                        placeholder="Prénom"
                        value={signupForm.prenom}
                        onChange={(e) => setSignupForm({ ...signupForm, prenom: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type de compte</Label>
                    <Select 
                      value={signupForm.userType} 
                      onValueChange={(value: "producteur" | "acheteur") => 
                        setSignupForm({ ...signupForm, userType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acheteur">
                          <div className="flex items-center">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Acheteur
                          </div>
                        </SelectItem>
                        <SelectItem value="producteur">
                          <div className="flex items-center">
                            <Leaf className="mr-2 h-4 w-4" />
                            Producteur
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pays">Pays</Label>
                      <Select
                        value={countries.find(c => c.name === signupForm.pays)?.code || ""}
                        onValueChange={handleCountryChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre pays" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.name}</span>
                                <span className="text-muted-foreground text-sm">({country.phoneCode})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Région</Label>
                      <Input
                        id="region"
                        placeholder="Région"
                        value={signupForm.region}
                        onChange={(e) => setSignupForm({ ...signupForm, region: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">
                      Contact WhatsApp {signupForm.userType === 'producteur' && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="flex gap-2">
                      <div className="w-20">
                        <Input
                          value={signupForm.phoneCode}
                          readOnly
                          className="text-center bg-muted text-muted-foreground font-mono"
                        />
                      </div>
                      <Input
                        id="whatsapp"
                        placeholder="XX XX XX XX XX"
                        value={signupForm.whatsapp.replace(signupForm.phoneCode, '').trim()}
                        onChange={(e) => setSignupForm({ 
                          ...signupForm, 
                          whatsapp: signupForm.phoneCode + " " + e.target.value.replace(/[^\d\s]/g, '') 
                        })}
                        required={signupForm.userType === 'producteur'}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le code pays est automatiquement ajouté selon votre sélection
                    </p>
                  </div>

                  {signupForm.userType === 'acheteur' && (
                    <div className="space-y-2">
                      <Label htmlFor="typeActivite">Type d'activité</Label>
                      <Input
                        id="typeActivite"
                        placeholder="Ex: Grossiste, Restaurateur..."
                        value={signupForm.typeActivite}
                        onChange={(e) => setSignupForm({ ...signupForm, typeActivite: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Inscription...
                      </>
                    ) : (
                      'Créer mon compte'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            ← Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;