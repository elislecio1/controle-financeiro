import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export interface InviteData {
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  invited_by: string
  invited_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired'
  token: string
}

export class EmailService {
  // Enviar convite por e-mail
  static async sendInviteEmail(invite: InviteData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Enviando e-mail de convite para:', invite.email)
      
      // URL da aplicação
      const appUrl = window.location.origin
      const inviteUrl = `${appUrl}/auth/invite?token=${invite.token}`
      
      // Template do e-mail
      const emailTemplate = {
        to: invite.email,
        subject: 'Convite para acessar o FinFlow Pro',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Convite - FinFlow Pro</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 FinFlow Pro</h1>
                <p>Controle Financeiro Inteligente</p>
              </div>
              
              <div class="content">
                <h2>Olá ${invite.name}!</h2>
                
                <p>Você foi convidado para acessar o <strong>FinFlow Pro</strong>, nossa plataforma de controle financeiro.</p>
                
                <p><strong>Detalhes do convite:</strong></p>
                <ul>
                  <li><strong>Nome:</strong> ${invite.name}</li>
                  <li><strong>E-mail:</strong> ${invite.email}</li>
                  <li><strong>Função:</strong> ${invite.role === 'admin' ? 'Administrador' : invite.role === 'user' ? 'Usuário' : 'Visualizador'}</li>
                  <li><strong>Expira em:</strong> ${new Date(invite.expires_at).toLocaleDateString('pt-BR')}</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Aceitar Convite</a>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Importante:</strong>
                  <ul>
                    <li>Este convite expira em 7 dias</li>
                    <li>Mantenha este e-mail seguro</li>
                    <li>Se não solicitou este convite, ignore este e-mail</li>
                  </ul>
                </div>
                
                <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all; color: #667eea;">${inviteUrl}</p>
              </div>
              
              <div class="footer">
                <p>Este e-mail foi enviado automaticamente pelo FinFlow Pro</p>
                <p>© 2024 FinFlow Pro. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      }
      
      // Enviar e-mail usando a API do Supabase (Edge Functions)
      const response = await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailTemplate)
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao enviar e-mail: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ E-mail de convite enviado com sucesso')
        return { success: true }
      } else {
        throw new Error(result.error || 'Erro desconhecido ao enviar e-mail')
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar e-mail de convite:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao enviar e-mail de convite' 
      }
    }
  }
  
  // Enviar e-mail usando método alternativo (resend.com ou similar)
  static async sendInviteEmailAlternative(invite: InviteData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Enviando e-mail de convite (método alternativo) para:', invite.email)
      
      // URL da aplicação
      const appUrl = window.location.origin
      const inviteUrl = `${appUrl}/auth/invite?token=${invite.token}`
      
      // Usar Resend.com ou similar para envio de e-mails
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FinFlow Pro <noreply@finflowpro.com>',
          to: invite.email,
          subject: 'Convite para acessar o FinFlow Pro',
          html: `
            <h2>Olá ${invite.name}!</h2>
            <p>Você foi convidado para acessar o FinFlow Pro.</p>
            <p><a href="${inviteUrl}">Clique aqui para aceitar o convite</a></p>
            <p>Este convite expira em 7 dias.</p>
          `
        })
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao enviar e-mail: ${response.statusText}`)
      }
      
      console.log('✅ E-mail de convite enviado com sucesso')
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar e-mail de convite:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao enviar e-mail de convite' 
      }
    }
  }
  
  // Método de fallback - apenas salvar o convite no banco
  static async saveInviteOnly(invite: InviteData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💾 Salvando convite no banco de dados:', invite.email)
      
      const { data, error } = await supabase
        .from('user_invites')
        .insert([invite])
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      console.log('✅ Convite salvo com sucesso (ID:', data.id, ')')
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar convite:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao salvar convite' 
      }
    }
  }
}

export default EmailService
