import{C as x,T as f}from"./themeManager-CRIQpY6X.js";class y{constructor(){this.chartManager=new x,new f,this.init()}async init(){var e,t,o,n;try{console.log("🚀 Iniciando ViewApp...");const s=new URLSearchParams(window.location.search);if(console.log("🔍 Parâmetros da URL:",Object.fromEntries(s.entries())),!(s.get("shared")==="true")){console.log("❌ Não é um link compartilhado válido"),this.showError("Este link não é uma análise compartilhada válida.");return}console.log("✅ Link compartilhado válido detectado");const r=this.extractAnalysisFromUrl(s);if(!r){console.log("❌ Nenhum dado de análise encontrado"),this.showError("Dados da análise não encontrados no link.");return}console.log("✅ Dados da análise carregados com sucesso!"),console.log("📊 Resumo dos dados:",{frameInfo:((e=r.frameInfo)==null?void 0:e.name)||"N/A",totalComponents:((t=r.components)==null?void 0:t.length)||0,connected:((o=r.summary)==null?void 0:o.connected)||0,disconnected:((n=r.summary)==null?void 0:n.disconnected)||0}),this.displayAnalysis(r)}catch(s){console.error("❌ Erro ao inicializar visualização:",s),this.showError("Erro ao carregar análise compartilhada.")}}extractAnalysisFromUrl(e){var t,o;try{const n=e.get("connected"),s=e.get("disconnected"),a=e.get("compliance"),r=e.get("status"),d=e.get("timestamp");if(!n||!s||!a||!r)return console.log("❌ Parâmetros básicos da URL não encontrados"),null;const l=this.tryLoadFullAnalysisData(e.get("id"));if(l)return console.log("✅ Dados completos carregados do storage!"),l;const i=e.get("data");if(i){console.log("🔍 Tentando decodificar dados da URL...");try{const g=atob(decodeURIComponent(i)),c=JSON.parse(g);if(console.log("✅ Dados decodificados da URL com sucesso!"),console.log("📊 Componentes encontrados:",((t=c.components)==null?void 0:t.length)||0),console.log("📊 Componentes excluídos:",((o=c.excludedComponents)==null?void 0:o.length)||0),c&&e.get("id")){const u=`shared-analysis-${e.get("id")}`;try{localStorage.setItem(u,JSON.stringify(c)),console.log("💾 Dados salvos no localStorage para uso futuro")}catch(h){console.warn("⚠️ Não foi possível salvar no localStorage:",h)}}return c}catch(g){console.error("❌ Erro ao decodificar dados da URL:",g)}}console.log("⚠️ Usando apenas dados básicos da URL");const m=parseInt(n),p=parseInt(s);return{frameInfo:{name:"Análise Compartilhada",nodeId:"shared",url:"#"},summary:{connected:m,disconnected:p,total:m+p},components:[],timestamp:d?parseInt(d):Date.now(),complianceRate:parseFloat(a.replace("%","")),complianceStatus:decodeURIComponent(r),analysisId:e.get("id")||void 0}}catch(n){return console.error("❌ Erro ao extrair dados da URL:",n),null}}tryLoadFullAnalysisData(e){var t,o,n;if(!e)return console.log("🔍 Nenhum ID fornecido para buscar dados completos"),null;try{const s=`shared-analysis-${e}`;console.log("🔍 Tentando carregar dados do localStorage com chave:",s);const a=localStorage.getItem(s);if(a){console.log("✅ Dados encontrados no localStorage!");const d=JSON.parse(a);return console.log("📊 Dados carregados:",{components:((t=d.components)==null?void 0:t.length)||0,excludedComponents:((o=d.excludedComponents)==null?void 0:o.length)||0,frameInfo:((n=d.frameInfo)==null?void 0:n.name)||"N/A"}),d}else console.log("❌ Nenhum dado encontrado no localStorage");const r=sessionStorage.getItem(s);return r?(console.log("✅ Dados encontrados no sessionStorage!"),JSON.parse(r)):(console.log("❌ Nenhum dado encontrado no sessionStorage"),console.log("🔍 Chaves disponíveis no localStorage:",Object.keys(localStorage)),null)}catch(s){return console.error("❌ Erro ao carregar dados completos:",s),null}}displayAnalysis(e){const t=document.getElementById("loading-state");t&&t.classList.add("hidden");const o=document.getElementById("analysis-content");o&&o.classList.remove("hidden"),this.updateBasicInfo(e),this.updateChart(e),this.updateSummary(e),this.updateComponentsTable(e)}updateBasicInfo(e){const t=document.getElementById("frame-name");t&&(t.textContent=e.frameInfo.name);const o=document.getElementById("analysis-date");if(o){const a=new Date(e.timestamp);o.textContent=`Analisado em ${a.toLocaleDateString("pt-BR")} às ${a.toLocaleTimeString("pt-BR")}`}const n=document.getElementById("figma-link");n&&e.frameInfo.url!=="#"?n.href=e.frameInfo.url:n&&(n.style.display="none");const s=document.getElementById("compliance-status");s&&(s.textContent=e.complianceStatus,s.className=`px-2 py-1 text-xs font-medium rounded-full ${e.complianceRate>=80?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`)}updateChart(e){this.chartManager.updatePieChartWithValues(e.summary.connected,e.summary.disconnected)}updateSummary(e){const t=document.getElementById("summary-cards");if(!t)return;const o=e.summary.total>0?Math.round(e.summary.connected/e.summary.total*100):0;t.innerHTML=`
      <div class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div>
          <p class="text-sm font-medium text-green-800 dark:text-green-200">Componentes Conectados</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">${e.summary.connected}</p>
        </div>
        <div class="text-green-600 dark:text-green-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div>
          <p class="text-sm font-medium text-red-800 dark:text-red-200">Componentes Desconectados</p>
          <p class="text-2xl font-bold text-red-900 dark:text-red-200">${e.summary.disconnected}</p>
        </div>
        <div class="text-red-600 dark:text-red-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div>
          <p class="text-sm font-medium text-blue-800 dark:text-blue-200">Taxa de Conformidade</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">${o}%</p>
        </div>
        <div class="text-blue-600 dark:text-blue-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
      </div>
    `}createFigmaElementUrl(e,t){try{if(e==="#"||!e)return null;const o=new URL(e),n=t.replace(":","-");return o.searchParams.set("node-id",n),o.toString()}catch(o){return console.error("Erro ao criar URL do elemento Figma:",o),null}}updateComponentsTable(e){const t=document.getElementById("components-table-body");if(!t)return;t.innerHTML="";const o=this.getAllComponents(e);if(o.length===0){const n=document.createElement("tr");n.innerHTML=`
        <td colspan="5" class="px-6 py-8 text-center">
          <div class="text-gray-500 dark:text-gray-400">
            <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">Dados detalhados não disponíveis</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Esta análise foi compartilhada apenas com os totais.</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Para ver os componentes detalhados, gere um novo link após fazer a análise.</p>
          </div>
        </td>
      `,t.appendChild(n);return}o.forEach(n=>{const{component:s,isIncluded:a}=n,r=document.createElement("tr");r.className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700";const d=s.isConnectedToDS?'<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Conectado</span>':'<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Desconectado</span>',l=this.createFigmaElementUrl(e.frameInfo.url,s.nodeId),i=l?`<a href="${l}" target="_blank" class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline font-mono text-sm" title="Abrir elemento no Figma">${s.nodeId} 🔗</a>`:`<span class="font-mono text-sm text-gray-500 dark:text-gray-400">${s.nodeId}</span>`,m=a?"Sim":"Não";r.innerHTML=`
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          ${s.name}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          ${s.type}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${d}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${i}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          ${m}
        </td>
      `,t.appendChild(r)})}getAllComponents(e){const t=[],o=new Set;try{const n=localStorage.getItem(`shared-analysis-${e.analysisId||"unknown"}`);if(n){const s=JSON.parse(n);if(s.components&&Array.isArray(s.components)&&s.components.forEach(a=>{o.has(a.nodeId)||(t.push({component:a,isIncluded:!0}),o.add(a.nodeId))}),s.excludedComponents&&Array.isArray(s.excludedComponents)&&s.excludedComponents.forEach(a=>{o.has(a.nodeId)||(t.push({component:a,isIncluded:!1}),o.add(a.nodeId))}),t.length>0)return console.log(`✅ Carregados ${t.length} componentes únicos do localStorage`),t}}catch(n){console.warn("Não foi possível recuperar dados completos do localStorage:",n)}return e.components.forEach(n=>{o.has(n.nodeId)||(t.push({component:n,isIncluded:!0}),o.add(n.nodeId))}),console.log(`✅ Carregados ${t.length} componentes únicos da URL`),t}showError(e){const t=document.getElementById("loading-state");t&&t.classList.add("hidden");const o=document.getElementById("error-state");o&&o.classList.remove("hidden");const n=document.getElementById("error-message");n&&(n.textContent=e)}}document.addEventListener("DOMContentLoaded",()=>{new y});
