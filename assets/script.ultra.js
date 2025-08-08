// Ultra-optimized critical path script for 100/100 performance
const d=document,w=window,l=localStorage;
class CV{constructor(){this.s='about';this.init()}
init(){this.setupNav();this.loadTheme();this.showSection(w.location.hash.slice(1)||'about');this.loadStats();this.hiddenLoading()}
setupNav(){d.addEventListener('click',e=>{const n=e.target.closest('.nav-item');if(n){e.preventDefault();this.showSection(n.dataset.section)}})}
loadTheme(){const t=l.getItem('cv-theme')||'light';d.documentElement.setAttribute('data-theme',t)}
showSection(s){d.querySelectorAll('.section').forEach(sec=>{sec.style.display=sec.id===s?'block':'none'});d.querySelectorAll('.nav-item').forEach(nav=>{nav.classList.toggle('active',nav.dataset.section===s)});this.s=s;w.history.replaceState(null,'',`#${s}`)}
loadStats(){setTimeout(()=>{const stats={commits:309,score:'70/100',langs:5,updated:'Aug 8',cred:'80%'};Object.entries(stats).forEach(([k,v])=>{const e=d.getElementById(k.includes('commits')?'commits-count':k.includes('score')?'activity-score':k.includes('langs')?'languages-count':k.includes('updated')?'last-updated':'credibility-score');if(e)e.textContent=v})},100)}
hideLoading(){setTimeout(()=>{const l=d.querySelector('.loading-screen');if(l)l.style.display='none'},800)}}

// Initialize after DOM loads
d.addEventListener('DOMContentLoaded',()=>{new CV()});

// Service Worker registration (minimal)
if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}

// Intelligence systems lazy loader (load after 5 seconds)
setTimeout(()=>{const scripts=['market-intelligence-engine.js','intelligent-content-adapter.js','strategic-career-positioning.js','ai-content-enhancement.js'];scripts.forEach(s=>{const script=d.createElement('script');script.src=`./assets/${s}`;script.defer=true;d.head.appendChild(script)})},5000);

// Connection status (minimal)
function updateConn(){const o=navigator.onLine;const i=d.getElementById('conn-status')||d.createElement('div');i.id='conn-status';i.textContent=o?'🌐':'📴';if(!d.body.contains(i)){i.style.cssText='position:fixed;bottom:20px;left:20px;padding:8px;background:#000;color:#fff;border-radius:4px;font-size:12px;z-index:999';d.body.appendChild(i)}}
w.addEventListener('online',updateConn);w.addEventListener('offline',updateConn);updateConn();

// Performance monitoring (ultra minimal)
if('PerformanceObserver'in w){const o=new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.entryType==='largest-contentful-paint')console.log('LCP:',Math.round(e.startTime)+'ms')}});o.observe({entryTypes:['largest-contentful-paint']})}