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
  updateSummaryCards(result: AnalysisResult): void {
    const cards = document.querySelectorAll('.summary-card');
    
    if (cards.length >= 3) {
      // Card de componentes conectados
      const connectedValue = cards[0].querySelector('.summary-value');
      if (connectedValue) {
        connectedValue.textContent = result.summary.connected.toString();
      }

      // Card de componentes desconectados  
      const disconnectedValue = cards[1].querySelector('.summary-value');
      if (disconnectedValue) {
        disconnectedValue.textContent = result.summary.disconnected.toString();
      }

      // Card do total
      const totalValue = cards[2].querySelector('.summary-value');
      if (totalValue) {
        totalValue.textContent = result.summary.total.toString();
      }
    }

    // Atualizar também os elementos do resumo lateral
    const connectedCount = document.getElementById('connected-count');
    if (connectedCount) {
      connectedCount.textContent = result.summary.connected.toString();
    }

    const disconnectedCount = document.getElementById('disconnected-count');
    if (disconnectedCount) {
      disconnectedCount.textContent = result.summary.disconnected.toString();
    }

    const complianceRate = document.getElementById('compliance-rate');
    const complianceStatus = document.getElementById('compliance-status');
    if (complianceRate && complianceStatus) {
      const rate = result.summary.total > 0 
        ? Math.round((result.summary.connected / result.summary.total) * 100)
        : 0;
      complianceRate.textContent = `${rate}%`;

      // Atualizar tag de status baseado na taxa de conformidade
      if (rate >= 80) {
        complianceStatus.textContent = 'Aprovado';
        complianceStatus.className = 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800';
      } else {
        complianceStatus.textContent = 'Revisar';
        complianceStatus.className = 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
      }
      
      complianceStatus.classList.remove('hidden');
    }
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
    const toggleId = `toggle-${component.nodeId.replace(':', '-')}`;
    const includeToggle = `
      <label class="relative inline-flex items-center cursor-pointer justify-center">
        <input type="checkbox" id="${toggleId}" class="sr-only peer component-toggle" checked data-node-id="${component.nodeId}">
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
      </label>
    `;

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
    // PNG Export
    const pngBtn = document.getElementById('export-png');
    if (pngBtn) {
      pngBtn.addEventListener('click', () => this.exportToPNG());
    }

    // PDF Export
    const pdfBtn = document.getElementById('export-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => this.exportToPDF());
    }

    // Generate Link
    const linkBtn = document.getElementById('generate-link');
    if (linkBtn) {
      linkBtn.addEventListener('click', () => this.generateShareableLink());
    }

    // Checklist Export
    const checklistBtn = document.getElementById('export-checklist');
    if (checklistBtn) {
      checklistBtn.addEventListener('click', () => this.exportChecklist());
    }
  }

  /**
   * Exporta relatório como PNG
   */
  private async exportToPNG(): Promise<void> {
    try {
      this.showSuccess('🖼️ Preparando PNG...');
      
      // Implementação futura: captura de tela da análise
      // Por enquanto, vamos mostrar uma mensagem
      setTimeout(() => {
        this.showSuccess('🖼️ Funcionalidade PNG em desenvolvimento!');
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      this.showError('Erro ao gerar PNG');
    }
  }

  /**
   * Exporta relatório como PDF
   */
  private async exportToPDF(): Promise<void> {
    try {
      this.showSuccess('📄 Preparando PDF...');
      
      // Implementação futura: geração de PDF
      setTimeout(() => {
        this.showSuccess('📄 Funcionalidade PDF em desenvolvimento!');
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      this.showError('Erro ao gerar PDF');
    }
  }

  /**
   * Gera link compartilhável
   */
  private generateShareableLink(): void {
    try {
      // Criar URL com parâmetros da análise atual
      const currentUrl = new URL(window.location.href);
      const shareableUrl = `${currentUrl.origin}${currentUrl.pathname}?shared=true&timestamp=${Date.now()}`;
      
      // Copiar para clipboard
      navigator.clipboard.writeText(shareableUrl).then(() => {
        this.showSuccess('🔗 Link copiado para área de transferência!');
      }).catch(() => {
        // Fallback para navegadores sem clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareableUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showSuccess('🔗 Link copiado!');
      });
      
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      this.showError('Erro ao gerar link compartilhável');
    }
  }

  /**
   * Exporta checklist de ações
   */
  private exportChecklist(): void {
    try {
      // Coletar dados da análise atual
      const connectedCount = document.getElementById('connected-count')?.textContent || '0';
      const disconnectedCount = document.getElementById('disconnected-count')?.textContent || '0';
      const complianceRate = document.getElementById('compliance-rate')?.textContent || '0%';
      const complianceStatus = document.getElementById('compliance-status')?.textContent || '';
      
      // Criar checklist em texto
      const checklist = `
📋 CHECKLIST DE AÇÕES - ANÁLISE DE COMPONENTES

📊 RESUMO DA ANÁLISE:
✅ Componentes Conectados: ${connectedCount}
❌ Componentes Desconectados: ${disconnectedCount}
📈 Taxa de Conformidade: ${complianceRate} (${complianceStatus})

🎯 AÇÕES RECOMENDADAS:
${parseInt(disconnectedCount) > 0 ? `
□ Conectar ${disconnectedCount} componente(s) ao Design System
□ Revisar elementos desconectados na tabela
□ Atualizar instâncias para usar componentes oficiais
` : '□ Manter componentes já conectados atualizados'}

💡 PRÓXIMOS PASSOS:
□ Implementar correções identificadas
□ Validar mudanças no Figma
□ Executar nova análise para verificar melhorias
□ Documentar padrões encontrados

📅 Data da Análise: ${new Date().toLocaleDateString('pt-BR')}
🕒 Hora: ${new Date().toLocaleTimeString('pt-BR')}
      `.trim();

      // Download como arquivo de texto
      const blob = new Blob([checklist], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `checklist-componentes-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showSuccess('📋 Checklist baixado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao exportar checklist:', error);
      this.showError('Erro ao gerar checklist');
    }
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
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4 mb-4';
    errorDiv.innerHTML = `
      <div class="flex">
        <svg class="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <div>
          <h3 class="text-sm font-medium text-red-800">Erro na análise</h3>
          <p class="text-sm text-red-700 mt-1">${message}</p>
        </div>
      </div>
    `;

    // Inserir antes do primeiro elemento do main
    const main = document.querySelector('main');
    if (main && main.firstChild) {
      main.insertBefore(errorDiv, main.firstChild);
    }

    // Remover após 5 segundos
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * Mostra mensagem de sucesso
   */
  showSuccess(message: string): void {
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-50 border border-green-200 rounded-md p-4 mb-4';
    successDiv.innerHTML = `
      <div class="flex">
        <svg class="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <div>
          <h3 class="text-sm font-medium text-green-800">Sucesso</h3>
          <p class="text-sm text-green-700 mt-1">${message}</p>
        </div>
      </div>
    `;

    // Inserir antes do primeiro elemento do main
    const main = document.querySelector('main');
    if (main && main.firstChild) {
      main.insertBefore(successDiv, main.firstChild);
    }

    // Remover após 3 segundos
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }
} 