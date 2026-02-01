import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image as ImageIcon, Lock, AlertTriangle } from "lucide-react";

interface AddProductFormProps {
  onProductAdded: () => void;
}

interface Category {
  id: string;
  nom: string;
  icone: string;
}

interface AcheteurCategory {
  id: string;
  nom: string;
}

export const AddProductForm = ({ onProductAdded }: AddProductFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [acheteurCategories, setAcheteurCategories] = useState<AcheteurCategory[]>([]);
  const [selectedAcheteurs, setSelectedAcheteurs] = useState<string[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  const [formData, setFormData] = useState({
    nom: "",
    prix: "",
    quantite: "",
    unite: "kg",
    description: "",
    localisation: "",
    categorie_id: ""
  });

  const unites = [
    { value: "kg", label: "Kilogramme (kg)" },
    { value: "tonne", label: "Tonne" },
    { value: "sac", label: "Sac" },
    { value: "unite", label: "Unité" },
    { value: "litre", label: "Litre" },
    { value: "carton", label: "Carton" },
    { value: "panier", label: "Panier" },
    { value: "botte", label: "Botte" },
    { value: "tas", label: "Tas" },
  ];

  useEffect(() => {
    fetchCategories();
    fetchAcheteurCategories();
    checkProductLimit();
  }, [user]);

  const checkProductLimit = async () => {
    if (!user) {
      setCheckingLimit(false);
      return;
    }
    
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, subscription_required')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!profile) {
        setCheckingLimit(false);
        return;
      }

      setSubscriptionRequired(profile.subscription_required);

      // Count existing products
      const { count, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('producteur_id', profile.id);

      if (countError) throw countError;
      setProductCount(count || 0);
    } catch (error) {
      console.error('Error checking product limit:', error);
    } finally {
      setCheckingLimit(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories_produits')
        .select('id, nom, icone')
        .order('nom');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const fetchAcheteurCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories_acheteurs')
        .select('id, nom')
        .order('nom');
      
      if (error) throw error;
      setAcheteurCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories d\'acheteurs:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + imageFiles.length > 3) {
      toast({
        title: "Limite d'images",
        description: "Vous ne pouvez télécharger que 3 images maximum",
        variant: "destructive"
      });
      return;
    }

    // Add new files
    setImageFiles(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const uploadedUrls: string[] = [];
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prix || !formData.quantite || !formData.categorie_id) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get user profile to get the profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Erreur de profil: ${profileError.message}`);
      }
      
      if (!profile) {
        throw new Error("Profil non trouvé. Veuillez vous reconnecter.");
      }

      // L'ajout de produits est maintenant gratuit - pas de vérification d'abonnement nécessaire

      // Upload images first
      setUploadingImage(true);
      const imageUrls = await uploadImages();
      setUploadingImage(false);

      // Insert product with quantity including unit
      const quantiteAvecUnite = `${formData.quantite} ${unites.find(u => u.value === formData.unite)?.label || formData.unite}`;
      
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          nom: formData.nom,
          prix: parseFloat(formData.prix),
          quantite: quantiteAvecUnite,
          description: formData.description,
          localisation: formData.localisation,
          categorie_id: formData.categorie_id,
          acheteurs_cibles: selectedAcheteurs,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null, // Use first image as main image
          producteur_id: profile.id
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Produit ajouté",
        description: "Votre produit a été publié avec succès"
      });

      // Reset form
      setFormData({
        nom: "",
        prix: "",
        quantite: "",
        unite: "kg",
        description: "",
        localisation: "",
        categorie_id: ""
      });
      setSelectedAcheteurs([]);
      setImageFiles([]);
      setImagePreviews([]);
      
      // Update product count for limit tracking
      setProductCount(prev => prev + 1);
      
      onProductAdded();

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'ajout du produit",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const isLimitReached = subscriptionRequired && productCount >= 3;

  if (checkingLimit) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Vérification des limites...</span>
        </CardContent>
      </Card>
    );
  }

  if (isLimitReached) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Lock className="h-5 w-5" />
            Limite de produits atteinte
          </CardTitle>
          <CardDescription className="text-amber-700">
            Vous avez atteint la limite de 3 produits pour le mode gratuit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Abonnement requis</p>
                <p className="text-sm text-amber-700 mt-1">
                  Un administrateur a activé l'obligation d'abonnement sur votre compte. 
                  Vous êtes limité à <strong>3 produits</strong> et ne pouvez pas ajouter de nouveaux produits 
                  ni modifier les existants.
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  <strong>Produits actuels :</strong> {productCount}/3
                </p>
              </div>
            </div>
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={() => window.location.href = '/abonnements'}
          >
            Voir les abonnements
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un nouveau produit</CardTitle>
        <CardDescription>
          Publiez vos produits pour les rendre visibles aux acheteurs
          {subscriptionRequired && (
            <span className="block mt-1 text-amber-600 font-medium">
              ⚠️ Limite: {productCount}/3 produits (abonnement requis activé)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du produit *</Label>
              <Input
                id="nom"
                placeholder="Ex: Riz parfumé, Maïs blanc..."
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie *</Label>
              <Select 
                value={formData.categorie_id} 
                onValueChange={(value) => handleInputChange('categorie_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <span>{category.icone}</span>
                        {category.nom}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prix">Prix (FCFA) *</Label>
              <Input
                id="prix"
                type="number"
                placeholder="Prix en FCFA"
                value={formData.prix}
                onChange={(e) => handleInputChange('prix', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unite">Unité de vente *</Label>
              <Select 
                value={formData.unite} 
                onValueChange={(value) => handleInputChange('unite', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une unité" />
                </SelectTrigger>
                <SelectContent>
                  {unites.map(unite => (
                    <SelectItem key={unite.value} value={unite.value}>
                      {unite.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantite">Quantité disponible *</Label>
              <Input
                id="quantite"
                type="number"
                placeholder="Ex: 50, 100, 20..."
                value={formData.quantite}
                onChange={(e) => handleInputChange('quantite', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localisation">Localisation</Label>
            <Input
              id="localisation"
              placeholder="Ville, région..."
              value={formData.localisation}
              onChange={(e) => handleInputChange('localisation', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez la qualité, l'origine, les conditions de stockage..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Section ciblage des acheteurs */}
          <div className="space-y-3">
            <Label>Cibler des types d'acheteurs (optionnel)</Label>
            <div className="text-sm text-gray-600 mb-3">
              Si vous ne sélectionnez aucun type, votre produit sera visible par tous les acheteurs.
            </div>
            <div className="grid grid-cols-2 gap-3">
              {acheteurCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`acheteur-${category.id}`}
                    checked={selectedAcheteurs.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAcheteurs(prev => [...prev, category.id]);
                      } else {
                        setSelectedAcheteurs(prev => prev.filter(id => id !== category.id));
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`acheteur-${category.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.nom}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Photos du produit (max 3)</Label>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Télécharger des images
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={imageFiles.length >= 3}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  JPG, PNG ou WEBP (max 5MB par image)
                </p>
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || uploadingImage}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadingImage ? "Upload des images..." : "Publication..."}
              </>
            ) : (
              'Publier le produit'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};