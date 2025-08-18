// API Route para Banco Inter - Proxy para contornar CORS
export default async function handler(req, res) {
  // Configurar CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-API-Secret');

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔍 API Route recebeu requisição:', req.method);
    console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2));

    const { method, endpoint, credentials, data, headers: customHeaders } = req.body;

    // Validar dados necessários
    if (!endpoint) {
      console.error('❌ Endpoint não fornecido');
      return res.status(400).json({ 
        error: 'Endpoint é obrigatório',
        received: { endpoint, hasCredentials: !!credentials }
      });
    }

    if (!credentials) {
      console.error('❌ Credenciais não fornecidas');
      return res.status(400).json({ 
        error: 'Credenciais são obrigatórias',
        received: { endpoint, hasCredentials: false }
      });
    }

    console.log('🔑 Credenciais recebidas:', {
      hasApiKey: !!credentials.apiKey,
      hasApiSecret: !!credentials.apiSecret
    });

    // Configurar headers para a API do Banco Inter
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Adicionar credenciais se fornecidas
    if (credentials.apiKey) {
      headers['X-API-Key'] = credentials.apiKey;
    }
    if (credentials.apiSecret) {
      headers['X-API-Secret'] = credentials.apiSecret;
    }

    // Adicionar headers customizados se fornecidos
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    console.log('🌐 Fazendo requisição para:', endpoint);
    console.log('📋 Headers:', headers);
    console.log('📦 Data:', data);

    // Fazer requisição para a API do Banco Inter
    const response = await fetch(endpoint, {
      method: method || 'POST',
      headers,
      body: data ? new URLSearchParams(data) : undefined,
    });

    console.log('📡 Resposta da API:', response.status, response.statusText);

    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API do Banco Inter:', response.status, errorText);
      
      return res.status(response.status).json({
        error: `Erro na API do Banco Inter: ${response.status}`,
        details: errorText,
        endpoint,
        method: method || 'POST'
      });
    }

    // Retornar dados da API
    const result = await response.json();
    
    console.log('✅ Requisição para Banco Inter bem-sucedida');
    
    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erro no proxy da API:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    });
  }
}
