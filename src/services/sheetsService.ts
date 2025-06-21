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
 * Serviço para integração com Google Sheets via Google Apps Script
 * Resolve problemas de CORS usando GAS como proxy
 */
export class SheetsService {
  // URL do Google Apps Script (será configurada via env vars)
  private static readonly SCRIPT_URL = Environment.GOOGLE_SCRIPT_URL;
  
  /**
   * Envia feedback para o Google Sheets via Google Apps Script
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

      console.log('📤 Enviando feedback via Google Apps Script:', dataToSend);

      // Fazer requisição para o Google Apps Script
      const response = await fetch(this.SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Feedback enviado com sucesso para Google Sheets!');
        return true;
      } else {
        throw new Error(result.error || 'Erro desconhecido do Google Apps Script');
      }

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
      const results = await Promise.allSettled(
        pendingFeedbacks.map(feedback => this.sendFeedback(feedback))
      );

      // Verificar quais foram enviados com sucesso
      const successfulIndexes: number[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value === true) {
          successfulIndexes.push(index);
        }
      });

      // Remover feedbacks enviados com sucesso da lista pendente
      if (successfulIndexes.length > 0) {
        const remainingFeedbacks = pendingFeedbacks.filter(
          (_, index) => !successfulIndexes.includes(index)
        );

        if (remainingFeedbacks.length === 0) {
          localStorage.removeItem(pendingKey);
          console.log('🎉 Todos os feedbacks pendentes foram sincronizados!');
        } else {
          localStorage.setItem(pendingKey, JSON.stringify(remainingFeedbacks));
          console.log(`⏳ ${remainingFeedbacks.length} feedbacks ainda pendentes de sincronização`);
        }
      } else {
        console.log(`⏳ ${pendingFeedbacks.length} feedbacks ainda pendentes de sincronização`);
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