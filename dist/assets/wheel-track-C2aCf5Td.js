import"./style-hLBxd820.js";function c(){console.log("=== LocalStorage Contents ===");const o=Object.keys(localStorage);if(o.length===0){console.log("localStorage is empty");return}const e=[];o.forEach(t=>{try{const a=JSON.parse(localStorage.getItem(t));e.push({Key:t,Type:typeof a,Value:a})}catch{const n=localStorage.getItem(t);e.push({Key:t,Type:typeof n,Value:n,Note:"Could not parse as JSON"})}}),console.table(e,["Key","Type","Value","Note"]),console.log(`
=== Detailed View ===`),e.forEach(t=>{console.group(`Key: ${t.Key}`),console.log("Type:",t.Type),console.log("Value:",t.Value),t.Note&&console.log("Note:",t.Note),console.groupEnd()})}document.addEventListener("DOMContentLoaded",()=>{console.log("Wheel Track Calculator initialized"),c();const o=document.getElementById("calculate"),e=document.getElementById("reset");o&&o.addEventListener("click",i),e&&e.addEventListener("click",d)});function f(o,e){return o*e*.2/e}function p(o,e){return o*e*.8/e}function i(){console.log("Calculating wheel track...");const o=parseFloat(document.getElementById("wheel-base-start").value),e=parseFloat(document.getElementById("wheel-base-end").value),t=parseFloat(document.getElementById("wheel-base-step").value),a=localStorage.getItem("wingAreaInputs");if(!a){alert("Please set the weight in the Wing Area tab first.");return}const n=parseFloat(JSON.parse(a).weight);if(console.log("Weight from Wing Area tab:",n,"kg"),isNaN(n)||n<=0){alert("Invalid weight found. Please set a valid weight in the Wing Area tab.");return}const l=n*9.81;if(console.log("Weight in Newtons:",l,"N"),isNaN(o)||isNaN(e)||isNaN(t)||t<=0){alert("Please enter valid wheel base range and step values");return}const u=[];for(let s=o;s<=e;s+=t)u.push(parseFloat(s.toFixed(2)));const g=u.map(s=>({wheelBase:s,mainGearDistance:f(s,l),noseGearDistance:p(s,l)}));r=[...g],m(g);const h=document.getElementById("export-excel");h&&(h.disabled=!1)}function m(o){const e=document.getElementById("results-container");if(!e)return;let t=`
        <div class="table-responsive">
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Wheel Base (in)</th>
                        <th>Main Gear from CG (in)</th>
                        <th>Nose Gear from CG (in)</th>
                    </tr>
                </thead>
                <tbody>
    `;o.forEach(a=>{t+=`
            <tr>
                <td>${a.wheelBase.toFixed(2)}</td>
                <td>${a.mainGearDistance.toFixed(2)}</td>
                <td>${a.noseGearDistance.toFixed(2)}</td>
            </tr>
        `}),t+=`
                </tbody>
            </table>
        </div>
    `,e.innerHTML=t}function d(){console.log("Resetting form...");const o=document.querySelector("form");o&&o.reset();const e=document.getElementById("results-container");e&&(e.innerHTML=""),r=[];const t=document.getElementById("export-excel");t&&(t.disabled=!0)}window.WheelTrack={logAllLocalStorage:c,calculateWheelTrack:i,resetForm:d};function y(o){try{if(!o||o.length===0){alert("No data to export. Please calculate the wheel track first.");return}const e=[["Wheel Base (in)","Main Gear from CG (in)","Nose Gear from CG (in)"],...o.map(l=>[l.wheelBase.toFixed(2),l.mainGearDistance.toFixed(2),l.noseGearDistance.toFixed(2)])],t=XLSX.utils.aoa_to_sheet(e),a=XLSX.utils.book_new();XLSX.utils.book_append_sheet(a,t,"Wheel Track Results");const n=`WheelTrack_Results_${new Date().toISOString().slice(0,10)}.xlsx`;XLSX.writeFile(a,n),console.log("Export successful:",n)}catch(e){console.error("Error exporting to Excel:",e),alert("Error exporting to Excel. Please try again.")}}let r=[];addEventListener("DOMContentLoaded",()=>{console.log("Wheel Track Calculator initialized"),c();const o=document.getElementById("calculate"),e=document.getElementById("export-excel"),t=document.getElementById("reset");o&&o.addEventListener("click",i),e&&e.addEventListener("click",()=>{r&&r.length>0?y(r):alert("No data to export. Please calculate the wheel track first.")}),t&&t.addEventListener("click",d)});
