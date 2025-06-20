import { environment } from '../config/environment.ts';

/**
 * Serviço para integração com Google Sheets
 */
export class SheetsService {
  private static readonly SHEET_ID = environment.googleSheetsId;
  private static readonly API_KEY = environment.googleSheetsApiKey;
  private static readonly RANGE = 'Sheet1!A:H'; // Colunas A até H

  /**
   * Envia feedback para o Google Sheets
   */
  static async sendFeedback(feedback: FeedbackData): Promise<boolean> {
    // Verificar se API está configurada
    if (!this.API_KEY || this.API_KEY === '') {
      console.warn('⚠️ Google Sheets API Key não configurada. Salvando apenas localmente.');
      return false;
    }

    try {
      // Preparar dados para envio
      const rowData = [
        new Date().toISOString(), // Timestamp
        feedback.usuario,          // Usuario
        feedback.frameUrl,         // Frame_URL
        feedback.tipoproblema,     // Tipo_Problema
        feedback.nomeComponente || '', // Nome_Componente
        feedback.classificacaoEsperada || '', // Classificacao_Esperada
        feedback.descricao,        // Descricao
        navigator.userAgent        // User_Agent
      ];

      // URL da API do Google Sheets
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.RANGE}:append?valueInputOption=RAW&key=${this.API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData]
        })
      });

      if (response.ok) {
        console.log('✅ Feedback enviado para Google Sheets com sucesso');
        return true;
      } else {
        console.error('❌ Erro ao enviar para Google Sheets:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na integração com Google Sheets:', error);
      return false;
    }
  }

  /**
   * Testa a conexão com a planilha
   */
  static async testConnection(): Promise<boolean> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}?key=${this.API_KEY}`;
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      return false;
    }
  }

  /**
   * Salva feedback localmente como fallback
   */
  static saveFeedbackLocally(feedback: FeedbackData): void {
    try {
      const existingFeedbacks = JSON.parse(localStorage.getItem('pending-feedbacks') || '[]');
      existingFeedbacks.push({
        ...feedback,
        timestamp: new Date().toISOString(),
        status: 'pending-sync'
      });
      localStorage.setItem('pending-feedbacks', JSON.stringify(existingFeedbacks));
      console.log('💾 Feedback salvo localmente para sincronização futura');
    } catch (error) {
      console.error('❌ Erro ao salvar feedback localmente:', error);
    }
  }

  /**
   * Tenta reenviar feedbacks pendentes
   */
  static async syncPendingFeedbacks(): Promise<void> {
    try {
      const pendingFeedbacks = JSON.parse(localStorage.getItem('pending-feedbacks') || '[]');
      
      if (pendingFeedbacks.length === 0) return;

      console.log(`🔄 Tentando sincronizar ${pendingFeedbacks.length} feedbacks pendentes...`);

      const successfulSyncs: number[] = [];

      for (let i = 0; i < pendingFeedbacks.length; i++) {
        const feedback = pendingFeedbacks[i];
        const success = await this.sendFeedback(feedback);
        
        if (success) {
          successfulSyncs.push(i);
        }
      }

      // Remover feedbacks sincronizados com sucesso
      if (successfulSyncs.length > 0) {
        const remainingFeedbacks = pendingFeedbacks.filter((_: any, index: number) => !successfulSyncs.includes(index));
        localStorage.setItem('pending-feedbacks', JSON.stringify(remainingFeedbacks));
        console.log(`✅ ${successfulSyncs.length} feedbacks sincronizados com sucesso`);
      }

    } catch (error) {
      console.error('❌ Erro ao sincronizar feedbacks pendentes:', error);
    }
  }

  /**
   * Obtém estatísticas de feedbacks pendentes
   */
  static getPendingCount(): number {
    try {
      const pending = JSON.parse(localStorage.getItem('pending-feedbacks') || '[]');
      return pending.length;
    } catch {
      return 0;
    }
  }
}

/**
 * Interface para dados de feedback
 */
export interface FeedbackData {
  usuario: string;
  frameUrl: string;
  tipoproblema: string;
  nomeComponente?: string;
  classificacaoEsperada?: string;
  descricao: string;
} 