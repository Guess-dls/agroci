import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

interface AddProductFormProps {
  onProductAdded: () => void;
}

export const AddProductForm = ({ onProductAdded }: AddProductFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    nom: "",
    prix: "",
    quantite: "",
    description: "",
    localisation: ""
  });

  const productTypes = [
    "Maïs", "Riz", "Manioc", "Igname", "Tomates", "Oignons",
    "Banane plantain", "Arachide", "Haricot", "Soja", "Cacao", "Café"
  ];

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
    
    if (!formData.nom || !formData.prix || !formData.quantite) {
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

      // Check subscription and product count limit
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', profile.id)
        .eq('status', 'actif')
        .maybeSingle();

      if (subError) {
        console.error('Subscription error:', subError);
      }

      const currentPlan = subscription?.plan || 'gratuit';

      // Check current product count
      const { count: productCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('producteur_id', profile.id);

      if (countError) {
        throw new Error(`Erreur lors du comptage des produits: ${countError.message}`);
      }

      // Check limits based on plan
      const limits = {
        gratuit: 3,
        premium: 20,
        pro: Infinity
      };

      const limit = limits[currentPlan as keyof typeof limits] || 3;

      if ((productCount || 0) >= limit) {
        toast({
          title: "Limite atteinte",
          description: `Vous avez atteint la limite de ${limit} produits pour votre plan ${currentPlan}. Passez à un plan supérieur pour publier plus de produits.`,
          variant: "destructive"
        });
        return;
      }


      // Upload images first
      setUploadingImage(true);
      const imageUrls = await uploadImages();
      setUploadingImage(false);

      // Insert product
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          nom: formData.nom,
          prix: parseFloat(formData.prix),
          quantite: formData.quantite,
          description: formData.description,
          localisation: formData.localisation,
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
        description: "",
        localisation: ""
      });
      setImageFiles([]);
      setImagePreviews([]);
      
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un nouveau produit</CardTitle>
        <CardDescription>
          Publiez vos produits pour les rendre visibles aux acheteurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du produit *</Label>
              <Select 
                value={formData.nom} 
                onValueChange={(value) => handleInputChange('nom', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix">Prix (FCFA/unité) *</Label>
              <Input
                id="prix"
                type="number"
                placeholder="Prix en FCFA"
                value={formData.prix}
                onChange={(e) => handleInputChange('prix', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantite">Quantité disponible *</Label>
              <Input
                id="quantite"
                placeholder="Ex: 50 sacs, 100kg, 20 tonnes..."
                value={formData.quantite}
                onChange={(e) => handleInputChange('quantite', e.target.value)}
                required
              />
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