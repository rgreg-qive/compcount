import{C as m}from"./chartManager-DTtrTfBc.js";class p{constructor(){this.chartManager=new m,this.init()}async init(){try{const e=new URLSearchParams(window.location.search);if(!(e.get("shared")==="true")){this.showError("Este link não é uma análise compartilhada válida.");return}const t=this.extractAnalysisFromUrl(e);if(!t){this.showError("Dados da análise não encontrados no link.");return}this.displayAnalysis(t)}catch(e){console.error("Erro ao inicializar visualização:",e),this.showError("Erro ao carregar análise compartilhada.")}}extractAnalysisFromUrl(e){try{const n=e.get("connected"),t=e.get("disconnected"),o=e.get("compliance"),s=e.get("status"),r=e.get("timestamp");if(!n||!t||!o||!s)return null;const a=this.tryLoadFullAnalysisData(e.get("id"));if(a)return a;const l=parseInt(n),d=parseInt(t);return{frameInfo:{name:"Análise Compartilhada",nodeId:"shared",url:"#"},summary:{connected:l,disconnected:d,total:l+d},components:this.generateMockComponents(l,d),timestamp:r?parseInt(r):Date.now(),complianceRate:parseFloat(o.replace("%","")),complianceStatus:decodeURIComponent(s),analysisId:e.get("id")||void 0}}catch(n){return console.error("Erro ao extrair dados da URL:",n),null}}tryLoadFullAnalysisData(e){if(!e)return null;try{const n=localStorage.getItem(`shared-analysis-${e}`);if(n)return JSON.parse(n);const t=sessionStorage.getItem(`shared-analysis-${e}`);return t?JSON.parse(t):null}catch(n){return console.error("Erro ao carregar dados completos:",n),null}}generateMockComponents(e,n){const t=[];for(let o=0;o<e;o++)t.push({name:`Componente Conectado ${o+1}`,type:"INSTANCE",isConnectedToDS:!0,priority:3,nodeId:`connected-${o}`,depth:1});for(let o=0;o<n;o++)t.push({name:`Componente Desconectado ${o+1}`,type:"OTHER",isConnectedToDS:!1,priority:2,nodeId:`disconnected-${o}`,depth:1});return t}displayAnalysis(e){const n=document.getElementById("loading-state");n&&n.classList.add("hidden");const t=document.getElementById("analysis-content");t&&t.classList.remove("hidden"),this.updateBasicInfo(e),this.updateChart(e),this.updateSummary(e),this.updateComponentsTable(e)}updateBasicInfo(e){const n=document.getElementById("frame-name");n&&(n.textContent=e.frameInfo.name);const t=document.getElementById("analysis-date");if(t){const r=new Date(e.timestamp);t.textContent=`Analisado em ${r.toLocaleDateString("pt-BR")} às ${r.toLocaleTimeString("pt-BR")}`}const o=document.getElementById("figma-link");o&&e.frameInfo.url!=="#"?o.href=e.frameInfo.url:o&&(o.style.display="none");const s=document.getElementById("compliance-status");s&&(s.textContent=e.complianceStatus,s.className=`px-2 py-1 text-xs font-medium rounded-full ${e.complianceRate>=80?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`)}updateChart(e){this.chartManager.updatePieChartWithValues(e.summary.connected,e.summary.disconnected)}updateSummary(e){const n=document.getElementById("summary-cards");if(!n)return;const t=e.summary.total>0?Math.round(e.summary.connected/e.summary.total*100):0;n.innerHTML=`
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
    `}createFigmaElementUrl(e,n){try{if(e==="#"||!e)return null;const t=new URL(e),o=n.replace(":","-");return t.searchParams.set("node-id",o),t.toString()}catch(t){return console.error("Erro ao criar URL do elemento Figma:",t),null}}updateComponentsTable(e){const n=document.getElementById("components-table-body");if(!n)return;n.innerHTML="",this.getAllComponents(e).forEach(o=>{const{component:s,isIncluded:r}=o,a=document.createElement("tr");a.className="border-b border-gray-200 hover:bg-gray-50";const l=s.isConnectedToDS?'<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Conectado</span>':'<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Desconectado</span>',d=this.createFigmaElementUrl(e.frameInfo.url,s.nodeId),c=d?`<a href="${d}" target="_blank" class="text-red-600 hover:text-red-800 underline font-mono text-sm" title="Abrir elemento no Figma">${s.nodeId} 🔗</a>`:`<span class="font-mono text-sm text-gray-500">${s.nodeId}</span>`,i=r?"Sim":"Não";a.innerHTML=`
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
          ${c}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${i}
        </td>
      `,n.appendChild(a)})}getAllComponents(e){const n=[];e.components.forEach(t=>{n.push({component:t,isIncluded:!0})});try{const t=localStorage.getItem(`shared-analysis-${e.analysisId||"unknown"}`);if(t){const o=JSON.parse(t);o.excludedComponents&&Array.isArray(o.excludedComponents)&&o.excludedComponents.forEach(s=>{n.push({component:s,isIncluded:!1})})}}catch(t){console.warn("Não foi possível recuperar componentes excluídos:",t)}return n.filter(t=>!t.isIncluded).length===0&&[{name:"Background Layer",type:"OTHER",isConnectedToDS:!1,priority:1,nodeId:"excluded-1",depth:1},{name:"Decorative Element",type:"OTHER",isConnectedToDS:!1,priority:1,nodeId:"excluded-2",depth:1}].forEach(o=>{n.push({component:o,isIncluded:!1})}),n}showError(e){const n=document.getElementById("loading-state");n&&n.classList.add("hidden");const t=document.getElementById("error-state");t&&t.classList.remove("hidden");const o=document.getElementById("error-message");o&&(o.textContent=e)}}document.addEventListener("DOMContentLoaded",()=>{new p});
