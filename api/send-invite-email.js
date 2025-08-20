// API route para enviar e-mails de convite
// /api/send-invite-email

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  try {
    const { to, subject, html } = req.body

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: to, subject, html' 
      })
    }

    console.log('📧 Enviando e-mail para:', to)

    // Opção 1: Usar Resend.com (recomendado)
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FinFlow Pro <noreply@finflowpro.com>',
          to: to,
          subject: subject,
          html: html
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Resend API error: ${error}`)
      }

      const result = await response.json()
      console.log('✅ E-mail enviado via Resend:', result.id)
      
      return res.status(200).json({ 
        success: true, 
        message: 'E-mail enviado com sucesso',
        id: result.id
      })
    }

    // Opção 2: Usar SendGrid
    else if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      const msg = {
        to: to,
        from: 'noreply@finflowpro.com',
        subject: subject,
        html: html
      }

      await sgMail.send(msg)
      console.log('✅ E-mail enviado via SendGrid')
      
      return res.status(200).json({ 
        success: true, 
        message: 'E-mail enviado com sucesso'
      })
    }

    // Opção 3: Usar Nodemailer com Gmail
    else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      const nodemailer = require('nodemailer')

      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      })

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: to,
        subject: subject,
        html: html
      }

      await transporter.sendMail(mailOptions)
      console.log('✅ E-mail enviado via Gmail')
      
      return res.status(200).json({ 
        success: true, 
        message: 'E-mail enviado com sucesso'
      })
    }

    // Opção 4: Usar Supabase Edge Functions (se configurado)
    else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = require('@supabase/supabase-js')
      
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html }
      })

      if (error) {
        throw error
      }

      console.log('✅ E-mail enviado via Supabase Edge Function')
      
      return res.status(200).json({ 
        success: true, 
        message: 'E-mail enviado com sucesso'
      })
    }

    // Fallback: Simular envio (para desenvolvimento)
    else {
      console.log('⚠️ Nenhum serviço de e-mail configurado. Simulando envio...')
      console.log('📧 E-mail simulado:')
      console.log('   Para:', to)
      console.log('   Assunto:', subject)
      console.log('   Conteúdo:', html.substring(0, 200) + '...')
      
      // Em desenvolvimento, retornar sucesso simulado
      return res.status(200).json({ 
        success: true, 
        message: 'E-mail simulado (nenhum serviço configurado)',
        simulated: true
      })
    }

  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error)
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor'
    })
  }
}
