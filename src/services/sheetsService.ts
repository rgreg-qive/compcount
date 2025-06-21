import { Environment } from '../config/environment';

export interface FeedbackData {
  usuario: string;
  frameUrl: string;
  tipoProblema: string;
  nomeComponente?: string;
  classificacaoEsperada?: string;
  descricao: string;
  timestamp?: string;
  userAgent?: string;
}

/**
 * Serviço para integração com Google Sheets via form submission
 * Resolve problemas de CORS usando POST form sem AJAX
 */
export class SheetsService {
  // URL do Google Apps Script (será configurada via env vars)
  private static readonly SCRIPT_URL = Environment.GOOGLE_SCRIPT_URL;
  
  /**
   * Envia feedback para o Google Sheets via form submission
   */
  static async sendFeedback(feedback: FeedbackData): Promise<boolean> {
    // DEBUG: Verificar variáveis de ambiente
    console.log('🔍 DEBUG - SCRIPT_URL:', this.SCRIPT_URL);
    console.log('🔍 DEBUG - SCRIPT_URL existe:', !!this.SCRIPT_URL);
    
    // Verificar se URL está configurada
    if (!this.SCRIPT_URL || this.SCRIPT_URL === '') {
      console.warn('⚠️ Google Apps Script URL não configurada. Salvando apenas localmente.');
      return false;
    }

    try {
      // Preparar dados com timestamp e user agent
      const dataToSend = {
        ...feedback,
        timestamp: feedback.timestamp || new Date().toISOString(),
        userAgent: feedback.userAgent || navigator.userAgent
      };

      console.log('📤 Enviando feedback via form submission:', dataToSend);

      // Criar form invisível para envio
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = this.SCRIPT_URL;
      form.target = '_blank'; // Abre em nova aba (será fechada automaticamente)
      form.style.display = 'none';

      // Adicionar campos do form
      Object.entries(dataToSend).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value || '');
        form.appendChild(input);
      });

      // Adicionar ao DOM e enviar
      document.body.appendChild(form);
      form.submit();
      
      // Remover form após envio
      setTimeout(() => {
        document.body.removeChild(form);
      }, 1000);

      console.log('✅ Feedback enviado via form submission!');
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar para Google Sheets:', error);
      return false;
    }
  }

  /**
   * Sincroniza feedbacks pendentes do localStorage
   */
  static async syncPendingFeedbacks(): Promise<void> {
    const pendingKey = 'compcount_pending_feedbacks';
    const pendingData = localStorage.getItem(pendingKey);
    
    if (!pendingData) {
      return;
    }

    try {
      const pendingFeedbacks: FeedbackData[] = JSON.parse(pendingData);
      
      if (pendingFeedbacks.length === 0) {
        return;
      }

      console.log(`🔄 Tentando sincronizar ${pendingFeedbacks.length} feedbacks pendentes...`);

      // Tentar enviar cada feedback pendente
      let successCount = 0;
      for (const feedback of pendingFeedbacks) {
        const success = await this.sendFeedback(feedback);
        if (success) {
          successCount++;
          // Pequeno delay entre envios
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Se todos foram enviados com sucesso, limpar localStorage
      if (successCount === pendingFeedbacks.length) {
        localStorage.removeItem(pendingKey);
        console.log('🎉 Todos os feedbacks pendentes foram sincronizados!');
      } else {
        // Manter apenas os que falharam (assumindo que os primeiros foram enviados)
        const remainingFeedbacks = pendingFeedbacks.slice(successCount);
        localStorage.setItem(pendingKey, JSON.stringify(remainingFeedbacks));
        console.log(`⏳ ${remainingFeedbacks.length} feedbacks ainda pendentes de sincronização`);
      }

    } catch (error) {
      console.error('❌ Erro ao sincronizar feedbacks pendentes:', error);
    }
  }

  /**
   * Salva feedback localmente como fallback
   */
  static saveFeedbackLocally(feedback: FeedbackData): void {
    const pendingKey = 'compcount_pending_feedbacks';
    const existingData = localStorage.getItem(pendingKey);
    
    let pendingFeedbacks: FeedbackData[] = [];
    if (existingData) {
      try {
        pendingFeedbacks = JSON.parse(existingData);
      } catch (error) {
        console.error('Erro ao carregar feedbacks pendentes:', error);
      }
    }

    // Adicionar novo feedback
    pendingFeedbacks.push({
      ...feedback,
      timestamp: feedback.timestamp || new Date().toISOString(),
      userAgent: feedback.userAgent || navigator.userAgent
    });

    localStorage.setItem(pendingKey, JSON.stringify(pendingFeedbacks));
    console.log('💾 Feedback salvo localmente para sincronização posterior');
  }

  /**
   * Processa envio de feedback com fallback inteligente
   */
  static async processFeedback(feedback: FeedbackData): Promise<void> {
    // Tentar enviar para Google Sheets primeiro
    const success = await this.sendFeedback(feedback);
    
    if (!success) {
      // Se falhar, salvar localmente
      this.saveFeedbackLocally(feedback);
    }
  }
} 