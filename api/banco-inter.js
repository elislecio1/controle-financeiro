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

    // Para autenticação OAuth, usar Basic Auth com API Key e Secret
    if (credentials.apiKey && credentials.apiSecret) {
      const authString = `${credentials.apiKey}:${credentials.apiSecret}`;
      const authBase64 = Buffer.from(authString).toString('base64');
      headers['Authorization'] = `Basic ${authBase64}`;
      
      console.log('🔑 Basic Auth configurado:', {
        apiKey: credentials.apiKey ? 'Presente' : 'Ausente',
        apiSecret: credentials.apiSecret ? 'Presente' : 'Ausente',
        authString: `${credentials.apiKey}:${credentials.apiSecret}`,
        authBase64: authBase64
      });
    }

    // Adicionar headers customizados se fornecidos
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    console.log('🌐 Fazendo requisição para:', endpoint);
    console.log('📋 Headers:', JSON.stringify(headers, null, 2));
    console.log('📦 Data:', data);
    console.log('📦 Data como URLSearchParams:', data ? new URLSearchParams(data).toString() : 'undefined');

    // Fazer requisição para a API do Banco Inter
    const requestOptions = {
      method: method || 'POST',
      headers,
    };

    // Adicionar body apenas se houver dados
    if (data && Object.keys(data).length > 0) {
      requestOptions.body = new URLSearchParams(data);
    }

    console.log('🚀 Opções da requisição:', JSON.stringify(requestOptions, null, 2));

    const response = await fetch(endpoint, requestOptions);

    console.log('📡 Resposta da API:', response.status, response.statusText);

    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Erro ao ler resposta';
      }
      
      console.error('❌ Erro na API do Banco Inter:', response.status, errorText);
      console.error('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      return res.status(response.status).json({
        error: `Erro na API do Banco Inter: ${response.status}`,
        details: errorText,
        endpoint,
        method: method || 'POST',
        responseHeaders: Object.fromEntries(response.headers.entries())
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
