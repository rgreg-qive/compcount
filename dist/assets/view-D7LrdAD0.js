import{C as f}from"./chartManager-DTtrTfBc.js";class y{constructor(){this.chartManager=new f,this.init()}async init(){var e,o,t,n;try{console.log("🚀 Iniciando ViewApp...");const s=new URLSearchParams(window.location.search);if(console.log("🔍 Parâmetros da URL:",Object.fromEntries(s.entries())),!(s.get("shared")==="true")){console.log("❌ Não é um link compartilhado válido"),this.showError("Este link não é uma análise compartilhada válida.");return}console.log("✅ Link compartilhado válido detectado");const r=this.extractAnalysisFromUrl(s);if(!r){console.log("❌ Nenhum dado de análise encontrado"),this.showError("Dados da análise não encontrados no link.");return}console.log("✅ Dados da análise carregados com sucesso!"),console.log("📊 Resumo dos dados:",{frameInfo:((e=r.frameInfo)==null?void 0:e.name)||"N/A",totalComponents:((o=r.components)==null?void 0:o.length)||0,connected:((t=r.summary)==null?void 0:t.connected)||0,disconnected:((n=r.summary)==null?void 0:n.disconnected)||0}),this.displayAnalysis(r)}catch(s){console.error("❌ Erro ao inicializar visualização:",s),this.showError("Erro ao carregar análise compartilhada.")}}extractAnalysisFromUrl(e){var o,t;try{const n=e.get("connected"),s=e.get("disconnected"),a=e.get("compliance"),r=e.get("status"),d=e.get("timestamp");if(!n||!s||!a||!r)return console.log("❌ Parâmetros básicos da URL não encontrados"),null;const l=this.tryLoadFullAnalysisData(e.get("id"));if(l)return console.log("✅ Dados completos carregados do storage!"),l;const i=e.get("data");if(i){console.log("🔍 Tentando decodificar dados da URL...");try{const p=atob(decodeURIComponent(i)),c=JSON.parse(p);if(console.log("✅ Dados decodificados da URL com sucesso!"),console.log("📊 Componentes encontrados:",((o=c.components)==null?void 0:o.length)||0),console.log("📊 Componentes excluídos:",((t=c.excludedComponents)==null?void 0:t.length)||0),c&&e.get("id")){const g=`shared-analysis-${e.get("id")}`;try{localStorage.setItem(g,JSON.stringify(c)),console.log("💾 Dados salvos no localStorage para uso futuro")}catch(h){console.warn("⚠️ Não foi possível salvar no localStorage:",h)}}return c}catch(p){console.error("❌ Erro ao decodificar dados da URL:",p)}}console.log("⚠️ Usando apenas dados básicos da URL");const m=parseInt(n),u=parseInt(s);return{frameInfo:{name:"Análise Compartilhada",nodeId:"shared",url:"#"},summary:{connected:m,disconnected:u,total:m+u},components:[],timestamp:d?parseInt(d):Date.now(),complianceRate:parseFloat(a.replace("%","")),complianceStatus:decodeURIComponent(r),analysisId:e.get("id")||void 0}}catch(n){return console.error("❌ Erro ao extrair dados da URL:",n),null}}tryLoadFullAnalysisData(e){var o,t,n;if(!e)return console.log("🔍 Nenhum ID fornecido para buscar dados completos"),null;try{const s=`shared-analysis-${e}`;console.log("🔍 Tentando carregar dados do localStorage com chave:",s);const a=localStorage.getItem(s);if(a){console.log("✅ Dados encontrados no localStorage!");const d=JSON.parse(a);return console.log("📊 Dados carregados:",{components:((o=d.components)==null?void 0:o.length)||0,excludedComponents:((t=d.excludedComponents)==null?void 0:t.length)||0,frameInfo:((n=d.frameInfo)==null?void 0:n.name)||"N/A"}),d}else console.log("❌ Nenhum dado encontrado no localStorage");const r=sessionStorage.getItem(s);return r?(console.log("✅ Dados encontrados no sessionStorage!"),JSON.parse(r)):(console.log("❌ Nenhum dado encontrado no sessionStorage"),console.log("🔍 Chaves disponíveis no localStorage:",Object.keys(localStorage)),null)}catch(s){return console.error("❌ Erro ao carregar dados completos:",s),null}}displayAnalysis(e){const o=document.getElementById("loading-state");o&&o.classList.add("hidden");const t=document.getElementById("analysis-content");t&&t.classList.remove("hidden"),this.updateBasicInfo(e),this.updateChart(e),this.updateSummary(e),this.updateComponentsTable(e)}updateBasicInfo(e){const o=document.getElementById("frame-name");o&&(o.textContent=e.frameInfo.name);const t=document.getElementById("analysis-date");if(t){const a=new Date(e.timestamp);t.textContent=`Analisado em ${a.toLocaleDateString("pt-BR")} às ${a.toLocaleTimeString("pt-BR")}`}const n=document.getElementById("figma-link");n&&e.frameInfo.url!=="#"?n.href=e.frameInfo.url:n&&(n.style.display="none");const s=document.getElementById("compliance-status");s&&(s.textContent=e.complianceStatus,s.className=`px-2 py-1 text-xs font-medium rounded-full ${e.complianceRate>=80?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`)}updateChart(e){this.chartManager.updatePieChartWithValues(e.summary.connected,e.summary.disconnected)}updateSummary(e){const o=document.getElementById("summary-cards");if(!o)return;const t=e.summary.total>0?Math.round(e.summary.connected/e.summary.total*100):0;o.innerHTML=`
      <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
        <div>
          <p class="text-sm font-medium text-green-800">Componentes Conectados</p>
          <p class="text-2xl font-bold text-green-900">${e.summary.connected}</p>
        </div>
        <div class="text-green-600">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg">
        <div>
          <p class="text-sm font-medium text-red-800">Componentes Desconectados</p>
          <p class="text-2xl font-bold text-red-900">${e.summary.disconnected}</p>
        </div>
        <div class="text-red-600">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <p class="text-sm font-medium text-blue-800">Taxa de Conformidade</p>
          <p class="text-2xl font-bold text-blue-900">${t}%</p>
        </div>
        <div class="text-blue-600">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
      </div>
    `}createFigmaElementUrl(e,o){try{if(e==="#"||!e)return null;const t=new URL(e),n=o.replace(":","-");return t.searchParams.set("node-id",n),t.toString()}catch(t){return console.error("Erro ao criar URL do elemento Figma:",t),null}}updateComponentsTable(e){const o=document.getElementById("components-table-body");if(!o)return;o.innerHTML="";const t=this.getAllComponents(e);if(t.length===0){const n=document.createElement("tr");n.innerHTML=`
        <td colspan="5" class="px-6 py-8 text-center">
          <div class="text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-sm font-medium text-gray-900 mb-1">Dados detalhados não disponíveis</h3>
            <p class="text-sm text-gray-500">Esta análise foi compartilhada apenas com os totais.</p>
            <p class="text-xs text-gray-400 mt-2">Para ver os componentes detalhados, gere um novo link após fazer a análise.</p>
          </div>
        </td>
      `,o.appendChild(n);return}t.forEach(n=>{const{component:s,isIncluded:a}=n,r=document.createElement("tr");r.className="border-b border-gray-200 hover:bg-gray-50";const d=s.isConnectedToDS?'<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Conectado</span>':'<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Desconectado</span>',l=this.createFigmaElementUrl(e.frameInfo.url,s.nodeId),i=l?`<a href="${l}" target="_blank" class="text-red-600 hover:text-red-800 underline font-mono text-sm" title="Abrir elemento no Figma">${s.nodeId} 🔗</a>`:`<span class="font-mono text-sm text-gray-500">${s.nodeId}</span>`,m=a?"Sim":"Não";r.innerHTML=`
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          ${s.name}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${s.type}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${d}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${i}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${m}
        </td>
      `,o.appendChild(r)})}getAllComponents(e){const o=[],t=new Set;try{const n=localStorage.getItem(`shared-analysis-${e.analysisId||"unknown"}`);if(n){const s=JSON.parse(n);if(s.components&&Array.isArray(s.components)&&s.components.forEach(a=>{t.has(a.nodeId)||(o.push({component:a,isIncluded:!0}),t.add(a.nodeId))}),s.excludedComponents&&Array.isArray(s.excludedComponents)&&s.excludedComponents.forEach(a=>{t.has(a.nodeId)||(o.push({component:a,isIncluded:!1}),t.add(a.nodeId))}),o.length>0)return console.log(`✅ Carregados ${o.length} componentes únicos do localStorage`),o}}catch(n){console.warn("Não foi possível recuperar dados completos do localStorage:",n)}return e.components.forEach(n=>{t.has(n.nodeId)||(o.push({component:n,isIncluded:!0}),t.add(n.nodeId))}),console.log(`✅ Carregados ${o.length} componentes únicos da URL`),o}showError(e){const o=document.getElementById("loading-state");o&&o.classList.add("hidden");const t=document.getElementById("error-state");t&&t.classList.remove("hidden");const n=document.getElementById("error-message");n&&(n.textContent=e)}}document.addEventListener("DOMContentLoaded",()=>{new y});
