import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Database, 
  FileText, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  RefreshCw,
  TestTube,
  Download,
  Upload,
  Shield,
  Key,
  Globe,
  Zap
} from 'lucide-react';
import { integracoesService } from '../services/integracoes';
import { 
  IntegracaoBancaria, 
  IntegracaoConfig, 
  LogSincronizacao, 
  TransacaoImportada,
  BancoInfo 
} from '../types';

export default function IntegracoesBancarias() {
  const [activeTab, setActiveTab] = useState<'integracoes' | 'logs' | 'conciliacao'>('integracoes');
  const [integracoes, setIntegracoes] = useState<IntegracaoBancaria[]>([]);
  const [bancos, setBancos] = useState<BancoInfo[]>([]);
  const [logs, setLogs] = useState<LogSincronizacao[]>([]);
  const [transacoesImportadas, setTransacoesImportadas] = useState<TransacaoImportada[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Estado do formulário
  const [formData, setFormData] = useState<Partial<IntegracaoBancaria>>({
    nome: '',
    banco: '',
    tipoIntegracao: 'api_oficial' as const,
    status: 'inativo' as const,
    configuracao: {
      nomeInstituicao: '',
      ambiente: 'homologacao' as const
    },
    frequenciaSincronizacao: 24,
    ativo: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integracoesData, bancosData, logsData, transacoesData] = await Promise.all([
        integracoesService.getIntegracoes(),
        Promise.resolve(integracoesService.getBancosBrasileiros()),
        integracoesService.getLogsSincronizacao(),
        integracoesService.getTransacoesImportadas()
      ]);

      console.log('Bancos carregados:', bancosData); // Debug
      console.log('Banco Inter encontrado:', bancosData.find(b => b.codigo === '077')); // Debug

      setIntegracoes(integracoesData);
      setBancos(bancosData);
      setLogs(logsData);
      setTransacoesImportadas(transacoesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Garantir que os campos obrigatórios estejam preenchidos
      const integracaoData = {
        ...formData,
        configuracao: {
          nomeInstituicao: formData.configuracao?.nomeInstituicao || '',
          ambiente: (formData.configuracao?.ambiente || 'homologacao') as 'producao' | 'homologacao' | 'desenvolvimento',
          apiKey: formData.configuracao?.apiKey,
          apiSecret: formData.configuracao?.apiSecret,
          clientId: formData.configuracao?.clientId,
          clientSecret: formData.configuracao?.clientSecret,
          baseUrl: formData.configuracao?.baseUrl,
          timeout: formData.configuracao?.timeout,
          webhookUrl: formData.configuracao?.webhookUrl,
          webhookSecret: formData.configuracao?.webhookSecret,
          formatoArquivo: formData.configuracao?.formatoArquivo,
          separador: formData.configuracao?.separador,
          tipoCertificado: formData.configuracao?.tipoCertificado,
          senhaCertificado: formData.configuracao?.senhaCertificado,
          certificadoArquivo: formData.configuracao?.certificadoArquivo,
          chavePrivadaArquivo: formData.configuracao?.chavePrivadaArquivo
        }
      };
      
      if (editingId) {
        await integracoesService.atualizarIntegracao(editingId, integracaoData);
        setMessage('Integração atualizada com sucesso!');
      } else {
        await integracoesService.salvarIntegracao(integracaoData);
        setMessage('Integração criada com sucesso!');
      }
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
      setMessage('Erro ao salvar integração');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (integracao: IntegracaoBancaria) => {
    setFormData({
      nome: integracao.nome,
      banco: integracao.banco,
      tipoIntegracao: integracao.tipoIntegracao,
      status: integracao.status,
      configuracao: integracao.configuracao,
      frequenciaSincronizacao: integracao.frequenciaSincronizacao,
      ativo: integracao.ativo
    });
    setEditingId(integracao.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta integração?')) {
      try {
        await integracoesService.deletarIntegracao(id);
        setMessage('Integração excluída com sucesso!');
        loadData();
      } catch (error) {
        console.error('Erro ao excluir integração:', error);
        setMessage('Erro ao excluir integração');
      }
    }
  };

  const handleToggleStatus = async (id: string, ativo: boolean) => {
    try {
      if (ativo) {
        await integracoesService.desativarIntegracao(id);
      } else {
        await integracoesService.ativarIntegracao(id);
      }
      loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setMessage('Erro ao alterar status');
    }
  };

  const handleSincronizar = async (id: string) => {
    try {
      setLoading(true);
      const resultado = await integracoesService.sincronizarIntegracao(id);
      setMessage(`Sincronização concluída: ${resultado.transacoesImportadas} transações importadas`);
      loadData();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setMessage('Erro na sincronização');
    } finally {
      setLoading(false);
    }
  };

  const handleTestarConexao = async (integracao: IntegracaoBancaria) => {
    try {
      setLoading(true);
      const sucesso = await integracoesService.testarConexaoBanco(integracao);
      setMessage(sucesso ? 'Conexão testada com sucesso!' : 'Falha na conexão');
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      setMessage('Erro no teste de conexão');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      banco: '',
      tipoIntegracao: 'api_oficial' as const,
      status: 'inativo' as const,
      configuracao: {
        nomeInstituicao: '',
        ambiente: 'homologacao' as const
      },
      frequenciaSincronizacao: 24,
      ativo: false
    });
  };

  const getBancoInfo = (codigo: string) => {
    return bancos.find(banco => banco.codigo === codigo);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'text-green-600 bg-green-100';
      case 'inativo': return 'text-gray-600 bg-gray-100';
      case 'erro': return 'text-red-600 bg-red-100';
      case 'sincronizando': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTipoIntegracaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'api_oficial': return <Database className="w-4 h-4" />;
      case 'open_banking': return <Globe className="w-4 h-4" />;
      case 'webhook': return <Zap className="w-4 h-4" />;
      case 'arquivo_csv': return <FileText className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const renderFormularioIntegracao = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingId ? 'Editar Integração' : 'Nova Integração Bancária'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome da Integração */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Integração
            </label>
            <input
              type="text"
              value={formData.nome || ''}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Integração Inter Empresas"
              required
            />
          </div>

          {/* Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco
            </label>
            <select
              value={formData.banco || ''}
              onChange={(e) => {
                const banco = bancos.find(b => b.codigo === e.target.value);
                setFormData({
                  ...formData, 
                  banco: e.target.value,
                  configuracao: {
                    ...formData.configuracao,
                    nomeInstituicao: banco?.nome || ''
                  }
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um banco</option>
              {bancos.map(banco => (
                <option 
                  key={banco.codigo} 
                  value={banco.codigo}
                  className={banco.codigo === '077' ? 'font-bold text-blue-600' : ''}
                >
                  {banco.codigo} - {banco.nome}
                  {banco.codigo === '077' ? ' (Recomendado)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Banco Inter (077) é nossa integração principal com suporte completo
            </p>
          </div>

          {/* Tipo de Integração */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Integração
            </label>
            <select
              value={formData.tipoIntegracao || 'api_oficial'}
              onChange={(e) => setFormData({
                ...formData, 
                tipoIntegracao: e.target.value as 'api_oficial' | 'open_banking' | 'webhook' | 'arquivo_csv'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="api_oficial">API Oficial</option>
              <option value="open_banking">Open Banking</option>
              <option value="webhook">Webhook</option>
              <option value="arquivo_csv">Arquivo CSV</option>
            </select>
          </div>

          {/* Ambiente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ambiente
            </label>
            <select
              value={formData.configuracao?.ambiente || 'homologacao'}
              onChange={(e) => setFormData({
                ...formData,
                configuracao: {
                  ...formData.configuracao,
                  ambiente: e.target.value as 'producao' | 'homologacao' | 'desenvolvimento'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="homologacao">Homologação</option>
              <option value="producao">Produção</option>
              <option value="desenvolvimento">Desenvolvimento</option>
            </select>
          </div>

          {/* Frequência de Sincronização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequência de Sincronização (horas)
            </label>
            <input
              type="number"
              value={formData.frequenciaSincronizacao || 24}
              onChange={(e) => setFormData({...formData, frequenciaSincronizacao: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="168"
              required
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo || false}
              onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
              Integração Ativa
            </label>
          </div>
        </div>

        {/* Campos específicos por tipo de integração */}
        {formData.tipoIntegracao === 'api_oficial' && (
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-700 mb-3">Configurações da API</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.configuracao?.apiKey || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      apiKey: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sua API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Secret
                </label>
                <input
                  type="password"
                  value={formData.configuracao?.apiSecret || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      apiSecret: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu API Secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL
                </label>
                <input
                  type="url"
                  value={formData.configuracao?.baseUrl || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      baseUrl: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.banco.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.configuracao?.timeout || 30000}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      timeout: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1000"
                  max="120000"
                />
              </div>
            </div>

            {/* Seção específica para certificados digitais */}
            <div className="mt-6 border-t pt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Certificado Digital (Obrigatório para Banco Inter)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Certificado
                  </label>
                  <select
                    value={formData.configuracao?.tipoCertificado || 'pfx'}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuracao: {
                        ...formData.configuracao,
                        tipoCertificado: e.target.value as 'pfx' | 'pem' | 'p12' | 'crt'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pfx">PFX/P12 (Recomendado)</option>
                    <option value="pem">PEM</option>
                    <option value="p12">P12</option>
                    <option value="crt">CRT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha do Certificado
                  </label>
                  <input
                    type="password"
                    value={formData.configuracao?.senhaCertificado || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuracao: {
                        ...formData.configuracao,
                        senhaCertificado: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Senha do certificado (se houver)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificado Digital (.pfx, .p12, .pem, .crt)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="certificado-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Fazer upload do certificado</span>
                          <input
                            id="certificado-upload"
                            name="certificado-upload"
                            type="file"
                            accept=".pfx,.p12,.pem,.crt"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData({
                                  ...formData,
                                  configuracao: {
                                    ...formData.configuracao,
                                    certificadoArquivo: file
                                  }
                                });
                              }
                            }}
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PFX, P12, PEM ou CRT até 10MB
                      </p>
                      {formData.configuracao?.certificadoArquivo && (
                        <p className="text-sm text-green-600">
                          ✓ Certificado selecionado: {(formData.configuracao.certificadoArquivo as File).name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave Privada (se separada do certificado)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="chave-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Fazer upload da chave privada</span>
                          <input
                            id="chave-upload"
                            name="chave-upload"
                            type="file"
                            accept=".key,.pem"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData({
                                  ...formData,
                                  configuracao: {
                                    ...formData.configuracao,
                                    chavePrivadaArquivo: file
                                  }
                                });
                              }
                            }}
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        KEY ou PEM até 10MB (opcional)
                      </p>
                      {formData.configuracao?.chavePrivadaArquivo && (
                        <p className="text-sm text-green-600">
                          ✓ Chave privada selecionada: {(formData.configuracao.chavePrivadaArquivo as File).name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Informações sobre certificados */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Sobre Certificados Digitais
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>• O Banco Inter utiliza certificados digitais para autenticação segura</p>
                      <p>• Baixe o certificado no portal do desenvolvedor do Inter</p>
                      <p>• Formatos aceitos: PFX, P12, PEM, CRT</p>
                      <p>• Mantenha a senha do certificado em local seguro</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.tipoIntegracao === 'open_banking' && (
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-700 mb-3">Configurações Open Banking</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={formData.configuracao?.clientId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      clientId: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu Client ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={formData.configuracao?.clientSecret || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      clientSecret: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu Client Secret"
                />
              </div>
            </div>
          </div>
        )}

        {formData.tipoIntegracao === 'webhook' && (
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-700 mb-3">Configurações Webhook</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Webhook
                </label>
                <input
                  type="url"
                  value={formData.configuracao?.webhookUrl || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      webhookUrl: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://seu-dominio.com/webhook"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret do Webhook
                </label>
                <input
                  type="password"
                  value={formData.configuracao?.webhookSecret || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      webhookSecret: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Secret para validação"
                />
              </div>
            </div>
          </div>
        )}

        {formData.tipoIntegracao === 'arquivo_csv' && (
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-700 mb-3">Configurações de Arquivo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato do Arquivo
                </label>
                <select
                  value={formData.configuracao?.formatoArquivo || 'csv'}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      formatoArquivo: e.target.value as 'csv' | 'ofx' | 'qif'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="csv">CSV</option>
                  <option value="ofx">OFX</option>
                  <option value="qif">QIF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Separador
                </label>
                <input
                  type="text"
                  value={formData.configuracao?.separador || ','}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuracao: {
                      ...formData.configuracao,
                      separador: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder=","
                />
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
              resetForm();
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Criar')}
          </button>
        </div>
      </form>
    </div>
  );

  const renderIntegracoes = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Integrações Bancárias</h3>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Integração</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Integração
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Banco
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Sincronização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {integracoes.map((integracao) => {
              const bancoInfo = getBancoInfo(integracao.banco);
              return (
                <tr key={integracao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{integracao.nome}</div>
                      <div className="text-sm text-gray-500">{integracao.configuracao?.ambiente}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{bancoInfo?.nome}</div>
                      {bancoInfo?.documentacao && (
                        <a
                          href={bancoInfo.documentacao}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTipoIntegracaoIcon(integracao.tipoIntegracao)}
                      <span className="text-sm text-gray-900 capitalize">
                        {integracao.tipoIntegracao.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(integracao.status)}`}>
                      {integracao.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {integracao.ultimaSincronizacao 
                      ? new Date(integracao.ultimaSincronizacao).toLocaleString('pt-BR')
                      : 'Nunca'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleStatus(integracao.id, integracao.ativo)}
                        className={`p-1 rounded ${integracao.ativo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                        title={integracao.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {integracao.ativo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleTestarConexao(integracao)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        title="Testar Conexão"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleSincronizar(integracao.id)}
                        className="text-green-600 hover:text-green-800 p-1 rounded"
                        title="Sincronizar"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEdit(integracao)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(integracao.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Logs de Sincronização</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Integração
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transações
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tempo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {integracoes.find(i => i.id === log.integracaoId)?.nome || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {log.tipoOperacao}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    log.status === 'sucesso' ? 'text-green-600 bg-green-100' :
                    log.status === 'erro' ? 'text-red-600 bg-red-100' :
                    'text-yellow-600 bg-yellow-100'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.transacoesImportadas} importadas, {log.transacoesAtualizadas} atualizadas
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.tempoExecucaoMs ? `${log.tempoExecucaoMs}ms` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConciliacao = () => (
    <div className="space-y-6">
      {/* Conciliação Automática */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Conciliação Automática</h3>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const conciliadas = await integracoesService.executarConciliacaoAutomatica();
                setMessage(`${conciliadas} transações conciliadas automaticamente`);
                loadData();
              } catch (error) {
                console.error('Erro na conciliação automática:', error);
                setMessage('Erro na conciliação automática');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Executando...' : 'Executar Conciliação Automática'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Execute a conciliação automática para tentar relacionar transações importadas com transações do sistema.
        </p>
      </div>

      {/* Transações Importadas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transações Importadas</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transacoesImportadas.map((transacao) => (
                <tr key={transacao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transacao.dataTransacao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transacao.descricao}</div>
                    <div className="text-sm text-gray-500">{transacao.categoriaBanco}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(transacao.valor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transacao.statusConciliacao === 'conciliada' ? 'text-green-600 bg-green-100' :
                      transacao.statusConciliacao === 'ignorada' ? 'text-red-600 bg-red-100' :
                      'text-yellow-600 bg-yellow-100'
                    }`}>
                      {transacao.statusConciliacao}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {transacao.statusConciliacao === 'pendente' && (
                        <>
                          <button
                            onClick={() => {
                              // Implementar conciliação manual
                              setMessage('Funcionalidade de conciliação manual em desenvolvimento');
                            }}
                            className="text-green-600 hover:text-green-800 p-1 rounded"
                            title="Conciliar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              // Implementar ignorar transação
                              setMessage('Funcionalidade de ignorar transação em desenvolvimento');
                            }}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Ignorar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrações Bancárias</h1>
            <p className="text-gray-600">
              Conecte-se com bancos e instituições financeiras para sincronizar transações automaticamente
            </p>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('sucesso') || message.includes('concluída') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
          <button
            onClick={() => setMessage('')}
            className="float-right text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulário */}
      {showForm && renderFormularioIntegracao()}

      {/* Navegação por Abas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'integracoes', name: 'Integrações', icon: Database },
              { id: 'logs', name: 'Logs', icon: FileText },
              { id: 'conciliacao', name: 'Conciliação', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'integracoes' && renderIntegracoes()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'conciliacao' && renderConciliacao()}
        </div>
      </div>
    </div>
  );
}
