import { FigmaApiService } from './services/figmaApi.ts';
import { ComponentAnalyzer } from './services/componentAnalyzer.ts';
import { LearningService } from './services/learningService.ts';
import { AuthService } from './services/authService.ts';
import { ChartManager } from './components/chartManager.ts';
import { UIManager } from './components/uiManager.ts';
import type { AnalysisResult, FigmaNode } from './types/figma.ts';
import { ThemeManager } from './components/themeManager.ts';

class FigmaAnalyzerApp {
  private chartManager: ChartManager;
  private uiManager: UIManager;
  private currentResult: AnalysisResult | null = null;
  private currentFrameNode: FigmaNode | null = null;

  constructor() {
    this.chartManager = new ChartManager();
    this.uiManager = new UIManager();
    
    // Inicializar theme manager apenas para detecção automática do sistema
    new ThemeManager();
    
    // Conectar UIManager ao ChartManager para atualizações em tempo real
    this.uiManager.setChartManager(this.chartManager);
    
    // Verificar autenticação antes de inicializar
    this.checkAuthAndInit();
  }

  /**
   * Verifica autenticação e inicializa a aplicação
   */
  private checkAuthAndInit(): void {
    if (AuthService.isAuthenticated()) {
      this.showMainApp();
      this.init();
    } else {
      this.showLoginScreen();
    }
  }

  /**
   * Mostra a tela de login
   */
  private showLoginScreen(): void {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
    
    this.setupLoginListeners();
  }

  /**
   * Mostra a aplicação principal
   */
  private showMainApp(): void {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
  }

  /**
   * Configura listeners da tela de login
   */
  private setupLoginListeners(): void {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
  }

  /**
   * Processa o login
   */
  private handleLogin(e: Event): void {
    e.preventDefault();
    
    const emailInput = document.getElementById('login-email') as HTMLInputElement;
    const passwordInput = document.getElementById('login-password') as HTMLInputElement;
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (AuthService.login(email, password)) {
      this.showMainApp();
      this.init();
    } else {
      this.showLoginError('Email ou senha incorretos');
    }
  }

  /**
   * Mostra erro de login
   */
  private showLoginError(message: string): void {
    // Remover erro anterior se existir
    const existingError = document.querySelector('.login-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Criar novo erro
    const errorDiv = document.createElement('div');
    errorDiv.className = 'login-error bg-red-50 border border-red-200 rounded-md p-3 mt-4';
    errorDiv.innerHTML = `
      <div class="flex">
        <svg class="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <p class="text-sm text-red-700">${message}</p>
      </div>
    `;
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.appendChild(errorDiv);
    }
  }

  /**
   * Inicializa a aplicação
   */
  private async init(): Promise<void> {
    console.log('🚀 Iniciando Figma Component Analyzer...');
    
    // Inicializar padrões conhecidos
    LearningService.initializeKnownPatterns();
    
    // Carregar token salvo
    this.loadSavedToken();
    
    // Atualizar contador de padrões
    this.uiManager.updatePatternsCount();
    
    // Configurar formulário de feedback
    this.uiManager.setupFeedbackForm();
    this.uiManager.updateLearningStats();
    
    // Configurar event listeners
    this.setupEventListeners();
  }



  /**
   * Configura todos os event listeners
   */
  private setupEventListeners(): void {
    // Botão de análise
    const analyzeBtn = document.querySelector('[onclick="analyzeFrame()"]');
    if (analyzeBtn) {
      analyzeBtn.removeAttribute('onclick');
      analyzeBtn.addEventListener('click', () => this.analyzeFrame());
    }

    // Toggle de visibilidade do token
    const toggleBtn = document.getElementById('toggle-token-visibility');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleTokenVisibility());
    }

    // Configurar dropdown de relatórios
    this.uiManager.setupReportDropdown();

    // Botão de feedback detalhado
    const feedbackBtn = document.getElementById('show-feedback-form');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => this.showFeedbackForm());
    }

    // Botão de cancelar feedback
    const cancelFeedbackBtn = document.getElementById('cancel-feedback');
    if (cancelFeedbackBtn) {
      cancelFeedbackBtn.addEventListener('click', () => this.cancelFeedback());
    }

    // Botão de enviar feedback
    const submitFeedbackBtn = document.getElementById('submit-feedback');
    if (submitFeedbackBtn) {
      submitFeedbackBtn.addEventListener('click', () => this.submitFeedback());
    }

    // Salvar token quando digitado
    const tokenInput = document.getElementById('figma-token') as HTMLInputElement;
    if (tokenInput) {
      tokenInput.addEventListener('input', () => {
        const token = tokenInput.value.trim();
        if (token) {
          LearningService.saveToken(token);
        }
      });
    }

    // Modal de instruções
    const showInstructionsBtn = document.getElementById('show-instructions');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    const closeInstructionsBtnFooter = document.getElementById('close-instructions-btn');

    if (showInstructionsBtn && instructionsModal) {
      showInstructionsBtn.addEventListener('click', () => {
        instructionsModal.classList.remove('hidden');
      });
    }

    if (closeInstructionsBtn && instructionsModal) {
      closeInstructionsBtn.addEventListener('click', () => {
        instructionsModal.classList.add('hidden');
      });
    }

    if (closeInstructionsBtnFooter && instructionsModal) {
      closeInstructionsBtnFooter.addEventListener('click', () => {
        instructionsModal.classList.add('hidden');
      });
    }

    // Fechar modal clicando fora dele
    if (instructionsModal) {
      instructionsModal.addEventListener('click', (e) => {
        if (e.target === instructionsModal) {
          instructionsModal.classList.add('hidden');
        }
      });
    }

    // Drawer de feedback
    const closeFeedbackDrawerBtn = document.getElementById('close-feedback-drawer');
    const feedbackOverlay = document.getElementById('feedback-overlay');

    if (closeFeedbackDrawerBtn) {
      closeFeedbackDrawerBtn.addEventListener('click', () => this.cancelFeedback());
    }

    if (feedbackOverlay) {
      feedbackOverlay.addEventListener('click', () => this.cancelFeedback());
    }

    // Botão de exportar dados de aprendizado
    const exportDataBtn = document.getElementById('export-learning-data');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.exportLearningData());
    }

    // Botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  /**
   * Processa o logout
   */
  private handleLogout(): void {
    AuthService.logout();
    
    // Limpar dados da sessão
    this.currentResult = null;
    this.currentFrameNode = null;
    
    // Resetar interface
    this.uiManager.toggleAnalysisSections(false);
    this.uiManager.toggleReportDropdown(false);
    this.uiManager.toggleFeedbackButton(false);
    
    // Mostrar tela de login
    this.showLoginScreen();
  }

  /**
   * Carrega token salvo do localStorage
   */
  private loadSavedToken(): void {
    const savedToken = LearningService.getToken();
    if (savedToken) {
      const tokenInput = document.getElementById('figma-token') as HTMLInputElement;
      if (tokenInput) {
        tokenInput.value = savedToken;
      }
    }
  }

  /**
   * Toggle da visibilidade do token
   */
  private toggleTokenVisibility(): void {
    const tokenInput = document.getElementById('figma-token') as HTMLInputElement;
    const eyeIcon = document.getElementById('eye-icon');
    
    if (tokenInput && eyeIcon) {
      const isPassword = tokenInput.type === 'password';
      tokenInput.type = isPassword ? 'text' : 'password';
      
      // Atualizar ícone
      eyeIcon.innerHTML = isPassword 
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
    }
  }

  /**
   * Função principal de análise do frame
   */
  private async analyzeFrame(): Promise<void> {
    const tokenInput = document.getElementById('figma-token') as HTMLInputElement;
    const urlInput = document.getElementById('figma-url') as HTMLInputElement;

    if (!tokenInput || !urlInput) {
      this.uiManager.showError('Elementos de entrada não encontrados');
      return;
    }

    const token = tokenInput.value.trim();
    const url = urlInput.value.trim();

    // Validações
    if (!token) {
      this.uiManager.showError('Token do Figma é obrigatório');
      return;
    }

    if (!url) {
      this.uiManager.showError('URL do frame é obrigatória');
      return;
    }

    // Mostrar loading
    this.uiManager.toggleLoadingState(true);

    try {
      // Parse da URL
      const urlInfo = FigmaApiService.parseUrl(url);
      if (!urlInfo) {
        throw new Error('URL do Figma inválida');
      }

      // Criar serviço da API
      const figmaApi = new FigmaApiService(token);

      // Validar token
      const isValidToken = await figmaApi.validateToken();
      if (!isValidToken) {
        throw new Error('Token do Figma inválido ou sem permissões');
      }

      // Buscar dados do frame
      const frameNode = await figmaApi.fetchFrame(urlInfo.fileKey, urlInfo.nodeId);
      if (!frameNode) {
        throw new Error('Frame não encontrado');
      }

      // Analisar componentes
      const result = ComponentAnalyzer.analyzeFrame(frameNode, url);
      
      // Verificar se há padrão conhecido para este frame
      const knownPattern = LearningService.getPatternByFrameId(urlInfo.nodeId);
      if (knownPattern) {
        console.log('Padrão conhecido encontrado:', knownPattern);
        // Aplicar correções conhecidas se houver
        if (knownPattern.corrections) {
          result.summary.connected = knownPattern.corrections.connected;
          result.summary.disconnected = knownPattern.corrections.disconnected;
          result.summary.total = knownPattern.corrections.connected + knownPattern.corrections.disconnected;
        }
      }

      // Salvar resultado atual
      this.currentResult = result;
      this.currentFrameNode = frameNode;

      // Definir resultado no UIManager para geração de links
      this.uiManager.setCurrentAnalysisResult(result);

      // Atualizar interface
      this.updateUI(result);

      // Mostrar seções de análise
      this.uiManager.toggleAnalysisSections(true);

      // Mostrar dropdown de relatórios
      this.uiManager.toggleReportDropdown(true);

      // Mostrar botão de feedback
      this.uiManager.toggleFeedbackButton(true);

      this.uiManager.showSuccess('Análise concluída com sucesso!');

    } catch (error) {
      console.error('Erro na análise:', error);
      this.uiManager.showError(error instanceof Error ? error.message : 'Erro desconhecido na análise');
    } finally {
      this.uiManager.toggleLoadingState(false);
    }
  }

  /**
   * Atualiza toda a interface com os resultados
   */
  private updateUI(result: AnalysisResult): void {
    // Atualizar cards de resumo
    this.uiManager.updateSummaryCards(result);

    // Atualizar tabela
    this.uiManager.updateComponentsTable(result);

    // Atualizar gráfico
    this.chartManager.updatePieChart(result);
  }

  /**
   * Exporta todos os dados de aprendizado
   */
  private exportLearningData(): void {
    try {
      LearningService.exportAllLearningData();
      this.uiManager.showSuccess('Dados exportados! Envie o arquivo para consolidação.');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      this.uiManager.showError('Erro ao exportar dados de aprendizado');
    }
  }

  /**
   * Mostra o formulário de feedback detalhado
   */
  private showFeedbackForm(): void {
    if (!this.currentResult || !this.currentFrameNode) {
      this.uiManager.showError('Nenhuma análise ativa para dar feedback');
      return;
    }

    // Mostrar formulário
    this.uiManager.toggleDetailedFeedback(true);

    // Gerar e mostrar sugestões de componentes perdidos
    const suggestions = ComponentAnalyzer.getSuggestedMissedComponents(this.currentFrameNode);
    this.uiManager.showSuggestedComponents(suggestions);

    // Atualizar estatísticas
    this.uiManager.updateLearningStats();
  }

  /**
   * Cancela o feedback e esconde o formulário
   */
  private cancelFeedback(): void {
    this.uiManager.toggleDetailedFeedback(false);
    this.uiManager.clearFeedbackForm();
  }

  /**
   * Envia o feedback do usuário
   */
  private submitFeedback(): void {
    if (!this.currentResult) {
      this.uiManager.showError('Nenhuma análise ativa para dar feedback');
      return;
    }

    // Coletar dados do formulário
    const feedback = this.uiManager.collectFeedbackData();
    if (!feedback) {
      return; // Erro já mostrado no collectFeedbackData
    }

    try {
      // Salvar feedback no padrão
      const urlInfo = FigmaApiService.parseUrl(this.currentResult.frameInfo.url);
      if (urlInfo) {
        LearningService.addFeedbackToPattern(urlInfo.nodeId, feedback);
        
        this.uiManager.showSuccess(
          `Feedback salvo! O sistema aprendeu e um arquivo foi baixado automaticamente. Envie este arquivo para melhorar o sistema para todos!`
        );

        // Atualizar estatísticas
        this.uiManager.updateLearningStats();
        this.uiManager.updatePatternsCount();

        // Limpar e esconder formulário
        this.cancelFeedback();

        console.log('📚 Feedback salvo:', feedback);
        console.log('🧠 Sistema aprendeu e criou novas regras automáticas');
      } else {
        throw new Error('Não foi possível identificar o frame para salvar o feedback');
      }
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      this.uiManager.showError(
        error instanceof Error ? error.message : 'Erro ao salvar feedback'
      );
    }
  }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new FigmaAnalyzerApp();
});

// Expor globalmente para compatibilidade (se necessário)
(window as any).FigmaAnalyzerApp = FigmaAnalyzerApp; 