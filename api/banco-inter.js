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
    const { method, endpoint, credentials, data } = req.body;

    // Validar dados necessários
    if (!endpoint || !credentials) {
      return res.status(400).json({ 
        error: 'Endpoint e credenciais são obrigatórios' 
      });
    }

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
    if (req.body.headers) {
      Object.assign(headers, req.body.headers);
    }

    // Fazer requisição para a API do Banco Inter
    const response = await fetch(endpoint, {
      method: method || 'POST',
      headers,
      body: data ? new URLSearchParams(data) : undefined,
    });

    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API do Banco Inter:', response.status, errorText);
      
      return res.status(response.status).json({
        error: `Erro na API do Banco Inter: ${response.status}`,
        details: errorText
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
      details: error.message
    });
  }
}
