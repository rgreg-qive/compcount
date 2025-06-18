import type { ComponentAnalysis } from './types/figma.ts';
import { ChartManager } from './components/chartManager.ts';

interface SharedAnalysisData {
  frameInfo: {
    name: string;
    nodeId: string;
    url: string;
  };
  summary: {
    connected: number;
    disconnected: number;
    total: number;
  };
  components: ComponentAnalysis[];
  timestamp: number;
  complianceRate: number;
  complianceStatus: string;
}

class ViewApp {
  private chartManager: ChartManager;

  constructor() {
    this.chartManager = new ChartManager();
    this.init();
  }

  /**
   * Inicializa a aplicação de visualização
   */
  private async init(): Promise<void> {
    try {
      // Verificar se é um link compartilhado
      const urlParams = new URLSearchParams(window.location.search);
      const isShared = urlParams.get('shared') === 'true';
      
      if (!isShared) {
        this.showError('Este link não é uma análise compartilhada válida.');
        return;
      }

      // Tentar carregar dados da URL
      const analysisData = this.extractAnalysisFromUrl(urlParams);
      
      if (!analysisData) {
        this.showError('Dados da análise não encontrados no link.');
        return;
      }

      // Exibir a análise
      this.displayAnalysis(analysisData);
      
    } catch (error) {
      console.error('Erro ao inicializar visualização:', error);
      this.showError('Erro ao carregar análise compartilhada.');
    }
  }

  /**
   * Extrai dados da análise dos parâmetros da URL
   */
  private extractAnalysisFromUrl(urlParams: URLSearchParams): SharedAnalysisData | null {
    try {
      // Verificar se tem dados básicos
      const connected = urlParams.get('connected');
      const disconnected = urlParams.get('disconnected');
      const compliance = urlParams.get('compliance');
      const status = urlParams.get('status');
      const timestamp = urlParams.get('timestamp');
      
      if (!connected || !disconnected || !compliance || !status) {
        return null;
      }

      // Tentar obter dados completos do localStorage ou sessionStorage
      const fullData = this.tryLoadFullAnalysisData(urlParams.get('id'));
      
      if (fullData) {
        return fullData;
      }

      // Criar dados básicos a partir dos parâmetros da URL
      const connectedNum = parseInt(connected);
      const disconnectedNum = parseInt(disconnected);
      
      return {
        frameInfo: {
          name: 'Análise Compartilhada',
          nodeId: 'shared',
          url: '#'
        },
        summary: {
          connected: connectedNum,
          disconnected: disconnectedNum,
          total: connectedNum + disconnectedNum
        },
        components: this.generateMockComponents(connectedNum, disconnectedNum),
        timestamp: timestamp ? parseInt(timestamp) : Date.now(),
        complianceRate: parseFloat(compliance.replace('%', '')),
        complianceStatus: decodeURIComponent(status)
      };
      
    } catch (error) {
      console.error('Erro ao extrair dados da URL:', error);
      return null;
    }
  }

  /**
   * Tenta carregar dados completos da análise
   */
  private tryLoadFullAnalysisData(id: string | null): SharedAnalysisData | null {
    if (!id) return null;
    
    try {
      // Tentar localStorage primeiro
      const stored = localStorage.getItem(`shared-analysis-${id}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Tentar sessionStorage
      const sessionStored = sessionStorage.getItem(`shared-analysis-${id}`);
      if (sessionStored) {
        return JSON.parse(sessionStored);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao carregar dados completos:', error);
      return null;
    }
  }

  /**
   * Gera componentes mock para exibição básica
   */
  private generateMockComponents(connected: number, disconnected: number): ComponentAnalysis[] {
    const components: ComponentAnalysis[] = [];
    
    // Componentes conectados
    for (let i = 0; i < connected; i++) {
      components.push({
        name: `Componente Conectado ${i + 1}`,
        type: 'INSTANCE',
        isConnectedToDS: true,
        priority: 3,
        nodeId: `connected-${i}`,
        depth: 1
      });
    }
    
    // Componentes desconectados
    for (let i = 0; i < disconnected; i++) {
      components.push({
        name: `Componente Desconectado ${i + 1}`,
        type: 'OTHER',
        isConnectedToDS: false,
        priority: 2,
        nodeId: `disconnected-${i}`,
        depth: 1
      });
    }
    
    return components;
  }

  /**
   * Exibe a análise na interface
   */
  private displayAnalysis(data: SharedAnalysisData): void {
    // Esconder loading
    const loadingEl = document.getElementById('loading-state');
    if (loadingEl) loadingEl.classList.add('hidden');
    
    // Mostrar conteúdo
    const contentEl = document.getElementById('analysis-content');
    if (contentEl) contentEl.classList.remove('hidden');
    
    // Atualizar informações básicas
    this.updateBasicInfo(data);
    
    // Atualizar gráfico
    this.updateChart(data);
    
    // Atualizar resumo
    this.updateSummary(data);
    
    // Atualizar tabela
    this.updateComponentsTable(data);
  }

  /**
   * Atualiza informações básicas da análise
   */
  private updateBasicInfo(data: SharedAnalysisData): void {
    // Nome do frame
    const frameNameEl = document.getElementById('frame-name');
    if (frameNameEl) {
      frameNameEl.textContent = data.frameInfo.name;
    }
    
    // Data da análise
    const dateEl = document.getElementById('analysis-date');
    if (dateEl) {
      const date = new Date(data.timestamp);
      dateEl.textContent = `Analisado em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR')}`;
    }
    
    // Link do Figma
    const linkEl = document.getElementById('figma-link') as HTMLAnchorElement;
    if (linkEl && data.frameInfo.url !== '#') {
      linkEl.href = data.frameInfo.url;
    } else if (linkEl) {
      linkEl.style.display = 'none';
    }
    
    // Status de conformidade
    const statusEl = document.getElementById('compliance-status');
    if (statusEl) {
      statusEl.textContent = data.complianceStatus;
      statusEl.className = `px-2 py-1 text-xs font-medium rounded-full ${
        data.complianceRate >= 80 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`;
    }
  }

  /**
   * Atualiza o gráfico de pizza
   */
  private updateChart(data: SharedAnalysisData): void {
    this.chartManager.updatePieChartWithValues(data.summary.connected, data.summary.disconnected);
  }

  /**
   * Atualiza o resumo da análise
   */
  private updateSummary(data: SharedAnalysisData): void {
    const summaryEl = document.getElementById('summary-cards');
    if (!summaryEl) return;
    
    const complianceRate = data.summary.total > 0 
      ? Math.round((data.summary.connected / data.summary.total) * 100)
      : 0;
    
    summaryEl.innerHTML = `
      <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
        <div>
          <p class="text-sm font-medium text-green-800">Componentes Conectados</p>
          <p class="text-2xl font-bold text-green-900">${data.summary.connected}</p>
        </div>
        <div class="text-green-600">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg">
        <div>
          <p class="text-sm font-medium text-red-800">Componentes Desconectados</p>
          <p class="text-2xl font-bold text-red-900">${data.summary.disconnected}</p>
        </div>
        <div class="text-red-600">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <p class="text-sm font-medium text-blue-800">Taxa de Conformidade</p>
          <p class="text-2xl font-bold text-blue-900">${complianceRate}%</p>
        </div>
        <div class="text-blue-600">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
      </div>
    `;
  }

  /**
   * Atualiza a tabela de componentes
   */
  private updateComponentsTable(data: SharedAnalysisData): void {
    const tableBody = document.getElementById('components-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    data.components.forEach(component => {
      const row = document.createElement('tr');
      row.className = 'border-b border-gray-200 hover:bg-gray-50';
      
      const statusBadge = component.isConnectedToDS 
        ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Conectado</span>'
        : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Desconectado</span>';
      
      // Criar link para o elemento no Figma se disponível
      const nodeIdDisplay = data.frameInfo.url !== '#' 
        ? `<span class="font-mono text-sm text-gray-500">${component.nodeId}</span>`
        : `<span class="font-mono text-sm text-gray-500">${component.nodeId}</span>`;

      // Substituir toggle por Sim/Não simples
      const includeInAnalysis = 'Sim'; // Por padrão, todos os componentes estão incluídos na visualização
      
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
          ${nodeIdDisplay}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${includeInAnalysis}
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  }

  /**
   * Mostra erro na interface
   */
  private showError(message: string): void {
    const loadingEl = document.getElementById('loading-state');
    if (loadingEl) loadingEl.classList.add('hidden');
    
    const errorEl = document.getElementById('error-state');
    if (errorEl) errorEl.classList.remove('hidden');
    
    const messageEl = document.getElementById('error-message');
    if (messageEl) messageEl.textContent = message;
  }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new ViewApp();
}); 