import type { LearningPattern, UserFeedback, AnalysisRule } from '../types/figma.ts';

export class LearningService {
  private static readonly STORAGE_KEY = 'figma-component-analysis-patterns';
  private static readonly TOKEN_KEY = 'figma-token';
  private static readonly RULES_KEY = 'figma-analysis-rules';

  /**
   * Salva padrão de análise no localStorage
   */
  static savePattern(pattern: LearningPattern): void {
    const patterns = this.getPatterns();
    
    // Remover padrão existente para o mesmo frame
    const filteredPatterns = patterns.filter(p => p.frameId !== pattern.frameId);
    
    // Adicionar novo padrão
    filteredPatterns.push(pattern);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPatterns));
  }

  /**
   * Recupera todos os padrões salvos
   */
  static getPatterns(): LearningPattern[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao recuperar padrões:', error);
      return [];
    }
  }

  /**
   * Busca padrão específico por frame ID
   */
  static getPatternByFrameId(frameId: string): LearningPattern | null {
    const patterns = this.getPatterns();
    return patterns.find(p => p.frameId === frameId) || null;
  }

  /**
   * Adiciona feedback do usuário a um padrão
   */
  static addFeedbackToPattern(frameId: string, feedback: UserFeedback): void {
    const patterns = this.getPatterns();
    const patternIndex = patterns.findIndex(p => p.frameId === frameId);
    
    if (patternIndex !== -1) {
      if (!patterns[patternIndex].feedback) {
        patterns[patternIndex].feedback = [];
      }
      patterns[patternIndex].feedback!.push(feedback);
      
      // Gerar regras baseadas no feedback
      const newRules = this.generateRulesFromFeedback(feedback);
      if (newRules.length > 0) {
        this.saveAnalysisRules(newRules);
        if (!patterns[patternIndex].analysisRules) {
          patterns[patternIndex].analysisRules = [];
        }
        patterns[patternIndex].analysisRules!.push(...newRules);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patterns));
      
      // Salvar feedback automaticamente em arquivo para compartilhamento
      this.autoSaveFeedbackToFile(frameId, feedback);
    }
  }

  /**
   * Salva automaticamente feedback em arquivo para compartilhamento
   */
  private static autoSaveFeedbackToFile(frameId: string, feedback: UserFeedback): void {
    const feedbackData = {
      timestamp: new Date().toISOString(),
      frameId,
      feedback,
      userAgent: navigator.userAgent,
      sessionId: this.getOrCreateSessionId()
    };

    // Salvar em formato JSON para facilitar consolidação
    const filename = `figma-feedback-${frameId}-${Date.now()}.json`;
    const jsonContent = JSON.stringify(feedbackData, null, 2);
    
    this.downloadFile(jsonContent, filename, 'application/json');
    
    console.log('📤 Feedback salvo automaticamente:', filename);
  }

  /**
   * Gera ou recupera ID de sessão único
   */
  private static getOrCreateSessionId(): string {
    const SESSION_KEY = 'figma-analysis-session-id';
    let sessionId = localStorage.getItem(SESSION_KEY);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Gera regras de análise baseadas no feedback do usuário
   */
  private static generateRulesFromFeedback(feedback: UserFeedback): AnalysisRule[] {
    const rules: AnalysisRule[] = [];
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    switch (feedback.type) {
      case 'missed_component':
        if (feedback.componentName) {
          rules.push({
            id: ruleId,
            type: 'include',
            condition: {
              nodeName: feedback.componentName
            },
            action: {
              classify: feedback.expectedClassification || 'disconnected'
            },
            confidence: 0.8,
            source: 'user_feedback',
            createdAt: Date.now()
          });

          // Regra adicional para padrões similares
          if (feedback.componentName.includes('Rectangle')) {
            rules.push({
              id: `${ruleId}_pattern`,
              type: 'include',
              condition: {
                namePattern: 'Rectangle.*'
              },
              action: {
                classify: feedback.expectedClassification || 'disconnected'
              },
              confidence: 0.6,
              source: 'user_feedback',
              createdAt: Date.now()
            });
          }
        }
        break;

      case 'wrong_classification':
        if (feedback.componentName) {
          rules.push({
            id: ruleId,
            type: 'classify',
            condition: {
              nodeName: feedback.componentName
            },
            action: {
              classify: feedback.expectedClassification || 'disconnected'
            },
            confidence: 0.9,
            source: 'user_feedback',
            createdAt: Date.now()
          });
        }
        break;

      case 'should_ignore':
        if (feedback.componentName) {
          rules.push({
            id: ruleId,
            type: 'exclude',
            condition: {
              nodeName: feedback.componentName
            },
            action: {
              ignore: true
            },
            confidence: 0.9,
            source: 'user_feedback',
            createdAt: Date.now()
          });
        }
        break;
    }

    return rules;
  }

  /**
   * Salva regras de análise
   */
  static saveAnalysisRules(newRules: AnalysisRule[]): void {
    const existingRules = this.getAnalysisRules();
    const allRules = [...existingRules, ...newRules];
    
    // Remover regras duplicadas baseado no ID
    const uniqueRules = allRules.filter((rule, index, self) => 
      index === self.findIndex(r => r.id === rule.id)
    );
    
    localStorage.setItem(this.RULES_KEY, JSON.stringify(uniqueRules));
  }

  /**
   * Recupera regras de análise
   */
  static getAnalysisRules(): AnalysisRule[] {
    try {
      const stored = localStorage.getItem(this.RULES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao recuperar regras:', error);
      return [];
    }
  }

  /**
   * Aplica regras de análise a um nome de componente
   */
  static applyRulesToComponent(componentName: string, nodeType: string): {
    shouldInclude: boolean;
    classification?: 'connected' | 'disconnected';
    shouldIgnore: boolean;
    appliedRules: AnalysisRule[];
  } {
    const rules = this.getAnalysisRules();
    const appliedRules: AnalysisRule[] = [];
    let shouldInclude = false;
    let classification: 'connected' | 'disconnected' | undefined;
    let shouldIgnore = false;

    // Ordenar regras por confiança (maior confiança primeiro)
    const sortedRules = rules.sort((a, b) => b.confidence - a.confidence);

    for (const rule of sortedRules) {
      let matches = false;

      // Verificar condições
      if (rule.condition.nodeName && rule.condition.nodeName === componentName) {
        matches = true;
      } else if (rule.condition.namePattern) {
        const regex = new RegExp(rule.condition.namePattern);
        if (regex.test(componentName)) {
          matches = true;
        }
      } else if (rule.condition.nodeType && rule.condition.nodeType === nodeType) {
        matches = true;
      }

      if (matches) {
        appliedRules.push(rule);

        // Aplicar ações
        if (rule.action.ignore) {
          shouldIgnore = true;
          break; // Ignorar tem prioridade máxima
        }

        if (rule.action.classify) {
          classification = rule.action.classify;
        }

        if (rule.type === 'include') {
          shouldInclude = true;
        }
      }
    }

    return {
      shouldInclude,
      classification,
      shouldIgnore,
      appliedRules
    };
  }

  /**
   * Inicializa padrões conhecidos (dados de treinamento)
   */
  static initializeKnownPatterns(): void {
    const existingPatterns = this.getPatterns();
    
    // Se já tem padrões, não sobrescrever
    if (existingPatterns.length > 0) {
      return;
    }

    const knownPatterns: LearningPattern[] = [
      {
        frameId: '8287:54836',
        frameUrl: 'https://www.figma.com/design/Ibss9YekrWOz9EbjaNBcB5/Gera%C3%A7%C3%A3o-e-leitura-do-CNAB?node-id=8287-54836',
        timestamp: Date.now(),
        components: { connected: 1, disconnected: 0 }
      },
      {
        frameId: '8287:53586',
        frameUrl: 'https://www.figma.com/design/Ibss9YekrWOz9EbjaNBcB5/Gera%C3%A7%C3%A3o-e-leitura-do-CNAB?node-id=8287-53586',
        timestamp: Date.now(),
        components: { connected: 0, disconnected: 1 }
      },
      {
        frameId: '8287:54843',
        frameUrl: 'https://www.figma.com/design/Ibss9YekrWOz9EbjaNBcB5/Gera%C3%A7%C3%A3o-e-leitura-do-CNAB?node-id=8287-54843',
        timestamp: Date.now(),
        components: { connected: 1, disconnected: 1 }
      }
    ];

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(knownPatterns));
  }

  /**
   * Salva token do Figma no localStorage
   */
  static saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Recupera token do Figma do localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Remove token do localStorage
   */
  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Exporta dados para CSV
   */
  static exportToCsv(components: any[], _frameInfo?: any): string {
    const headers = [
      'Nome do Componente',
      'Tipo',
      'Conectado ao DS',
      'Prioridade',
      'Node ID'
    ];

    const rows = components.map(component => [
      component.name,
      component.type,
      component.isConnectedToDS ? 'Sim' : 'Não',
      component.priority,
      component.nodeId
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Faz download do CSV
   */
  static downloadCsv(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Faz download de arquivo genérico
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Exporta todos os dados de aprendizado para compartilhamento
   */
  static exportAllLearningData(): void {
    const patterns = this.getPatterns();
    const rules = this.getAnalysisRules();
    const stats = this.getLearningStats();
    
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        sessionId: this.getOrCreateSessionId(),
        userAgent: navigator.userAgent
      },
      statistics: stats,
      patterns,
      rules
    };

    const filename = `figma-learning-data-export-${Date.now()}.json`;
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    this.downloadFile(jsonContent, filename, 'application/json');
    
    console.log('📦 Dados de aprendizado exportados:', filename);
  }

  /**
   * Limpa todos os dados salvos
   */
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.RULES_KEY);
  }

  /**
   * Obtém estatísticas do sistema de aprendizado
   */
  static getLearningStats(): {
    totalPatterns: number;
    totalFeedbacks: number;
    totalRules: number;
    rulesBreakdown: Record<string, number>;
  } {
    const patterns = this.getPatterns();
    const rules = this.getAnalysisRules();
    
    const totalFeedbacks = patterns.reduce((sum, pattern) => 
      sum + (pattern.feedback?.length || 0), 0
    );

    const rulesBreakdown = rules.reduce((breakdown, rule) => {
      breakdown[rule.type] = (breakdown[rule.type] || 0) + 1;
      return breakdown;
    }, {} as Record<string, number>);

    return {
      totalPatterns: patterns.length,
      totalFeedbacks,
      totalRules: rules.length,
      rulesBreakdown
    };
  }
} 