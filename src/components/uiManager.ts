import type { AnalysisResult, ComponentAnalysis, UserFeedback } from '../types/figma.ts';
import { ComponentAnalyzer } from '../services/componentAnalyzer.ts';
import { LearningService } from '../services/learningService.ts';
import { ChartManager } from './chartManager.ts';

export class UIManager {
  private chartManager: ChartManager | null = null;

  /**
   * Define o ChartManager para atualização dos gráficos
   */
  setChartManager(chartManager: ChartManager): void {
    this.chartManager = chartManager;
  }
  /**
   * Atualiza os cards de resumo
   */
  updateSummaryCards(_result?: AnalysisResult): void {
    // CORREÇÃO: Não usar os totais do result diretamente
    // Aguardar configuração dos toggles e depois recalcular
    
    const cards = document.querySelectorAll('.summary-card');
    
    if (cards.length >= 3) {
      // Inicializar com zeros - será atualizado após setupToggleListeners
      const connectedValue = cards[0].querySelector('.summary-value');
      if (connectedValue) {
        connectedValue.textContent = '0';
      }

      const disconnectedValue = cards[1].querySelector('.summary-value');
      if (disconnectedValue) {
        disconnectedValue.textContent = '0';
      }

      const totalValue = cards[2].querySelector('.summary-value');
      if (totalValue) {
        totalValue.textContent = '0';
      }
    }

    // Inicializar também os elementos do resumo lateral com zeros
    const connectedCount = document.getElementById('connected-count');
    if (connectedCount) {
      connectedCount.textContent = '0';
    }

    const disconnectedCount = document.getElementById('disconnected-count');
    if (disconnectedCount) {
      disconnectedCount.textContent = '0';
    }

    const complianceRate = document.getElementById('compliance-rate');
    const complianceStatus = document.getElementById('compliance-status');
    if (complianceRate && complianceStatus) {
      complianceRate.textContent = '0%';
      complianceStatus.textContent = 'Aguardando...';
      complianceStatus.className = 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
      complianceStatus.classList.remove('hidden');
    }

    console.log('📊 Cards de resumo inicializados com zeros - aguardando cálculo dos toggles');
  }

  /**
   * Atualiza a tabela de componentes
   */
  updateComponentsTable(result: AnalysisResult): void {
    const tableBody = document.getElementById('components-table-body');
    if (!tableBody) return;

    const categories = ComponentAnalyzer.categorizeComponents(result.components);
    
    // Limpar tabela
    tableBody.innerHTML = '';

    // Adicionar componentes conectados
    categories.connected.forEach(component => {
      const row = this.createComponentRow(component, true, result.frameInfo.url);
      tableBody.appendChild(row);
    });

    // Adicionar componentes desconectados
    categories.disconnected.forEach(component => {
      const row = this.createComponentRow(component, false, result.frameInfo.url);
      tableBody.appendChild(row);
    });

    // Configurar event listeners dos toggles
    this.setupToggleListeners();
    
    // CORREÇÃO: Recalcular estatísticas após configurar toggles
    // Aguardar um pouco para garantir que os toggles estejam prontos
    setTimeout(() => {
      this.recalculateStats();
      console.log('📊 Estatísticas recalculadas automaticamente após configurar toggles');
    }, 100);
  }

  /**
   * Cria uma linha da tabela para um componente
   */
  private createComponentRow(component: ComponentAnalysis, isConnected: boolean, frameUrl: string): HTMLTableRowElement {
    const row = document.createElement('tr');
    row.className = 'border-b border-gray-200 hover:bg-gray-50';

    const statusBadge = isConnected 
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Conectado</span>'
      : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Desconectado</span>';

    // Criar toggle para incluir/excluir da análise
    // Estado inicial baseado na importância: INSTANCE, COMPONENT e elementos com nomes de DS
    const hasDesignSystemName = this.hasDesignSystemLikeName(component.name);
    const isImportantByDefault = component.type === 'INSTANCE' || component.type === 'COMPONENT' || hasDesignSystemName;
    const toggleId = `toggle-${component.nodeId.replace(':', '-')}`;
    const checkedAttribute = isImportantByDefault ? 'checked' : '';
    
    const includeToggle = `
      <label class="relative inline-flex items-center cursor-pointer justify-center">
        <input type="checkbox" id="${toggleId}" class="sr-only peer component-toggle" ${checkedAttribute} data-node-id="${component.nodeId}">
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
      </label>
    `;
    
    // Log do estado inicial para debug
    const reason = component.type === 'INSTANCE' ? 'INSTANCE' : 
                   component.type === 'COMPONENT' ? 'COMPONENT' : 
                   hasDesignSystemName ? 'NOME_DS' : 'OUTROS';
    console.log(`🔘 Toggle para "${component.name}" (${component.type}): ${isImportantByDefault ? 'LIGADO' : 'DESLIGADO'} por padrão (motivo: ${reason})`);

    // Criar link direto para o elemento no Figma
    const figmaElementUrl = this.createFigmaElementUrl(frameUrl, component.nodeId);
    const nodeIdLink = figmaElementUrl 
      ? `<a href="${figmaElementUrl}" target="_blank" class="text-red-600 hover:text-red-800 underline font-mono text-sm" title="Abrir elemento no Figma">${component.nodeId} 🔗</a>`
      : `<span class="font-mono text-sm text-gray-500">${component.nodeId}</span>`;

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${component.name}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${component.type}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${statusBadge}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${nodeIdLink}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${includeToggle}
      </td>
    `;

    return row;
  }

  /**
   * Cria URL para um elemento específico no Figma
   */
  private createFigmaElementUrl(frameUrl: string, nodeId: string): string | null {
    try {
      const url = new URL(frameUrl);
      // Converter nodeId de formato "123:456" para "123-456" (formato URL do Figma)
      const urlNodeId = nodeId.replace(':', '-');
      url.searchParams.set('node-id', urlNodeId);
      return url.toString();
    } catch (error) {
      console.error('Erro ao criar URL do elemento Figma:', error);
      return null;
    }
  }

  /**
   * Configura event listeners para os toggles de componentes
   */
  private setupToggleListeners(): void {
    const toggles = document.querySelectorAll('.component-toggle');
    
    toggles.forEach(toggle => {
      toggle.addEventListener('change', () => {
        this.recalculateStats();
      });
    });
  }

  /**
   * Recalcula as estatísticas baseado nos toggles ativos
   */
  private recalculateStats(): void {
    const toggles = document.querySelectorAll('.component-toggle') as NodeListOf<HTMLInputElement>;
    let connected = 0;
    let disconnected = 0;

    console.log(`🔄 Recalculando estatísticas... ${toggles.length} toggles encontrados`);

    toggles.forEach(toggle => {
      if (!toggle.checked) {
        console.log(`⏭️ Toggle desabilitado para nodeId: ${toggle.dataset.nodeId}`);
        return; // Pular se toggle está desabilitado
      }

      // Encontrar a linha da tabela correspondente
      const row = toggle.closest('tr');
      if (!row) {
        console.log(`❌ Linha não encontrada para toggle: ${toggle.dataset.nodeId}`);
        return;
      }

      // Verificar se é conectado ou desconectado pelo badge
      const statusBadges = row.querySelectorAll('span');
      let isConnected = false;
      
      statusBadges.forEach(badge => {
        if (badge.textContent?.includes('Conectado')) {
          isConnected = true;
        }
      });

      if (isConnected) {
        connected++;
        console.log(`✅ Componente conectado contabilizado: ${toggle.dataset.nodeId}`);
      } else {
        disconnected++;
        console.log(`❌ Componente desconectado contabilizado: ${toggle.dataset.nodeId}`);
      }
    });

    console.log(`📊 Resultado final: ${connected} conectados, ${disconnected} desconectados`);

    // Atualizar os cards de resumo
    this.updateSummaryCardsWithCustomValues(connected, disconnected);

    // Atualizar a seção "Resumo da Análise"
    this.updateAnalysisSummary(connected, disconnected);

    // Atualizar o gráfico se disponível
    if (this.chartManager) {
      this.chartManager.updatePieChartWithValues(connected, disconnected);
    }
  }

  /**
   * Atualiza os cards de resumo com valores customizados
   */
  private updateSummaryCardsWithCustomValues(connected: number, disconnected: number): void {
    const summaryCards = document.querySelectorAll('.summary-card .summary-value');
    
    if (summaryCards.length >= 3) {
      (summaryCards[0] as HTMLElement).textContent = connected.toString();
      (summaryCards[1] as HTMLElement).textContent = disconnected.toString();
      (summaryCards[2] as HTMLElement).textContent = (connected + disconnected).toString();
    }
  }

  /**
   * Atualiza a seção "Resumo da Análise" com valores customizados
   */
  private updateAnalysisSummary(connected: number, disconnected: number): void {
    const connectedCountElement = document.getElementById('connected-count');
    const disconnectedCountElement = document.getElementById('disconnected-count');
    const complianceRateElement = document.getElementById('compliance-rate');
    const complianceStatusElement = document.getElementById('compliance-status');

    if (connectedCountElement) {
      connectedCountElement.textContent = connected.toString();
    }

    if (disconnectedCountElement) {
      disconnectedCountElement.textContent = disconnected.toString();
    }

    if (complianceRateElement && complianceStatusElement) {
      const total = connected + disconnected;
      const complianceRate = total > 0 ? Math.round((connected / total) * 100) : 0;
      complianceRateElement.textContent = `${complianceRate}%`;

      // Atualizar tag de status baseado na taxa de conformidade
      if (complianceRate >= 80) {
        complianceStatusElement.textContent = 'Aprovado';
        complianceStatusElement.className = 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800';
      } else {
        complianceStatusElement.textContent = 'Revisar';
        complianceStatusElement.className = 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
      }
      
      complianceStatusElement.classList.remove('hidden');
    }

    console.log(`📊 Resumo da Análise atualizado: ${connected} conectados, ${disconnected} desconectados`);
  }

  /**
   * Mostra/esconde indicador de carregamento
   */
  toggleLoadingState(show: boolean): void {
    const statusDiv = document.getElementById('analysis-status');
    if (statusDiv) {
      statusDiv.classList.toggle('hidden', !show);
    }
  }

  /**
   * Mostra/esconde dropdown de relatórios
   */
  toggleReportDropdown(show: boolean): void {
    const dropdown = document.getElementById('report-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden', !show);
    }
  }

  /**
   * Configura o dropdown de relatórios
   */
  setupReportDropdown(): void {
    const dropdownButton = document.getElementById('generate-report-btn');
    const dropdownMenu = document.getElementById('report-dropdown-menu');
    
    if (!dropdownButton || !dropdownMenu) return;

    // Toggle dropdown
    dropdownButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !dropdownMenu.classList.contains('hidden');
      dropdownMenu.classList.toggle('hidden', isOpen);
      dropdownButton.setAttribute('aria-expanded', (!isOpen).toString());
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
      dropdownMenu.classList.add('hidden');
      dropdownButton.setAttribute('aria-expanded', 'false');
    });

    // Configurar opções do menu
    this.setupReportOptions();
  }

  /**
   * Configura as opções de relatório
   */
  private setupReportOptions(): void {
    // PNG Export (WIP)
    const pngBtn = document.getElementById('export-png');
    if (pngBtn) {
      pngBtn.addEventListener('click', () => this.showWipMessage('PNG'));
    }

    // PDF Export (WIP)
    const pdfBtn = document.getElementById('export-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => this.showWipMessage('PDF'));
    }

    // Generate Link (Funcional)
    const linkBtn = document.getElementById('generate-link');
    if (linkBtn) {
      linkBtn.addEventListener('click', () => this.generateShareableLink());
    }

    // Checklist Export (WIP)
    const checklistBtn = document.getElementById('export-checklist');
    if (checklistBtn) {
      checklistBtn.addEventListener('click', () => this.showWipMessage('Checklist'));
    }
  }

  /**
   * Mostra mensagem para funcionalidades em desenvolvimento
   */
  private showWipMessage(feature: string): void {
    this.showError(`🚧 ${feature} em desenvolvimento! Use "Gerar Link" por enquanto.`);
  }

  /**
   * Gera link compartilhável com dados completos da análise atual
   */
  private generateShareableLink(): void {
    try {
      // Verificar se há análise atual
      if (!this.currentAnalysisResult) {
        this.showError('Nenhuma análise disponível para compartilhar');
        return;
      }

      // Coletar dados básicos da interface
      const connectedCount = document.getElementById('connected-count')?.textContent || '0';
      const disconnectedCount = document.getElementById('disconnected-count')?.textContent || '0';
      const complianceRate = document.getElementById('compliance-rate')?.textContent || '0%';
      const complianceStatus = document.getElementById('compliance-status')?.textContent || '';
      
      // Criar ID único para esta análise
      const analysisId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Coletar componentes excluídos (toggles desabilitados)
      const excludedComponents = this.getExcludedComponents();
      
      // Preparar dados completos da análise
      const fullAnalysisData = {
        frameInfo: this.currentAnalysisResult.frameInfo,
        summary: this.currentAnalysisResult.summary,
        components: this.currentAnalysisResult.components,
        excludedComponents: excludedComponents,
        timestamp: Date.now(),
        complianceRate: parseFloat(complianceRate.replace('%', '')),
        complianceStatus: complianceStatus,
        analysisId: analysisId
      };
      
      // Salvar dados completos em múltiplos locais para garantir persistência
      const storageKey = `shared-analysis-${analysisId}`;
      const dataString = JSON.stringify(fullAnalysisData);
      
      try {
        // Tentar localStorage
        localStorage.setItem(storageKey, dataString);
        console.log('✅ Dados salvos no localStorage com chave:', storageKey);
        
        // Também salvar no sessionStorage como backup
        sessionStorage.setItem(storageKey, dataString);
        console.log('✅ Dados salvos no sessionStorage como backup');
        
        // Salvar uma versão com chave alternativa (só o timestamp)
        const altKey = `shared-analysis-${Date.now()}`;
        localStorage.setItem(altKey, dataString);
        console.log('✅ Dados salvos com chave alternativa:', altKey);
        
        // Log dos dados que estão sendo salvos
        console.log('📊 Dados completos sendo salvos:', {
          frameInfo: fullAnalysisData.frameInfo,
          totalComponents: fullAnalysisData.components?.length || 0,
          componentNames: fullAnalysisData.components?.slice(0, 3).map((c: any) => c.name) || [],
          excludedComponents: fullAnalysisData.excludedComponents?.length || 0
        });
        
      } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        this.showError('Erro ao salvar dados da análise');
        return;
      }
      
      // Criar dados compactos para a URL (apenas essenciais)
      const compactData = {
        frameInfo: fullAnalysisData.frameInfo,
        components: fullAnalysisData.components.map((c: any) => ({
          name: c.name,
          type: c.type,
          isConnectedToDS: c.isConnectedToDS,
          nodeId: c.nodeId
        })),
        excludedComponents: fullAnalysisData.excludedComponents?.map((c: any) => ({
          name: c.name,
          type: c.type,
          isConnectedToDS: c.isConnectedToDS,
          nodeId: c.nodeId
        })) || [],
        summary: fullAnalysisData.summary,
        complianceRate: fullAnalysisData.complianceRate,
        complianceStatus: fullAnalysisData.complianceStatus,
        timestamp: fullAnalysisData.timestamp
      };
      
      const compactDataString = JSON.stringify(compactData);
      console.log('📦 Dados compactos:', {
        originalSize: dataString.length,
        compactSize: compactDataString.length,
        reduction: Math.round((1 - compactDataString.length / dataString.length) * 100) + '%'
      });
      
      // SEMPRE incluir dados na URL (prioridade máxima para funcionamento)
      let shareableUrl = '';
      let dataIncluded = false;
      
      try {
        const encodedData = encodeURIComponent(btoa(compactDataString));
        const currentUrl = new URL(window.location.href);
        shareableUrl = `${currentUrl.origin}/view.html?shared=true&id=${analysisId}&data=${encodedData}&connected=${connectedCount}&disconnected=${disconnectedCount}&compliance=${encodeURIComponent(complianceRate)}&status=${encodeURIComponent(complianceStatus)}&timestamp=${Date.now()}`;
        dataIncluded = true;
        
        console.log('✅ URL com dados completos criada (tamanho:', shareableUrl.length, 'chars)');
        console.log('🔗 URL preview:', shareableUrl.substring(0, 150) + '...');
        
      } catch (error) {
        console.error('❌ Erro ao codificar dados:', error);
        // Fallback sem dados codificados
        const currentUrl = new URL(window.location.href);
        shareableUrl = `${currentUrl.origin}/view.html?shared=true&id=${analysisId}&connected=${connectedCount}&disconnected=${disconnectedCount}&compliance=${encodeURIComponent(complianceRate)}&status=${encodeURIComponent(complianceStatus)}&timestamp=${Date.now()}`;
        dataIncluded = false;
        console.log('⚠️ Fallback: URL sem dados codificados');
      }
      
      // Copiar para clipboard
      navigator.clipboard.writeText(shareableUrl).then(() => {
        this.showSuccess('🔗 Link da análise copiado! Compartilhe com sua equipe.');
      }).catch(() => {
        // Fallback para navegadores sem clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareableUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showSuccess('🔗 Link da análise copiado!');
      });
      
      // Log para debug
      console.log('📊 Link gerado com dados completos:', {
        analysisId,
        connected: connectedCount,
        disconnected: disconnectedCount,
        compliance: complianceRate,
        status: complianceStatus,
        url: shareableUrl,
        fullDataSaved: true,
        dataIncluded: dataIncluded,
        urlLength: shareableUrl.length
      });
      
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      this.showError('Erro ao gerar link compartilhável');
    }
  }

  /**
   * Define o resultado da análise atual para uso em outras funcionalidades
   */
  setCurrentAnalysisResult(result: any): void {
    this.currentAnalysisResult = result;
  }

  private currentAnalysisResult: any = null;

  /**
   * Obtém componentes que foram excluídos da análise (toggles desabilitados)
   */
  private getExcludedComponents(): ComponentAnalysis[] {
    const excludedComponents: ComponentAnalysis[] = [];
    
    if (!this.currentAnalysisResult) return excludedComponents;
    
    try {
      const toggles = document.querySelectorAll('.component-toggle') as NodeListOf<HTMLInputElement>;
      
      toggles.forEach(toggle => {
        if (!toggle.checked) {
          // Encontrar o componente correspondente
          const nodeId = toggle.dataset.nodeId;
          const component = this.currentAnalysisResult.components.find((c: ComponentAnalysis) => c.nodeId === nodeId);
          
          if (component) {
            excludedComponents.push(component);
          }
        }
      });
    } catch (error) {
      console.warn('Erro ao coletar componentes excluídos:', error);
    }
    
    return excludedComponents;
  }

  /**
   * Mostra/esconde botão de feedback
   */
  toggleFeedbackButton(show: boolean): void {
    const button = document.getElementById('show-feedback-form');
    if (button) {
      button.classList.toggle('hidden', !show);
    }
  }

  /**
   * Mostra/esconde seções de análise
   */
  toggleAnalysisSections(show: boolean): void {
    const summaryCards = document.getElementById('summary-cards');
    const chartsAnalysis = document.getElementById('charts-analysis');
    const componentsTable = document.getElementById('components-table');

    if (summaryCards) {
      summaryCards.classList.toggle('hidden', !show);
    }
    if (chartsAnalysis) {
      chartsAnalysis.classList.toggle('hidden', !show);
    }
    if (componentsTable) {
      componentsTable.classList.toggle('hidden', !show);
    }
  }

  /**
   * Atualiza contador de padrões conhecidos
   */
  updatePatternsCount(): void {
    const patterns = LearningService.getPatterns();
    
    // Atualizar contador no modal
    const countModalElement = document.getElementById('patterns-count-modal');
    if (countModalElement) {
      countModalElement.textContent = `${patterns.length}`;
    }
  }

  /**
   * Mostra/esconde drawer de feedback detalhado
   */
  toggleDetailedFeedback(show: boolean): void {
    const drawer = document.getElementById('feedback-drawer');
    const drawerContent = document.getElementById('feedback-drawer-content');
    
    if (drawer && drawerContent) {
      if (show) {
        drawer.classList.remove('hidden');
        // Trigger reflow para a animação funcionar
        drawer.offsetHeight;
        drawerContent.classList.remove('translate-x-full');
      } else {
        drawerContent.classList.add('translate-x-full');
        // Aguardar animação antes de esconder
        setTimeout(() => {
          drawer.classList.add('hidden');
        }, 300);
      }
    }
  }

  /**
   * Configura o formulário de feedback baseado no tipo selecionado
   */
  setupFeedbackForm(): void {
    const typeSelect = document.getElementById('feedback-type') as HTMLSelectElement;
    const componentNameField = document.getElementById('component-name-field');
    const expectedClassificationField = document.getElementById('expected-classification-field');

    if (!typeSelect) return;

    typeSelect.addEventListener('change', () => {
      const selectedType = typeSelect.value;
      
      // Mostrar/esconder campos baseado no tipo
      if (componentNameField) {
        componentNameField.classList.toggle('hidden', 
          selectedType !== 'missed_component' && 
          selectedType !== 'wrong_classification' && 
          selectedType !== 'should_ignore'
        );
      }

      if (expectedClassificationField) {
        expectedClassificationField.classList.toggle('hidden', 
          selectedType !== 'missed_component' && 
          selectedType !== 'wrong_classification'
        );
      }
    });
  }

  /**
   * Mostra sugestões de componentes perdidos
   */
  showSuggestedComponents(suggestions: { name: string; type: string; nodeId: string }[]): void {
    const suggestedSection = document.getElementById('suggested-components');
    const suggestionsList = document.getElementById('suggestions-list');

    if (!suggestedSection || !suggestionsList) return;

    if (suggestions.length === 0) {
      suggestedSection.classList.add('hidden');
      return;
    }

    suggestedSection.classList.remove('hidden');
    suggestionsList.innerHTML = '';

    suggestions.forEach(suggestion => {
      const suggestionElement = document.createElement('div');
      suggestionElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100';
      suggestionElement.innerHTML = `
        <div class="flex-1">
          <span class="text-sm font-medium text-gray-900">${suggestion.name}</span>
          <span class="ml-2 text-xs text-gray-500">(${suggestion.type})</span>
        </div>
        <button class="text-xs text-red-600 hover:text-red-800 font-medium">
          Usar este
        </button>
      `;

      // Ao clicar, preencher o formulário
      suggestionElement.addEventListener('click', () => {
        const componentNameInput = document.getElementById('component-name') as HTMLInputElement;
        const feedbackTypeSelect = document.getElementById('feedback-type') as HTMLSelectElement;
        
        if (componentNameInput) {
          componentNameInput.value = suggestion.name;
        }
        if (feedbackTypeSelect) {
          feedbackTypeSelect.value = 'missed_component';
          feedbackTypeSelect.dispatchEvent(new Event('change'));
        }
      });

      suggestionsList.appendChild(suggestionElement);
    });
  }

  /**
   * Atualiza estatísticas do sistema de aprendizado
   */
  updateLearningStats(): void {
    const stats = LearningService.getLearningStats();
    const statsElement = document.getElementById('learning-stats');
    
    if (statsElement) {
      statsElement.textContent = 
        `${stats.totalPatterns} padrões • ${stats.totalFeedbacks} feedbacks • ${stats.totalRules} regras ativas`;
    }
  }

  /**
   * Limpa o formulário de feedback
   */
  clearFeedbackForm(): void {
    const form = document.getElementById('detailed-feedback');
    if (!form) return;

    // Limpar campos
    const typeSelect = form.querySelector('#feedback-type') as HTMLSelectElement;
    const componentName = form.querySelector('#component-name') as HTMLInputElement;
    const expectedClassification = form.querySelector('#expected-classification') as HTMLSelectElement;
    const description = form.querySelector('#feedback-description') as HTMLTextAreaElement;

    if (typeSelect) typeSelect.value = '';
    if (componentName) componentName.value = '';
    if (expectedClassification) expectedClassification.value = '';
    if (description) description.value = '';

    // Esconder campos condicionais
    const componentNameField = document.getElementById('component-name-field');
    const expectedClassificationField = document.getElementById('expected-classification-field');
    
    if (componentNameField) componentNameField.classList.add('hidden');
    if (expectedClassificationField) expectedClassificationField.classList.add('hidden');
  }

  /**
   * Coleta dados do formulário de feedback
   */
  collectFeedbackData(): UserFeedback | null {
    const typeSelect = document.getElementById('feedback-type') as HTMLSelectElement;
    const componentName = document.getElementById('component-name') as HTMLInputElement;
    const expectedClassification = document.getElementById('expected-classification') as HTMLSelectElement;
    const description = document.getElementById('feedback-description') as HTMLTextAreaElement;

    if (!typeSelect || !description) return null;

    const feedbackType = typeSelect.value as UserFeedback['type'];
    const feedbackDescription = description.value.trim();

    if (!feedbackType || !feedbackDescription) {
      this.showError('Por favor, preencha o tipo e a descrição do problema');
      return null;
    }

    const feedback: UserFeedback = {
      type: feedbackType,
      description: feedbackDescription,
      timestamp: Date.now()
    };

    if (componentName && componentName.value.trim()) {
      feedback.componentName = componentName.value.trim();
    }

    if (expectedClassification && expectedClassification.value) {
      feedback.expectedClassification = expectedClassification.value as 'connected' | 'disconnected';
    }

    return feedback;
  }

  /**
   * Mostra mensagem de erro
   */
  showError(message: string): void {
    this.showSnackbar(message, 'error');
  }

  /**
   * Mostra mensagem de sucesso
   */
  showSuccess(message: string): void {
    this.showSnackbar(message, 'success');
  }

  /**
   * Mostra snackbar estilo Joy UI Top Center
   */
  private showSnackbar(message: string, type: 'success' | 'error'): void {
    const container = document.getElementById('snackbar-container');
    if (!container) return;

    // Criar snackbar
    const snackbar = document.createElement('div');
    const snackbarId = `snackbar-${Date.now()}`;
    snackbar.id = snackbarId;
    
    // Classes baseadas no Joy UI Snackbar
    const baseClasses = 'pointer-events-auto mb-3 px-4 py-3 rounded-lg shadow-lg border flex items-center min-w-96 max-w-md mx-auto transition-all duration-300 ease-out transform';
    const typeClasses = type === 'success' 
      ? 'bg-green-50 border-green-200 text-green-800' 
      : 'bg-red-50 border-red-200 text-red-800';
    
    snackbar.className = `${baseClasses} ${typeClasses} translate-y-0 opacity-100`;

    // Ícone baseado no tipo
    const icon = type === 'success' 
      ? `<svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
           <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
         </svg>`
      : `<svg class="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
           <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
         </svg>`;

    snackbar.innerHTML = `
      <div class="flex items-center w-full">
        ${icon}
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <button 
          class="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          onclick="this.closest('[id^=snackbar-]').remove()"
          aria-label="Fechar"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    // Animação de entrada
    snackbar.style.transform = 'translateY(-20px)';
    snackbar.style.opacity = '0';
    
    container.appendChild(snackbar);

    // Trigger animação
    requestAnimationFrame(() => {
      snackbar.style.transform = 'translateY(0)';
      snackbar.style.opacity = '1';
    });

    // Auto-remover após 4 segundos (padrão Joy UI)
    setTimeout(() => {
      this.hideSnackbar(snackbarId);
    }, 4000);
  }

  /**
   * Remove snackbar com animação
   */
  private hideSnackbar(snackbarId: string): void {
    const snackbar = document.getElementById(snackbarId);
    if (!snackbar) return;

    // Animação de saída
    snackbar.style.transform = 'translateY(-20px)';
    snackbar.style.opacity = '0';
    
    setTimeout(() => {
      if (snackbar.parentNode) {
        snackbar.remove();
      }
    }, 300);
  }

  /**
   * Verifica se o nome do elemento sugere que é um componente do Design System
   */
  private hasDesignSystemLikeName(name: string): boolean {
    const designSystemPatterns = [
      // Componentes básicos de interface
      /button/i, /btn/i, /botao/i, /botão/i,
      /card/i, /cartao/i, /cartão/i,
      /modal/i, /popup/i, /dialog/i, /overlay/i,
      /tooltip/i, /popover/i, /dropdown/i,
      
      // Componentes de formulário
      /input/i, /field/i, /form/i, /campo/i,
      /checkbox/i, /radio/i, /switch/i, /toggle/i,
      /select/i, /option/i, /picker/i,
      /textarea/i, /textfield/i,
      
      // Componentes de navegação
      /menu/i, /nav/i, /navigation/i, /navbar/i,
      /breadcrumb/i, /tab/i, /aba/i, /guia/i,
      /sidebar/i, /drawer/i, /header/i, /footer/i,
      
      // Componentes de feedback
      /alert/i, /notification/i, /toast/i, /snackbar/i,
      /badge/i, /tag/i, /chip/i, /pill/i,
      /loading/i, /spinner/i, /skeleton/i,
      
      // Componentes de mídia e conteúdo
      /avatar/i, /profile/i, /image/i, /icon/i,
      /list/i, /item/i, /grid/i, /table/i,
      /accordion/i, /collapse/i, /panel/i,
      
      // Termos específicos de Design System
      /component/i, /elemento/i, /widget/i,
      /design.?system/i, /ds.?/i, /ui.?kit/i,
      /template/i, /layout/i, /container/i,
      
      // Padrões de nomenclatura comuns
      /^(base|primary|secondary)/i,
      /\/(button|card|modal|input)/i, // Nomes com /
      /button$/i, /card$/i, /modal$/i, // Terminam com tipo
      
      // Textos de componentes
      /label/i, /title/i, /heading/i, /caption/i,
      /link/i, /texto/i, /text/i,
      
      // Componentes específicos do projeto
      /capa/i, /teste/i, /demo/i, /example/i
    ];

    const nameMatches = designSystemPatterns.some(pattern => pattern.test(name));
    
    if (nameMatches) {
      console.log(`🎯 Nome "${name}" identificado como Design System - toggle será LIGADO por padrão`);
      return true;
    }
    
    return false;
  }
} 