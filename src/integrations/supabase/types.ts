export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          actif: boolean
          created_at: string
          credits: number
          description: string | null
          duree_jours: number
          id: string
          montant: number
          nom: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          credits: number
          description?: string | null
          duree_jours?: number
          id?: string
          montant: number
          nom: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          credits?: number
          description?: string | null
          duree_jours?: number
          id?: string
          montant?: number
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories_acheteurs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories_produits: {
        Row: {
          created_at: string
          description: string | null
          icone: string | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          message: string | null
          producer_id: string
          product_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          producer_id: string
          product_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          producer_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          product_id: string
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          acheteurs_cibles: string[] | null
          categorie_id: string | null
          created_at: string | null
          description: string | null
          hidden: boolean | null
          id: string
          image_url: string | null
          localisation: string | null
          nom: string
          prix: number
          producteur_id: string
          quantite: string
          status: Database["public"]["Enums"]["product_status"] | null
          updated_at: string | null
          views_count: number | null
          whatsapp_clicks: number | null
        }
        Insert: {
          acheteurs_cibles?: string[] | null
          categorie_id?: string | null
          created_at?: string | null
          description?: string | null
          hidden?: boolean | null
          id?: string
          image_url?: string | null
          localisation?: string | null
          nom: string
          prix: number
          producteur_id: string
          quantite: string
          status?: Database["public"]["Enums"]["product_status"] | null
          updated_at?: string | null
          views_count?: number | null
          whatsapp_clicks?: number | null
        }
        Update: {
          acheteurs_cibles?: string[] | null
          categorie_id?: string | null
          created_at?: string | null
          description?: string | null
          hidden?: boolean | null
          id?: string
          image_url?: string | null
          localisation?: string | null
          nom?: string
          prix?: number
          producteur_id?: string
          quantite?: string
          status?: Database["public"]["Enums"]["product_status"] | null
          updated_at?: string | null
          views_count?: number | null
          whatsapp_clicks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_producteur_id_fkey"
            columns: ["producteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          nom: string
          pays: string
          prenom: string
          region: string | null
          subscription_required: boolean
          suspended: boolean | null
          type_acheteur: string | null
          type_activite: string | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          verified: boolean | null
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          credits?: number
          id?: string
          nom: string
          pays: string
          prenom: string
          region?: string | null
          subscription_required?: boolean
          suspended?: boolean | null
          type_acheteur?: string | null
          type_activite?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean | null
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          nom?: string
          pays?: string
          prenom?: string
          region?: string | null
          subscription_required?: boolean
          suspended?: boolean | null
          type_acheteur?: string | null
          type_activite?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_type_acheteur_fkey"
            columns: ["type_acheteur"]
            isOneToOne: false
            referencedRelation: "categories_acheteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          abonnement_id: string | null
          created_at: string
          credits_ajoutes: number | null
          credits_utilises: number | null
          description: string | null
          id: string
          montant: number | null
          reference_paiement: string | null
          statut: string
          type_transaction: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abonnement_id?: string | null
          created_at?: string
          credits_ajoutes?: number | null
          credits_utilises?: number | null
          description?: string | null
          id?: string
          montant?: number | null
          reference_paiement?: string | null
          statut?: string
          type_transaction: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abonnement_id?: string | null
          created_at?: string
          credits_ajoutes?: number | null
          credits_utilises?: number | null
          description?: string | null
          id?: string
          montant?: number | null
          reference_paiement?: string | null
          statut?: string
          type_transaction?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_clicks: {
        Row: {
          clicked_at: string | null
          clicker_id: string | null
          id: string
          product_id: string
        }
        Insert: {
          clicked_at?: string | null
          clicker_id?: string | null
          id?: string
          product_id: string
        }
        Update: {
          clicked_at?: string | null
          clicker_id?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_clicks_clicker_id_fkey"
            columns: ["clicker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_contact_request: {
        Args: { request_id_param: string }
        Returns: {
          buyer_name: string
          nom: string
          prenom: string
          whatsapp: string
        }[]
      }
      create_admin_profile: {
        Args: {
          admin_email: string
          admin_nom: string
          admin_pays?: string
          admin_prenom: string
          admin_whatsapp?: string
        }
        Returns: string
      }
      create_contact_request: {
        Args: {
          message_text?: string
          producer_profile_id: string
          product_id_param: string
        }
        Returns: Json
      }
      crediter_utilisateur: {
        Args: {
          abonnement_id_param: string
          reference_paiement_param?: string
          user_profile_id: string
        }
        Returns: string
      }
      deduct_credits_for_contact: {
        Args: {
          buyer_profile_id: string
          producer_profile_id: string
          product_id: string
        }
        Returns: string
      }
      delete_user_account: {
        Args: { profile_id: string }
        Returns: string
      }
      get_interested_buyers: {
        Args: { producer_user_id: string }
        Returns: {
          buyer_nom: string
          buyer_prenom: string
          interaction_date: string
        }[]
      }
      get_producer_contact_info: {
        Args: { producer_profile_id: string; product_id: string }
        Returns: {
          nom: string
          prenom: string
          whatsapp: string
        }[]
      }
      get_public_producer_info: {
        Args: { producer_profile_id: string }
        Returns: {
          id: string
          nom: string
          pays: string
          prenom: string
          region: string
          verified: boolean
        }[]
      }
      get_public_producer_info_for_product: {
        Args: { product_id_param: string }
        Returns: {
          id: string
          nom: string
          pays: string
          prenom: string
          region: string
          type_activite: string
          verified: boolean
        }[]
      }
      get_user_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_user_credits: {
        Args: { credits_to_add: number; user_profile_id: string }
        Returns: undefined
      }
      promote_to_admin: {
        Args: { user_email: string }
        Returns: string
      }
      reject_contact_request: {
        Args: { request_id_param: string }
        Returns: Json
      }
      toggle_product_visibility: {
        Args: { product_id: string }
        Returns: string
      }
      toggle_user_suspension: {
        Args: { profile_id: string }
        Returns: string
      }
      verify_producer: {
        Args: { profile_id: string }
        Returns: string
      }
    }
    Enums: {
      product_status: "en_attente" | "approuve" | "rejete"
      subscription_plan: "gratuit" | "pro" | "premium" | "business"
      user_type: "producteur" | "acheteur" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      product_status: ["en_attente", "approuve", "rejete"],
      subscription_plan: ["gratuit", "pro", "premium", "business"],
      user_type: ["producteur", "acheteur", "admin"],
    },
  },
} as const
