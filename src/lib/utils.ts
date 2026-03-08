import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Maps a Supabase/Postgres error to a user-friendly message
 * and logs the full technical details to the console.
 */
export function formatTransactionError(error: any, context: string): string {
  const code = error?.code || error?.statusCode || 'UNKNOWN';
  const rawMessage = error?.message || error?.error_description || String(error);

  // Log full technical details for debugging
  console.error(`[${context}] Code: ${code} | Détail: ${rawMessage}`, error);

  // Map known Postgres/Supabase error codes to friendly messages
  if (rawMessage?.includes('unique constraint') || code === '23505') {
    return "Cette opération a déjà été enregistrée. Veuillez rafraîchir la page et réessayer.";
  }
  if (rawMessage?.includes('check constraint') || code === '23514') {
    return "Les données envoyées ne respectent pas les règles du système. Contactez le support si le problème persiste.";
  }
  if (rawMessage?.includes('foreign key') || code === '23503') {
    return "Une référence vers un élément supprimé ou inexistant a été détectée. Rafraîchissez la page.";
  }
  if (rawMessage?.includes('permission denied') || rawMessage?.includes('Non autorisé') || code === '42501') {
    return "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
  }
  if (rawMessage?.includes('timeout') || rawMessage?.includes('statement canceled')) {
    return "Le serveur met trop de temps à répondre. Veuillez réessayer dans quelques instants.";
  }
  if (code === 'PGRST301' || rawMessage?.includes('JWT')) {
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }

  return "Une erreur inattendue s'est produite. Veuillez réessayer ou contacter le support.";
}
