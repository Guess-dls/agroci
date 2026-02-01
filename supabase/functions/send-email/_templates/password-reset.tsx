import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  resetUrl: string
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Réinitialisez votre mot de passe AgroCi</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={logo}>🌾 AgroCi</Heading>
        </Section>
        
        <Section style={content}>
          <Heading style={h1}>Réinitialiser votre mot de passe</Heading>
          
          <Text style={text}>
            Vous avez récemment demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Réinitialiser le mot de passe
            </Button>
          </Section>
          
          <Text style={textMuted}>
            Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email en toute sécurité.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © 2024 AgroCi - La marketplace agricole de Côte d'Ivoire
          </Text>
          <Text style={footerText}>
            Connecter producteurs et acheteurs pour une agriculture prospère
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginBottom: '64px',
  borderRadius: '8px',
  overflow: 'hidden',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#16a34a',
  padding: '32px 48px',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  padding: '48px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const textMuted = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const footer = {
  backgroundColor: '#f9fafb',
  padding: '24px 48px',
  borderTop: '1px solid #e5e7eb',
}

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
}
