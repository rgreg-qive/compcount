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
    
    // Receber dados do form submission
    const data = e.parameter;
    
    console.log('Dados recebidos:', data);
    
    // Acessar a planilha
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Preparar a linha de dados
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.usuario || '',
      data.frameUrl || '',
      data.tipoProblema || '',
      data.nomeComponente || '',
      data.classificacaoEsperada || '',
      data.descricao || '',
      data.userAgent || ''
    ];
    
    // Adicionar linha na planilha
    sheet.appendRow(rowData);
    
    console.log('Feedback salvo na planilha:', rowData);
    
    // Resposta de sucesso (HTML simples que fecha a aba)
    return HtmlService.createHtmlOutput(`
      <html>
        <head>
          <title>Feedback Enviado</title>
        </head>
        <body>
          <h2>✅ Feedback enviado com sucesso!</h2>
          <p>Obrigado pelo seu feedback. Esta janela será fechada automaticamente.</p>
          <script>
            setTimeout(function() {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
      
  } catch (error) {
    console.error('Erro ao processar feedback:', error);
    
    // Resposta de erro
    return HtmlService.createHtmlOutput(`
      <html>
        <head>
          <title>Erro</title>
        </head>
        <body>
          <h2>❌ Erro ao enviar feedback</h2>
          <p>Erro: ${error.toString()}</p>
          <p>Esta janela será fechada automaticamente.</p>
          <script>
            setTimeout(function() {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <html>
      <head>
        <title>CompCount Feedback API</title>
      </head>
      <body>
        <h2>🚀 CompCount Feedback API</h2>
        <p>API funcionando corretamente!</p>
        <p>Use POST para enviar feedbacks.</p>
      </body>
    </html>
  `);
}
```

### 3. Deploy do Script
1. Clique em "Implantar" > "Nova implantação"
2. Escolha tipo: "Aplicativo da Web"
3. Configurações:
   - **Descrição**: CompCount Feedback Collector v2
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
Após deploy, o sistema usará form submission, resolvendo o problema de CORS completamente.

## ✅ Vantagens desta Nova Solução
- ✅ **Zero problemas de CORS** (form submission não tem CORS)
- ✅ Funciona em 100% dos navegadores
- ✅ Não precisa de API Key (mais seguro)
- ✅ Google Apps Script é gratuito
- ✅ Mantém o fallback local intacto
- ✅ Feedback visual para o usuário (janela que fecha automaticamente)

## 🔧 Estrutura de Dados na Planilha
```
Timestamp | Usuario | Frame_URL | Tipo_Problema | Nome_Componente | Classificacao_Esperada | Descricao | User_Agent
```

## 🚨 Importante
- O script precisa ter permissão para acessar a planilha
- A planilha deve ter os cabeçalhos na primeira linha
- Uma pequena janela será aberta e fechada automaticamente a cada envio (comportamento normal)
- Mantenha a URL do script segura (não compartilhe publicamente)

## 🆕 Diferenças da Versão Anterior
- **Antes**: JSON via fetch() → Problema de CORS
- **Agora**: Form submission → Sem problemas de CORS
- **Resultado**: 100% funcional em qualquer navegador 