const DB_KEY="truckWorkLog.v1";
const $=id=>document.getElementById(id);
const DEFAULT_STATE={truckPlate:"",journeys:[],fuels:[],resetStatsAt:"",resetHistoryAt:"",statsPeriodStartDay:26,tach:{weeklyDriveMin:0,weeklyDriveWeekKey:"",biweeklyDriveMin:0,biweeklyBaseAt:"",reducedDailyUsed:0,reducedDailyBaseAt:"",tenHourUsed:0,tenHourWeekKey:"",pendingCompMin:0,consecutiveReducedWeekly:0,lastWeeklyRestEnd:"",lastReturnDate:"",weeklyRests:[],baselineAt:"",initialSetupDone:false}};
const state=loadState();
function loadState(){try{const raw=JSON.parse(localStorage.getItem(DB_KEY)||"{}");const merged=Object.assign({},DEFAULT_STATE,raw,{tach:Object.assign({},DEFAULT_STATE.tach,raw.tach||{})});if(merged.truckPlate&&raw.tach&&raw.tach.baselineAt&&!Object.prototype.hasOwnProperty.call(raw.tach,"initialSetupDone"))merged.tach.initialSetupDone=true;return merged}catch(e){return JSON.parse(JSON.stringify(DEFAULT_STATE))}}
function saveState(){localStorage.setItem(DB_KEY,JSON.stringify(state));updateUI()}
function uid(prefix){return prefix+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}
function nowLocalInput(){const d=new Date(),z=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`}
function formatDate(v){return v?new Date(v).toLocaleString(I18N.lang,{dateStyle:"short",timeStyle:"short"}):"—"}
function formatDay(v){return v?new Date(v).toLocaleDateString(I18N.lang,{dateStyle:"medium"}):"—"}
function minsToClock(m){m=Math.max(0,Math.round(m||0));return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`}
function minsToText(m){m=Math.max(0,Math.round(m||0));return `${Math.floor(m/60)} ${I18N.t("hours")} ${String(m%60).padStart(2,"0")} ${I18N.t("minutes")}`}
function minsToLong(m){m=Math.max(0,Math.round(m||0));return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")} h`}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2800)}
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0}
function backHome(){show("home")}
function backHistory(){renderHistory();show("historyScreen")}
document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",backHome));
function initSelects(){for(let i=0;i<=24;i++){$("driveHours").insertAdjacentHTML("beforeend",`<option value="${i}">${i} ${I18N.t("hours")}</option>`);$("editDriveHours").insertAdjacentHTML("beforeend",`<option value="${i}">${i} ${I18N.t("hours")}</option>`)}for(let i=0;i<60;i++){$("driveMinutes").insertAdjacentHTML("beforeend",`<option value="${i}">${String(i).padStart(2,"0")} ${I18N.t("minutes")}</option>`);$("editDriveMinutes").insertAdjacentHTML("beforeend",`<option value="${i}">${String(i).padStart(2,"0")} ${I18N.t("minutes")}</option>`)} }
function setNow(id){$(id).value=nowLocalInput()}
document.querySelectorAll("[data-now]").forEach(b=>b.addEventListener("click",()=>setNow(b.dataset.now)));
async function gps(which){if(!navigator.geolocation){toast(I18N.t("locationUnsupported"));return}const btn=document.querySelector(`[data-gps="${which}"]`);btn.disabled=true;btn.textContent=I18N.t("getting");navigator.geolocation.getCurrentPosition(pos=>{const lat=pos.coords.latitude,lng=pos.coords.longitude;$(`${which}Gps`).value=`${lat.toFixed(6)}, ${lng.toFixed(6)}`;const a=$(`${which}Map`);a.href=`https://www.google.com/maps?q=${lat},${lng}`;a.classList.remove("hidden");btn.disabled=false;btn.textContent=I18N.t("getLocation");toast(I18N.t("locationObtained"))},()=>{btn.disabled=false;btn.textContent=I18N.t("getLocation");toast(I18N.t("locationFailed"))},{enableHighAccuracy:true,timeout:15000,maximumAge:30000})}
document.querySelectorAll("[data-gps]").forEach(b=>b.addEventListener("click",()=>gps(b.dataset.gps)));
function gpsParts(s){if(!s)return {lat:"",lng:"",maps:""};const p=s.split(",").map(x=>x.trim());return {lat:p[0]||"",lng:p[1]||"",maps:p.length>1?`https://www.google.com/maps?q=${p[0]},${p[1]}`:""}}
function weekStart(d){const x=new Date(d);x.setHours(0,0,0,0);const day=x.getDay()||7;x.setDate(x.getDate()-day+1);return x}
function yearKm(){const y=new Date().getFullYear();return completedJourneys().filter(j=>new Date(j.endDate||j.startDate).getFullYear()===y).reduce((s,j)=>s+(j.kmDay||0),0)}
function monthPeriod(d=new Date()){const dayStart=Math.min(31,Math.max(1,Number(state.statsPeriodStartDay)||26));let y=d.getFullYear(),m=d.getMonth(),day=d.getDate();let start=new Date(y,m,dayStart);if(day<dayStart)start=new Date(y,m-1,dayStart);const endDay=dayStart-1;let end;if(endDay===0){end=new Date(start.getFullYear(),start.getMonth(),0,23,59,59)}else{end=new Date(start.getFullYear(),start.getMonth()+1,endDay,23,59,59);if(end.getMonth()!==((start.getMonth()+1)%12)){end=new Date(start.getFullYear(),start.getMonth()+2,0,23,59,59)}}return {start,end}}
function resetBoundary(area){const key=area==="history"?"resetHistoryAt":"resetStatsAt";return state[key]?new Date(state[key]):null}
function visibleJourneys(area="stats"){const cut=resetBoundary(area);return state.journeys.filter(j=>{if(!cut)return true;const d=new Date(j.endDate||j.startDate);return !isNaN(d)&&d>=cut})}
function visibleFuels(){const cut=resetBoundary("stats");return state.fuels.filter(f=>{if(!cut)return true;const d=new Date(f.date);return !isNaN(d)&&d>=cut})}
function completedJourneys(){return visibleJourneys("stats").filter(j=>j.status==="CLOSED")}
function calcOverallConsumption(){const fuels=visibleFuels().slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),full=fuels.filter(f=>f.full);if(full.length<2)return null;let totalLiters=0;for(let i=1;i<full.length;i++){const from=full[i-1],to=full[i];const between=fuels.filter(f=>new Date(f.date)>new Date(from.date)&&new Date(f.date)<=new Date(to.date));totalLiters+=between.reduce((s,f)=>s+f.liters,0)}const km=full[full.length-1].km-full[0].km;return km>0?`${(totalLiters/km*100).toFixed(2)} L/100 km`:null}

let truckEditMode=false;
$("truckBtn").addEventListener("click",()=>{
  syncJourneyPauses();syncWeeklyRestsFromJourneys();
  const firstSetup=!state.truckPlate || !(state.tach&&state.tach.initialSetupDone);
  $("truckInput").value=state.truckPlate;
  $("tachInitialFields").classList.toggle("hidden",!firstSetup);
  $("changeTruckBtn").classList.toggle("hidden",firstSetup);
  truckEditMode=firstSetup;
  if(firstSetup){fillInitialTachFields(true)}
  $("truckScreenTitle").textContent=state.truckPlate?I18N.t("changePlate"):I18N.t("truck");
  show("truckScreen");
});
function fillInitialTachFields(empty=false){
  if(empty){$("tachWeekly").value="";$("tachBiweekly").value="";$("tachReducedDaily").value="0";$("tachTenHour").value="0";$("tachConsecutiveReduced").value="0";$("tachLastWeeklyRest").value="";$("tachLastReturn").value="";return}
  const t=state.tach||DEFAULT_STATE.tach,ws=weekStart(new Date()),we=new Date(ws);we.setDate(we.getDate()+7);
  $("tachWeekly").value=t.weeklyDriveMin?minsToInput(t.weeklyDriveMin):"";$("tachBiweekly").value=t.biweeklyDriveMin?minsToInput(t.biweeklyDriveMin):"";
  $("tachReducedDaily").value=Math.min(3,(t.reducedDailyUsed||0)+reducedDailyFromApp());$("tachTenHour").value=Math.min(2,(t.tenHourUsed||0)+tenHourFromApp(ws,we));$("tachConsecutiveReduced").value=t.consecutiveReducedWeekly||0;$("tachLastWeeklyRest").value=t.lastWeeklyRestEnd||"";$("tachLastReturn").value=t.lastReturnDate||"";
}
$("changeTruckBtn").addEventListener("click",()=>{truckEditMode=true;$("truckInput").value="";fillInitialTachFields(true);$("tachInitialFields").classList.remove("hidden");$("changeTruckBtn").classList.add("hidden")});
function minsToInput(m){m=Math.max(0,Math.round(m||0));return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`}
function inputToMins(v){
  if(!v)return 0;
  const raw=String(v).trim();
  if(raw.includes(":")){const p=raw.split(":").map(Number);return Math.max(0,(p[0]||0)*60+Math.min(59,Math.max(0,p[1]||0)))}
  const digits=raw.replace(/\D/g,"").slice(0,4);
  if(!digits)return 0;
  if(digits.length<=2)return Number(digits)*60;
  return Number(digits.slice(0,-2))*60+Math.min(59,Number(digits.slice(-2)));
}
function attachDurationInput(id){
  const el=$(id); if(!el)return;
  el.addEventListener("input",()=>{
    const digits=el.value.replace(/\D/g,"").slice(0,4);
    if(!digits){el.value="";return}
    el.value=digits.length<=2?digits:digits.slice(0,2)+":"+digits.slice(2);
  });
  el.addEventListener("blur",()=>{const mins=inputToMins(el.value);el.value=mins?minsToInput(mins):"";});
}
attachDurationInput("tachWeekly");
attachDurationInput("tachBiweekly");
$("truckForm").addEventListener("submit",e=>{
  e.preventDefault();
  const newPlate=$("truckInput").value.trim().toUpperCase(),oldPlate=state.truckPlate.trim().toUpperCase();
  if(!newPlate){toast(I18N.t("enterPlate"));return}
  const changing=!!oldPlate&&newPlate!==oldPlate;
  let resetAll=false;
  if(changing){
    if(state.journeys.some(j=>j.status==="OPEN")){toast(I18N.t("closeBeforeChange"));return}
    if(!confirm(I18N.t("changeTruckConfirm",{old:oldPlate,new:newPlate})))return;
    resetAll=confirm(I18N.t("changeTruckResetConfirm"));
    if(resetAll){const now=new Date().toISOString();state.resetStatsAt=now;state.resetHistoryAt=now;state.tach=JSON.parse(JSON.stringify(DEFAULT_STATE.tach));}
  }
  state.truckPlate=newPlate;
  const saveTach=!oldPlate||resetAll||(!changing&&truckEditMode);
  if(saveTach){
    state.tach.weeklyDriveMin=inputToMins($("tachWeekly").value);state.tach.weeklyDriveWeekKey=weekKey(new Date());state.tach.biweeklyDriveMin=inputToMins($("tachBiweekly").value);state.tach.biweeklyBaseAt=new Date().toISOString();state.tach.reducedDailyUsed=Math.min(3,Math.max(0,Number($("tachReducedDaily").value)||0));state.tach.reducedDailyBaseAt=new Date().toISOString();state.tach.tenHourUsed=Math.min(2,Math.max(0,Number($("tachTenHour").value)||0));state.tach.tenHourWeekKey=weekKey(new Date());state.tach.consecutiveReducedWeekly=Math.max(0,Number($("tachConsecutiveReduced").value)||0);state.tach.lastWeeklyRestEnd=$("tachLastWeeklyRest").value||"";state.tach.lastReturnDate=$("tachLastReturn").value||"";state.tach.baselineAt=new Date().toISOString();state.tach.initialSetupDone=true;
  }
  saveState();
  truckEditMode=false;fillInitialTachFields(true);$("tachInitialFields").classList.add("hidden");$("changeTruckBtn").classList.remove("hidden");$("truckInput").value=state.truckPlate;
  toast(I18N.t("tachSaved"));alert(I18N.t("tachWarning"));backHome();
});
$("startBtn").addEventListener("click",()=>{if(state.journeys.some(j=>j.status==="OPEN")){toast(I18N.t("alreadyOpen"));return}$('startForm').reset();setNow("startDate");$("startSave").disabled=false;show("startScreen")});
$("finishBtn").addEventListener("click",()=>{const j=state.journeys.find(x=>x.status==="OPEN");if(!j){toast(I18N.t("noOpen"));return}$('finishForm').reset();setNow("finishDate");$("finishKm").value="";$("finishKm").min=String(j.startKm);$("finishKm").placeholder=`${I18N.t("endKmPlaceholder")} (≥ ${j.startKm.toLocaleString(I18N.lang)})`;$("finishKm").setCustomValidity("");$("finishSave").disabled=false;show("finishScreen")});
$("finishKm").addEventListener("input",()=>{const j=state.journeys.find(x=>x.status==="OPEN");const v=Number($("finishKm").value);$("finishKm").setCustomValidity(j&&$("finishKm").value!==""&&v<j.startKm?I18N.t("endKmInvalid"):"")});
function syncJourneyPauses(){
  const all=state.journeys.filter(j=>j.startDate).slice().sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
  let changed=false;
  for(let i=0;i<all.length;i++){
    const j=all[i];
    if(j.status!=="CLOSED"||!j.endDate)continue;
    const next=all.slice(i+1).find(x=>new Date(x.startDate)>=new Date(j.endDate));
    const value=next?Math.max(0,Math.round((new Date(next.startDate)-new Date(j.endDate))/60000)):null;
    if((j.pauseRealizedMin??null)!==value){j.pauseRealizedMin=value;changed=true}
  }
  if(changed)localStorage.setItem(DB_KEY,JSON.stringify(state));
  return changed;
}
$("fuelBtn").addEventListener("click",()=>{$("fuelForm").reset();$("fuelSave").disabled=false;show("fuelScreen")});
$("statsBtn").addEventListener("click",()=>{renderStats();show("statsScreen")});
function initPeriodEditor(){const sel=$("periodStartDay");for(let i=1;i<=31;i++)sel.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);sel.value=String(state.statsPeriodStartDay||26);}
$("changePeriodBtn").addEventListener("click",()=>{$("periodStartDay").value=String(state.statsPeriodStartDay||26);$("periodEditor").classList.toggle("hidden")});
$("cancelPeriodBtn").addEventListener("click",()=>$("periodEditor").classList.add("hidden"));
$("savePeriodBtn").addEventListener("click",()=>{state.statsPeriodStartDay=Math.min(31,Math.max(1,Number($("periodStartDay").value)||26));saveState();renderStats();$("periodEditor").classList.add("hidden");toast(I18N.t("periodSaved"))});
$("historyBtn").addEventListener("click",()=>{syncJourneyPauses();renderHistory();show("historyScreen")});
$("settingsBtn").addEventListener("click",()=>show("settingsScreen"));
$("tachBtn").addEventListener("click",()=>{renderTach();show("tachScreen")});$("weeklyRestsBtn").addEventListener("click",()=>{syncWeeklyRestsFromJourneys();renderWeeklyRests();show("weeklyRestsScreen")});
$("fuelHistoryBtn").addEventListener("click",()=>{renderFuelHistory();show("fuelHistoryScreen")});
$("resetStatsBtn").addEventListener("click",()=>resetLocalData("estadísticas"));
$("resetHistoryBtn").addEventListener("click",()=>resetLocalData("historial"));

$("startForm").addEventListener("submit",e=>{e.preventDefault();const btn=$("startSave");if(btn.disabled)return;btn.disabled=true;const g=gpsParts($("startGps").value),d=$("startDate").value;inferWeeklyRestFromStart(new Date(d));const prev=findPreviousClosedJourney(new Date(d));if(prev){prev.pauseRealizedMin=Math.max(0,Math.round((new Date(d)-new Date(prev.endDate))/60000));}syncJourneyPauses();const j={id:uid("J"),status:"OPEN",plate:state.truckPlate,startDate:d,startKm:Number($("startKm").value),startPlace:$("startPlace").value.trim(),startLat:g.lat,startLng:g.lng,startMaps:g.maps,note:"",createdAt:new Date().toISOString()};state.journeys.push(j);saveState();toast(I18N.t("startSaved"));backHome()});
$("finishForm").addEventListener("submit",e=>{e.preventDefault();const btn=$("finishSave");if(btn.disabled)return;btn.disabled=true;const j=state.journeys.find(x=>x.status==="OPEN");if(!j){toast(I18N.t("noOpen"));btn.disabled=false;return}const endKm=Number($("finishKm").value),endDate=$("finishDate").value;if(!Number.isFinite(endKm)||endKm<j.startKm){toast(I18N.t("endKmInvalid"));btn.disabled=false;return}const g=gpsParts($("finishGps").value),driveMin=Number($("driveHours").value)*60+Number($("driveMinutes").value),start=new Date(j.startDate),end=new Date(endDate),availability=Math.max(0,Math.round((end-start)/60000)),km=endKm-j.startKm;Object.assign(j,{status:"CLOSED",endDate,endKm,endPlace:$("finishPlace").value.trim(),driveMin,availabilityMin:availability,kmDay:km,avgSpeed:driveMin?km/(driveMin/60):0,endLat:g.lat,endLng:g.lng,endMaps:g.maps,note:$("finishNote").value.trim(),pauseRealizedMin:null,updatedAt:new Date().toISOString()});saveState();toast(I18N.t("finishSaved"));backHome()});
$("fuelForm").addEventListener("submit",e=>{e.preventDefault();const btn=$("fuelSave");if(btn.disabled)return;btn.disabled=true;const f={id:uid("F"),plate:state.truckPlate,date:new Date().toISOString(),place:$("fuelPlace").value.trim(),km:Number($("fuelKm").value),liters:Number($("fuelLiters").value),full:$("fuelFull").checked};state.fuels.push(f);saveState();toast(I18N.t("fuelSaved"));backHome()});

function resetLocalData(area){if(state.journeys.some(j=>j.status==="OPEN")){toast(I18N.t("resetWhileOpen"));return}if(!confirm(I18N.t("resetConfirm",{area:area})))return;const now=new Date().toISOString();if(area==="historial")state.resetHistoryAt=now;else state.resetStatsAt=now;saveState();renderStats();renderHistory();toast(I18N.t("resetDone",{area:area.charAt(0).toUpperCase()+area.slice(1)}))}
function renderStats(){const p=monthPeriod();$("periodLabel").textContent=`${p.start.toLocaleDateString(I18N.lang)} → ${p.end.toLocaleDateString(I18N.lang)}`;const closed=completedJourneys(),inMonth=closed.filter(j=>{const d=new Date(j.endDate||j.startDate);return d>=p.start&&d<=p.end});const monthKm=inMonth.reduce((s,j)=>s+(j.kmDay||0),0),totalKm=closed.reduce((s,j)=>s+(j.kmDay||0),0),speedKm=closed.reduce((s,j)=>s+(j.kmDay||0),0),drive=closed.reduce((s,j)=>s+(j.driveMin||0),0);$("monthKm").textContent=`${monthKm.toLocaleString(I18N.lang)} km`;$("totalKm").textContent=`${totalKm.toLocaleString(I18N.lang)} km`;$("yearKm").textContent=`${yearKm().toLocaleString(I18N.lang)} km`;$("avgSpeed").textContent=drive?`${(speedKm/(drive/60)).toFixed(1)} ${I18N.t("speedUnit")}`:"0 km/h";$("avgConsumption").textContent=calcOverallConsumption()??"— L/100 km"}
function renderHistory(){const rows=visibleJourneys("history").slice().sort((a,b)=>new Date(b.startDate)-new Date(a.startDate));$("historyList").innerHTML=rows.map(j=>{const note=j.note?` <span title="${I18N.t("incidents")}">📝</span>`:"";return `<button class="history-row history-open" data-journey="${j.id}"><div><strong>${formatDate(j.startDate)} · ${j.status==="OPEN"?I18N.t("openStatus"):I18N.t("closedStatus")}${note}</strong><small>${j.startKm} ${I18N.t("kmUnit")} → ${j.endKm??"—"} ${I18N.t("kmUnit")} · ${j.kmDay??"—"} ${I18N.t("kmUnit")} · ${j.startPlace} → ${j.endPlace||"—"}</small></div><span class="chevron">›</span></button>`}).join("")||`<div class="settings-card">${I18N.t("noRecords")}</div>`;document.querySelectorAll("[data-journey]").forEach(b=>b.addEventListener("click",()=>openJourneyDetail(b.dataset.journey)))}
function openJourneyDetail(id){syncJourneyPauses();const j=state.journeys.find(x=>x.id===id);if(!j){toast(I18N.t("notFound"));return}$("detailJourneyId").value=id;$("detailStart").textContent=formatDate(j.startDate);$("detailStartKm").textContent=`${Number(j.startKm||0).toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`;$("detailStartPlace").textContent=j.startPlace||"—";$("detailStartMap").href=j.startMaps||((j.startLat&&j.startLng)?`https://www.google.com/maps?q=${j.startLat},${j.startLng}`:"#");$("detailStartMap").classList.toggle("disabled-link",!j.startMaps&&!j.startLat);$("detailEnd").textContent=j.endDate?formatDate(j.endDate):"—";$("detailEndKm").textContent=j.endKm!=null?`${Number(j.endKm).toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`:"—";$("detailEndPlace").textContent=j.endPlace||"—";$("detailEndMap").href=j.endMaps||((j.endLat&&j.endLng)?`https://www.google.com/maps?q=${j.endLat},${j.endLng}`:"#");$("detailEndMap").classList.toggle("disabled-link",!j.endMaps&&!j.endLat);$("detailKm").textContent=j.kmDay!=null?`${Number(j.kmDay).toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`:"—";$("detailDrive").textContent=j.driveMin!=null?minsToText(j.driveMin):"—";$("detailDuration").textContent=j.availabilityMin!=null?minsToLong(j.availabilityMin):"—";$("detailPause").textContent=j.pauseRealizedMin!=null?`${minsToLong(j.pauseRealizedMin)} (${(j.pauseRealizedMin/60/24).toFixed(1)} ${I18N.t("daysUnit")})`:"—";$("journeyNote").value=j.note||"";show("journeyDetailScreen")}
$("journeyDetailBack").addEventListener("click",backHistory);$("journeyDetailBackBottom").addEventListener("click",backHistory);$("journeyDetailForm").addEventListener("submit",e=>{e.preventDefault();const j=state.journeys.find(x=>x.id===$("detailJourneyId").value);if(!j)return;j.note=$("journeyNote").value.trim();saveState();toast(I18N.t("notesSaved"));backHistory()});

function renderFuelHistory(){const fuels=visibleFuels().slice().sort((a,b)=>new Date(b.date)-new Date(a.date));$("fuelHistoryList").innerHTML=fuels.map(f=>`<div class="fuel-history-row"><strong>${formatDate(f.date)}</strong><span>${f.place}</span><span>${Number(f.km).toLocaleString(I18N.lang)} km</span><span>${Number(f.liters).toLocaleString(I18N.lang)} L</span><span>${f.full?"✓ "+I18N.t("fuelFull"):""}</span></div>`).join("")||`<div class="settings-card">${I18N.t("noFuels")}</div>`}

function weeklyDrivingFromApp(start,end){return completedJourneys().filter(j=>{const d=new Date(j.endDate||j.startDate);return d>=start&&d<end}).reduce((s,j)=>s+(Number(j.driveMin)||0),0)}
function weekKey(d){const ws=weekStart(d);return `${ws.getFullYear()}-${String(ws.getMonth()+1).padStart(2,"0")}-${String(ws.getDate()).padStart(2,"0")}`}
function ensureTachMeta(){const t=state.tach||DEFAULT_STATE.tach;if(!t.weeklyDriveWeekKey&&t.baselineAt)t.weeklyDriveWeekKey=weekKey(new Date(t.baselineAt));if(!t.biweeklyBaseAt)t.biweeklyBaseAt=t.baselineAt||"";if(!t.reducedDailyBaseAt)t.reducedDailyBaseAt=t.baselineAt||"";state.tach=t;return t}
function resetTachWeeklyCountersIfNeeded(){const key=weekKey(new Date()),t=ensureTachMeta();let changed=false;if(t.weeklyDriveWeekKey!==key){t.weeklyDriveMin=0;t.weeklyDriveWeekKey=key;changed=true}if(!t.tenHourWeekKey||t.tenHourWeekKey!==key){t.tenHourUsed=0;t.tenHourWeekKey=key;changed=true}if(changed)localStorage.setItem(DB_KEY,JSON.stringify(state));return t}
function tenHourFromApp(start,end){return completedJourneys().filter(j=>{const d=new Date(j.endDate||j.startDate),drive=Number(j.driveMin)||0;return d>=start&&d<end&&drive>540}).length}
function appBiweeklySinceBase(){
  const t=ensureTachMeta(),base=t.biweeklyBaseAt?new Date(t.biweeklyBaseAt):null;
  const ws=weekStart(new Date()),start14=new Date(ws);start14.setDate(start14.getDate()-7),end14=new Date(ws);end14.setDate(end14.getDate()+7);
  return completedJourneys().filter(j=>{const d=new Date(j.endDate||j.startDate);return d>=start14&&d<end14&&(!base||d>base)}).reduce((sum,j)=>sum+(Number(j.driveMin)||0),0);
}
function biweeklyAppWindowTotal(){
  const ws=weekStart(new Date()),start14=new Date(ws);start14.setDate(start14.getDate()-7),end14=new Date(ws);end14.setDate(end14.getDate()+7);
  return completedJourneys().filter(j=>{const d=new Date(j.endDate||j.startDate);return d>=start14&&d<end14}).reduce((sum,j)=>sum+(Number(j.driveMin)||0),0);
}
function effectiveManualBiweekly(){const t=ensureTachMeta();return Number(t.biweeklyDriveMin)||0}
function findPreviousClosedJourney(startDate){return state.journeys.filter(j=>j.status==="CLOSED"&&j.endDate&&new Date(j.endDate)<=startDate).sort((a,b)=>new Date(b.endDate)-new Date(a.endDate))[0]||null}
function addAutoWeeklyRest(start,end){const t=ensureTachMeta();t.weeklyRests=t.weeklyRests||[];const exists=t.weeklyRests.find(r=>Math.abs(new Date(r.start)-new Date(start))<60000&&Math.abs(new Date(r.end)-new Date(end))<60000);if(exists)return exists;const minutes=Math.round((new Date(end)-new Date(start))/60000);if(minutes<1440)return null;const reduced=minutes<2700,rest={id:uid("R"),start:new Date(start).toISOString(),end:new Date(end).toISOString(),minutes,reduced,outsideSpain:false,compMin:reduced?Math.max(0,2700-minutes):0,source:"auto"};t.weeklyRests.push(rest);return rest}
function syncWeeklyRestsFromJourneys(){const t=ensureTachMeta();t.weeklyRests=t.weeklyRests||[];const sorted=state.journeys.filter(j=>j.status==="CLOSED"&&j.endDate).slice().sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));let changed=false;for(let i=0;i<sorted.length-1;i++){const end=sorted[i].endDate,start=sorted[i+1].startDate;if((new Date(start)-new Date(end))>=1440*60000){const before=t.weeklyRests.length;addAutoWeeklyRest(end,start);changed=changed||t.weeklyRests.length>before}}const open=state.journeys.find(j=>j.status==="OPEN");if(open){const prev=findPreviousClosedJourney(new Date(open.startDate));if(prev&&(new Date(open.startDate)-new Date(prev.endDate))>=1440*60000){const before=t.weeklyRests.length;addAutoWeeklyRest(prev.endDate,open.startDate);changed=changed||t.weeklyRests.length>before}}const latest=t.weeklyRests.slice().sort((a,b)=>new Date(b.end)-new Date(a.end))[0];if(latest&&t.lastWeeklyRestEnd!==latest.end){t.lastWeeklyRestEnd=latest.end;changed=true}if(latest&&(!t.reducedDailyBaseAt||new Date(latest.end)>new Date(t.reducedDailyBaseAt))){t.reducedDailyUsed=0;t.reducedDailyBaseAt=latest.end;changed=true}const pending=t.weeklyRests.reduce((sum,r)=>sum+(r.compMin||0),0);if(t.pendingCompMin!==pending){t.pendingCompMin=pending;changed=true}if(changed)localStorage.setItem(DB_KEY,JSON.stringify(state));return t}
function inferWeeklyRestFromStart(startDate){const t=syncWeeklyRestsFromJourneys();const prev=findPreviousClosedJourney(startDate);if(!prev)return null;const gap=Math.round((startDate-new Date(prev.endDate))/60000);if(!Number.isFinite(gap)||gap<1440)return null;const rest=addAutoWeeklyRest(prev.endDate,startDate);if(rest){t.lastWeeklyRestEnd=rest.end;t.pendingCompMin=t.weeklyRests.reduce((sum,r)=>sum+(r.compMin||0),0);t.reducedDailyUsed=0;t.reducedDailyBaseAt=rest.end;localStorage.setItem(DB_KEY,JSON.stringify(state));}return rest}
function reducedDailyFromApp(){
  const t=ensureTachMeta(),rests=(t.weeklyRests||[]).slice().sort((a,b)=>new Date(b.end)-new Date(a.end));
  const base=t.reducedDailyBaseAt?new Date(t.reducedDailyBaseAt):null;let count=0;
  const starts=state.journeys.filter(j=>j.startDate).slice().sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
  for(const j of starts){
    const start=new Date(j.startDate),prev=findPreviousClosedJourney(start);if(!prev)continue;
    const prevEnd=new Date(prev.endDate);if(base&&prevEnd<base)continue;
    const gap=Math.round((start-prevEnd)/60000);if(gap<540||gap>=1440)continue;
    const availability=Number(prev.availabilityMin)||0;
    const reducedByShortRest=gap<660;
    const reducedBy24hWindow=availability>=781 && availability+gap>1440;
    if(reducedByShortRest||reducedBy24hWindow)count++;
  }
  return Math.min(3,count);
}
function biweeklyTotal(){
  const t=ensureTachMeta(),base=t.biweeklyBaseAt?new Date(t.biweeklyBaseAt):null;
  const ws=weekStart(new Date()),start14=new Date(ws);start14.setDate(start14.getDate()-7);const end14=new Date(ws);end14.setDate(end14.getDate()+7);
  const appAll=completedJourneys().filter(j=>{const d=new Date(j.endDate||j.startDate);return d>=start14&&d<end14});
  if(!base||isNaN(base)||base<start14)return appAll.reduce((s,j)=>s+(Number(j.driveMin)||0),0);
  const postBase=appAll.filter(j=>new Date(j.endDate||j.startDate)>base).reduce((s,j)=>s+(Number(j.driveMin)||0),0);
  return (Number(t.biweeklyDriveMin)||0)+postBase;
}
function renderTach(){const t=resetTachWeeklyCountersIfNeeded();syncWeeklyRestsFromJourneys();const ws=weekStart(new Date()),we=new Date(ws);we.setDate(we.getDate()+7);const appWeek=weeklyDrivingFromApp(ws,we),weekTotal=(t.weeklyDriveMin||0)+appWeek,biTotal=biweeklyTotal();const ten=Math.min(2,(t.tenHourUsed||0)+tenHourFromApp(ws,we));const autoReduced=reducedDailyFromApp(),latestRest=t.weeklyRests.slice().sort((a,b)=>new Date(b.end)-new Date(a.end))[0];const red=latestRest&&t.reducedDailyBaseAt===latestRest.end?autoReduced:Math.min(3,(t.reducedDailyUsed||0)+autoReduced);$("tachWeekValue").textContent=`${minsToLong(weekTotal)} / 56 h`;$('tachWeekRemaining').textContent=minsToLong(Math.max(0,3360-weekTotal));$("tachBiValue").textContent=`${minsToLong(biTotal)} / 90 h`;$('tachBiRemaining').textContent=minsToLong(Math.max(0,5400-biTotal));$("tachTenValue").textContent=`${ten} / 2`;$('tachTenRemaining').textContent=String(Math.max(0,2-ten));$("tachReducedValue").textContent=`${red} / 3`;$('tachReducedRemaining').textContent=String(Math.max(0,3-red));const autoPendingComp=t.weeklyRests.reduce((sum,r)=>sum+(r.compMin||0),0);$("tachCompValue").textContent=autoPendingComp?minsToLong(autoPendingComp):I18N.t("compNone");const last=t.lastWeeklyRestEnd?new Date(t.lastWeeklyRestEnd):null;if(last&&!isNaN(last))$("tachWeeklyDeadline").textContent=formatDate(new Date(last.getTime()+6*24*60*60*1000));else $("tachWeeklyDeadline").textContent=I18N.t("dataIncomplete");let statusClass="status-good",statusText=I18N.t("statusOk");if(weekTotal>3360||biTotal>5400){statusClass="status-bad";statusText=I18N.t("statusReview")}else if(weekTotal>3000||biTotal>4800||ten>=2||red>=3||autoPendingComp>0){statusClass="status-warn";statusText=I18N.t("statusWarn")}else if(!(weekTotal||biTotal||t.lastWeeklyRestEnd)){statusClass="status-data";statusText=I18N.t("statusOpen")}$('tachStatus').innerHTML=`<span class="${statusClass}">${statusText}</span>`}
function renderWeeklyRests(){const rows=(state.tach.weeklyRests||[]).slice().sort((a,b)=>new Date(b.start)-new Date(a.start));$("weeklyRestList").innerHTML=rows.map(r=>`<div class="rest-row"><strong>${formatDate(r.start)} → ${formatDate(r.end)}</strong><small>${r.reduced?I18N.t("reducedRest"):I18N.t("normalRest")} · ${minsToLong(r.minutes)}${r.outsideSpain?" · 🇪🇺 "+I18N.t("outsideSpain"):""}${r.compMin?` · ${minsToLong(r.compMin)} ${I18N.t("compHours")}`:""}${r.source==="auto"?" · ⚙️":""}</small></div>`).join("")||`<p>${I18N.t("noRest")}</p>`}
$("weeklyRestForm").addEventListener("submit",e=>{e.preventDefault();const start=$("restStart").value,end=$("restEnd").value;if(!start||!end||new Date(end)<=new Date(start)){toast(I18N.t("reviewEnd"));return}const minutes=Math.round((new Date(end)-new Date(start))/60000),reduced=$("restReduced").checked,outside=$("restOutside").checked;const comp=reduced?Math.max(0,2700-minutes):0;state.tach.weeklyRests=state.tach.weeklyRests||[];const exists=state.tach.weeklyRests.find(r=>Math.abs(new Date(r.start)-new Date(start))<60000&&Math.abs(new Date(r.end)-new Date(end))<60000);if(!exists)state.tach.weeklyRests.push({id:uid("R"),start,end,minutes,reduced,outsideSpain:outside,compMin:comp,source:"manual"});state.tach.pendingCompMin=state.tach.weeklyRests.reduce((sum,r)=>sum+(r.compMin||0),0);state.tach.consecutiveReducedWeekly=reduced?(state.tach.consecutiveReducedWeekly||0)+1:0;state.tach.reducedDailyUsed=0;state.tach.reducedDailyBaseAt=end;state.tach.lastWeeklyRestEnd=end;saveState();toast(I18N.t("restSaved"));$("weeklyRestForm").reset();renderTach()});

function updateUI(){const open=state.journeys.find(j=>j.status==="OPEN"),lastClosed=visibleJourneys("history").filter(j=>j.status==="CLOSED").sort((a,b)=>new Date(b.endDate)-new Date(a.endDate))[0];$("truckPlate").textContent=state.truckPlate||"---";$("journeyStatus").textContent=open?I18N.t("open"):I18N.t("closed");$("journeyStatusDot").classList.toggle("open",!!open);$("startBtn").disabled=!!open;$("finishBtn").disabled=!open;if(open){$("journeyStatusText").textContent=`${I18N.t("openStart")} ${formatDate(open.startDate)} · ${open.startKm.toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`}else if(lastClosed){$("journeyStatusText").textContent=`${I18N.t("lastFinish")} ${formatDate(lastClosed.endDate)}`}else $("journeyStatusText").textContent=I18N.t("newJourney");$("syncStatus").textContent=I18N.t("deviceSaved");updateJourneyTimer()}
function updateJourneyTimer(){const open=state.journeys.find(j=>j.status==="OPEN");const card=$("journeyTimer");if(!card)return;if(open){const mins=Math.max(0,Math.round((Date.now()-new Date(open.startDate))/60000));card.textContent=`${I18N.t("journeyDuration")}: ${minsToClock(mins)} h`;card.classList.add("running")}else{const last=state.journeys.filter(j=>j.status==="CLOSED"&&j.endDate).sort((a,b)=>new Date(b.endDate)-new Date(a.endDate))[0];const mins=last?Math.max(0,Math.round((Date.now()-new Date(last.endDate))/60000)):0;card.textContent=`${I18N.t("pauseSinceLast")}: ${String(Math.floor(mins/60)).padStart(3,"0")}:${String(mins%60).padStart(2,"0")} h (${(mins/1440).toFixed(1)} ${I18N.t("daysUnit")})`;card.classList.remove("running")}}
setInterval(()=>{updateJourneyTimer();const active=document.querySelector("#home.active");if(active)updateUI()},1000);

function exportBackup(){const payload={version:"5.2.0",exportedAt:new Date().toISOString(),data:state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${I18N.t("backupFile")}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(I18N.t("backupReady"))}
function importBackup(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(reader.result),data=payload.data||payload;if(!Array.isArray(data.journeys)||!Array.isArray(data.fuels))throw new Error();const merged=Object.assign({},DEFAULT_STATE,data,{tach:Object.assign({},DEFAULT_STATE.tach,data.tach||{})});if(!confirm(I18N.t("importConfirm")))return;localStorage.setItem(DB_KEY,JSON.stringify(merged));location.reload()}catch(e){toast(I18N.t("backupInvalid"))}};reader.readAsText(file)}
$("exportBtn").addEventListener("click",exportBackup);$("importFile").addEventListener("change",e=>importBackup(e.target.files[0]));

initSelects();initPeriodEditor();updateUI();
