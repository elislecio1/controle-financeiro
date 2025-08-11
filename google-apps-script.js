/**
 * Google Apps Script para Dashboard de Planilhas
 * Este script resolve o problema de autenticação 401 para operações de escrita
 */

// Configuração CORS para permitir requisições do dashboard
function doPost(e) {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  try {
    // Parse do JSON recebido
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    
    switch(action) {
      case 'read':
        result = readData(data.spreadsheetId, data.sheetName);
        break;
      case 'append':
        result = appendData(data.spreadsheetId, data.sheetName, data.values);
        break;
      case 'update':
        result = updateData(data.spreadsheetId, data.sheetName, data.rowIndex, data.values);
        break;
      default:
        throw new Error('Ação não reconhecida: ' + action);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    const errorResponse = {
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

// Função para ler dados da planilha
function readData(spreadsheetId, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error('Aba não encontrada: ' + sheetName);
    }
    
    const data = sheet.getDataRange().getValues();
    
    return {
      status: 'success',
      data: {
        data: data,
        rows: data.length,
        columns: data.length > 0 ? data[0].length : 0
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error('Erro ao ler dados: ' + error.toString());
  }
}

// Função para adicionar dados na planilha
function appendData(spreadsheetId, sheetName, values) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error('Aba não encontrada: ' + sheetName);
    }
    
    // Adicionar dados na planilha
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow + 1, 1, values.length, values[0].length);
    range.setValues(values);
    
    return {
      status: 'success',
      message: 'Dados adicionados com sucesso',
      rowsAdded: values.length,
      lastRow: lastRow + values.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error('Erro ao adicionar dados: ' + error.toString());
  }
}

// Função para atualizar dados na planilha
function updateData(spreadsheetId, sheetName, rowIndex, values) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error('Aba não encontrada: ' + sheetName);
    }
    
    // Verificar se a linha existe
    const lastRow = sheet.getLastRow();
    if (rowIndex > lastRow) {
      throw new Error('Linha não existe: ' + rowIndex);
    }
    
    // Atualizar dados na planilha
    const range = sheet.getRange(rowIndex, 1, values.length, values[0].length);
    range.setValues(values);
    
    return {
      status: 'success',
      message: 'Dados atualizados com sucesso',
      rowUpdated: rowIndex,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error('Erro ao atualizar dados: ' + error.toString());
  }
}

// Função para lidar com requisições OPTIONS (CORS preflight)
function doOptions(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  return ContentService
    .createTextOutput('')
    .setHeaders(headers);
}

// Função de teste para verificar se o script está funcionando
function doGet(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  const testResponse = {
    status: 'success',
    message: 'Google Apps Script está funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(testResponse))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
} 