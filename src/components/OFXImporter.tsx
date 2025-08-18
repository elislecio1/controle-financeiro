import React, { useState, useRef } from 'react';
import { ofxService, OFXData, ImportResult } from '../services/ofxService';
import { supabaseService } from '../services/supabase';

interface OFXImporterProps {
  onImportComplete?: (result: ImportResult) => void;
}

export const OFXImporter: React.FC<OFXImporterProps> = ({ onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<OFXData | null>(null);
  const [selectedConta, setSelectedConta] = useState<string>('');
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'select' | 'preview' | 'import' | 'complete'>('select');
  
  // Estados para edição
  const [editingTransactions, setEditingTransactions] = useState<{ [key: number]: string }>({});
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [batchEditDescription, setBatchEditDescription] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar contas bancárias
  React.useEffect(() => {
    loadContasBancarias();
  }, []);

  const loadContasBancarias = async () => {
    try {
      const contas = await supabaseService.getContas();
      setContasBancarias(contas);
      if (contas.length > 0) {
        setSelectedConta(contas[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    const validation = ofxService.validateOFXFile(file);
    if (!validation.valid) {
      alert(`Erro na validação: ${validation.errors.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);

    try {
      // Parsear arquivo OFX
      const ofxData = await ofxService.parseOFXFile(file);
      setPreviewData(ofxData);
      setStep('preview');
    } catch (error) {
      console.error('Erro ao processar arquivo OFX:', error);
      alert(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || !selectedConta) {
      alert('Selecione uma conta bancária para importar');
      return;
    }

    setIsLoading(true);
    setStep('import');

    try {
      // Aplicar as edições de descrição antes da importação
      const modifiedData = {
        ...previewData,
        transactions: previewData.transactions.map((transaction, index) => ({
          ...transaction,
          memo: getFinalDescription(index, transaction.memo || transaction.name || ''),
          name: getFinalDescription(index, transaction.memo || transaction.name || '')
        }))
      };

      const result = await ofxService.importOFXTransactions(modifiedData, selectedConta);
      setImportResult(result);
      setStep('complete');
      
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      alert(`Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setStep('select');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Funções de edição
  const handleEditDescription = (index: number, description: string) => {
    setEditingTransactions(prev => ({
      ...prev,
      [index]: description
    }));
  };

  const handleSelectTransaction = (index: number) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (previewData) {
      const allIndices = Array.from({ length: previewData.transactions.length }, (_, i) => i);
      setSelectedTransactions(new Set(allIndices));
    }
  };

  const handleDeselectAll = () => {
    setSelectedTransactions(new Set());
  };

  const handleBatchEdit = () => {
    if (selectedTransactions.size === 0 || !batchEditDescription.trim()) return;
    
    const newEditingTransactions = { ...editingTransactions };
    selectedTransactions.forEach(index => {
      newEditingTransactions[index] = batchEditDescription;
    });
    setEditingTransactions(newEditingTransactions);
    setBatchEditDescription('');
  };

  const getFinalDescription = (index: number, originalDescription: string) => {
    return editingTransactions[index] || originalDescription;
  };

  if (step === 'select') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📁 Importar Arquivo OFX</h2>
          <p className="text-gray-600">Selecione um arquivo OFX para importar transações bancárias</p>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🔄 Sistema de Conciliação Inteligente</h3>
            <p className="text-sm text-blue-700">
              O sistema verifica automaticamente se as transações já existem, evitando duplicações e 
              atualizando o banco quando necessário. Transações similares são identificadas por valor, 
              data e descrição.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ofx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading}
          />
          
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Processando...' : 'Selecionar Arquivo OFX'}
          </button>
          
          <p className="mt-2 text-sm text-gray-500">
            Suporte para arquivos .ofx até 10MB
          </p>
        </div>
      </div>
    );
  }

  if (step === 'preview' && previewData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📊 Prévia da Importação</h2>
          <button
            onClick={resetImport}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕ Cancelar
          </button>
        </div>

        {/* Informações da Conta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🏦 Conta Bancária</h3>
            <p className="text-sm text-blue-600">
              Banco: {previewData.account.bankId}<br/>
              Conta: {previewData.account.accountId}<br/>
              Tipo: {previewData.account.accountType}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">💰 Saldo</h3>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(previewData.balance.balanceAmount)}
            </p>
            <p className="text-sm text-green-600">
              Data: {previewData.balance.dateAsOf}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">📈 Transações</h3>
            <p className="text-lg font-bold text-purple-600">
              {previewData.transactions.length}
            </p>
            <p className="text-sm text-purple-600">
              Período: {previewData.startDate} - {previewData.endDate}
            </p>
          </div>
        </div>

        {/* Seleção da Conta */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione a conta para importar:
          </label>
          <select
            value={selectedConta}
            onChange={(e) => setSelectedConta(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {contasBancarias.map(conta => (
              <option key={conta.id} value={conta.id}>
                {conta.nome} - {conta.banco}
              </option>
            ))}
          </select>
        </div>

        {/* Prévia das Transações */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">📋 Prévia das Transações</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  isEditing 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isEditing ? '✕ Cancelar Edição' : '✏️ Editar Descrições'}
              </button>
            </div>
          </div>

          {/* Controles de Edição em Lote */}
          {isEditing && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4 mb-3">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Selecionar Todas
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Desmarcar Todas
                </button>
                <span className="text-sm text-gray-600">
                  {selectedTransactions.size} selecionada(s)
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={batchEditDescription}
                  onChange={(e) => setBatchEditDescription(e.target.value)}
                  placeholder="Nova descrição para todas as selecionadas..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleBatchEdit}
                  disabled={selectedTransactions.size === 0 || !batchEditDescription.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {isEditing && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.size === previewData.transactions.length}
                        onChange={() => selectedTransactions.size === previewData.transactions.length ? handleDeselectAll() : handleSelectAll()}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.transactions.slice(0, 10).map((transaction, index) => (
                  <tr key={index} className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                    {isEditing && (
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(index)}
                          onChange={() => handleSelectTransaction(index)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 text-sm text-gray-900">{transaction.datePosted}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTransactions[index] || transaction.memo || transaction.name || 'Transação OFX'}
                          onChange={(e) => handleEditDescription(index, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        getFinalDescription(index, transaction.memo || transaction.name || 'Transação OFX')
                      )}
                    </td>
                    <td className={`px-3 py-2 text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.amount > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.amount > 0 ? 'Crédito' : 'Débito'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.transactions.length > 10 && (
              <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                ... e mais {previewData.transactions.length - 10} transações
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={resetImport}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading || !selectedConta}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? 'Importando...' : 'Importar Transações'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'import') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">📥 Importando Transações</h2>
        <p className="text-gray-600">Aguarde enquanto processamos o arquivo OFX...</p>
      </div>
    );
  }

  if (step === 'complete' && importResult) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            importResult.success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {importResult.success ? (
              <span className="text-2xl">✅</span>
            ) : (
              <span className="text-2xl">❌</span>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {importResult.success ? 'Importação Concluída!' : 'Erro na Importação'}
          </h2>
          
          <p className={`text-lg ${
            importResult.success ? 'text-green-600' : 'text-red-600'
          }`}>
            {importResult.message}
          </p>
        </div>

        {/* Resultado Detalhado */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{importResult.importedCount}</div>
            <div className="text-sm text-blue-600">Novas Importadas</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{importResult.updatedCount || 0}</div>
            <div className="text-sm text-green-600">Atualizadas</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{importResult.skippedCount || 0}</div>
            <div className="text-sm text-yellow-600">Puladas</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{importResult.errorCount}</div>
            <div className="text-sm text-red-600">Erros</div>
          </div>
        </div>

        {/* Erros (se houver) */}
        {importResult.errors.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-red-800 mb-2">❌ Erros Encontrados:</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="text-sm text-red-700 space-y-1">
                {importResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={resetImport}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Importar Outro Arquivo
          </button>
        </div>
      </div>
    );
  }

  return null;
};
