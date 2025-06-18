import type { FigmaFile, FigmaNode } from '../types/figma.ts';

export class FigmaApiService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Extrai informações do URL do Figma
   */
  static parseUrl(url: string): { fileKey: string; nodeId: string } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileKey = pathParts[2]; // /design/[fileKey]/...
      
      const nodeIdParam = urlObj.searchParams.get('node-id');
      if (!nodeIdParam) {
        throw new Error('node-id não encontrado na URL');
      }
      
      // Converter formato node-id (8287-64661) para formato da API (8287:64661)
      const nodeId = nodeIdParam.replace('-', ':');
      
      return { fileKey, nodeId };
    } catch (error) {
      console.error('Erro ao analisar URL do Figma:', error);
      return null;
    }
  }

  /**
   * Busca dados do frame específico no Figma
   */
  async fetchFrame(fileKey: string, nodeId: string): Promise<FigmaNode | null> {
    try {
      const response = await fetch(
        `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`,
        {
          headers: {
            'X-Figma-Token': this.token,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro da API do Figma: ${response.status} ${response.statusText}`);
      }

      const data: FigmaFile = await response.json();
      const nodeData = data.nodes[nodeId];
      
      if (!nodeData || !nodeData.document) {
        throw new Error('Frame não encontrado');
      }

      return nodeData.document;
    } catch (error) {
      console.error('Erro ao buscar frame do Figma:', error);
      throw error;
    }
  }

  /**
   * Valida se o token tem as permissões necessárias
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': this.token,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  }
} 