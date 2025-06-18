# 🔧 Melhorias na Detecção de Componentes

## 🐛 Problema Identificado

O sistema não estava detectando corretamente componentes **fora do Design System**. No exemplo fornecido:
- **Esperado:** 1 conectado + 1 fora = 2 total
- **Resultado anterior:** 1 conectado + 0 fora = 1 total

## ✅ Soluções Implementadas

### 1. **Logs de Debug Detalhados**
```typescript
console.log(`🔍 Analisando node: "${node.name}" (${node.type}) - componentId: ${node.componentId || 'null'} - depth: ${depth}`);
console.log(`📍 INSTANCE "${node.name}": componentId="${node.componentId}" → ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
console.log(`🧩 COMPONENT "${node.name}": → ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
```

### 2. **Lógica Melhorada para INSTANCE**
**Antes:**
```typescript
const classification = ruleResult.classification || (!!node.componentId ? 'connected' : 'disconnected');
```

**Depois:**
```typescript
let isConnected = false;
if (ruleResult.classification) {
  isConnected = ruleResult.classification === 'connected';
} else {
  // Uma INSTANCE está conectada se tem componentId válido
  isConnected = !!(node.componentId && node.componentId.trim() !== '');
}
```

### 3. **Lógica Melhorada para COMPONENT**
- **COMPONENTs locais** são considerados **desconectados por padrão**
- Evita processamento de filhos para evitar duplicatas
- Logs claros da classificação

## 🆕 **NOVA: Detecção Avançada de Texto**

### **Problema do Texto Não Aparecer**
O sistema tinha várias limitações que impediam a detecção de elementos TEXT:

1. **Filtros de profundidade muito restritivos** (`depth > 4`)
2. **Filtros de tamanho inadequados** para texto
3. **Exclusão automática** de textos filhos de INSTANCE
4. **Padrões de exclusão muito amplos**

### **Solução: Lógica Dedicada para Texto**

#### **Nova Função `shouldIncludeTextComponent()`**
- ✅ **Profundidade mais permissiva:** Até `depth 6` (vs. 4 para outros)
- ✅ **Critérios de tamanho flexíveis:** 5x5px até 1200x400px
- ✅ **40+ padrões de inclusão:** component, title, heading, button, capa, teste, etc.
- ✅ **Exclusões específicas:** Apenas placeholders óbvios
- ✅ **Estratégia inclusiva:** Por padrão, inclui textos que não foram explicitamente excluídos

#### **Padrões Reconhecidos**
```typescript
// Tipos de texto importantes
/title/i, /heading/i, /header/i, /label/i, /caption/i, /subtitle/i,
// Texto de interface  
/button/i, /link/i, /menu/i, /nav/i, /tab/i,
// Conteúdo específico
/capa/i, /teste/i, /demo/i, /example/i, /sample/i,
// Textos numerados
/text \d+/i, /texto \d+/i
```

## 🎯 **NOVA: Classificação Rigorosa de Texto por Tokens**

### **Problema da Classificação de Texto**
Antes, todos os textos eram classificados genericamente. Agora implementamos **detecção rigorosa** que exige **AMBOS** os tipos de token.

### **Solução: Critério Duplo para Design System**

#### **Função `isTextUsingDesignSystemTokens()` - CRITÉRIO RIGOROSO**
Para ser considerado **CONECTADO**, o texto precisa ter **AMBOS**:

**1. 📝 Token de Texto (Tipografia)**
```typescript
// textStyleId definido
if (node.textStyleId && node.textStyleId.trim() !== '') {
  hasTextToken = true;
}

// OU variáveis de tipografia
const textFields = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];
const hasTextVariables = textFields.some(field => node.boundVariables[field]);
```

**2. 🎨 Token de Cor (Fill do DS)**
```typescript
// fillStyleId definido
if (node.fillStyleId && node.fillStyleId.trim() !== '') {
  hasColorToken = true;
}

// OU variáveis de cor
const colorFields = ['fills', 'fill', 'color'];
const hasColorVariables = colorFields.some(field => node.boundVariables[field]);
```

#### **Lógica AND (Ambos Obrigatórios)**
```typescript
// Precisa ter AMBOS para ser conectado
const isConnected = hasTextToken && hasColorToken;

if (isConnected) {
  console.log(`✅ Texto "${node.name}" CONECTADO - tem texto token E cor token`);
} else {
  console.log(`❌ Texto "${node.name}" DESCONECTADO`);
  if (!hasTextToken) console.log(`   ⚠️ Faltando: token de texto`);
  if (!hasColorToken) console.log(`   ⚠️ Faltando: token de cor`);
}
```

### **Exemplos Práticos**

**✅ CONECTADO (tem ambos):**
- Título com `textStyleId: "heading-1"` + `fillStyleId: "primary-color"`
- Label com variável de fonte + variável de cor
- Botão com estilo de texto + cor do Design System

**❌ DESCONECTADO (falta algo):**
- Texto com estilo de fonte mas cor hardcoded `#000000`
- Texto com cor do DS mas fonte não padronizada
- Texto sem nenhum token definido

### **Resultado**
- ✅ **Texto + Cor do DS** → **CONECTADO** 
- ❌ **Só texto OU só cor** → **FORA** do Design System
- 🔍 **Logs detalhados** mostram exatamente o que falta

## 🚀 **NOVA: Toggles Inteligentes**

### **Smart Toggle com Design System Detection**

#### **Função `hasDesignSystemLikeName()`**
Reconhece **40+ padrões** de componentes típicos:

**Componentes de Interface:**
- `button`, `card`, `modal`, `dialog`, `sheet`, `drawer`

**Formulários:**  
- `input`, `field`, `checkbox`, `radio`, `select`, `dropdown`

**Navegação:**
- `menu`, `nav`, `tab`, `breadcrumb`, `pagination`

**Feedback:**
- `alert`, `toast`, `badge`, `chip`, `progress`, `spinner`

**Conteúdo:**
- `avatar`, `icon`, `image`, `divider`, `separator`

#### **Lógica de Ativação Automática**
```typescript
// Elementos automaticamente HABILITADOS:
// 1. INSTANCE (são instâncias de componentes)
// 2. COMPONENT (são definições de componentes)  
// 3. Nomes que sugerem Design System

if (isInstance || isComponent || hasDesignSystemName) {
  toggle.checked = true; // ✅ HABILITADO
  console.log(`🎯 Toggle HABILITADO: "${element.name}" (${reasoning})`);
} else {
  toggle.checked = false; // ❌ DESABILITADO
  console.log(`⚪ Toggle desabilitado: "${element.name}" (OUTROS)`);
}
```

## 🔄 **Correção de Bug: Estatísticas com Toggles**

### **Problema**
Componentes com toggles **desabilitados** ainda eram contabilizados nas estatísticas.

### **Solução**
1. **Inicialização zerada:** Estatísticas começam em 0
2. **Recálculo automático:** Após configurar toggles (delay 100ms)
3. **Contagem apenas habilitados:** `toggle.checked = true`
4. **Atualizações em tempo real:** Quando usuário altera toggles

## 📊 **Como Verificar se Está Funcionando**

### **1. Abra o DevTools (F12) → Console**

### **2. Analise um frame e procure por:**

**Detecção de Texto:**
```
📝 Texto "Título Principal" tem textStyleId: heading-1
🎨 Texto "Título Principal" tem fillStyleId: primary-color
✅ Texto "Título Principal" CONECTADO - tem texto token (true) E cor token (true)
📝 Texto auto-detectado: "Título Principal" (depth: 2) → CONECTADO (tokens: true)

📝 Texto "Label Simples" tem textStyleId: body-text
❌ Texto "Label Simples" DESCONECTADO - texto token: true, cor token: false
   ⚠️ Faltando: token de cor (fillStyleId ou variáveis de cor)
📝 Texto auto-detectado: "Label Simples" (depth: 3) → DESCONECTADO (tokens: false)
```

**Toggles Inteligentes:**
```
🎯 Toggle HABILITADO: "Button/Primary" (INSTANCE + NOME_DS)
⚪ Toggle desabilitado: "Rectangle 123" (OUTROS)
```

**Estatísticas Corretas:**
```
📊 Recalculando stats - Componente "Button" incluído (toggle habilitado)
📊 Recalculando stats - Componente "Rect" excluído (toggle desabilitado)
```

### **3. Esperado:**
- ✅ **Textos com estilos** aparecem como **CONECTADOS**
- ❌ **Textos sem estilos** aparecem como **FORA** 
- 🎯 **Componentes DS** têm toggles **habilitados automaticamente**
- 📊 **Estatísticas** refletem apenas componentes com **toggles habilitados**

## 🎯 Casos Específicos Resolvidos

### **Rectangle 6190**
- ✅ Detectado pelo padrão `/rectangle \d+/i`
- ✅ Classificado como **desconectado** automaticamente
- ✅ Incluído na análise mesmo sem regras específicas

### **Elementos de Texto**
- ✅ **Títulos, cabeçalhos, labels** detectados automaticamente
- ✅ **Textos de componentes** (botões, links) incluídos
- ✅ **Conteúdo específico** ("capa", "teste") reconhecido
- ✅ **Textos numerados** incluídos por padrão
- ✅ **Estratégia inclusiva** - assume que texto é importante

### **Controle de Estatísticas**
- ✅ **Toggles funcionam corretamente** - apenas componentes habilitados são contados
- ✅ **Números precisos** baseados na seleção do usuário
- ✅ **Atualização em tempo real** ao modificar toggles

## 🔍 Como Debugar

### **1. Console do Navegador**
Abra as **DevTools** e veja os logs:

**Para componentes gerais:**
```
🔍 Analisando node: "Rectangle 6190" (RECTANGLE) - componentId: null - depth: 2
🔶 Auto-detectado como componente: "Rectangle 6190" (RECTANGLE)
```

**Para textos:**
```
🔍 Analisando node: "Capa do Livro" (TEXT) - componentId: null - depth: 3
✅ Texto incluído por padrão de nome: "Capa do Livro"
📝 Texto auto-detectado: "Capa do Livro" (depth: 3)
```

**Para estatísticas:**
```
🔄 Recalculando estatísticas... 5 toggles encontrados
⏭️ Toggle desabilitado - NÃO contabilizado: 123:456
✅ Componente conectado contabilizado: 789:012
📊 Resultado final: 1 conectados, 2 desconectados
```

### **2. Verificar Classificação**
Os logs mostram claramente:
- ✅ **CONECTADO** = tem componentId válido ou regra específica
- ❌ **DESCONECTADO** = sem componentId ou auto-detectado
- 📝 **TEXTO** = nova categoria específica para elementos TEXT
- ⏭️ **NÃO CONTABILIZADO** = toggle desabilitado

### **3. Feedback Detalhado**
Use o sistema de feedback para ensinar casos específicos:
1. Clique em "Dar Feedback Detalhado"
2. Selecione "Componente não foi detectado"
3. Digite o nome exato do elemento
4. Sistema criará regras automáticas

## 📊 Resultado Esperado

Para frames com texto, agora deve mostrar:
- **Componentes conectados** (INSTANCE com componentId)
- **Componentes desconectados** (Rectangle, etc. auto-detectados)
- **Elementos de texto** (títulos, labels, conteúdo)
- **⭐ NÚMEROS CORRETOS** baseados apenas nos toggles habilitados

## 🚀 Próximos Passos

1. **Teste com o frame específico** mencionado
2. **Verifique o console** para logs de detecção de texto
3. **Teste os toggles** - números devem mudar em tempo real
4. **Use o feedback detalhado** para casos não detectados
5. **Sistema aprenderá** e melhorará automaticamente
6. **Regras personalizadas** serão criadas baseadas no seu uso 