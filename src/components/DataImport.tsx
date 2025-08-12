import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Settings } from 'lucide-react';
import { supabaseService } from '../services/supabase';

interface ImportData {
  file: File | null;
  mapping: {
    vencimento: string;
    descricao: string;
    empresa: string;
    valor: string;
    parcela: string;
    situacao: string;
    dataPagamento: string;
  };
  preview: any[];
  isProcessing: boolean;
  message: { type: 'success' | 'error' | 'info'; text: string } | null;
}

const DataImport: React.FC = () => {
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    mapping: {
      vencimento: 'A',
      descricao: 'B',
      empresa: 'C',
      valor: 'E',
      parcela: 'F',
      situacao: 'G',
      dataPagamento: 'H'
    },
    preview: [],
    isProcessing: false,
    message: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapeamento padrão baseado na sua planilha
  const defaultMapping = {
    vencimento: 'A',
    descricao: 'B',
    empresa: 'C',
    valor: 'E',
    parcela: 'F',
    situacao: 'G',
    dataPagamento: 'H'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setImportData(prev => ({ ...prev, file }));
      processCSVFile(file);
    } else if (file) {
      setImportData(prev => ({
        ...prev,
        message: { type: 'error', text: 'Por favor, selecione um arquivo CSV válido' }
      }));
    }
  };

  const processCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1, 6); // Primeiras 5 linhas para preview
      
      const preview = dataRows.map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return {
          row: index + 2,
          vencimento: values[0] || '',
          descricao: values[1] || '',
          empresa: values[2] || '',
          valor: values[4] || '',
          parcela: values[5] || '',
          situacao: values[6] || '',
          dataPagamento: values[7] || ''
        };
      });

      setImportData(prev => ({ 
        ...prev, 
        preview,
        message: { type: 'info', text: `Arquivo carregado: ${file.name} (${lines.length - 1} linhas de dados)` }
      }));
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (field: string, value: string) => {
    setImportData(prev => ({
      ...prev,
      mapping: { ...prev.mapping, [field]: value }
    }));
  };

  const resetToDefaultMapping = () => {
    setImportData(prev => ({
      ...prev,
      mapping: defaultMapping
    }));
  };

  const processFullFile = async () => {
    if (!importData.file) return;

    setImportData(prev => ({ ...prev, isProcessing: true, message: null }));

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const dataRows = lines.slice(1); // Pular cabeçalho

        const transactions = [];
        let processedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < dataRows.length; i++) {
          const line = dataRows[i];
          if (!line.trim()) continue;

          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          
          try {
            const transaction = convertRowToTransaction(values, i);
            if (transaction) {
              transactions.push(transaction);
              processedCount++;
            }
          } catch (error) {
            errorCount++;
            console.error(`Erro na linha ${i + 2}:`, error);
          }
        }

        if (transactions.length > 0) {
          // Inserir no Supabase em lotes
          const batchSize = 50;
          let insertedCount = 0;

          for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            
            const { error } = await supabaseService.supabase
              .from('transactions')
              .insert(batch);

            if (error) {
              throw new Error(`Erro ao inserir lote ${Math.floor(i/batchSize) + 1}: ${error.message}`);
            }

            insertedCount += batch.length;
          }

          setImportData(prev => ({
            ...prev,
            isProcessing: false,
            message: {
              type: 'success',
              text: `Importação concluída! ${insertedCount} transações inseridas com sucesso. ${errorCount} linhas com erro.`
            }
          }));
        } else {
          throw new Error('Nenhuma transação válida encontrada para importar');
        }
      };

      reader.readAsText(importData.file);
    } catch (error) {
      setImportData(prev => ({
        ...prev,
        isProcessing: false,
        message: {
          type: 'error',
          text: `Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        }
      }));
    }
  };

  const convertRowToTransaction = (values: string[], index: number) => {
    const { mapping } = importData;
    
    // Obter valores baseado no mapeamento
    const vencimento = values[getColumnIndex(mapping.vencimento)];
    const descricao = values[getColumnIndex(mapping.descricao)];
    const empresa = values[getColumnIndex(mapping.empresa)];
    const valor = values[getColumnIndex(mapping.valor)];
    const parcela = values[getColumnIndex(mapping.parcela)];
    const situacao = values[getColumnIndex(mapping.situacao)];
    const dataPagamento = values[getColumnIndex(mapping.dataPagamento)];

    if (!vencimento || !descricao || !valor) {
      return null; // Linha inválida
    }

    // Converter data de vencimento (DD/MM/YYYY → YYYY-MM-DD)
    let dataVencimento = null;
    if (vencimento) {
      const [dia, mes, ano] = vencimento.split('/');
      if (dia && mes && ano) {
        dataVencimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    }

    // Converter data de pagamento
    let dataPagamentoConvertida = null;
    if (dataPagamento) {
      const [dia, mes, ano] = dataPagamento.split('/');
      if (dia && mes && ano) {
        dataPagamentoConvertida = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    }

    // Determinar tipo e status
    const valorNumerico = parseFloat(valor.replace(',', '.')) || 0;
    const tipoTransacao = valorNumerico > 0 ? 'receita' : 'despesa';
    
    let status = 'pendente';
    if (situacao && situacao.toLowerCase().includes('pago')) {
      status = 'pago';
    } else if (situacao && situacao.toLowerCase().includes('vencido')) {
      status = 'vencido';
    }

    return {
      data: dataVencimento,
      vencimento: dataVencimento,
      valor: tipoTransacao === 'despesa' ? -Math.abs(valorNumerico) : Math.abs(valorNumerico),
      descricao: descricao,
      conta: empresa || 'Conta Padrão',
      tipo: tipoTransacao,
      status: status,
      data_pagamento: dataPagamentoConvertida,
      observacoes: `Importado via sistema - Empresa: ${empresa || 'N/A'}${parcela ? ` - Parcela: ${parcela}` : ''}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const getColumnIndex = (column: string): number => {
    return column.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
  };

  const clearImport = () => {
    setImportData({
      file: null,
      mapping: defaultMapping,
      preview: [],
      isProcessing: false,
      message: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = `VENCIMENTO,DESCRIÇÃO,EMPRESA,TIPO,VALOR,PARCELA,SITUAÇÃO,DATA_PAGAMENTO
01/01/2025,ENERGIA BTN,NEONEGIA,,87.90,,PAGO,28/05/2025
15/01/2025,ALUGUEL CENTRO,JOSE GOMES,,3500.00,,PAGO,26/01/2025
20/01/2025,HONORARIOS CONTABEIS,BUREAU,,1065.40,,PAGO,10/01/2025`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_importacao.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Importação de Dados</h2>
                <p className="text-sm text-gray-600">
                  Ferramenta para migrar dados de outros sistemas ou planilhas
                </p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Template CSV</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!importData.file ? (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Selecionar Arquivo CSV
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  ou arraste e solte um arquivo CSV aqui
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Suporta arquivos CSV com até 10.000 linhas
                </p>
              </div>
            ) : (
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Arquivo selecionado: {importData.file.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {importData.file.size} bytes
                </p>
                <div className="mt-4 flex justify-center space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Trocar Arquivo
                  </button>
                  <button
                    onClick={clearImport}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          {importData.message && (
            <div className={`p-4 rounded-lg ${
              importData.message.type === 'success' ? 'bg-green-50 text-green-800' :
              importData.message.type === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              <div className="flex items-center">
                {importData.message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : importData.message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 mr-2" />
                ) : (
                  <FileText className="w-5 h-5 mr-2" />
                )}
                {importData.message.text}
              </div>
            </div>
          )}

          {/* Mapping Configuration */}
          {importData.file && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Mapeamento de Campos
                </h3>
                <button
                  onClick={resetToDefaultMapping}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Restaurar Padrão
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(importData.mapping).map(([field, column]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {field === 'vencimento' ? 'Data Vencimento' :
                       field === 'descricao' ? 'Descrição' :
                       field === 'empresa' ? 'Empresa/Conta' :
                       field === 'valor' ? 'Valor' :
                       field === 'parcela' ? 'Parcela' :
                       field === 'situacao' ? 'Situação' :
                       field === 'dataPagamento' ? 'Data Pagamento' : field}
                    </label>
                    <select
                      value={column}
                      onChange={(e) => handleMappingChange(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(col => (
                        <option key={col} value={col}>
                          Coluna {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {importData.preview.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Prévia dos Dados</h3>
                <p className="text-sm text-gray-600">
                  Mostrando as primeiras 5 linhas para verificação
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Linha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Situação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importData.preview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.row}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.vencimento}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.descricao}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.empresa}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.valor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.situacao}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {importData.file && importData.preview.length > 0 && (
            <div className="text-center">
              <button
                onClick={processFullFile}
                disabled={importData.isProcessing}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                  importData.isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                }`}
              >
                {importData.isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Importar Dados
                  </>
                )}
              </button>
              <p className="mt-2 text-sm text-gray-600">
                Esta ação importará todos os dados válidos do arquivo para o sistema
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataImport;
