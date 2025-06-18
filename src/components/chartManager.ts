import type { AnalysisResult } from '../types/figma.ts';

// Declaração global para Chart.js (carregado via CDN)
declare global {
  interface Window {
    Chart: any;
  }
}

export class ChartManager {
  private pieChart: any = null;

  /**
   * Cria ou atualiza o gráfico de pizza
   */
  updatePieChart(result: AnalysisResult): void {
    this.updatePieChartWithValues(result.summary.connected, result.summary.disconnected);
  }

  /**
   * Cria ou atualiza o gráfico de pizza com valores customizados
   */
  updatePieChartWithValues(connected: number, disconnected: number): void {
    const canvas = document.getElementById('components-chart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas do gráfico não encontrado');
      return;
    }

    // Verificar se Chart.js está disponível
    if (typeof window.Chart === 'undefined') {
      console.error('Chart.js não está carregado');
      return;
    }

    const total = connected + disconnected;

    // Se já existe um gráfico, apenas atualizar os dados
    if (this.pieChart) {
      this.pieChart.data.datasets[0].data = [connected, disconnected];
      this.pieChart.options.plugins.tooltip.callbacks.label = (context: any) => {
        const label = context.label || '';
        const value = context.parsed;
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        return `${label}: ${value} (${percentage}%)`;
      };
      this.pieChart.update('active');
      console.log(`📊 Gráfico atualizado: ${connected} conectados, ${disconnected} desconectados`);
      return;
    }

    // Criar novo gráfico
    const config = {
      type: 'pie',
      data: {
        labels: ['Conectados ao DS', 'Fora do DS'],
        datasets: [{
          data: [connected, disconnected],
          backgroundColor: [
            '#10B981', // Verde para conectados
            '#EF4444'  // Vermelho para desconectados
          ],
          borderColor: [
            '#059669',
            '#DC2626'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
                family: 'Inter'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new window.Chart(canvas, config);
    console.log(`📊 Gráfico criado: ${connected} conectados, ${disconnected} desconectados`);
  }

  /**
   * Destrói todos os gráficos
   */
  destroy(): void {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
  }
} 