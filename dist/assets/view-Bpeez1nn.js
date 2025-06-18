import{C as m}from"./chartManager-DTtrTfBc.js";class p{constructor(){this.chartManager=new m,this.init()}async init(){try{const e=new URLSearchParams(window.location.search);if(!(e.get("shared")==="true")){this.showError("Este link não é uma análise compartilhada válida.");return}const n=this.extractAnalysisFromUrl(e);if(!n){this.showError("Dados da análise não encontrados no link.");return}this.displayAnalysis(n)}catch(e){console.error("Erro ao inicializar visualização:",e),this.showError("Erro ao carregar análise compartilhada.")}}extractAnalysisFromUrl(e){try{const t=e.get("connected"),n=e.get("disconnected"),o=e.get("compliance"),s=e.get("status"),r=e.get("timestamp");if(!t||!n||!o||!s)return null;const a=this.tryLoadFullAnalysisData(e.get("id"));if(a)return a;const l=parseInt(t),c=parseInt(n);return{frameInfo:{name:"Análise Compartilhada",nodeId:"shared",url:"#"},summary:{connected:l,disconnected:c,total:l+c},components:this.generateMockComponents(l,c),timestamp:r?parseInt(r):Date.now(),complianceRate:parseFloat(o.replace("%","")),complianceStatus:decodeURIComponent(s),analysisId:e.get("id")||void 0}}catch(t){return console.error("Erro ao extrair dados da URL:",t),null}}tryLoadFullAnalysisData(e){if(!e)return null;try{const t=localStorage.getItem(`shared-analysis-${e}`);if(t)return JSON.parse(t);const n=sessionStorage.getItem(`shared-analysis-${e}`);return n?JSON.parse(n):null}catch(t){return console.error("Erro ao carregar dados completos:",t),null}}generateMockComponents(e,t){const n=[];for(let o=0;o<e;o++)n.push({name:`Componente Conectado ${o+1}`,type:"INSTANCE",isConnectedToDS:!0,priority:3,nodeId:`connected-${o}`,depth:1});for(let o=0;o<t;o++)n.push({name:`Componente Desconectado ${o+1}`,type:"OTHER",isConnectedToDS:!1,priority:2,nodeId:`disconnected-${o}`,depth:1});return n}displayAnalysis(e){const t=document.getElementById("loading-state");t&&t.classList.add("hidden");const n=document.getElementById("analysis-content");n&&n.classList.remove("hidden"),this.updateBasicInfo(e),this.updateChart(e),this.updateSummary(e),this.updateComponentsTable(e)}updateBasicInfo(e){const t=document.getElementById("frame-name");t&&(t.textContent=e.frameInfo.name);const n=document.getElementById("analysis-date");if(n){const r=new Date(e.timestamp);n.textContent=`Analisado em ${r.toLocaleDateString("pt-BR")} às ${r.toLocaleTimeString("pt-BR")}`}const o=document.getElementById("figma-link");o&&e.frameInfo.url!=="#"?o.href=e.frameInfo.url:o&&(o.style.display="none");const s=document.getElementById("compliance-status");s&&(s.textContent=e.complianceStatus,s.className=`px-2 py-1 text-xs font-medium rounded-full ${e.complianceRate>=80?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`)}updateChart(e){this.chartManager.updatePieChartWithValues(e.summary.connected,e.summary.disconnected)}updateSummary(e){const t=document.getElementById("summary-cards");if(!t)return;const n=e.summary.total>0?Math.round(e.summary.connected/e.summary.total*100):0;t.innerHTML=`
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
          <p class="text-2xl font-bold text-blue-900">${n}%</p>
        </div>
        <div class="text-blue-600">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
      </div>
    `}createFigmaElementUrl(e,t){try{if(e==="#"||!e)return null;const n=new URL(e),o=t.replace(":","-");return n.searchParams.set("node-id",o),n.toString()}catch(n){return console.error("Erro ao criar URL do elemento Figma:",n),null}}updateComponentsTable(e){const t=document.getElementById("components-table-body");if(!t)return;t.innerHTML="",this.getAllComponents(e).forEach(o=>{const{component:s,isIncluded:r}=o,a=document.createElement("tr");a.className="border-b border-gray-200 hover:bg-gray-50";const l=s.isConnectedToDS?'<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Conectado</span>':'<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Desconectado</span>',c=this.createFigmaElementUrl(e.frameInfo.url,s.nodeId),d=c?`<a href="${c}" target="_blank" class="text-red-600 hover:text-red-800 underline font-mono text-sm" title="Abrir elemento no Figma">${s.nodeId} 🔗</a>`:`<span class="font-mono text-sm text-gray-500">${s.nodeId}</span>`,i=r?"Sim":"Não";a.innerHTML=`
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          ${s.name}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${s.type}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${l}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${d}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${i}
        </td>
      `,t.appendChild(a)})}getAllComponents(e){const t=[];try{const n=localStorage.getItem(`shared-analysis-${e.analysisId||"unknown"}`);if(n){const o=JSON.parse(n);if(o.components&&Array.isArray(o.components)&&o.components.forEach(s=>{t.push({component:s,isIncluded:!0})}),o.excludedComponents&&Array.isArray(o.excludedComponents)&&o.excludedComponents.forEach(s=>{t.push({component:s,isIncluded:!1})}),t.length>0)return t}}catch(n){console.warn("Não foi possível recuperar dados completos do localStorage:",n)}return e.components.forEach(n=>{t.push({component:n,isIncluded:!0})}),t}showError(e){const t=document.getElementById("loading-state");t&&t.classList.add("hidden");const n=document.getElementById("error-state");n&&n.classList.remove("hidden");const o=document.getElementById("error-message");o&&(o.textContent=e)}}document.addEventListener("DOMContentLoaded",()=>{new p});
