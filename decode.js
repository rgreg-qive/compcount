const encodedData = 'eyJmcmFtZUluZm8iOnsibmFtZSI6IkZyYW1lIDYiLCJub2RlSWQiOiIxNTo2NSIsInVybCI6Imh0dHBzOi8vd3d3LmZpZ21hLmNvbS9kZXNpZ24vbkp3NEJKWFJCRldKTVN4MGliNmRIeC9UZXN0ZS1Db21wY291bnQ%2Fbm9kZS1pZD0xNS02NSZ0PXVVcVVEb2xmajBTVnlwMmItMTEifSwiY29tcG9uZW50cyI6W3sibmFtZSI6IlRlc3RlIGRlIHRleHRvIGZvcmEiLCJ0eXBlIjoiVEVYVCIsImlzQ29ubmVjdGVkVG9EUyI6ZmFsc2UsIm5vZGVJZCI6IjE1OjY2In0seyJuYW1lIjoiVGVzdGUgZGUgdGV4dG8iLCJ0eXBlIjoiVEVYVCIsImlzQ29ubmVjdGVkVG9EUyI6dHJ1ZSwibm9kZUlkIjoiMTU6NjcifSx7Im5hbWUiOiJUZXN0ZSBkZSB0ZXh0byBjb20gY29yIiwidHlwZSI6IlRFWFQiLCJpc0Nvbm5lY3RlZFRvRFMiOnRydWUsIm5vZGVJZCI6IjE1OjY4In0seyJuYW1lIjoiQ2FyZHMiLCJ0eXBlIjoiT1RIRVIiLCJpc0Nvbm5lY3RlZFRvRFMiOmZhbHNlLCJub2RlSWQiOiIxNTo3MCJ9LHsibmFtZSI6IkJ1dHRvbiIsInR5cGUiOiJJTlNUQU5DRSIsImlzQ29ubmVjdGVkVG9EUyI6dHJ1ZSwibm9kZUlkIjoiMTY6NzEifV0sImV4Y2x1ZGVkQ29tcG9uZW50cyI6W3sibmFtZSI6IlRlc3RlIGRlIHRleHRvIGZvcmEiLCJ0eXBlIjoiVEVYVCIsImlzQ29ubmVjdGVkVG9EUyI6ZmFsc2UsIm5vZGVJZCI6IjE1OjY2In0seyJuYW1lIjoiQ2FyZHMiLCJ0eXBlIjoiT1RIRVIiLCJpc0Nvbm5lY3RlZFRvRFMiOmZhbHNlLCJub2RlSWQiOiIxNTo3MCJ9XSwic3VtbWFyeSI6eyJjb25uZWN0ZWQiOjMsImRpc2Nvbm5lY3RlZCI6MiwidG90YWwiOjV9LCJjb21wbGlhbmNlUmF0ZSI6MTAwLCJjb21wbGlhbmNlU3RhdHVzIjoiQXByb3ZhZG8iLCJ0aW1lc3RhbXAiOjE3NTAyODk5OTg2OTV9';

try {
  const decodedData = Buffer.from(decodeURIComponent(encodedData), 'base64').toString('utf-8');
  const parsedData = JSON.parse(decodedData);
  
  console.log('=== DADOS DECODIFICADOS ===');
  console.log(JSON.stringify(parsedData, null, 2));
  
  console.log('\n=== COMPONENTES INCLUÍDOS ===');
  parsedData.components.forEach((comp, index) => {
    console.log(`${index + 1}. ${comp.name} (${comp.type}) - ${comp.isConnectedToDS ? 'CONECTADO' : 'DESCONECTADO'} - ID: ${comp.nodeId}`);
  });
  
  console.log('\n=== COMPONENTES EXCLUÍDOS ===');
  parsedData.excludedComponents.forEach((comp, index) => {
    console.log(`${index + 1}. ${comp.name} (${comp.type}) - ${comp.isConnectedToDS ? 'CONECTADO' : 'DESCONECTADO'} - ID: ${comp.nodeId}`);
  });
  
  console.log('\n=== PROBLEMA IDENTIFICADO ===');
  const duplicados = [];
  const allComponents = [...parsedData.components, ...parsedData.excludedComponents];
  const nodeIds = allComponents.map(c => c.nodeId);
  const duplicatedIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
  
  if (duplicatedIds.length > 0) {
    console.log('COMPONENTES DUPLICADOS ENCONTRADOS:');
    duplicatedIds.forEach(id => {
      const comps = allComponents.filter(c => c.nodeId === id);
      console.log(`- ID ${id}: ${comps.map(c => c.name).join(', ')}`);
    });
  } else {
    console.log('Nenhum componente duplicado encontrado.');
  }
  
} catch (error) {
  console.error('Erro ao decodificar:', error);
} 