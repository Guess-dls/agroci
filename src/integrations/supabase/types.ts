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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          created_at: string
          description: string | null
          duree_jours: number
          id: string
          nom: string
          prix: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duree_jours?: number
          id?: string
          nom: string
          prix?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duree_jours?: number
          id?: string
          nom?: string
          prix?: number
        }
        Relationships: []
      }
      categories_acheteurs: {
        Row: {
          created_at: string
          id: string
          nom: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
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
        }
        Insert: {
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          nom: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          buyer_id: string
          created_at: string
          deleted_by_buyer: boolean
          deleted_by_producer: boolean
          id: string
          message: string | null
          producer_id: string
          product_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          deleted_by_buyer?: boolean
          deleted_by_producer?: boolean
          id?: string
          message?: string | null
          producer_id: string
          product_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          deleted_by_buyer?: boolean
          deleted_by_producer?: boolean
          id?: string
          message?: string | null
          producer_id?: string
          product_id?: string
          status?: string
          updated_at?: string
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
      messages: {
        Row: {
          contact_request_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          contact_request_id: string
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          contact_request_id?: string
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_request_id_fkey"
            columns: ["contact_request_id"]
            isOneToOne: false
            referencedRelation: "contact_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_boosts: {
        Row: {
          amount_paid: number
          created_at: string
          end_date: string
          id: string
          producer_id: string
          product_id: string
          reference_paiement: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          end_date: string
          id?: string
          producer_id: string
          product_id: string
          reference_paiement?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          end_date?: string
          id?: string
          producer_id?: string
          product_id?: string
          reference_paiement?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_boosts_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_boosts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          product_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          viewed_at?: string
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
          boost_end_date: string | null
          categorie_id: string | null
          created_at: string
          description: string | null
          hidden: boolean
          id: string
          image_url: string | null
          images: string[] | null
          is_boosted: boolean
          localisation: string | null
          nom: string
          prix: number
          producteur_id: string
          quantite: string | null
          status: string
          updated_at: string
          views_count: number
          whatsapp_clicks: number
        }
        Insert: {
          acheteurs_cibles?: string[] | null
          boost_end_date?: string | null
          categorie_id?: string | null
          created_at?: string
          description?: string | null
          hidden?: boolean
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_boosted?: boolean
          localisation?: string | null
          nom: string
          prix?: number
          producteur_id: string
          quantite?: string | null
          status?: string
          updated_at?: string
          views_count?: number
          whatsapp_clicks?: number
        }
        Update: {
          acheteurs_cibles?: string[] | null
          boost_end_date?: string | null
          categorie_id?: string | null
          created_at?: string
          description?: string | null
          hidden?: boolean
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_boosted?: boolean
          localisation?: string | null
          nom?: string
          prix?: number
          producteur_id?: string
          quantite?: string | null
          status?: string
          updated_at?: string
          views_count?: number
          whatsapp_clicks?: number
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
          boost_payment_required: boolean
          created_at: string
          credits: number
          id: string
          nom: string
          pays: string | null
          prenom: string
          region: string | null
          subscription_active: boolean
          subscription_end_date: string | null
          subscription_required: boolean
          suspended: boolean
          type_activite: string | null
          updated_at: string
          user_id: string
          user_type: string
          verified: boolean
          whatsapp: string | null
        }
        Insert: {
          boost_payment_required?: boolean
          created_at?: string
          credits?: number
          id?: string
          nom?: string
          pays?: string | null
          prenom?: string
          region?: string | null
          subscription_active?: boolean
          subscription_end_date?: string | null
          subscription_required?: boolean
          suspended?: boolean
          type_activite?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
          verified?: boolean
          whatsapp?: string | null
        }
        Update: {
          boost_payment_required?: boolean
          created_at?: string
          credits?: number
          id?: string
          nom?: string
          pays?: string | null
          prenom?: string
          region?: string | null
          subscription_active?: boolean
          subscription_end_date?: string | null
          subscription_required?: boolean
          suspended?: boolean
          type_activite?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          verified?: boolean
          whatsapp?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          nom: string | null
          plan: string | null
          start_date: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          nom?: string | null
          plan?: string | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          nom?: string | null
          plan?: string | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
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
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
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
          clicked_at: string
          clicker_id: string | null
          id: string
          product_id: string
        }
        Insert: {
          clicked_at?: string
          clicker_id?: string | null
          id?: string
          product_id: string
        }
        Update: {
          clicked_at?: string
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
        Returns: undefined
      }
      activate_product_boost: {
        Args: {
          p_producer_id: string
          p_product_id: string
          p_reference?: string
        }
        Returns: string
      }
      admin_toggle_boost_global: {
        Args: { new_value: boolean }
        Returns: string
      }
      admin_toggle_boost_user: {
        Args: { target_profile_id: string }
        Returns: string
      }
      admin_toggle_subscription_global: {
        Args: { new_value: boolean }
        Returns: string
      }
      admin_toggle_subscription_user: {
        Args: { target_profile_id: string }
        Returns: string
      }
      create_contact_request: {
        Args: {
          message_text: string
          producer_profile_id: string
          product_id_param: string
        }
        Returns: undefined
      }
      delete_conversation: {
        Args: { contact_request_id_param: string }
        Returns: undefined
      }
      delete_user_account: { Args: { profile_id: string }; Returns: string }
      get_public_producer_info_for_product: {
        Args: { product_id_param: string }
        Returns: {
          id: string
          nom: string
          prenom: string
        }[]
      }
      get_user_emails_for_admin: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      reject_contact_request: {
        Args: { request_id_param: string }
        Returns: undefined
      }
      send_message: {
        Args: { contact_request_id_param: string; content_param: string }
        Returns: undefined
      }
      toggle_product_visibility: {
        Args: { product_id: string }
        Returns: string
      }
      toggle_user_suspension: { Args: { profile_id: string }; Returns: string }
      verify_producer: { Args: { profile_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
