# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Em Desenvolvimento
- Melhorias de performance
- Novas funcionalidades em planejamento

## [1.1.0] - 2025-01-18

### ✨ Adicionado
- **🌙 Dark Mode**: Suporte completo a tema escuro
  - Detecção automática da preferência do sistema (`prefers-color-scheme`)
  - Toggle manual para alternar entre Claro/Sistema/Escuro
  - Persistência da escolha no localStorage
  - Transições suaves entre temas
  - Aplicado em ambas as páginas (principal e visualização)
- **🎨 Theme Manager**: Sistema inteligente de gerenciamento de temas
  - Escuta mudanças na preferência do sistema
  - API completa para controle de temas
  - Eventos customizados para reação de componentes
- **🛠️ Configuração Tailwind**: Configuração otimizada para dark mode
  - Modo `class` para controle manual
  - Cores customizadas para melhor contraste
  - Suporte completo a todas as variantes dark:

### 🔧 Técnico
- Novo componente `ThemeManager` para controle centralizado
- Configuração `tailwind.config.js` com suporte a dark mode
- Classes CSS dark: aplicadas em todos os elementos da interface
- Integração completa com ambas as aplicações (main e view)

## [1.0.0] - 2025-01-18

### ✨ Adicionado
- **Análise de Componentes Figma**: Sistema completo para analisar componentes e sua conexão com Design System
- **Detecção de Tokens**: Identificação automática de tokens de tipografia, cores e variáveis
- **Suporte a APIs**: Compatibilidade com Plugin API e REST API do Figma
- **Visualização Interativa**: Interface moderna com gráficos e tabelas detalhadas
- **Links Compartilháveis**: Sistema de compartilhamento de análises com URLs
- **Classificação Inteligente**: Categorização de componentes como "conectados" ou "desconectados"
- **Análise de Conformidade**: Cálculo automático de taxa de conformidade com Design System

### 🐛 Corrigido
- **Detecção de Texto**: Correção na detecção de elementos de texto usando tokens do Design System
- **Duplicação de Componentes**: Eliminação de componentes duplicados na visualização compartilhada
- **Compatibilidade de APIs**: Suporte tanto para `textStyleId`/`fillStyleId` quanto para `styles.text`/`styles.fill`

### 🔧 Técnico
- TypeScript com tipagem completa
- Vite para build otimizado
- Chart.js para visualizações
- Tailwind CSS para interface moderna
- Deploy automatizado no Vercel

---

## Guia de Versionamento

### Semantic Versioning (X.Y.Z)
- **X (Major)**: Mudanças incompatíveis na API
- **Y (Minor)**: Novas funcionalidades compatíveis
- **Z (Patch)**: Correções de bugs compatíveis

### Tipos de Mudanças
- `✨ Adicionado` para novas funcionalidades
- `🔄 Modificado` para mudanças em funcionalidades existentes
- `⚠️ Descontinuado` para funcionalidades que serão removidas
- `🗑️ Removido` para funcionalidades removidas
- `🐛 Corrigido` para correções de bugs
- `🔒 Segurança` para correções de vulnerabilidades 