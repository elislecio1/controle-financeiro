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

    // Opção 2: Usar SendGrid (compatível com Vercel)
    else if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'noreply@finflowpro.com', name: 'FinFlow Pro' },
          subject: subject,
          content: [{ type: 'text/html', value: html }]
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid API error: ${error}`)
      }

      console.log('✅ E-mail enviado via SendGrid')
      
      return res.status(200).json({ 
        success: true, 
        message: 'E-mail enviado com sucesso'
      })
    }

    // Opção 3: Usar Supabase Edge Functions (se configurado)
    else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, html })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Supabase Edge Function error: ${error}`)
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
