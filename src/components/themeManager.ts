export type Theme = 'light' | 'dark' | 'system';

export class ThemeManager {
  private currentTheme: Theme = 'system';
  private readonly STORAGE_KEY = 'compcount-theme';

  constructor() {
    this.init();
  }

  /**
   * Inicializa o gerenciador de temas
   */
  private init(): void {
    // Carregar tema salvo ou usar 'system' como padrão
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme;
    this.currentTheme = savedTheme || 'system';
    
    // Aplicar tema inicial
    this.applyTheme();
    
    // Escutar mudanças na preferência do sistema
    this.listenToSystemChanges();
    
    console.log(`🎨 Theme Manager iniciado - Tema atual: ${this.currentTheme}`);
  }

  /**
   * Aplica o tema atual
   */
  private applyTheme(): void {
    const isDark = this.shouldUseDarkMode();
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Dispatch event para outros componentes reagirem
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: this.currentTheme, isDark } 
    }));
    
    console.log(`🎨 Tema aplicado: ${isDark ? 'dark' : 'light'} (configuração: ${this.currentTheme})`);
  }

  /**
   * Determina se deve usar modo escuro
   */
  private shouldUseDarkMode(): boolean {
    if (this.currentTheme === 'dark') return true;
    if (this.currentTheme === 'light') return false;
    
    // Modo 'system' - verificar preferência do sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Escuta mudanças na preferência do sistema
   */
  private listenToSystemChanges(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme();
      }
    });
  }

  /**
   * Alterna entre os temas
   */
  public toggleTheme(): void {
    const themes: Theme[] = ['light', 'system', 'dark'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    
    this.setTheme(themes[nextIndex]);
  }

  /**
   * Define um tema específico
   */
  public setTheme(theme: Theme): void {
    this.currentTheme = theme;
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme();
    
    console.log(`🎨 Tema alterado para: ${theme}`);
  }

  /**
   * Obtém o tema atual
   */
  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Verifica se está em modo escuro
   */
  public isDarkMode(): boolean {
    return this.shouldUseDarkMode();
  }

  /**
   * Obtém o ícone apropriado para o tema atual
   */
  public getThemeIcon(): string {
    switch (this.currentTheme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '🖥️';
      default:
        return '🖥️';
    }
  }

  /**
   * Obtém o nome legível do tema
   */
  public getThemeName(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Escuro';
      case 'system':
        return 'Sistema';
      default:
        return 'Sistema';
    }
  }
} 