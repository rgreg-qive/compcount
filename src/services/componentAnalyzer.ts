import type { FigmaNode, ComponentAnalysis, AnalysisResult } from '../types/figma.ts';
import { LearningService } from './learningService.ts';

export class ComponentAnalyzer {
  /**
   * Analisa um frame do Figma e identifica componentes
   */
  static analyzeFrame(frameNode: FigmaNode, frameUrl: string): AnalysisResult {
    const components: ComponentAnalysis[] = [];
    
    // Extrair componentes recursivamente, mas não entrar em filhos de INSTANCE
    this.extractComponents(frameNode, components, 0);
    
    // Filtrar componentes relevantes
    const filteredComponents = this.filterRelevantComponents(components);
    
    // Calcular estatísticas
    const connected = filteredComponents.filter(c => c.isConnectedToDS).length;
    const disconnected = filteredComponents.filter(c => !c.isConnectedToDS).length;
    
    return {
      components: filteredComponents,
      summary: {
        connected,
        disconnected,
        total: connected + disconnected
      },
      frameInfo: {
        name: frameNode.name,
        nodeId: frameNode.id,
        url: frameUrl
      }
    };
  }

  /**
   * Extrai componentes recursivamente da árvore de nodes
   */
  private static extractComponents(
    node: FigmaNode, 
    components: ComponentAnalysis[], 
    depth: number
  ): void {
    // Pular frames raiz (depth 0)
    if (depth === 0 && node.children) {
      node.children.forEach(child => {
        this.extractComponents(child, components, depth + 1);
      });
      return;
    }

    // Pular layers ocultos (começam com underscore)
    if (node.name.startsWith('_')) {
      return;
    }

    // Log para debug
    console.log(`🔍 Analisando node: "${node.name}" (${node.type}) - componentId: ${node.componentId || 'null'} - depth: ${depth}`);

    // Aplicar regras de aprendizado
    const ruleResult = LearningService.applyRulesToComponent(node.name, node.type);
    
    // Se deve ser ignorado, pular
    if (ruleResult.shouldIgnore) {
      console.log(`🚫 Ignorando componente "${node.name}" devido a regra aprendida`);
      return;
    }

    // Se é uma INSTANCE, adicionar à análise mas NÃO processar filhos
    if (node.type === 'INSTANCE') {
      // Melhor lógica para detectar se está conectado ao DS
      let isConnected = false;
      if (ruleResult.classification) {
        isConnected = ruleResult.classification === 'connected';
      } else {
        // Uma INSTANCE está conectada se tem componentId válido
        isConnected = !!(node.componentId && node.componentId.trim() !== '');
      }
      
      console.log(`📍 INSTANCE "${node.name}": componentId="${node.componentId}" → ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
      
      components.push({
        name: node.name,
        type: 'INSTANCE',
        isConnectedToDS: isConnected,
        priority: this.calculatePriority(node),
        nodeId: node.id,
        depth
      });
      
      if (ruleResult.appliedRules.length > 0) {
        console.log(`🎯 Aplicadas ${ruleResult.appliedRules.length} regras ao componente "${node.name}"`);
      }
      
      // NÃO processar children de INSTANCE
      return;
    }

    // Se é COMPONENT, adicionar à análise
    if (node.type === 'COMPONENT') {
      // COMPONENTs locais são considerados desconectados por padrão
      let isConnected = false;
      if (ruleResult.classification) {
        isConnected = ruleResult.classification === 'connected';
      } else {
        // Um COMPONENT local geralmente é desconectado do DS
        isConnected = false;
      }
      
      console.log(`🧩 COMPONENT "${node.name}": → ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
      
      components.push({
        name: node.name,
        type: 'COMPONENT',
        isConnectedToDS: isConnected,
        priority: this.calculatePriority(node),
        nodeId: node.id,
        depth
      });
      
      if (ruleResult.appliedRules.length > 0) {
        console.log(`🎯 Aplicadas ${ruleResult.appliedRules.length} regras ao componente "${node.name}"`);
      }
      
      // Para COMPONENT, também não processar filhos para evitar duplicatas
      return;
    }

    // MELHORIA: Detecção especial e mais inclusiva para elementos TEXT
    if (node.type === 'TEXT') {
      let shouldIncludeText = false;
      let textClassification: 'connected' | 'disconnected' = 'disconnected';

      // 1. Verificar se há regras específicas para este texto
      if (ruleResult.shouldInclude) {
        shouldIncludeText = true;
        textClassification = ruleResult.classification || 'disconnected';
        console.log(`✅ Texto incluído por regra aprendida: "${node.name}" → ${textClassification.toUpperCase()}`);
      }
      // 2. Auto-detecção mais permissiva para textos
      else {
        // Critérios mais flexíveis para textos
        shouldIncludeText = this.shouldIncludeTextComponent(node, depth);
        if (shouldIncludeText) {
          // NOVA LÓGICA: Classificar baseado no uso de tokens
          const isUsingTokens = this.isTextUsingDesignSystemTokens(node);
          textClassification = isUsingTokens ? 'connected' : 'disconnected';
          console.log(`📝 Texto auto-detectado: "${node.name}" (depth: ${depth}) → ${textClassification.toUpperCase()} (tokens: ${isUsingTokens})`);
        }
      }

      if (shouldIncludeText) {
        components.push({
          name: node.name,
          type: 'TEXT',
          isConnectedToDS: textClassification === 'connected',
          priority: this.calculatePriority(node),
          nodeId: node.id,
          depth
        });
        
        // Para TEXT, não processar filhos (textos não têm filhos relevantes)
        return;
      }
    }

    // NOVA ESTRATÉGIA: Incluir MUITO mais elementos para dar controle total ao usuário
    
    // 1. Elementos com regras aprendidas (sempre incluir)
    if (ruleResult.shouldInclude && (node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'VECTOR')) {
      const classification = ruleResult.classification || 'disconnected';
      
      console.log(`✅ Incluído elemento "${node.name}" (${node.type}) devido a regra aprendida → ${classification.toUpperCase()}`);
      
      components.push({
        name: node.name,
        type: 'OTHER',
        isConnectedToDS: classification === 'connected',
        priority: this.calculatePriority(node),
        nodeId: node.id,
        depth
      });
    }
    
    // 2. Auto-detecção de componentes (lógica original)
    else if (this.shouldIncludeAsDisconnectedComponent(node, depth)) {
      console.log(`🔶 Auto-detectado como componente: "${node.name}" (${node.type})`);
      
      components.push({
        name: node.name,
        type: 'OTHER',
        isConnectedToDS: false,
        priority: this.calculatePriority(node),
        nodeId: node.id,
        depth
      });
    }
    
    // 3. NOVO: Incluir TODOS os elementos visuais básicos (deixar usuário decidir)
    else if (this.shouldShowAsOption(node, depth)) {
      console.log(`📋 Adicionado como opção: "${node.name}" (${node.type}) - usuário decide`);
      
      components.push({
        name: node.name,
        type: 'OTHER',
        isConnectedToDS: false,
        priority: this.calculatePriority(node),
        nodeId: node.id,
        depth
      });
    }

    // Para outros tipos, processar filhos recursivamente
    if (node.children) {
      node.children.forEach(child => {
        // REMOVIDO: Não pular mais textos filhos de INSTANCE - deixar lógica de TEXT decidir
        this.extractComponents(child, components, depth + 1);
      });
    }
  }

  /**
   * Filtra componentes relevantes para a análise - AGORA INCLUI TUDO!
   */
  private static filterRelevantComponents(components: ComponentAnalysis[]): ComponentAnalysis[] {
    console.log(`🔍 Mostrando TODOS os componentes: ${components.length} componentes encontrados`);
    
    // NOVA ESTRATÉGIA: Mostrar TUDO, deixar usuário decidir via toggles
    const filtered = components.filter(component => {
      // Incluir TODOS os componentes encontrados
      console.log(`✅ Incluindo componente: "${component.name}" (${component.type})`);
      return true;
    });
    
    console.log(`📊 Todos os componentes incluídos: ${filtered.length} componentes na análise`);
    return filtered;
  }

  /**
   * Determina se um node deve ser incluído como componente desconectado
   */
  private static shouldIncludeAsDisconnectedComponent(node: FigmaNode, depth: number): boolean {
    // Não incluir se for muito profundo na hierarquia (provavelmente é decorativo)
    if (depth > 4) return false;
    
    // Incluir elementos com nomes significativos que parecem ser componentes
    const significantTypes = ['RECTANGLE', 'ELLIPSE', 'VECTOR', 'FRAME', 'GROUP'];
    if (!significantTypes.includes(node.type)) return false;
    
    // Verificar se tem tamanho significativo
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      
      // Para outros tipos, critérios padrão
      if (width < 20 || height < 20) return false;
      if (width > 500 || height > 500) return false;
    }
    
    // Incluir se o nome sugere que é um componente
    const componentLikeNames = [
      /button/i, /btn/i, /card/i, /modal/i, /popup/i, /tooltip/i,
      /input/i, /field/i, /form/i, /checkbox/i, /radio/i,
      /icon/i, /avatar/i, /badge/i, /chip/i, /tag/i,
      /header/i, /footer/i, /sidebar/i, /menu/i, /nav/i,
      /component/i, /element/i, /widget/i,
      /rectangle \d+/i, /ellipse \d+/i, /vector \d+/i // Elementos numerados
    ];
    
    const nameMatches = componentLikeNames.some(pattern => pattern.test(node.name));
    
    // Incluir se tem filhos (pode ser um componente complexo)
    const hasChildren = !!(node.children && node.children.length > 0);
    
    // Incluir se parece ser um componente baseado no nome OU se tem estrutura complexa
    return nameMatches || (hasChildren && depth <= 2);
  }

  /**
   * Determina se um elemento deve ser mostrado como opção para o usuário decidir
   */
  private static shouldShowAsOption(node: FigmaNode, depth: number): boolean {
    // Não mostrar elementos muito profundos (provavelmente internos)
    if (depth > 5) return false;
    
    // Tipos de elementos que podem ser interessantes
    const interestingTypes = ['TEXT', 'RECTANGLE', 'ELLIPSE', 'VECTOR', 'FRAME', 'GROUP', 'LINE'];
    if (!interestingTypes.includes(node.type)) return false;
    
    // Pular elementos com nomes que começam com underscore (convenção de oculto)
    if (node.name.startsWith('_')) return false;
    
    // Verificar tamanho mínimo (evitar elementos muito pequenos/decorativos)
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      if (width < 5 || height < 5) return false;
    }
    
    // Incluir a maioria dos elementos para dar controle ao usuário
    console.log(`📋 Considerando elemento como opção: "${node.name}" (${node.type}, depth: ${depth})`);
    return true;
  }

  /**
   * Determina se um elemento TEXT está usando tokens do Design System
   * CRITÉRIO RIGOROSO: Precisa ter TANTO token de texto QUANTO cor do DS
   */
  private static isTextUsingDesignSystemTokens(node: FigmaNode): boolean {
    // PRIMEIRO: Vamos logar TODAS as propriedades do nó TEXT para debug
    console.log(`🔍 DEBUG: Propriedades completas do nó TEXT "${node.name}":`, node);

    // LOGS DETALHADOS INDIVIDUAIS - usando try/catch para evitar erros
    try {
      console.log(`📋 textStyleId:`, node.textStyleId);
      console.log(`📋 fillStyleId:`, node.fillStyleId);
      console.log(`📋 styles (API REST):`, node.styles);
      console.log(`📋 fills (length):`, node.fills ? node.fills.length : 'undefined');
      console.log(`📋 fills (content):`, node.fills);
      console.log(`📋 boundVariables:`, node.boundVariables);
      console.log(`📋 Todas as propriedades:`, Object.keys(node));
      
      // Verificar se há propriedades relacionadas a estilo que podem ter nomes diferentes
      const possibleStyleProperties = [
        'textStyleId', 'fillStyleId', 'style', 'styles', 'textStyle', 'fillStyle',
        'styleId', 'textStyles', 'fillStyles', 'boundVariables', 'variables'
      ];
      
      console.log(`📋 Propriedades de estilo encontradas:`);
      possibleStyleProperties.forEach(prop => {
        if (node.hasOwnProperty(prop)) {
          console.log(`   - ${prop}:`, (node as any)[prop]);
        }
      });
      
    } catch (error) {
      console.log(`❌ Erro ao logar propriedades:`, error);
    }

    let hasTextToken = false;
    let hasColorToken = false;

    // 1. VERIFICAR TOKENS DE TEXTO (tipografia, fonte, etc.)
    
    // Plugin API - textStyleId
    if (node.textStyleId && node.textStyleId.trim() !== '') {
      console.log(`📝 Texto "${node.name}" tem textStyleId: ${node.textStyleId}`);
      hasTextToken = true;
    }
    
    // REST API - styles.text
    if (node.styles && node.styles.text && node.styles.text.trim() !== '') {
      console.log(`📝 Texto "${node.name}" tem styles.text: ${node.styles.text}`);
      hasTextToken = true;
    }

    // Verificar boundVariables relacionadas a texto
    if (node.boundVariables && Object.keys(node.boundVariables).length > 0) {
      const textRelatedFields = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];
      const hasTextVariables = textRelatedFields.some(field => 
        node.boundVariables && node.boundVariables[field]
      );
      
      if (hasTextVariables) {
        console.log(`📝 Texto "${node.name}" tem variáveis de texto:`, 
          Object.keys(node.boundVariables).filter(key => textRelatedFields.includes(key))
        );
        hasTextToken = true;
      }
    }

    // 2. VERIFICAR TOKENS DE COR (fill, stroke, etc.)
    
    // Plugin API - fillStyleId
    if (node.fillStyleId && node.fillStyleId.trim() !== '') {
      console.log(`🎨 Texto "${node.name}" tem fillStyleId: ${node.fillStyleId}`);
      hasColorToken = true;
    }
    
    // REST API - styles.fill
    if (node.styles && node.styles.fill && node.styles.fill.trim() !== '') {
      console.log(`🎨 Texto "${node.name}" tem styles.fill: ${node.styles.fill}`);
      hasColorToken = true;
    }

    // Verificar fills com variáveis vinculadas
    if (node.fills && Array.isArray(node.fills)) {
      console.log(`🔍 Analisando ${node.fills.length} fills...`);
      
      const fillsWithVariables = node.fills.some(fill => 
        fill.boundVariables && Object.keys(fill.boundVariables).length > 0
      );
      
      if (fillsWithVariables) {
        console.log(`🎨 Texto "${node.name}" tem fills com variáveis:`, 
          node.fills.filter(fill => fill.boundVariables)
        );
        hasColorToken = true;
      }
      
      // Verificar se há fillStyleId nos fills individuais
      const fillsWithStyleId = node.fills.some(fill => 
        (fill as any).styleId || (fill as any).fillStyleId
      );
      
      if (fillsWithStyleId) {
        console.log(`🎨 Texto "${node.name}" tem fills com styleId`);
        hasColorToken = true;
      }
    }

    // Verificar boundVariables relacionadas a cor
    if (node.boundVariables && Object.keys(node.boundVariables).length > 0) {
      const colorRelatedFields = ['fills', 'strokes', 'textRangeFills'];
      const hasColorVariables = colorRelatedFields.some(field => 
        node.boundVariables && node.boundVariables[field]
      );
      
      if (hasColorVariables) {
        console.log(`🎨 Texto "${node.name}" tem variáveis de cor:`, 
          Object.keys(node.boundVariables).filter(key => colorRelatedFields.includes(key))
        );
        hasColorToken = true;
      }
    }

    // ESTRATÉGIA ALTERNATIVA: Se não encontrou tokens, mas o texto tem fills com cores específicas
    // Pode indicar que está usando um sistema de cores mesmo sem tokens explícitos
    if (!hasColorToken && node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
      console.log(`🔍 Verificando fills para cores do sistema...`);
      // Por enquanto, vamos assumir que qualquer fill indica algum tipo de estilo
      // Isso pode ser refinado depois baseado em cores específicas do DS
    }

    // 3. RESULTADO FINAL
    const isConnected = hasTextToken && hasColorToken;
    
    if (isConnected) {
      console.log(`✅ Texto "${node.name}" CONECTADO - tem texto token (${hasTextToken}) E cor token (${hasColorToken})`);
    } else {
      console.log(`❌ Texto "${node.name}" DESCONECTADO - texto token: ${hasTextToken}, cor token: ${hasColorToken}`);
      if (!hasTextToken) {
        console.log(`   ⚠️ Faltando: token de texto (textStyleId/styles.text ou variáveis de tipografia)`);
      }
      if (!hasColorToken) {
        console.log(`   ⚠️ Faltando: token de cor (fillStyleId/styles.fill ou variáveis de cor)`);
      }
    }

    return isConnected;
  }

  /**
   * Determina se um elemento TEXT deve ser incluído na análise
   * Lógica mais permissiva e inclusiva para textos
   */
  private static shouldIncludeTextComponent(node: FigmaNode, depth: number): boolean {
    // Incluir textos até profundidade 6 (mais permissivo que outros elementos)
    if (depth > 6) {
      console.log(`🚫 Texto muito profundo: "${node.name}" (depth: ${depth})`);
      return false;
    }
    
    // Verificar tamanho - critérios bem mais flexíveis para textos
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      
      // Aceitar textos muito pequenos (podem ser labels importantes)
      if (width < 5 || height < 5) {
        console.log(`🚫 Texto muito pequeno: "${node.name}" (${width}x${height}px)`);
        return false;
      }
      
      // Limite superior bem alto para textos (podem ser títulos grandes)
      if (width > 1200 || height > 400) {
        console.log(`🚫 Texto muito grande: "${node.name}" (${width}x${height}px)`);
        return false;
      }
    }

    // Padrões de texto que devem ser INCLUÍDOS
    const includePatterns = [
      // Componentes de texto
      /component/i, /element/i, /widget/i,
      // Tipos de texto importantes
      /title/i, /heading/i, /header/i, /label/i, /caption/i, /subtitle/i,
      // Texto de interface
      /button/i, /link/i, /menu/i, /nav/i, /tab/i,
      // Conteúdo específico
      /capa/i, /teste/i, /demo/i, /example/i, /sample/i,
      // Textos numerados
      /text \d+/i, /texto \d+/i,
      // Nomes que sugerem conteúdo importante
      /main/i, /primary/i, /secondary/i, /content/i
    ];

    const nameMatchesInclude = includePatterns.some(pattern => pattern.test(node.name));
    
    if (nameMatchesInclude) {
      console.log(`✅ Texto incluído por padrão de nome: "${node.name}"`);
      return true;
    }

    // Padrões de texto que devem ser EXCLUÍDOS (bem específicos)
    const excludePatterns = [
      // Textos claramente decorativos ou placeholders
      /^placeholder$/i, /^lorem ipsum$/i, /^sample text$/i,
      // Textos gerados automaticamente pelo Figma que são vazios
      /^text$/i, /^label$/i, /^caption$/i,
      // Apenas se forem exatamente esses nomes
    ];

    const nameMatchesExclude = excludePatterns.some(pattern => {
      // Usar match exato para padrões de exclusão
      const exactMatch = pattern.test(node.name) && pattern.test(node.name.trim());
      return exactMatch && node.name.trim().length < 15; // Só excluir se for curto e exato
    });

    if (nameMatchesExclude) {
      console.log(`🚫 Texto excluído por ser placeholder/decorativo: "${node.name}"`);
      return false;
    }

    // NOVA ESTRATÉGIA: Ser MUITO mais inclusivo
    // Incluir praticamente todos os textos que não foram explicitamente excluídos
    
    // Se chegou até aqui, incluir se:
    // 1. Não é muito profundo (já verificado)
    // 2. Tem tamanho razoável (já verificado)  
    // 3. Não foi explicitamente excluído (já verificado)
    
    console.log(`📝 Texto incluído por critérios gerais: "${node.name}" (depth: ${depth})`);
    return true;
  }

  /**
   * Calcula prioridade baseada no tipo e características do componente
   */
  private static calculatePriority(node: FigmaNode): number {
    if (node.type === 'INSTANCE') return 1;
    if (node.type === 'COMPONENT') return 2;
    return 3;
  }

  /**
   * Categoriza componentes por tipo
   */
  static categorizeComponents(components: ComponentAnalysis[]): Record<string, ComponentAnalysis[]> {
    const categories: Record<string, ComponentAnalysis[]> = {
      connected: [],
      disconnected: []
    };

    components.forEach(component => {
      if (component.isConnectedToDS) {
        categories.connected.push(component);
      } else {
        categories.disconnected.push(component);
      }
    });

    return categories;
  }

  /**
   * Obtém sugestões de componentes que podem ter sido perdidos
   */
  static getSuggestedMissedComponents(frameNode: FigmaNode): { name: string; type: string; nodeId: string }[] {
    const suggestions: { name: string; type: string; nodeId: string }[] = [];
    
    const findPotentialComponents = (node: FigmaNode, depth: number) => {
      if (depth > 0 && !node.name.startsWith('_')) {
        // Sugerir elementos que podem ser componentes mas não foram incluídos
        if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'VECTOR') {
          // Verificar se tem tamanho significativo
          if (node.absoluteBoundingBox && 
              node.absoluteBoundingBox.width > 10 && 
              node.absoluteBoundingBox.height > 10) {
            suggestions.push({
              name: node.name,
              type: node.type,
              nodeId: node.id
            });
          }
        }
      }
      
      if (node.children && node.type !== 'INSTANCE') {
        node.children.forEach(child => findPotentialComponents(child, depth + 1));
      }
    };
    
    findPotentialComponents(frameNode, 0);
    
    // Remover duplicatas e limitar a 10 sugestões
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.name === suggestion.name)
    ).slice(0, 10);
    
    return uniqueSuggestions;
  }
} 