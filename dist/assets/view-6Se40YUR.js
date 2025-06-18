import{C as l}from"./chartManager-DTtrTfBc.js";class c{constructor(){this.chartManager=new l,this.init()}async init(){try{const e=new URLSearchParams(window.location.search);if(!(e.get("shared")==="true")){this.showError("Este link não é uma análise compartilhada válida.");return}const t=this.extractAnalysisFromUrl(e);if(!t){this.showError("Dados da análise não encontrados no link.");return}this.displayAnalysis(t)}catch(e){console.error("Erro ao inicializar visualização:",e),this.showError("Erro ao carregar análise compartilhada.")}}extractAnalysisFromUrl(e){try{const n=e.get("connected"),t=e.get("disconnected"),s=e.get("compliance"),o=e.get("status"),a=e.get("timestamp");if(!n||!t||!s||!o)return null;const r=this.tryLoadFullAnalysisData(e.get("id"));if(r)return r;const i=parseInt(n),d=parseInt(t);return{frameInfo:{name:"Análise Compartilhada",nodeId:"shared",url:"#"},summary:{connected:i,disconnected:d,total:i+d},components:this.generateMockComponents(i,d),timestamp:a?parseInt(a):Date.now(),complianceRate:parseFloat(s.replace("%","")),complianceStatus:decodeURIComponent(o)}}catch(n){return console.error("Erro ao extrair dados da URL:",n),null}}tryLoadFullAnalysisData(e){if(!e)return null;try{const n=localStorage.getItem(`shared-analysis-${e}`);if(n)return JSON.parse(n);const t=sessionStorage.getItem(`shared-analysis-${e}`);return t?JSON.parse(t):null}catch(n){return console.error("Erro ao carregar dados completos:",n),null}}generateMockComponents(e,n){const t=[];for(let s=0;s<e;s++)t.push({name:`Componente Conectado ${s+1}`,type:"INSTANCE",isConnectedToDS:!0,priority:3,nodeId:`connected-${s}`,depth:1});for(let s=0;s<n;s++)t.push({name:`Componente Desconectado ${s+1}`,type:"OTHER",isConnectedToDS:!1,priority:2,nodeId:`disconnected-${s}`,depth:1});return t}displayAnalysis(e){const n=document.getElementById("loading-state");n&&n.classList.add("hidden");const t=document.getElementById("analysis-content");t&&t.classList.remove("hidden"),this.updateBasicInfo(e),this.updateChart(e),this.updateSummary(e),this.updateComponentsTable(e)}updateBasicInfo(e){const n=document.getElementById("frame-name");n&&(n.textContent=e.frameInfo.name);const t=document.getElementById("analysis-date");if(t){const a=new Date(e.timestamp);t.textContent=`Analisado em ${a.toLocaleDateString("pt-BR")} às ${a.toLocaleTimeString("pt-BR")}`}const s=document.getElementById("figma-link");s&&e.frameInfo.url!=="#"?s.href=e.frameInfo.url:s&&(s.style.display="none");const o=document.getElementById("compliance-status");o&&(o.textContent=e.complianceStatus,o.className=`px-2 py-1 text-xs font-medium rounded-full ${e.complianceRate>=80?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`)}updateChart(e){this.chartManager.updatePieChartWithValues(e.summary.connected,e.summary.disconnected)}updateSummary(e){const n=document.getElementById("summary-cards");if(!n)return;const t=e.summary.total>0?Math.round(e.summary.connected/e.summary.total*100):0;n.innerHTML=`
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
    `}updateComponentsTable(e){const n=document.getElementById("components-table-body");n&&(n.innerHTML="",e.components.forEach(t=>{const s=document.createElement("tr");s.className="hover:bg-gray-50";const o=t.isConnectedToDS?"bg-green-100 text-green-800":"bg-red-100 text-red-800",a=t.isConnectedToDS?"Conectado":"Desconectado",r="★".repeat(t.priority)+"☆".repeat(5-t.priority);s.innerHTML=`
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${t.name}</div>
          <div class="text-sm text-gray-500">ID: ${t.nodeId}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            ${t.type}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o}">
            ${a}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <span title="Prioridade ${t.priority}/5">${r}</span>
        </td>
      `,n.appendChild(s)}))}showError(e){const n=document.getElementById("loading-state");n&&n.classList.add("hidden");const t=document.getElementById("error-state");t&&t.classList.remove("hidden");const s=document.getElementById("error-message");s&&(s.textContent=e)}}document.addEventListener("DOMContentLoaded",()=>{new c});
