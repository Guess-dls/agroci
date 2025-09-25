import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  nom: string;
  description: string;
  icone: string;
}

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories_produits')
        .select('*')
        .order('nom');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Filtrer par catégorie
      </h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          className={selectedCategory === null ? 
            "bg-gradient-to-r from-green-600 to-blue-600 text-white" : 
            "hover:bg-gray-100"
          }
        >
          Toutes les catégories
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={`${
              selectedCategory === category.id 
                ? "bg-gradient-to-r from-green-600 to-blue-600 text-white" 
                : "hover:bg-gray-100"
            } transition-all duration-200`}
          >
            <span className="mr-1">{category.icone}</span>
            {category.nom}
            {selectedCategory === category.id && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                Actif
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;