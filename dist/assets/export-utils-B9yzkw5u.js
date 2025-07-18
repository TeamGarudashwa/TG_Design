let p;const h=document.createElement("style");h.textContent=`
    .import-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        transition: background-color 0.3s ease;
    }
    .import-btn:hover {
        background-color: #45a049;
    }
    .import-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
        opacity: 0.7;
    }
    .import-loading {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-right: 0.5rem;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .export-message {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease-out;
    }
    .export-success {
        background-color: #4CAF50;
    }
    .export-error {
        background-color: #f44336;
    }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @media (max-width: 768px) {
        .import-btn span {
            display: none;
        }
        .import-btn i {
            margin-right: 0;
        }
        .export-message {
            left: 10px;
            right: 10px;
            bottom: 10px;
            text-align: center;
        }
    }
`;document.head.appendChild(h);function g(){typeof p>"u"&&window.XLSX&&(p=window.XLSX)}async function y(){const n={"wing-area":w(),"wing-parameter":b(),"dynamic-thrust":S(),"climb-rate":x(),"sink-rate":A(),"landing-distance":E(),"takeoff-distance":D(),"vn-diagram":q(),"wheel-track":C()},o=await Promise.all(Object.values(n));return Object.keys(n).reduce((t,l,e)=>(t[l]=o[e],t),{})}function m(n){const o=document.querySelector(n);if(!o)return{};const r=o.querySelectorAll('input[type="number"], input[type="text"], select'),t={};return r.forEach(l=>{const e=l.id||l.name||l.placeholder||`input_${Math.random().toString(36).substr(2,9)}`;e&&(t[e]=l.value)}),t}function w(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function b(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function S(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function x(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function A(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function E(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function D(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function q(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function C(){const n=m(".calculator-container"),o=document.getElementById("results-table");let r=[];if(o){const t=o.querySelectorAll("tr");if(t.length>1){const l=Array.from(t[0].querySelectorAll("th")).map(e=>e.textContent.trim());for(let e=1;e<t.length;e++){const a=t[e].querySelectorAll("td"),s={};a.forEach((i,c)=>{s[l[c]||`col_${c}`]=i.textContent.trim()}),r.push(s)}}}return{inputs:n,results:r,timestamp:new Date().toISOString()}}function I(n){const o=p.utils.book_new();return Object.entries(n).forEach(([r,t])=>{const l=[];if(t.inputs&&(l.push(["INPUTS"]),l.push(["Parameter","Value"]),Object.entries(t.inputs).forEach(([u,a])=>{l.push([u,a])}),l.push([])),t.results&&Array.isArray(t.results)&&t.results.length>0){l.push(["RESULTS"]);const u=Object.keys(t.results[0]);l.push(u),t.results.forEach(a=>{l.push(u.map(s=>a[s]))})}l.push([],["Generated on",new Date().toLocaleString()]);const e=p.utils.aoa_to_sheet(l);p.utils.book_append_sheet(o,e,r.substring(0,31))}),o}function f(n,o=!1){const r=document.querySelector(".export-message");r&&r.remove();const t=document.createElement("div");t.className=`export-message ${o?"export-error":"export-success"}`,t.textContent=n,document.body.appendChild(t),setTimeout(()=>{t.style.animation="fadeOut 0.5s ease-out",setTimeout(()=>t.remove(),500)},5e3)}function d(n,o){if(o){n.disabled=!0;const r=document.createElement("span");r.className="import-loading",n.insertBefore(r,n.firstChild)}else{n.disabled=!1;const r=n.querySelector(".import-loading");r&&r.remove()}}async function k(n){const o=n?.target.closest(".import-btn");try{if(o&&d(o,!0),g(),!p)throw new Error("Excel export library not loaded. Please refresh the page and try again.");f("Preparing data for export...");const r=await y();if(!Object.values(r).some(a=>a.inputs&&Object.keys(a.inputs).length>0||a.results&&a.results.length>0))throw new Error("No data found to export. Please perform some calculations first.");f("Creating Excel file...");const l=I(r),u=`TG-APCalc-Export-${new Date().toISOString().replace(/[:.]/g,"-")}.xlsx`;return f("Downloading file..."),p.writeFile(l,u),f("Export completed successfully!"),console.log("Export successful:",u),!0}catch(r){return console.error("Error exporting data:",r),f(`Error: ${r.message}`,!0),!1}finally{o&&d(o,!1)}}typeof window<"u"&&window.addEventListener("load",()=>{g(),document.querySelectorAll(".import-btn").forEach(n=>{n.replaceWith(n.cloneNode(!0));const o=document.querySelector(`#${n.id}`);o.addEventListener("click",r=>{r.preventDefault(),k(r)}),o.title="Export all calculator data to Excel",o.setAttribute("aria-label","Export all calculator data to Excel")})});
