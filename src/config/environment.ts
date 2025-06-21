/**
 * Configurações de ambiente da aplicação
 */
const getEnvironmentVariable = (key: string): string => {
  const value = (import.meta as any).env?.[key];
  return value || '';
};

export const environment = {
  // Google Sheets API
  googleSheetsApiKey: getEnvironmentVariable('VITE_GOOGLE_SHEETS_API_KEY'),
  googleSheetsId: getEnvironmentVariable('VITE_GOOGLE_SHEETS_ID'),
  googleScriptUrl: getEnvironmentVariable('VITE_GOOGLE_SCRIPT_URL'),
  
  // Outros configs
  isDevelopment: (import.meta as any).env?.DEV || false,
  isProduction: (import.meta as any).env?.PROD || false,
};

// Compatibilidade com importação por classe
export class Environment {
  static get GOOGLE_SHEETS_ID(): string {
    return environment.googleSheetsId;
  }
  
  static get GOOGLE_SHEETS_API_KEY(): string {
    return environment.googleSheetsApiKey;
  }
  
  static get GOOGLE_SCRIPT_URL(): string {
    return environment.googleScriptUrl;
  }
} 