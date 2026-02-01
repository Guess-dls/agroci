import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'
import { SignupConfirmationEmail } from './_templates/signup-confirmation.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  
  try {
    const wh = new Webhook(hookSecret)
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
        user_metadata?: {
          prenom?: string
          nom?: string
        }
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
        token_new: string
        token_hash_new: string
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const userName = user.user_metadata?.prenom || undefined

    let html: string
    let subject: string

    // Determine which email template to use based on the action type
    if (email_action_type === 'recovery' || email_action_type === 'reset_password') {
      // Password reset email
      const resetUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
      
      html = await renderAsync(
        React.createElement(PasswordResetEmail, { resetUrl })
      )
      subject = 'Réinitialisation de votre mot de passe AgroCi'
      
    } else if (email_action_type === 'signup' || email_action_type === 'email_confirmation') {
      // Signup confirmation email
      const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
      
      html = await renderAsync(
        React.createElement(SignupConfirmationEmail, { confirmUrl, userName })
      )
      subject = 'Confirmez votre inscription sur AgroCi'
      
    } else if (email_action_type === 'magiclink') {
      // Magic link email (using password reset template style)
      const magicLinkUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
      
      html = await renderAsync(
        React.createElement(PasswordResetEmail, { resetUrl: magicLinkUrl })
      )
      subject = 'Votre lien de connexion AgroCi'
      
    } else {
      // Default fallback
      const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
      
      html = await renderAsync(
        React.createElement(PasswordResetEmail, { resetUrl: verifyUrl })
      )
      subject = 'Notification AgroCi'
    }

    console.log(`Sending ${email_action_type} email to ${user.email}`)

    const { error } = await resend.emails.send({
      from: 'AgroCi <noreply@votre-domaine.com>', // Remplacez par votre domaine vérifié
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    console.log(`Email sent successfully to ${user.email}`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || 'Unknown error',
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})
