# 🎨 Figma Component Analyzer

Ferramenta para análise de componentes Figma vs Design System, desenvolvida em TypeScript com arquitetura modular.

## ✨ Funcionalidades

- 🔍 **Análise automática** de frames do Figma
- 🎯 **Identificação de componentes** conectados vs desconectados do Design System
- 🧠 **Sistema de aprendizado inteligente** que melhora com correções manuais
- 💬 **Feedback detalhado** - Descreva problemas na análise para criar regras automáticas
- 🤖 **Geração automática de regras** baseada no feedback do usuário
- 💡 **Sugestões de componentes perdidos** com análise de elementos não detectados
- 📊 **Visualização** com gráficos e tabelas interativas
- 📥 **Export para CSV** dos resultados
- 💾 **Persistência local** de tokens, padrões e regras aprendidas

## 🏗️ Arquitetura

O projeto foi modularizado com TypeScript para melhor organização e manutenibilidade:

```
src/
├── types/
│   └── figma.ts              # Tipos TypeScript para API do Figma
├── services/
│   ├── figmaApi.ts           # Serviço para interação com API do Figma
│   ├── componentAnalyzer.ts  # Lógica de análise de componentes
│   └── learningService.ts    # Sistema de aprendizado e persistência
├── components/
│   ├── chartManager.ts       # Gerenciamento de gráficos (Chart.js)
│   └── uiManager.ts          # Gerenciamento da interface
├── main.ts                   # Arquivo principal da aplicação
└── index.html                # Interface HTML
```

## 🚀 Como usar

### Desenvolvimento

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Verificar tipos TypeScript:**
   ```bash
   npm run type-check
   ```

### Build para produção

```bash
npm run build
```

### Uso da ferramenta

1. **Obter token do Figma:**
   - Acesse: Figma → Settings → Personal Access Tokens
   - Crie um token com permissão `File content:read`

2. **Analisar frame:**
   - Cole o token no campo apropriado
   - Insira a URL do frame do Figma
   - Clique em "Analisar"

3. **Ajustar resultados (opcional):**
   - Use os campos de ajuste manual se necessário
   - O sistema aprenderá com suas correções

4. **Dar feedback detalhado (opcional):**
   - Clique em "Dar Feedback Detalhado" se a análise tiver problemas
   - Descreva o que estava errado (ex: "Rectangle 6190 não foi detectado")
   - O sistema criará regras automáticas para melhorar futuras análises

5. **Exportar dados:**
   - Clique em "Baixar CSV" para exportar os resultados

## 🔧 Tecnologias

- **TypeScript** - Type safety e melhor DX
- **Vite** - Build tool rápido e moderno
- **Chart.js** - Gráficos interativos
- **Tailwind CSS** - Styling
- **Figma API** - Integração com Figma

## 📁 Estrutura de Dados

### Padrões Conhecidos
O sistema salva padrões de análise no localStorage:

```typescript
interface LearningPattern {
  frameId: string;
  frameUrl: string;
  timestamp: number;
  components: {
    connected: number;
    disconnected: number;
  };
  corrections?: {
    connected: number;
    disconnected: number;
  };
}
```

### Análise de Componentes
```typescript
interface ComponentAnalysis {
  name: string;
  type: 'INSTANCE' | 'COMPONENT' | 'TEXT' | 'OTHER';
  isConnectedToDS: boolean;
  priority: number;
  nodeId: string;
  depth: number;
}
```

### Feedback do Usuário
```typescript
interface UserFeedback {
  type: 'missed_component' | 'wrong_classification' | 'should_ignore' | 'other';
  description: string;
  componentName?: string;
  expectedClassification?: 'connected' | 'disconnected';
  nodeId?: string;
  timestamp: number;
}
```

### Regras de Análise Automáticas
```typescript
interface AnalysisRule {
  id: string;
  type: 'include' | 'exclude' | 'classify';
  condition: {
    nodeType?: string;
    nodeName?: string;
    namePattern?: string;
    parentType?: string;
  };
  action: {
    classify?: 'connected' | 'disconnected';
    ignore?: boolean;
  };
  confidence: number;
  source: 'user_feedback' | 'pattern_recognition';
  createdAt: number;
}
```

## 🎯 Melhorias implementadas

### Em relação à versão anterior (HTML monolítico):

✅ **Modularização:** Código organizado em módulos especializados  
✅ **TypeScript:** Type safety e melhor experiência de desenvolvimento  
✅ **Separação de responsabilidades:** Cada classe tem uma função específica  
✅ **Reutilização:** Componentes podem ser facilmente reutilizados  
✅ **Testabilidade:** Estrutura permite testes unitários  
✅ **Manutenibilidade:** Mais fácil de manter e expandir  
✅ **Build system:** Vite para desenvolvimento e build otimizado  
✅ **Sistema de feedback inteligente:** Usuário pode ensinar o sistema descrevendo problemas  
✅ **Geração automática de regras:** Cria regras baseadas no feedback para melhorar análises futuras  
✅ **Sugestões de componentes:** Detecta elementos que podem ter sido perdidos na análise  

### Mantendo as vantagens:

✅ **Simplicidade de deploy:** Build gera arquivos estáticos  
✅ **Performance:** Bundle otimizado  
✅ **Zero dependências de runtime:** Funciona em qualquer servidor  

## 🚦 Scripts disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção  
- `npm run preview` - Preview do build
- `npm run type-check` - Verificação de tipos
- `npm run clean` - Remove arquivos antigos

## 🔒 Segurança

- Tokens são armazenados apenas no localStorage do navegador
- Nenhum dado é enviado para servidores externos
- Comunicação direta com a API do Figma

## 📈 Roadmap

- [ ] Testes unitários
- [ ] Suporte a múltiplos Design Systems
- [ ] Análise de tendências históricas
- [ ] Integração com outras ferramentas de design
- [ ] API para automação

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 