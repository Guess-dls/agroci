import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

interface Product {
  id: string;
  nom: string;
  prix: number;
  quantite: string;
  description: string;
  localisation: string;
  image_url: string;
  images?: string[];
  categorie_id?: string;
  acheteurs_cibles?: string[];
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

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
}

export const EditProductModal = ({ product, isOpen, onClose, onProductUpdated }: EditProductModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [acheteurCategories, setAcheteurCategories] = useState<AcheteurCategory[]>([]);
  const [selectedAcheteurs, setSelectedAcheteurs] = useState<string[]>([]);

  // Existing images (URLs from DB)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // New images (files to upload)
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

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
  }, []);

  useEffect(() => {
    if (product) {
      // Parse quantity to extract number and unit
      const quantiteParts = product.quantite?.match(/^(\d+)\s*(.*)$/);
      const quantiteNum = quantiteParts ? quantiteParts[1] : product.quantite || "";
      const uniteLabel = quantiteParts ? quantiteParts[2] : "";
      const matchedUnit = unites.find(u => u.label === uniteLabel || u.value === uniteLabel);

      setFormData({
        nom: product.nom,
        prix: product.prix.toString(),
        quantite: quantiteNum,
        unite: matchedUnit?.value || "kg",
        description: product.description || "",
        localisation: product.localisation || "",
        categorie_id: product.categorie_id || ""
      });
      setSelectedAcheteurs(product.acheteurs_cibles || []);
      
      // Load existing images
      const imgs = product.images && product.images.length > 0 
        ? product.images 
        : product.image_url ? [product.image_url] : [];
      setExistingImages(imgs.filter(Boolean));
      setNewImageFiles([]);
      setNewImagePreviews([]);
    }
  }, [product]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories_produits').select('id, nom, icone').order('nom');
    setCategories(data || []);
  };

  const fetchAcheteurCategories = async () => {
    const { data } = await supabase.from('categories_acheteurs').select('id, nom').order('nom');
    setAcheteurCategories(data || []);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalImages = existingImages.length + newImageFiles.length;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + totalImages > 3) {
      toast({ title: "Limite d'images", description: "Maximum 3 images au total", variant: "destructive" });
      return;
    }
    setNewImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => setNewImagePreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of newImageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !formData.nom || !formData.prix || !formData.quantite) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      setUploadingImage(true);
      const newUrls = await uploadNewImages();
      setUploadingImage(false);

      const allImages = [...existingImages, ...newUrls];
      const quantiteAvecUnite = `${formData.quantite} ${unites.find(u => u.value === formData.unite)?.label || formData.unite}`;

      const { error } = await supabase
        .from('products')
        .update({
          nom: formData.nom,
          prix: parseFloat(formData.prix),
          quantite: quantiteAvecUnite,
          description: formData.description,
          localisation: formData.localisation,
          categorie_id: formData.categorie_id || null,
          acheteurs_cibles: selectedAcheteurs,
          image_url: allImages[0] || null,
          images: allImages
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({ title: "Produit modifié", description: "Votre produit a été mis à jour avec succès" });
      onProductUpdated();
      onClose();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Erreur lors de la modification", variant: "destructive" });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
          <DialogDescription>Modifiez les informations de votre produit</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom du produit *</Label>
              <Input id="edit-nom" placeholder="Ex: Riz parfumé, Maïs blanc..." value={formData.nom} onChange={(e) => handleInputChange('nom', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-categorie">Catégorie *</Label>
              <Select value={formData.categorie_id} onValueChange={(value) => handleInputChange('categorie_id', value)}>
                <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2"><span>{c.icone}</span>{c.nom}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-prix">Prix (FCFA) *</Label>
              <Input id="edit-prix" type="number" placeholder="Prix en FCFA" value={formData.prix} onChange={(e) => handleInputChange('prix', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unite">Unité de vente *</Label>
              <Select value={formData.unite} onValueChange={(value) => handleInputChange('unite', value)}>
                <SelectTrigger><SelectValue placeholder="Choisir une unité" /></SelectTrigger>
                <SelectContent>
                  {unites.map(u => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantite">Quantité disponible *</Label>
              <Input id="edit-quantite" type="number" placeholder="Ex: 50, 100..." value={formData.quantite} onChange={(e) => handleInputChange('quantite', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-localisation">Localisation</Label>
            <Input id="edit-localisation" placeholder="Ville, région..." value={formData.localisation} onChange={(e) => handleInputChange('localisation', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" placeholder="Décrivez la qualité, l'origine..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} />
          </div>

          {/* Ciblage acheteurs */}
          <div className="space-y-3">
            <Label>Cibler des types d'acheteurs (optionnel)</Label>
            <div className="text-sm text-muted-foreground mb-3">
              Si vous ne sélectionnez aucun type, votre produit sera visible par tous.
            </div>
            <div className="grid grid-cols-2 gap-3">
              {acheteurCategories.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-acheteur-${cat.id}`}
                    checked={selectedAcheteurs.includes(cat.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedAcheteurs(prev => [...prev, cat.id]);
                      else setSelectedAcheteurs(prev => prev.filter(id => id !== cat.id));
                    }}
                  />
                  <Label htmlFor={`edit-acheteur-${cat.id}`} className="text-sm font-normal cursor-pointer">{cat.nom}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-4">
            <Label>Photos du produit (max 3)</Label>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative">
                    <img src={url} alt={`Photo ${index + 1}`} className="w-full h-24 object-cover rounded-lg border" />
                    <button type="button" onClick={() => removeExistingImage(index)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New image previews */}
            {newImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {newImagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative">
                    <img src={preview} alt={`Nouvelle ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-primary/50" />
                    <button type="button" onClick={() => removeNewImage(index)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {totalImages < 3 && (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <Label htmlFor="edit-image-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    <Upload className="mr-2 h-4 w-4" />
                    Ajouter des photos
                  </Label>
                  <Input id="edit-image-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  <p className="text-sm text-muted-foreground mt-2">
                    {totalImages}/3 photos · JPG, PNG ou WEBP
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading || uploadingImage}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadingImage ? "Upload des images..." : "Modification..."}</>
              ) : 'Modifier le produit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
