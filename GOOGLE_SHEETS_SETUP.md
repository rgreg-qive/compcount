# 📊 Configuração Google Sheets API

Este guia explica como configurar a integração com Google Sheets para receber feedbacks dos usuários.

## 🎯 Objetivo

Os feedbacks dos usuários serão enviados automaticamente para uma planilha Google Sheets, permitindo análise e acompanhamento em tempo real.

## 📝 Pré-requisitos

1. ✅ Planilha Google Sheets criada
2. ✅ Conta Google com acesso à planilha
3. ⏳ API Key do Google (vamos configurar)

## 🛠 Passo a Passo

### 1. Configurar Google Cloud Project

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Library**
4. Procure por "Google Sheets API" e **habilite**

### 2. Criar API Key

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **API Key**
3. Copie a API Key gerada
4. **IMPORTANTE**: Clique em "RESTRICT KEY" para adicionar restrições de segurança:
   - **Application restrictions**: HTTP referrers
   - Adicione seus domínios: `https://seu-dominio.vercel.app/*`
   - **API restrictions**: Restringir a "Google Sheets API"

### 3. Configurar Permissões da Planilha

1. Abra sua planilha: https://docs.google.com/spreadsheets/d/1jC49dfYgZyVCtYzDIFq9y4Q8nFKuQoPKX07IHxkViSY/
2. Clique em **Compartilhar**
3. Altere para **"Qualquer pessoa com o link pode editar"**
   - Isso permite que a API adicione dados
   - Alternativa mais segura: adicionar um Service Account (mais complexo)

### 4. Configurar Variáveis de Ambiente

1. No Vercel, vá em **Project Settings** > **Environment Variables**
2. Adicione:
   ```
   VITE_GOOGLE_SHEETS_API_KEY=sua_api_key_aqui
   VITE_GOOGLE_SHEETS_ID=1jC49dfYgZyVCtYzDIFq9y4Q8nFKuQoPKX07IHxkViSY
   ```

### 5. Fazer Deploy

1. Faça commit das alterações
2. O Vercel fará deploy automático
3. A integração estará ativa!

## 📊 Estrutura da Planilha

A planilha deve ter as seguintes colunas na primeira linha:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Timestamp | Usuario | Frame_URL | Tipo_Problema | Nome_Componente | Classificacao_Esperada | Descricao | User_Agent |

## 🔧 Como Funciona

1. **Usuário envia feedback** → Tenta enviar para Google Sheets
2. **Se sucesso** → Feedback salvo na planilha + localmente
3. **Se falha** → Salva apenas localmente 
4. **Próxima sessão** → Tenta reenviar feedbacks pendentes

## 🎯 Fallback Inteligente

- ✅ Sempre funciona, mesmo sem API configurada
- ✅ Feedbacks nunca são perdidos
- ✅ Sincronização automática quando possível
- ✅ Feedback visual claro para o usuário

## 🔍 Teste

Após configurar:

1. Faça uma análise no CompCount
2. Envie um feedback
3. Verifique se aparece na planilha
4. Console do navegador mostra logs detalhados

## 🚨 Troubleshooting

### "API Key não configurada"
- Adicione `VITE_GOOGLE_SHEETS_API_KEY` no Vercel
- Faça redeploy

### "403 Forbidden"
- Verifique permissões da planilha
- Confirme que API Key tem acesso à Google Sheets API

### "404 Not Found" 
- Confirme o ID da planilha
- Verifique se planilha existe e está acessível

## 📈 Análise dos Dados

Com os feedbacks na planilha, você pode:

- **Filtrar por usuário** - ver padrões por pessoa
- **Filtrar por tipo** - agrupar problemas similares  
- **Analisar por frame** - identificar frames problemáticos
- **Criar gráficos** - visualizar trends
- **Exportar dados** - para outras ferramentas 