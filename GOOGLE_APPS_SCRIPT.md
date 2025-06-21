# Google Apps Script - Configuração para CompCount

## 📋 Passo a Passo

### 1. Criar o Script
1. Acesse [script.google.com](https://script.google.com)
2. Clique em "Novo projeto"
3. Renomeie para "CompCount Sheets Proxy"

### 2. Código do Script
```javascript
function doPost(e) {
  try {
    // ID da planilha (substitua pelo seu)
    const SHEET_ID = '1jC49dfYgZyVCtYzDIFq9y4Q8nFKuQoPKX07IHxkViSY';
    
    // Parse dos dados recebidos
    const data = JSON.parse(e.postData.contents);
    
    // Acessar a planilha
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Preparar a linha de dados
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.usuario,
      data.frameUrl,
      data.tipoProblema,
      data.nomeComponente || '',
      data.classificacaoEsperada || '',
      data.descricao,
      data.userAgent || ''
    ];
    
    // Adicionar linha na planilha
    sheet.appendRow(rowData);
    
    // Resposta de sucesso
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Feedback salvo com sucesso!'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    // Resposta de erro
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

function doOptions(e) {
  // Resposta para requisições OPTIONS (CORS preflight)
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600'
    });
}
```

### 3. Deploy do Script
1. Clique em "Implantar" > "Nova implantação"
2. Escolha tipo: "Aplicativo da Web"
3. Configurações:
   - **Descrição**: CompCount Feedback Collector
   - **Executar como**: Eu (seu email)
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em "Implantar"
5. **COPIE A URL** que será gerada (algo como: `https://script.google.com/macros/s/AKfycby.../exec`)

### 4. Configurar no Vercel
Adicione a variável de ambiente no Vercel:
```
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SUA_URL_AQUI/exec
```

### 5. Testar
Após deploy, o sistema usará o Google Apps Script como proxy, resolvendo o problema de CORS.

## ✅ Vantagens desta Solução
- ✅ Resolve problema de CORS completamente
- ✅ Não precisa de API Key (mais seguro)
- ✅ Funciona em qualquer navegador
- ✅ Google Apps Script é gratuito
- ✅ Mantém o fallback local intacto

## 🔧 Estrutura de Dados na Planilha
```
Timestamp | Usuario | Frame_URL | Tipo_Problema | Nome_Componente | Classificacao_Esperada | Descricao | User_Agent
```

## 🚨 Importante
- O script precisa ter permissão para acessar a planilha
- A planilha deve ter os cabeçalhos na primeira linha
- Mantenha a URL do script segura (não compartilhe publicamente) 