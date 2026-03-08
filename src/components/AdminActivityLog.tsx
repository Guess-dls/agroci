import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, MousePointerClick, CreditCard, MessageSquare, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductView {
  id: string;
  viewed_at: string;
  product: { nom: string };
  viewer: { nom: string; prenom: string } | null;
}

interface WhatsAppClick {
  id: string;
  clicked_at: string;
  product: { nom: string };
  clicker: { nom: string; prenom: string } | null;
}

interface Transaction {
  id: string;
  type_transaction: string;
  montant: number | null;
  description: string | null;
  statut: string;
  created_at: string;
  credits_ajoutes: number | null;
  credits_utilises: number | null;
  user: { nom: string; prenom: string };
}

export const AdminActivityLog = () => {
  const [views, setViews] = useState<ProductView[]>([]);
  const [clicks, setClicks] = useState<WhatsAppClick[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("views");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchViews(), fetchClicks(), fetchTransactions()]);
    setLoading(false);
  };

  const fetchViews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_views")
        .select(`
          id, viewed_at,
          product:products!product_views_product_id_fkey(nom),
          viewer:profiles!product_views_viewer_id_fkey(nom, prenom)
        `)
        .order("viewed_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setViews(
        (data || []).map((v: any) => ({
          id: v.id,
          viewed_at: v.viewed_at,
          product: v.product,
          viewer: v.viewer,
        }))
      );
    } catch (e) {
      console.error("Error fetching views:", e);
    }
  };

  const fetchClicks = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_clicks")
        .select(`
          id, clicked_at,
          product:products!whatsapp_clicks_product_id_fkey(nom),
          clicker:profiles!whatsapp_clicks_clicker_id_fkey(nom, prenom)
        `)
        .order("clicked_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setClicks(
        (data || []).map((c: any) => ({
          id: c.id,
          clicked_at: c.clicked_at,
          product: c.product,
          clicker: c.clicker,
        }))
      );
    } catch (e) {
      console.error("Error fetching clicks:", e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id, type_transaction, montant, description, statut, created_at, credits_ajoutes, credits_utilises,
          user:profiles!transactions_user_id_fkey(nom, prenom)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setTransactions(
        (data || []).map((t: any) => ({
          ...t,
          user: t.user,
        }))
      );
    } catch (e) {
      console.error("Error fetching transactions:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const transactionTypeLabel = (t: string) => {
    switch (t) {
      case "achat_abonnement": return "Achat crédits";
      case "contact_producteur": return "Contact producteur";
      case "abonnement_mensuel": return "Abonnement";
      case "boost_produit": return "Boost produit";
      default: return t;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{views.length}</div>
            <p className="text-xs text-muted-foreground">Vues récentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Phone className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{clicks.length}</div>
            <p className="text-xs text-muted-foreground">Clics contact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CreditCard className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="views" className="text-xs sm:text-sm gap-1">
            <Eye className="h-3 w-3" />
            <span className="hidden sm:inline">Vues produits</span>
            <span className="sm:hidden">Vues</span>
          </TabsTrigger>
          <TabsTrigger value="clicks" className="text-xs sm:text-sm gap-1">
            <MousePointerClick className="h-3 w-3" />
            <span className="hidden sm:inline">Clics contact</span>
            <span className="sm:hidden">Clics</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm gap-1">
            <CreditCard className="h-3 w-3" />
            <span className="hidden sm:inline">Transactions</span>
            <span className="sm:hidden">Trans.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="views">
          {views.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune vue enregistrée</p>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-2">
                {views.slice(0, 50).map((v) => (
                  <div key={v.id} className="border rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{v.product?.nom || "Produit supprimé"}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.viewer ? `${v.viewer.prenom} ${v.viewer.nom}` : "Anonyme"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(v.viewed_at)}</span>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Visiteur</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {views.slice(0, 100).map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.product?.nom || "Supprimé"}</TableCell>
                        <TableCell>{v.viewer ? `${v.viewer.prenom} ${v.viewer.nom}` : "Anonyme"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(v.viewed_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="clicks">
          {clicks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun clic enregistré</p>
          ) : (
            <>
              <div className="md:hidden space-y-2">
                {clicks.slice(0, 50).map((c) => (
                  <div key={c.id} className="border rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{c.product?.nom || "Produit supprimé"}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.clicker ? `${c.clicker.prenom} ${c.clicker.nom}` : "Anonyme"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(c.clicked_at)}</span>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clicks.slice(0, 100).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.product?.nom || "Supprimé"}</TableCell>
                        <TableCell>{c.clicker ? `${c.clicker.prenom} ${c.clicker.nom}` : "Anonyme"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(c.clicked_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune transaction</p>
          ) : (
            <>
              <div className="md:hidden space-y-2">
                {transactions.slice(0, 50).map((t) => (
                  <div key={t.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{t.user.prenom} {t.user.nom}</p>
                        <Badge variant="outline" className="text-[10px]">{transactionTypeLabel(t.type_transaction)}</Badge>
                      </div>
                      <div className="text-right">
                        {t.montant !== null && <p className="font-bold text-sm">{t.montant.toLocaleString()} F</p>}
                        <Badge variant={t.statut === "valide" ? "default" : "secondary"} className="text-[10px]">{t.statut}</Badge>
                      </div>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    <p className="text-[10px] text-muted-foreground">{formatDate(t.created_at)}</p>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 100).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.user.prenom} {t.user.nom}</TableCell>
                        <TableCell><Badge variant="outline">{transactionTypeLabel(t.type_transaction)}</Badge></TableCell>
                        <TableCell>{t.montant !== null ? `${t.montant.toLocaleString()} FCFA` : "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.description || "-"}</TableCell>
                        <TableCell><Badge variant={t.statut === "valide" ? "default" : "secondary"}>{t.statut}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(t.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
