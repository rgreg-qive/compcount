/**
 * Serviço de Autenticação
 */
export class AuthService {
  private static readonly STORAGE_KEY = 'figma-analyzer-auth';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  // Lista de usuários válidos (em produção, isso viria de uma API)
  private static readonly VALID_USERS = {
    'design@qive.com': 'design2024',
    'ux@qive.com': 'ux2024',
    'admin@qive.com': 'admin2024',
    'rafael@qive.com': 'dev2024'
  };

  /**
   * Verifica se o usuário está autenticado
   */
  static isAuthenticated(): boolean {
    const authData = this.getAuthData();
    if (!authData) return false;

    // Verificar se a sessão não expirou
    const now = Date.now();
    if (now > authData.expiresAt) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Faz login do usuário
   */
  static login(email: string, password: string): boolean {
    const validPassword = this.VALID_USERS[email as keyof typeof this.VALID_USERS];
    
    if (!validPassword || validPassword !== password) {
      return false;
    }

    // Salvar dados de autenticação
    const authData = {
      email,
      loginTime: Date.now(),
      expiresAt: Date.now() + this.SESSION_DURATION
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    return true;
  }

  /**
   * Faz logout do usuário
   */
  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Obtém dados de autenticação
   */
  private static getAuthData(): { email: string; loginTime: number; expiresAt: number } | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Obtém email do usuário logado
   */
  static getCurrentUser(): string | null {
    const authData = this.getAuthData();
    return authData?.email || null;
  }

  /**
   * Verifica se precisa renovar a sessão
   */
  static shouldRenewSession(): boolean {
    const authData = this.getAuthData();
    if (!authData) return false;

    const timeUntilExpiry = authData.expiresAt - Date.now();
    const oneHour = 60 * 60 * 1000;
    
    return timeUntilExpiry < oneHour;
  }

  /**
   * Renova a sessão do usuário
   */
  static renewSession(): void {
    const authData = this.getAuthData();
    if (!authData) return;

    authData.expiresAt = Date.now() + this.SESSION_DURATION;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
  }
} 