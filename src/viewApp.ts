import type { ComponentAnalysis } from './types/figma.ts';
import { ChartManager } from './components/chartManager.ts';
import { ThemeManager } from './components/themeManager.ts';

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
  analysisId?: string;
}

class ViewApp {
  private chartManager: ChartManager;

  constructor() {
    this.chartManager = new ChartManager();
    
    // Inicializar theme manager apenas para detecção automática do sistema
    new ThemeManager();
    
    this.init();
  }

  /**
   * Inicializa a aplicação de visualização
   */
  private async init(): Promise<void> {
    try {
      console.log('🚀 Iniciando ViewApp...');
      
      // Verificar se é um link compartilhado
      const urlParams = new URLSearchParams(window.location.search);
      console.log('🔍 Parâmetros da URL:', Object.fromEntries(urlParams.entries()));
      
      const isShared = urlParams.get('shared') === 'true';
      
      if (!isShared) {
        console.log('❌ Não é um link compartilhado válido');
        this.showError('Este link não é uma análise compartilhada válida.');
        return;
      }

      console.log('✅ Link compartilhado válido detectado');

      // Tentar carregar dados da URL
      const analysisData = this.extractAnalysisFromUrl(urlParams);
      
      if (!analysisData) {
        console.log('❌ Nenhum dado de análise encontrado');
        this.showError('Dados da análise não encontrados no link.');
        return;
      }

      console.log('✅ Dados da análise carregados com sucesso!');
      console.log('📊 Resumo dos dados:', {
        frameInfo: analysisData.frameInfo?.name || 'N/A',
        totalComponents: analysisData.components?.length || 0,
        connected: analysisData.summary?.connected || 0,
        disconnected: analysisData.summary?.disconnected || 0
      });

      // Exibir a análise
      this.displayAnalysis(analysisData);
      
    } catch (error) {
      console.error('❌ Erro ao inicializar visualização:', error);
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
        console.log('❌ Parâmetros básicos da URL não encontrados');
        return null;
      }

      // 1. Tentar obter dados completos do localStorage ou sessionStorage
      const fullData = this.tryLoadFullAnalysisData(urlParams.get('id'));
      
      if (fullData) {
        console.log('✅ Dados completos carregados do storage!');
        return fullData;
      }

      // 2. Tentar decodificar dados da URL (fallback)
      const encodedData = urlParams.get('data');
      if (encodedData) {
        console.log('🔍 Tentando decodificar dados da URL...');
        try {
          const decodedData = atob(decodeURIComponent(encodedData));
          const parsedData = JSON.parse(decodedData);
          console.log('✅ Dados decodificados da URL com sucesso!');
          console.log('📊 Componentes encontrados:', parsedData.components?.length || 0);
          console.log('📊 Componentes excluídos:', parsedData.excludedComponents?.length || 0);
          
          // Armazenar os dados decodificados no localStorage para uso posterior
          if (parsedData && urlParams.get('id')) {
            const storageKey = `shared-analysis-${urlParams.get('id')}`;
            try {
              localStorage.setItem(storageKey, JSON.stringify(parsedData));
              console.log('💾 Dados salvos no localStorage para uso futuro');
            } catch (storageError) {
              console.warn('⚠️ Não foi possível salvar no localStorage:', storageError);
            }
          }
          
          return parsedData;
        } catch (error) {
          console.error('❌ Erro ao decodificar dados da URL:', error);
        }
      }

      // 3. Fallback: mostrar apenas os totais (sem componentes detalhados)
      console.log('⚠️ Usando apenas dados básicos da URL');
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
        components: [], // Sem componentes detalhados
        timestamp: timestamp ? parseInt(timestamp) : Date.now(),
        complianceRate: parseFloat(compliance.replace('%', '')),
        complianceStatus: decodeURIComponent(status),
        analysisId: urlParams.get('id') || undefined
      };
      
    } catch (error) {
      console.error('❌ Erro ao extrair dados da URL:', error);
      return null;
    }
  }

  /**
   * Tenta carregar dados completos da análise
   */
  private tryLoadFullAnalysisData(id: string | null): SharedAnalysisData | null {
    if (!id) {
      console.log('🔍 Nenhum ID fornecido para buscar dados completos');
      return null;
    }
    
    try {
      // Tentar localStorage primeiro
      const storageKey = `shared-analysis-${id}`;
      console.log('🔍 Tentando carregar dados do localStorage com chave:', storageKey);
      
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        console.log('✅ Dados encontrados no localStorage!');
        const parsedData = JSON.parse(stored);
        console.log('📊 Dados carregados:', {
          components: parsedData.components?.length || 0,
          excludedComponents: parsedData.excludedComponents?.length || 0,
          frameInfo: parsedData.frameInfo?.name || 'N/A'
        });
        return parsedData;
      } else {
        console.log('❌ Nenhum dado encontrado no localStorage');
      }
      
      // Tentar sessionStorage
      const sessionStored = sessionStorage.getItem(storageKey);
      if (sessionStored) {
        console.log('✅ Dados encontrados no sessionStorage!');
        return JSON.parse(sessionStored);
      } else {
        console.log('❌ Nenhum dado encontrado no sessionStorage');
      }
      
      // Debug: listar todas as chaves do localStorage
      console.log('🔍 Chaves disponíveis no localStorage:', Object.keys(localStorage));
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao carregar dados completos:', error);
      return null;
    }
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
      <div class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div>
          <p class="text-sm font-medium text-green-800 dark:text-green-200">Componentes Conectados</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">${data.summary.connected}</p>
        </div>
        <div class="text-green-600 dark:text-green-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div>
          <p class="text-sm font-medium text-red-800 dark:text-red-200">Componentes Desconectados</p>
          <p class="text-2xl font-bold text-red-900 dark:text-red-100">${data.summary.disconnected}</p>
        </div>
        <div class="text-red-600 dark:text-red-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div>
          <p class="text-sm font-medium text-blue-800 dark:text-blue-200">Taxa de Conformidade</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">${complianceRate}%</p>
        </div>
        <div class="text-blue-600 dark:text-blue-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
      </div>
    `;
  }

  /**
   * Cria URL para um elemento específico no Figma
   */
  private createFigmaElementUrl(frameUrl: string, nodeId: string): string | null {
    try {
      if (frameUrl === '#' || !frameUrl) return null;
      
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
   * Atualiza a tabela de componentes
   */
  private updateComponentsTable(data: SharedAnalysisData): void {
    const tableBody = document.getElementById('components-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Incluir TODOS os componentes (incluídos e excluídos da análise)
    const allComponents = this.getAllComponents(data);
    
    // Se não há componentes reais, mostrar mensagem informativa
    if (allComponents.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="5" class="px-6 py-8 text-center">
          <div class="text-gray-500 dark:text-gray-400">
            <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">Dados detalhados não disponíveis</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Esta análise foi compartilhada apenas com os totais.</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Para ver os componentes detalhados, gere um novo link após fazer a análise.</p>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
      return;
    }
    
    allComponents.forEach(componentData => {
      const { component, isIncluded } = componentData;
      const row = document.createElement('tr');
      row.className = 'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700';
      
      const statusBadge = component.isConnectedToDS 
        ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Conectado</span>'
        : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Desconectado</span>';
      
      // Criar link para o elemento no Figma (igual à análise principal)
      const figmaElementUrl = this.createFigmaElementUrl(data.frameInfo.url, component.nodeId);
      const nodeIdLink = figmaElementUrl 
        ? `<a href="${figmaElementUrl}" target="_blank" class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline font-mono text-sm" title="Abrir elemento no Figma">${component.nodeId} 🔗</a>`
        : `<span class="font-mono text-sm text-gray-500 dark:text-gray-400">${component.nodeId}</span>`;

      // Mostrar se está incluído ou excluído da análise
      const includeInAnalysis = isIncluded ? 'Sim' : 'Não';
      
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          ${component.name}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          ${component.type}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${nodeIdLink}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          ${includeInAnalysis}
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  }

  /**
   * Obtém todos os componentes (incluídos e excluídos da análise)
   */
  private getAllComponents(data: SharedAnalysisData): Array<{component: ComponentAnalysis, isIncluded: boolean}> {
    const result: Array<{component: ComponentAnalysis, isIncluded: boolean}> = [];
    const seenNodeIds = new Set<string>(); // Para evitar duplicatas
    
    // Tentar recuperar dados completos do localStorage primeiro
    try {
      const fullData = localStorage.getItem(`shared-analysis-${data.analysisId || 'unknown'}`);
      if (fullData) {
        const parsedData = JSON.parse(fullData);
        
        // Adicionar componentes incluídos na análise
        if (parsedData.components && Array.isArray(parsedData.components)) {
          parsedData.components.forEach((component: ComponentAnalysis) => {
            if (!seenNodeIds.has(component.nodeId)) {
              result.push({ component, isIncluded: true });
              seenNodeIds.add(component.nodeId);
            }
          });
        }
        
        // Adicionar componentes excluídos da análise (apenas se não foram vistos antes)
        if (parsedData.excludedComponents && Array.isArray(parsedData.excludedComponents)) {
          parsedData.excludedComponents.forEach((component: ComponentAnalysis) => {
            if (!seenNodeIds.has(component.nodeId)) {
              result.push({ component, isIncluded: false });
              seenNodeIds.add(component.nodeId);
            }
          });
        }
        
        // Se encontrou dados completos, retornar
        if (result.length > 0) {
          console.log(`✅ Carregados ${result.length} componentes únicos do localStorage`);
          return result;
        }
      }
    } catch (error) {
      console.warn('Não foi possível recuperar dados completos do localStorage:', error);
    }
    
    // Fallback: usar apenas os componentes básicos da URL (sem componentes fictícios)
    data.components.forEach(component => {
      if (!seenNodeIds.has(component.nodeId)) {
        result.push({ component, isIncluded: true });
        seenNodeIds.add(component.nodeId);
      }
    });
    
    console.log(`✅ Carregados ${result.length} componentes únicos da URL`);
    return result;
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