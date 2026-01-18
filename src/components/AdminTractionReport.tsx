import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Package, TrendingUp, Eye, MessageSquare, CreditCard, Calendar, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend 
} from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface DailyStats {
  date: string;
  users: number;
  products: number;
  views: number;
  contacts: number;
}

interface CategoryStats {
  name: string;
  count: number;
}

interface UserTypeStats {
  name: string;
  value: number;
  color: string;
}

interface CountryStats {
  pays: string;
  count: number;
}

interface TransactionStats {
  date: string;
  montant: number;
  count: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 76%, 36%)', 'hsl(48, 96%, 53%)', 'hsl(280, 65%, 60%)'];

export const AdminTractionReport = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalViews: 0,
    totalContacts: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    newProductsToday: 0,
    activeProductsPercent: 0,
    verifiedProducersPercent: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [userTypeStats, setUserTypeStats] = useState<UserTypeStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats[]>([]);
  const [productStatusStats, setProductStatusStats] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchGeneralStats(),
      fetchDailyStats(),
      fetchCategoryStats(),
      fetchUserTypeStats(),
      fetchCountryStats(),
      fetchTransactionStats(),
      fetchProductStatusStats(),
    ]);
    setLoading(false);
  };

  const fetchGeneralStats = async () => {
    try {
      // Users count
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // Products count
      const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
      
      // Views count
      const { count: totalViews } = await supabase.from('product_views').select('*', { count: 'exact', head: true });
      
      // Contacts count
      const { count: totalContacts } = await supabase.from('contact_requests').select('*', { count: 'exact', head: true });
      
      // Transactions
      const { data: transactions } = await supabase.from('transactions').select('montant').eq('statut', 'complete');
      const totalRevenue = transactions?.reduce((acc, t) => acc + (t.montant || 0), 0) || 0;
      
      // Today's stats
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();
      
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);
      
      const { count: newProductsToday } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);
      
      // Active products percentage
      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approuve')
        .eq('hidden', false);
      
      // Verified producers percentage
      const { count: verifiedProducers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'producteur')
        .eq('verified', true);
      
      const { count: totalProducers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'producteur');

      setStats({
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        totalViews: totalViews || 0,
        totalContacts: totalContacts || 0,
        totalTransactions: transactions?.length || 0,
        totalRevenue,
        newUsersToday: newUsersToday || 0,
        newProductsToday: newProductsToday || 0,
        activeProductsPercent: totalProducts ? Math.round(((activeProducts || 0) / totalProducts) * 100) : 0,
        verifiedProducersPercent: totalProducers ? Math.round(((verifiedProducers || 0) / totalProducers) * 100) : 0,
      });
    } catch (error) {
      console.error('Error fetching general stats:', error);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      const dailyData: DailyStats[] = [];

      for (const day of last30Days) {
        const start = startOfDay(day).toISOString();
        const end = endOfDay(day).toISOString();

        const [usersRes, productsRes, viewsRes, contactsRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
          supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
          supabase.from('product_views').select('*', { count: 'exact', head: true }).gte('viewed_at', start).lte('viewed_at', end),
          supabase.from('contact_requests').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
        ]);

        dailyData.push({
          date: format(day, 'dd MMM', { locale: fr }),
          users: usersRes.count || 0,
          products: productsRes.count || 0,
          views: viewsRes.count || 0,
          contacts: contactsRes.count || 0,
        });
      }

      setDailyStats(dailyData);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('categorie_id, categories_produits(nom)');

      const categoryMap = new Map<string, number>();
      products?.forEach((p: any) => {
        const name = p.categories_produits?.nom || 'Non catégorisé';
        categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
      });

      const categoryData = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setCategoryStats(categoryData);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  const fetchUserTypeStats = async () => {
    try {
      const { data: users } = await supabase.from('profiles').select('user_type');

      const typeMap = new Map<string, number>();
      users?.forEach((u) => {
        const type = u.user_type === 'producteur' ? 'Producteurs' : u.user_type === 'acheteur' ? 'Acheteurs' : 'Admins';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });

      const typeData = [
        { name: 'Producteurs', value: typeMap.get('Producteurs') || 0, color: 'hsl(var(--primary))' },
        { name: 'Acheteurs', value: typeMap.get('Acheteurs') || 0, color: 'hsl(142, 76%, 36%)' },
        { name: 'Admins', value: typeMap.get('Admins') || 0, color: 'hsl(48, 96%, 53%)' },
      ];

      setUserTypeStats(typeData);
    } catch (error) {
      console.error('Error fetching user type stats:', error);
    }
  };

  const fetchCountryStats = async () => {
    try {
      const { data: users } = await supabase.from('profiles').select('pays');

      const countryMap = new Map<string, number>();
      users?.forEach((u) => {
        const pays = u.pays || 'Non spécifié';
        countryMap.set(pays, (countryMap.get(pays) || 0) + 1);
      });

      const countryData = Array.from(countryMap.entries())
        .map(([pays, count]) => ({ pays, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setCountryStats(countryData);
    } catch (error) {
      console.error('Error fetching country stats:', error);
    }
  };

  const fetchTransactionStats = async () => {
    try {
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      const transactionData: TransactionStats[] = [];

      for (const day of last30Days) {
        const start = startOfDay(day).toISOString();
        const end = endOfDay(day).toISOString();

        const { data, count } = await supabase
          .from('transactions')
          .select('montant', { count: 'exact' })
          .gte('created_at', start)
          .lte('created_at', end)
          .eq('statut', 'complete');

        transactionData.push({
          date: format(day, 'dd MMM', { locale: fr }),
          montant: data?.reduce((acc, t) => acc + (t.montant || 0), 0) || 0,
          count: count || 0,
        });
      }

      setTransactionStats(transactionData);
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
    }
  };

  const fetchProductStatusStats = async () => {
    try {
      const { data: products } = await supabase.from('products').select('status');

      const statusMap = new Map<string, number>();
      products?.forEach((p) => {
        const status = p.status || 'en_attente';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const statusData = [
        { name: 'Approuvés', value: statusMap.get('approuve') || 0, color: 'hsl(142, 76%, 36%)' },
        { name: 'En attente', value: statusMap.get('en_attente') || 0, color: 'hsl(48, 96%, 53%)' },
        { name: 'Rejetés', value: statusMap.get('rejete') || 0, color: 'hsl(0, 84%, 60%)' },
      ];

      setProductStatusStats(statusData);
    } catch (error) {
      console.error('Error fetching product status stats:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setExporting(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `rapport-traction-agroci-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success("Rapport PDF exporté avec succès!");
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Erreur lors de l'export du PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement du rapport...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">📊 Users & Traction Report</h1>
          <p className="text-muted-foreground">
            Analyse complète de la plateforme • Mis à jour le {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
        <Button 
          onClick={handleExportPDF} 
          disabled={exporting}
          className="gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exporter PDF
            </>
          )}
        </Button>
      </div>

      {/* Report Content for PDF */}
      <div ref={reportRef} className="space-y-6">

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +{stats.newUsersToday} aujourd'hui
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Total</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +{stats.newProductsToday} aujourd'hui • {stats.activeProductsPercent}% actifs
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues de Produits</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">Total des consultations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes de Contact</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">Connexions acheteur-producteur</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{stats.totalTransactions} transactions complètes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producteurs Vérifiés</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedProducersPercent}%</div>
            <p className="text-xs text-muted-foreground">des producteurs sont vérifiés</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Croissance des Utilisateurs</CardTitle>
            <CardDescription>Nouveaux utilisateurs par jour (30 derniers jours)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                  name="Utilisateurs"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>📦 Produits Ajoutés</CardTitle>
            <CardDescription>Nouveaux produits par jour (30 derniers jours)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="products" fill="hsl(142, 76%, 36%)" name="Produits" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>👥 Types d'Utilisateurs</CardTitle>
            <CardDescription>Répartition des utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={userTypeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {userTypeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Statut des Produits</CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={productStatusStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {productStatusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>💬 Engagement</CardTitle>
            <CardDescription>Vues et contacts (30 derniers jours)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="hsl(217, 91%, 60%)" name="Vues" strokeWidth={2} />
                <Line type="monotone" dataKey="contacts" stroke="hsl(280, 65%, 60%)" name="Contacts" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Revenus par Jour</CardTitle>
            <CardDescription>Transactions complètes (30 derniers jours)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={transactionStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="montant" 
                  stroke="hsl(48, 96%, 53%)" 
                  fill="hsl(48, 96%, 53%)" 
                  fillOpacity={0.3}
                  name="Revenus"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>🏷️ Produits par Catégorie</CardTitle>
            <CardDescription>Top 8 catégories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Produits" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Country Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 Utilisateurs par Pays</CardTitle>
          <CardDescription>Distribution géographique (Top 10)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="pays" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="count" name="Utilisateurs" radius={[4, 4, 0, 0]}>
                {countryStats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
