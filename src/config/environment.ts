/**
 * Configurações de ambiente da aplicação
 */
export const environment = {
  // Google Sheets API
  googleSheetsApiKey: (import.meta as any).env?.VITE_GOOGLE_SHEETS_API_KEY || '',
  googleSheetsId: (import.meta as any).env?.VITE_GOOGLE_SHEETS_ID || '1jC49dfYgZyVCtYzDIFq9y4Q8nFKuQoPKX07IHxkViSY',
  
  // Outros configs
  isDevelopment: (import.meta as any).env?.DEV || false,
  isProduction: (import.meta as any).env?.PROD || false,
}; 