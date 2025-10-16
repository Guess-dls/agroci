import { z } from 'zod';

// Product validation schema
export const productSchema = z.object({
  nom: z.string()
    .trim()
    .min(1, "Le nom du produit est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
  
  prix: z.number()
    .positive("Le prix doit être positif")
    .max(999999999, "Le prix est trop élevé"),
  
  quantite: z.string()
    .trim()
    .min(1, "La quantité est requise")
    .max(50, "La quantité ne doit pas dépasser 50 caractères"),
  
  description: z.string()
    .trim()
    .max(1000, "La description ne doit pas dépasser 1000 caractères")
    .optional(),
  
  localisation: z.string()
    .trim()
    .max(200, "La localisation ne doit pas dépasser 200 caractères")
    .optional(),
  
  categorie_id: z.string().uuid("ID de catégorie invalide").optional(),
});

// Contact message validation schema
export const contactMessageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, "Le message est requis")
    .max(500, "Le message ne doit pas dépasser 500 caractères"),
});

// Auth validation schemas
export const signupSchema = z.object({
  email: z.string()
    .trim()
    .email("Email invalide")
    .max(255, "L'email ne doit pas dépasser 255 caractères"),
  
  password: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(100, "Le mot de passe ne doit pas dépasser 100 caractères"),
  
  nom: z.string()
    .trim()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom contient des caractères invalides"),
  
  prenom: z.string()
    .trim()
    .min(1, "Le prénom est requis")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le prénom contient des caractères invalides"),
  
  whatsapp: z.string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{8,20}$/, "Numéro WhatsApp invalide"),
  
  pays: z.string()
    .trim()
    .min(1, "Le pays est requis")
    .max(100, "Le pays ne doit pas dépasser 100 caractères"),
  
  region: z.string()
    .trim()
    .max(100, "La région ne doit pas dépasser 100 caractères")
    .optional(),
  
  user_type: z.union([
    z.literal('acheteur'),
    z.literal('producteur')
  ]).refine((val) => val === 'acheteur' || val === 'producteur', {
    message: "Type d'utilisateur invalide"
  }),
  
  type_activite: z.string()
    .trim()
    .max(200, "Le type d'activité ne doit pas dépasser 200 caractères")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email("Email invalide")
    .max(255, "L'email ne doit pas dépasser 255 caractères"),
  
  password: z.string()
    .min(1, "Le mot de passe est requis"),
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  nom: z.string()
    .trim()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom contient des caractères invalides")
    .optional(),
  
  prenom: z.string()
    .trim()
    .min(1, "Le prénom est requis")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le prénom contient des caractères invalides")
    .optional(),
  
  whatsapp: z.string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{8,20}$/, "Numéro WhatsApp invalide")
    .optional(),
  
  pays: z.string()
    .trim()
    .max(100, "Le pays ne doit pas dépasser 100 caractères")
    .optional(),
  
  region: z.string()
    .trim()
    .max(100, "La région ne doit pas dépasser 100 caractères")
    .optional(),
  
  type_activite: z.string()
    .trim()
    .max(200, "Le type d'activité ne doit pas dépasser 200 caractères")
    .optional(),
});
