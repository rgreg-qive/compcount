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

    // Para outros tipos de node, verificar se devem ser incluídos baseado nas regras OU características
    if (ruleResult.shouldInclude && (node.type === 'RECTANGLE' || node.type === 'TEXT' || node.type === 'ELLIPSE' || node.type === 'VECTOR')) {
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
    
    // NOVA LÓGICA: Detectar automaticamente possíveis componentes desconectados
    // Incluir elementos que parecem ser componentes visuais importantes mas não estão no DS
    else if (this.shouldIncludeAsDisconnectedComponent(node, depth)) {
      console.log(`🔶 Auto-detectado como componente desconectado: "${node.name}" (${node.type})`);
      
      components.push({
        name: node.name,
        type: 'OTHER',
        isConnectedToDS: false, // Sempre desconectado para auto-detectados
        priority: this.calculatePriority(node),
        nodeId: node.id,
        depth
      });
    }

    // Para outros tipos, processar filhos recursivamente
    if (node.children) {
      node.children.forEach(child => {
        // Pular TEXT nodes que são filhos de INSTANCE
        if (child.type === 'TEXT' && node.type === 'INSTANCE') {
          return;
        }
        
        this.extractComponents(child, components, depth + 1);
      });
    }
  }

  /**
   * Filtra componentes relevantes para a análise
   */
  private static filterRelevantComponents(components: ComponentAnalysis[]): ComponentAnalysis[] {
    return components.filter(component => {
      // Incluir INSTANCE e COMPONENT sempre
      if (component.type === 'INSTANCE' || component.type === 'COMPONENT') {
        return true;
      }
      
      // Para OTHER, incluir apenas se foi especificamente incluído por regras
      return component.type === 'OTHER';
    });
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
      // Muito pequeno = provavelmente decorativo
      if (width < 20 || height < 20) return false;
      // Muito grande = provavelmente container
      if (width > 500 || height > 500) return false;
    }
    
    // Incluir se o nome sugere que é um componente
    const componentLikeNames = [
      /button/i, /btn/i, /card/i, /modal/i, /popup/i, /tooltip/i,
      /input/i, /field/i, /form/i, /checkbox/i, /radio/i,
      /icon/i, /avatar/i, /badge/i, /chip/i, /tag/i,
      /header/i, /footer/i, /sidebar/i, /menu/i, /nav/i,
      /component/i, /element/i, /widget/i,
      /rectangle \d+/i, /ellipse \d+/i, /vector \d+/i // Elementos numerados como Rectangle 6190
    ];
    
    const nameMatches = componentLikeNames.some(pattern => pattern.test(node.name));
    
    // Incluir se tem filhos (pode ser um componente complexo)
    const hasChildren = !!(node.children && node.children.length > 0);
    
    // Incluir se parece ser um componente baseado no nome OU se tem estrutura complexa
    return nameMatches || (hasChildren && depth <= 2);
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