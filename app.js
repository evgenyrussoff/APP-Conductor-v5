const DB_KEY="truckWorkLog.v1";
const $=id=>document.getElementById(id);
const DEFAULT_STATE={truckPlate:"",journeys:[],fuels:[],documents:[],resetStatsAt:"",resetHistoryAt:"",statsPeriodStartDay:26,tach:{weeklyDriveMin:0,weeklyDriveWeekKey:"",biweeklyDriveMin:0,biweeklyBaseAt:"",reducedDailyUsed:0,reducedDailyBaseAt:"",tenHourUsed:0,tenHourWeekKey:"",pendingCompMin:0,consecutiveReducedWeekly:0,lastWeeklyRestEnd:"",lastReturnDate:"",weeklyRests:[],baselineAt:"",initialSetupDone:false,calcVersion:"",lastRecalculatedAt:"",weeklyCalc:{},crossWeekBaselineAt:"",manualTachBaselineAt:""}};
const state=loadState();
function loadState(){try{const raw=JSON.parse(localStorage.getItem(DB_KEY)||"{}");const merged=Object.assign({},DEFAULT_STATE,raw,{tach:Object.assign({},DEFAULT_STATE.tach,raw.tach||{})});if(merged.truckPlate&&raw.tach&&raw.tach.baselineAt&&!Object.prototype.hasOwnProperty.call(raw.tach,"initialSetupDone"))merged.tach.initialSetupDone=true;return merged}catch(e){return JSON.parse(JSON.stringify(DEFAULT_STATE))}}
function saveState(){localStorage.setItem(DB_KEY,JSON.stringify(state));updateUI()}
function uid(prefix){return prefix+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}
function localDateString(d=new Date()){const z=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`}
function nowLocalInput(){const d=new Date(),z=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`}
function formatDate(v){return v?new Date(v).toLocaleString(I18N.lang,{dateStyle:"short",timeStyle:"short"}):"—"}
function formatDay(v){return v?new Date(v).toLocaleDateString(I18N.lang,{dateStyle:"medium"}):"—"}
function minsToClock(m){m=Math.max(0,Math.round(m||0));return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`}
function minsToText(m){m=Math.max(0,Math.round(m||0));return `${Math.floor(m/60)} ${I18N.t("hours")} ${String(m%60).padStart(2,"0")} ${I18N.t("minutes")}`}
function minsToLong(m){m=Math.max(0,Math.round(m||0));return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")} h`}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2800)}
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0}
function backHome(){show("home")}
function backHistory(){if(window.__journeyDetailSource==="calendar"){renderTach();show("tachScreen");return}renderHistory();show("historyScreen")}
document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",backHome));
let swipeStartX=0,swipeStartY=0;document.addEventListener("touchstart",e=>{const t=e.touches[0];swipeStartX=t.clientX;swipeStartY=t.clientY},{passive:true});document.addEventListener("touchend",e=>{const t=e.changedTouches[0],dx=t.clientX-swipeStartX,dy=t.clientY-swipeStartY;if(swipeStartX<=25&&dx>=70&&Math.abs(dx)>Math.abs(dy)*1.3){const active=document.querySelector(".screen.active");if(active&&active.id!=="home"){if(active.id==="journeyDetailScreen")backHistory();else if(active.id==="consumptionHistoryScreen")show("statsScreen");else backHome();}}},{passive:true});
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
function visibleFuels(){const cut=resetBoundary("stats");return state.fuels.filter(f=>{if(!cut)return true;const d=new Date(`${f.dateOnly||localDateString(new Date(f.date))}T12:00:00`);return !isNaN(d)&&d>=cut})}
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
    state.tach.weeklyDriveMin=inputToMins($("tachWeekly").value);state.tach.weeklyDriveWeekKey=weekKey(new Date());state.tach.initialWeeklySnapshot=state.tach.weeklyDriveMin;state.tach.biweeklyDriveMin=inputToMins($("tachBiweekly").value);state.tach.biweeklyBaseAt=new Date().toISOString();state.tach.initialBiweeklySnapshot=state.tach.biweeklyDriveMin;state.tach.reducedDailyUsed=Math.min(3,Math.max(0,Number($("tachReducedDaily").value)||0));state.tach.reducedDailyBaseAt=new Date().toISOString();state.tach.initialReducedDailySnapshot=state.tach.reducedDailyUsed;state.tach.tenHourUsed=Math.min(2,Math.max(0,Number($("tachTenHour").value)||0));state.tach.tenHourWeekKey=weekKey(new Date());state.tach.initialTenHourSnapshot=state.tach.tenHourUsed;state.tach.consecutiveReducedWeekly=Math.max(0,Number($("tachConsecutiveReduced").value)||0);state.tach.lastWeeklyRestEnd=$("tachLastWeeklyRest").value||"";state.tach.lastReturnDate=$("tachLastReturn").value||"";state.tach.baselineAt=new Date().toISOString();state.tach.initialSetupDone=true;
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
$("fuelBtn").addEventListener("click",()=>{$("fuelForm").reset();$("fuelDate").value=localDateString(new Date());$("fuelSave").disabled=false;show("fuelScreen")});
$("statsBtn").addEventListener("click",()=>{renderStats();show("statsScreen")});
function initPeriodEditor(){const sel=$("periodStartDay");for(let i=1;i<=31;i++)sel.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);sel.value=String(state.statsPeriodStartDay||26);}
$("changePeriodBtn").addEventListener("click",()=>{$("periodStartDay").value=String(state.statsPeriodStartDay||26);$("periodEditor").classList.toggle("hidden")});
$("cancelPeriodBtn").addEventListener("click",()=>$("periodEditor").classList.add("hidden"));
$("savePeriodBtn").addEventListener("click",()=>{state.statsPeriodStartDay=Math.min(31,Math.max(1,Number($("periodStartDay").value)||26));saveState();renderStats();$("periodEditor").classList.add("hidden");toast(I18N.t("periodSaved"))});
$("historyBtn").addEventListener("click",()=>{syncJourneyPauses();renderHistory();show("historyScreen")});
$("settingsBtn").addEventListener("click",()=>{const sel=$("languageSelect");if(sel)sel.value=I18N.lang;show("settingsScreen")});
$("languageSelect").value=I18N.lang;
$("languageSelect").addEventListener("change",e=>{I18N.setLanguage(e.target.value);saveState();renderStats();renderHistory();renderFuelHistory();renderDocuments();if($("consumptionHistoryScreen").classList.contains("active"))renderConsumptionHistory();toast(I18N.t("languageSaved"))});
$("tachBtn").addEventListener("click",()=>{renderTach();show("tachScreen")});$("recalcTachBtn").addEventListener("click",()=>{recalculateTachograph(true);renderTach();toast(I18N.t("recalcDone"))});$("weeklyRestsBtn").addEventListener("click",()=>{syncWeeklyRestsFromJourneys();renderWeeklyRests();show("weeklyRestsScreen")});
$("fuelHistoryBtn").addEventListener("click",()=>{renderFuelHistory();show("fuelHistoryScreen")});
$("resetStatsBtn").addEventListener("click",()=>resetLocalData("estadísticas"));
$("resetHistoryBtn").addEventListener("click",()=>resetLocalData("historial"));

$("startForm").addEventListener("submit",e=>{e.preventDefault();const btn=$("startSave");if(btn.disabled)return;btn.disabled=true;const g=gpsParts($("startGps").value),d=$("startDate").value;inferWeeklyRestFromStart(new Date(d));const prev=findPreviousClosedJourney(new Date(d));if(prev){prev.pauseRealizedMin=Math.max(0,Math.round((new Date(d)-new Date(prev.endDate))/60000));}syncJourneyPauses();const j={id:uid("J"),status:"OPEN",plate:state.truckPlate,startDate:d,startKm:Number($("startKm").value),startPlace:$("startPlace").value.trim(),startLat:g.lat,startLng:g.lng,startMaps:g.maps,note:"",createdAt:new Date().toISOString()};state.journeys.push(j);saveState();toast(I18N.t("startSaved"));backHome()});
$("finishForm").addEventListener("submit",e=>{e.preventDefault();const btn=$("finishSave");if(btn.disabled)return;btn.disabled=true;const j=state.journeys.find(x=>x.status==="OPEN");if(!j){toast(I18N.t("noOpen"));btn.disabled=false;return}const endKm=Number($("finishKm").value),endDate=$("finishDate").value;if(!Number.isFinite(endKm)||endKm<j.startKm){toast(I18N.t("endKmInvalid"));btn.disabled=false;return}const g=gpsParts($("finishGps").value),driveMin=Number($("driveHours").value)*60+Number($("driveMinutes").value),start=new Date(j.startDate),end=new Date(endDate),availability=Math.max(0,Math.round((end-start)/60000)),km=endKm-j.startKm;Object.assign(j,{status:"CLOSED",endDate,endKm,endPlace:$("finishPlace").value.trim(),driveMin,availabilityMin:availability,kmDay:km,avgSpeed:driveMin?km/(driveMin/60):0,endLat:g.lat,endLng:g.lng,endMaps:g.maps,note:$("finishNote").value.trim(),pauseRealizedMin:null,updatedAt:new Date().toISOString()});
  const tach=ensureTachMeta();
  // More than 13:00 h of availability leaves less than 11:00 h rest in the
  // 24-hour period, so count one reduced daily rest immediately at shift close.
  if(availability>780){
    j.reducedDailyAutoCounted=true;
    j.reducedDailyAutoCountedAt=new Date().toISOString();
  }
  saveState();
  toast(I18N.t("finishSaved"));
  if(isCrossWeekBoundaryJourney(j)){
    openCrossWeekBaselineDialog(j);
  }else{
    recalculateTachograph(true);
    backHome();
  }
});

function isCrossWeekBoundaryJourney(j){
  if(!j||!j.startDate||!j.endDate)return false;
  const start=new Date(j.startDate),end=new Date(j.endDate);
  return start.getDay()===0 && end.getDay()===1 && (end.getHours()>2 || (end.getHours()===2 && end.getMinutes()>=1));
}
function openCrossWeekBaselineDialog(j){
  recalculateTachograph(true);
  const ws=weekStart(new Date()), bi=calcWeekTotal(ws)+calcWeekTotal(addDays(ws,-7));
  $("crossWeekCalculatedWeekly").textContent=minsToLong(calcWeekTotal(ws));
  $("crossWeekCalculatedBiweekly").textContent=minsToLong(bi);
  $("crossWeekActualWeekly").value="";$("crossWeekActualBiweekly").value="";
  $("crossWeekJourneyInfo").textContent=`${I18N.t("crossWeekJourneyInfo")}: ${formatDate(j.startDate)} → ${formatDate(j.endDate)} · ${Number(j.startKm||0).toLocaleString(I18N.lang)} → ${Number(j.endKm||0).toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`;
  $("crossWeekModal").classList.add("show");
}
function closeCrossWeekModal(){ $("crossWeekModal").classList.remove("show"); }
function applyCrossWeekBaseline(){
  const weekly=inputToMins($("crossWeekActualWeekly").value),bi=inputToMins($("crossWeekActualBiweekly").value);
  if(!weekly||weekly>3360||!bi||bi>5400){toast(I18N.t("crossWeekInvalid"));return;}
  const t=ensureTachMeta(),now=new Date().toISOString();
  t.crossWeekBaselineAt=now;t.baselineAt=now;t.biweeklyBaseAt=now;t.weeklyDriveMin=weekly;t.weeklyDriveWeekKey=weekKey(new Date());t.biweeklyDriveMin=bi;
  t.initialWeeklySnapshot=weekly;t.initialBiweeklySnapshot=bi;t.initialTenHourSnapshot=Number(t.tenHourUsed)||0;t.initialReducedDailySnapshot=Number(t.reducedDailyUsed)||0;t.weeklyCalc={};
  recalculateTachograph(true);closeCrossWeekModal();toast(I18N.t("crossWeekSaved"));backHome();
}
$("crossWeekCancel").addEventListener("click",()=>{closeCrossWeekModal();backHome()});
$("crossWeekSave").addEventListener("click",applyCrossWeekBaseline);
attachDurationInput("crossWeekActualWeekly");attachDurationInput("crossWeekActualBiweekly");
function hasOpenJourney(){return state.journeys.some(j=>String(j.status||"").toUpperCase()==="OPEN")}
function updateManualTachButton(){const btn=$("tachManualHoursBtn");if(!btn)return;const open=hasOpenJourney();btn.disabled=false;btn.setAttribute("aria-disabled",open?"true":"false");btn.classList.toggle("manual-tach-disabled",open);btn.title=open?I18N.t("manualTachDisabled"):I18N.t("manualTachHint")}
function openManualTachModal(){
  const btn=$("tachManualHoursBtn");
  if(hasOpenJourney()){toast(I18N.t("manualTachDisabled"));updateManualTachButton();return}
  const modal=$("manualTachHoursOverlay");if(!btn||!modal){toast("No se pudo abrir la ventana de actualización. Recarga la aplicación.");return}const ws=weekStart(new Date());const weekly=calcWeekTotal(ws);const biweekly=biweeklyTotal();$("manualTachCalculatedWeekly").textContent=minsToLong(weekly);$("manualTachCalculatedBiweekly").textContent=minsToLong(biweekly);$("manualTachWeekly").value="";$("manualTachBiweekly").value="";modal.classList.add("show");modal.setAttribute("aria-hidden","false");setTimeout(()=>$("manualTachWeekly")?.focus(),50)}
function closeManualTachModal(){const modal=$("manualTachHoursOverlay");modal.classList.remove("show");modal.setAttribute("aria-hidden","true")}
function applyManualTachBaseline(){if(hasOpenJourney()){toast(I18N.t("manualTachDisabled"));closeManualTachModal();return}const wr=$("manualTachWeekly").value.trim(),br=$("manualTachBiweekly").value.trim(),weekly=inputToMins(wr),bi=inputToMins(br);if(wr===""||br===""||weekly>3360||bi>5400){toast(I18N.t("manualTachInvalid"));return}recalculateTachograph(false);const t=ensureTachMeta(),now=new Date().toISOString();t.manualTachBaselineAt=now;t.baselineAt=now;t.biweeklyBaseAt=now;t.reducedDailyBaseAt=now;t.crossWeekBaselineAt="";t.weeklyDriveMin=weekly;t.weeklyDriveWeekKey=weekKey(new Date());t.biweeklyDriveMin=bi;t.initialWeeklySnapshot=weekly;t.initialBiweeklySnapshot=bi;t.initialTenHourSnapshot=Number(t.tenHourUsed)||0;t.initialReducedDailySnapshot=Number(t.reducedDailyUsed)||0;t.weeklyCalc={};recalculateTachograph(true);closeManualTachModal();toast(I18N.t("manualTachSaved"));renderTach()}
const tachManualUpdateBtn=$("tachManualHoursBtn");
if(tachManualUpdateBtn){
  tachManualUpdateBtn.disabled=false;
  tachManualUpdateBtn.onclick=e=>{e.preventDefault();openManualTachModal()};
}
$("manualTachCancel").addEventListener("click",closeManualTachModal);$("manualTachSave").addEventListener("click",applyManualTachBaseline);attachDurationInput("manualTachWeekly");attachDurationInput("manualTachBiweekly");
$("manualTachHoursOverlay").addEventListener("click",e=>{if(e.target.id==="manualTachHoursOverlay")closeManualTachModal()});

$("fuelForm").addEventListener("submit",e=>{e.preventDefault();const btn=$("fuelSave");if(btn.disabled)return;btn.disabled=true;const f={id:uid("F"),plate:state.truckPlate,dateOnly:$("fuelDate").value,date:new Date(`${$("fuelDate").value}T12:00:00`).toISOString(),place:$("fuelPlace").value.trim(),km:Number($("fuelKm").value),liters:Number($("fuelLiters").value),full:$("fuelFull").checked};state.fuels.push(f);saveState();toast(I18N.t("fuelSaved"));backHome()});

function resetLocalData(area){if(state.journeys.some(j=>j.status==="OPEN")){toast(I18N.t("resetWhileOpen"));return}if(!confirm(I18N.t("resetConfirm",{area:area})))return;const now=new Date().toISOString();if(area==="historial")state.resetHistoryAt=now;else state.resetStatsAt=now;saveState();renderStats();renderHistory();toast(I18N.t("resetDone",{area:area.charAt(0).toUpperCase()+area.slice(1)}))}
$("consumptionHistoryBtn").addEventListener("click",()=>{renderConsumptionHistory();show("consumptionHistoryScreen")});
function consumptionIntervals(){
  const fuels=visibleFuels().slice().sort((a,b)=>fuelDateForDisplay(a).localeCompare(fuelDateForDisplay(b))||new Date(a.date)-new Date(b.date));
  const full=fuels.map((f,i)=>({f,i})).filter(x=>x.f.full);const intervals=[];
  for(let k=1;k<full.length;k++){
    const prev=full[k-1],cur=full[k],km=Number(cur.f.km)-Number(prev.f.km);
    const prevDate=fuelDateForDisplay(prev.f),date=fuelDateForDisplay(cur.f);
    if(km<=0)continue;
    const litres=fuels.filter((f,i)=>i>prev.i&&i<=cur.i).reduce((sum,f)=>sum+(Number(f.liters)||0),0);
    const [year,month]=date.split("-").map(Number);
    intervals.push({year,month,km,litres,consumption:litres/km*100,date,withinMonth:prevDate.slice(0,7)===date.slice(0,7),withinYear:prevDate.slice(0,4)===date.slice(0,4)});
  }
  return intervals;
}
function renderConsumptionHistory(){
  const list=$("consumptionHistoryList");if(!list)return;
  const intervals=consumptionIntervals(),fuels=visibleFuels();
  const months=new Set(fuels.map(f=>fuelDateForDisplay(f).slice(0,7)));
  const years=[...new Set([...months].map(k=>k.slice(0,4)))].sort((a,b)=>b.localeCompare(a));
  let html="";
  for(const y of years){
    const monthKeys=[...months].filter(k=>k.startsWith(y+"-")).sort((a,b)=>b.localeCompare(a));
    const rows=monthKeys.map(k=>{
      const [yy,mm]=k.split("-").map(Number);
      const its=intervals.filter(x=>x.year===yy&&x.month===mm&&x.withinMonth);
      const km=its.reduce((sum,x)=>sum+x.km,0),litres=its.reduce((sum,x)=>sum+x.litres,0);
      const value=km>0?`${(litres/km*100).toFixed(2)} L/100 km`:"Datos insuficientes";
      return `<div class="consumption-month-row"><strong>${new Date(yy,mm-1,1).toLocaleDateString(I18N.lang,{month:"long",year:"numeric"})}</strong><span>${value}</span><small>${km>0?`${km.toLocaleString(I18N.lang)} km · ${litres.toFixed(1)} L`:`Se necesitan dos repostajes con depósito lleno dentro del mismo mes para calcularlo.`}</small></div>`;
    }).join("");
    const annual=intervals.filter(x=>x.year===Number(y)&&x.withinYear),yearKm=annual.reduce((sum,x)=>sum+x.km,0),yearLitres=annual.reduce((sum,x)=>sum+x.litres,0);
    const yearValue=yearKm>0?`${(yearLitres/yearKm*100).toFixed(2)} L/100 km`:"Datos insuficientes";
    html+=`<details class="history-year" ${y===String(new Date().getFullYear())?"open":""}><summary><span>▼ ${y}</span><b>${yearValue}</b></summary><div class="consumption-year-body">${rows}</div></details>`;
  }
  list.innerHTML=html||`<div class="settings-card">${I18N.t("noFuels")}</div>`;
}
function renderStats(){const p=monthPeriod();$("periodLabel").textContent=`${p.start.toLocaleDateString(I18N.lang)} → ${p.end.toLocaleDateString(I18N.lang)}`;const closed=completedJourneys(),inMonth=closed.filter(j=>{const d=new Date(j.endDate||j.startDate);return d>=p.start&&d<=p.end});const monthKm=inMonth.reduce((s,j)=>s+(j.kmDay||0),0),totalKm=closed.reduce((s,j)=>s+(j.kmDay||0),0),speedKm=closed.reduce((s,j)=>s+(j.kmDay||0),0),drive=closed.reduce((s,j)=>s+(j.driveMin||0),0);$("monthKm").textContent=`${monthKm.toLocaleString(I18N.lang)} km`;$("totalKm").textContent=`${totalKm.toLocaleString(I18N.lang)} km`;$("yearKm").textContent=`${yearKm().toLocaleString(I18N.lang)} km`;$("avgSpeed").textContent=drive?`${(speedKm/(drive/60)).toFixed(1)} ${I18N.t("speedUnit")}`:"0 km/h";$("avgConsumption").textContent=calcOverallConsumption()??"— L/100 km"}
function historyMetricClass(type,minutes){
  if(minutes==null)return "history-metric";
  if(type==="availability"){
    if(minutes>=901)return "history-metric metric-red";
    if(minutes>780)return "history-metric metric-yellow";
    return "history-metric";
  }
  if(type==="pause"){
    if(minutes<540)return "history-metric metric-red";
    if(minutes<660)return "history-metric metric-yellow";
    if(minutes>=660)return "history-metric metric-green";
    return "history-metric";
  }
  return "history-metric";
}
function monthKeyForJourney(j){const d=new Date(j.startDate||j.endDate);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function renderHistory(){
  syncJourneyPauses();const rows=visibleJourneys("history").slice().sort((a,b)=>new Date(b.startDate)-new Date(a.startDate));
  const groups=new Map();rows.forEach(j=>{const d=new Date(j.startDate||j.endDate),year=d.getFullYear(),key=monthKeyForJourney(j);if(!groups.has(year))groups.set(year,new Map());if(!groups.get(year).has(key))groups.get(year).set(key,[]);groups.get(year).get(key).push(j)});
  const years=[...groups.keys()].sort((a,b)=>b-a),currentYear=new Date().getFullYear(),yearCount=years.length;
  const weeklyRestMarker=j=>{
    if(!j||j.status!=="CLOSED"||!j.startDate)return "";
    const prev=findPreviousClosedJourney(new Date(j.startDate));
    if(!prev||!prev.endDate)return "";
    const minutes=Math.round((new Date(j.startDate)-new Date(prev.endDate))/60000);
    return minutes>=1440?`<div class="history-weekly-rest">Descanso semanal de ${minsToLong(minutes)}</div>`:"";
  };
  const rowHtml=j=>{const note=j.note?` <span title="${I18N.t("incidents")}">📝</span>`:"";const avail=j.availabilityMin!=null?minsToLong(j.availabilityMin):"00:00 h";const pause=j.pauseRealizedMin!=null?minsToLong(j.pauseRealizedMin):"00:00 h";const avClass=historyMetricClass("availability",j.availabilityMin);const pauseClass=historyMetricClass("pause",j.pauseRealizedMin);return `<button class="history-row history-open" data-journey="${j.id}"><div><strong>${formatDate(j.startDate)} · ${j.status==="OPEN"?I18N.t("openStatus"):I18N.t("closedStatus")}${note}</strong><small>${j.startKm} ${I18N.t("kmUnit")} → ${j.endKm??"—"} ${I18N.t("kmUnit")} · ${j.kmDay??"—"} ${I18N.t("kmUnit")} · ${j.startPlace} · ${j.endPlace||"—"}${j.status==="CLOSED"?` · <span class="${avClass}">${I18N.t("availability")}: ${avail}</span> · <span class="${pauseClass}">${I18N.t("pauseRealizedShort")}: ${pause}</span>`:""}</small></div><span class="chevron">›</span></button>${weeklyRestMarker(j)}`};
  const monthHtml=(key,items,open)=>{const [y,m]=key.split("-").map(Number),name=new Date(y,m-1,1).toLocaleDateString(I18N.lang,{month:"long",year:"numeric"}).toUpperCase();return `<details class="history-month" ${open?"open":""}><summary><span>${open?"▼":"▶"} ${name}</span><b>${items.length}</b></summary><div class="history-month-body">${items.map(rowHtml).join("")}</div></details>`};
  let html="";for(const y of years){const months=[...groups.get(y).entries()].sort((a,b)=>b[0].localeCompare(a[0]));if(yearCount>2){const openY=y===currentYear;html+=`<details class="history-year" ${openY?"open":""}><summary><span>${openY?"▼":"▶"} ${y}</span></summary><div>${months.map(([k,items])=>monthHtml(k,items,openY&&k===months[0][0])).join("")}</div></details>`}else html+=months.map(([k,items],idx)=>monthHtml(k,items,idx===0&&y===currentYear)).join("")}
  $("historyList").innerHTML=html||`<div class="settings-card">${I18N.t("noRecords")}</div>`;
  document.querySelectorAll("[data-journey]").forEach(b=>b.addEventListener("click",()=>openJourneyDetail(b.dataset.journey)));
  document.querySelectorAll(".history-month,.history-year").forEach(d=>d.addEventListener("toggle",()=>{const s=d.querySelector("summary span");if(s)s.textContent=s.textContent.replace(/^[▼▶]/,d.open?"▼":"▶")}));
}
function openJourneyDetail(id,source="history"){window.__journeyDetailSource=source;syncJourneyPauses();const j=state.journeys.find(x=>x.id===id);if(!j){toast(I18N.t("notFound"));return}$("detailJourneyId").value=id;$("detailStart").textContent=formatDate(j.startDate);$("detailStartKm").textContent=`${Number(j.startKm||0).toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`;$("detailStartPlace").textContent=j.startPlace||"—";$("detailStartMap").href=j.startMaps||((j.startLat&&j.startLng)?`https://www.google.com/maps?q=${j.startLat},${j.startLng}`:"#");$("detailStartMap").classList.toggle("disabled-link",!j.startMaps&&!j.startLat);$("detailEnd").textContent=j.endDate?formatDate(j.endDate):"—";$("detailEndKm").textContent=j.endKm!=null?`${Number(j.endKm).toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`:"—";$("detailEndPlace").textContent=j.endPlace||"—";$("detailEndMap").href=j.endMaps||((j.endLat&&j.endLng)?`https://www.google.com/maps?q=${j.endLat},${j.endLng}`:"#");$("detailEndMap").classList.toggle("disabled-link",!j.endMaps&&!j.endLat);$("detailKm").textContent=j.kmDay!=null?`${Number(j.kmDay).toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`:"—";$("detailDrive").textContent=j.driveMin!=null?minsToText(j.driveMin):"—";$("detailDuration").textContent=j.availabilityMin!=null?minsToLong(j.availabilityMin):"—";$("detailPause").textContent=j.pauseRealizedMin!=null?`${minsToLong(j.pauseRealizedMin)} (${(j.pauseRealizedMin/60/24).toFixed(1)} ${I18N.t("daysUnit")})`:"—";$("journeyNote").value=j.note||"";show("journeyDetailScreen")}
$("consumptionHistoryBack").addEventListener("click",()=>show("statsScreen"));$("journeyDetailBack").addEventListener("click",backHistory);$("journeyDetailBackBottom").addEventListener("click",backHistory);$("journeyDetailForm").addEventListener("submit",e=>{e.preventDefault();const j=state.journeys.find(x=>x.id===$("detailJourneyId").value);if(!j)return;j.note=$("journeyNote").value.trim();saveState();toast(I18N.t("notesSaved"));backHistory()});

function fuelDateForDisplay(f){return f.dateOnly||localDateString(new Date(f.date))}
function renderFuelHistory(){const fuels=visibleFuels().slice().sort((a,b)=>new Date(b.date)-new Date(a.date));$("fuelHistoryList").innerHTML=fuels.map(f=>`<div class="fuel-history-row"><strong>${new Date(`${fuelDateForDisplay(f)}T12:00:00`).toLocaleDateString(I18N.lang)}</strong><span>${f.place}</span><span>${Number(f.km).toLocaleString(I18N.lang)} km</span><span>${Number(f.liters).toLocaleString(I18N.lang)} L</span><span>${f.full?"✓ "+I18N.t("fuelFull"):""}</span></div>`).join("")||`<div class="settings-card">${I18N.t("noFuels")}</div>`}

function journeyDateForWeek(j){return j&&j.startDate?new Date(j.startDate):new Date(j.endDate||j.startDate)}
function weekDrivingFromJourneys(ws){const we=new Date(ws);we.setDate(we.getDate()+7);return completedJourneys().filter(j=>{const d=journeyDateForWeek(j);return !isNaN(d)&&d>=ws&&d<we}).reduce((s,j)=>s+(Number(j.driveMin)||0),0)}
function weeklyDrivingFromApp(start,end){return completedJourneys().filter(j=>{const d=journeyDateForWeek(j);return d>=start&&d<end}).reduce((s,j)=>s+(Number(j.driveMin)||0),0)}
function weekKey(d){const ws=weekStart(d);return `${ws.getFullYear()}-${String(ws.getMonth()+1).padStart(2,"0")}-${String(ws.getDate()).padStart(2,"0")}`}
function ensureTachMeta(){const t=state.tach||DEFAULT_STATE.tach;if(!t.weeklyDriveWeekKey&&t.baselineAt)t.weeklyDriveWeekKey=weekKey(new Date(t.baselineAt));if(!t.biweeklyBaseAt)t.biweeklyBaseAt=t.baselineAt||"";if(!t.reducedDailyBaseAt)t.reducedDailyBaseAt=t.baselineAt||"";if(!t.weeklyCalc)t.weeklyCalc={};state.tach=t;return t}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function weekLabel(ws){const we=addDays(ws,6);return `${ws.toLocaleDateString(I18N.lang,{day:"2-digit",month:"2-digit"})} → ${we.toLocaleDateString(I18N.lang,{day:"2-digit",month:"2-digit"})}`}
function weekKeyFromDate(d){return weekKey(new Date(d))}
function initialWeeklyForWeek(ws){const t=ensureTachMeta(),base=t.baselineAt?new Date(t.baselineAt):null;if(!base||isNaN(base)||weekKeyFromDate(base)!==weekKeyFromDate(ws))return 0;return Number(t.initialWeeklySnapshot??t.weeklyDriveMin)||0}
function appDrivingForWeek(ws,afterDate=null){const we=addDays(ws,7);return completedJourneys().filter(j=>{const d=journeyDateForWeek(j);return d>=ws&&d<we&&(!afterDate||d>afterDate)}).reduce((s,j)=>s+(Number(j.driveMin)||0),0)}
function calcWeekTotal(ws){const t=ensureTachMeta(),base=t.baselineAt?new Date(t.baselineAt):null;if(base&&!isNaN(base)&&weekKeyFromDate(base)===weekKeyFromDate(ws))return initialWeeklyForWeek(ws)+appDrivingForWeek(ws,base);return appDrivingForWeek(ws)}
function recalculateTachograph(persist=true){
  const t=ensureTachMeta(),now=new Date(),current=weekStart(now),previous=addDays(current,-7);
  if(t.initialWeeklySnapshot==null)t.initialWeeklySnapshot=Number(t.weeklyDriveMin)||0;
  if(t.initialBiweeklySnapshot==null)t.initialBiweeklySnapshot=Number(t.biweeklyDriveMin)||0;
  if(t.initialTenHourSnapshot==null)t.initialTenHourSnapshot=Number(t.tenHourUsed)||0;
  if(t.initialReducedDailySnapshot==null)t.initialReducedDailySnapshot=Number(t.reducedDailyUsed)||0;
  syncWeeklyRestsFromJourneys();
  const currentTotal=calcWeekTotal(current),previousTotal=calcWeekTotal(previous);
  t.weeklyCalc={};
  t.weeklyCalc[weekKey(current)]={minutes:currentTotal,source:weekDrivingFromJourneys(current)>0?"journeys":"initial"};
  t.weeklyCalc[weekKey(previous)]={minutes:previousTotal,source:weekDrivingFromJourneys(previous)>0?"journeys":"initial"};
  // The old biweekly snapshot is preserved for backup compatibility, but is not blindly
  // added to the new fixed two-week calculation: doing so can double-count journeys.
  t.weeklyDriveMin=currentTotal;t.weeklyDriveWeekKey=weekKey(current);
  const calculatedBiweekly=biweeklyTotal();t.biweeklyDriveMin=calculatedBiweekly;t.biweeklyBaseAt=t.biweeklyBaseAt||t.baselineAt||"";
  const base=t.baselineAt?new Date(t.baselineAt):null;const initialTen=(base&&!isNaN(base)&&weekKeyFromDate(base)===weekKeyFromDate(current))?Number(t.initialTenHourSnapshot||0):0;
  t.tenHourUsed=Math.min(2,initialTen+tenHourFromApp(current,addDays(current,7),base));t.tenHourWeekKey=weekKey(current);
  const initialReduced=(base&&!isNaN(base)&&weekKeyFromDate(base)===weekKeyFromDate(current))?Number(t.initialReducedDailySnapshot||0):0;
  const reduced=Math.min(3,initialReduced+reducedDailyFromApp());t.reducedDailyUsed=reduced;
  t.pendingCompMin=(t.weeklyRests||[]).reduce((sum,r)=>sum+(Number(r.compMin)||0),0);
  t.lastRecalculatedAt=now.toISOString();t.calcVersion="5.4.0";
  if(persist)localStorage.setItem(DB_KEY,JSON.stringify(state));
  return {currentTotal,previousTotal,biweeklyTotal:calculatedBiweekly};
}
function resetTachWeeklyCountersIfNeeded(){const key=weekKey(new Date()),t=ensureTachMeta();if(t.weeklyDriveWeekKey!==key||t.tenHourWeekKey!==key){recalculateTachograph(true);return ensureTachMeta()}return t}
function tenHourFromApp(start,end,afterDate=null){return completedJourneys().filter(j=>{const d=journeyDateForWeek(j),drive=Number(j.driveMin)||0;return d>=start&&d<end&&(!afterDate||d>afterDate)&&drive>540}).length}
function findPreviousClosedJourney(startDate){return state.journeys.filter(j=>j.status==="CLOSED"&&j.endDate&&new Date(j.endDate)<=startDate).sort((a,b)=>new Date(b.endDate)-new Date(a.endDate))[0]||null}
function addAutoWeeklyRest(start,end){const t=ensureTachMeta();t.weeklyRests=t.weeklyRests||[];const exists=t.weeklyRests.find(r=>Math.abs(new Date(r.start)-new Date(start))<60000&&Math.abs(new Date(r.end)-new Date(end))<60000);if(exists)return exists;const minutes=Math.round((new Date(end)-new Date(start))/60000);if(minutes<1440)return null;const reduced=minutes<2700,rest={id:uid("R"),start:new Date(start).toISOString(),end:new Date(end).toISOString(),minutes,reduced,outsideSpain:false,compMin:reduced?Math.max(0,2700-minutes):0,source:"auto"};t.weeklyRests.push(rest);return rest}
function syncWeeklyRestsFromJourneys(){const t=ensureTachMeta();t.weeklyRests=t.weeklyRests||[];const sorted=state.journeys.filter(j=>j.status==="CLOSED"&&j.endDate).slice().sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));let changed=false;for(let i=0;i<sorted.length-1;i++){const end=sorted[i].endDate,start=sorted[i+1].startDate;if((new Date(start)-new Date(end))>=1440*60000){const before=t.weeklyRests.length;addAutoWeeklyRest(end,start);changed=changed||t.weeklyRests.length>before}}const open=state.journeys.find(j=>j.status==="OPEN");if(open){const prev=findPreviousClosedJourney(new Date(open.startDate));if(prev&&(new Date(open.startDate)-new Date(prev.endDate))>=1440*60000){const before=t.weeklyRests.length;addAutoWeeklyRest(prev.endDate,open.startDate);changed=changed||t.weeklyRests.length>before}}const latest=t.weeklyRests.slice().sort((a,b)=>new Date(b.end)-new Date(a.end))[0];if(latest&&t.lastWeeklyRestEnd!==latest.end){t.lastWeeklyRestEnd=latest.end;changed=true}if(latest&&(!t.reducedDailyBaseAt||new Date(latest.end)>new Date(t.reducedDailyBaseAt))){t.reducedDailyUsed=0;t.reducedDailyBaseAt=latest.end;changed=true}const pending=t.weeklyRests.reduce((sum,r)=>sum+(r.compMin||0),0);if(t.pendingCompMin!==pending){t.pendingCompMin=pending;changed=true}if(changed)localStorage.setItem(DB_KEY,JSON.stringify(state));return t}
function inferWeeklyRestFromStart(startDate){const t=syncWeeklyRestsFromJourneys();const prev=findPreviousClosedJourney(startDate);if(!prev)return null;const gap=Math.round((startDate-new Date(prev.endDate))/60000);if(!Number.isFinite(gap)||gap<1440)return null;const rest=addAutoWeeklyRest(prev.endDate,startDate);if(rest){t.lastWeeklyRestEnd=rest.end;t.pendingCompMin=t.weeklyRests.reduce((sum,r)=>sum+(r.compMin||0),0);t.reducedDailyUsed=0;t.reducedDailyBaseAt=rest.end;localStorage.setItem(DB_KEY,JSON.stringify(state));}return rest}
function reducedDailyFromApp(){
  const t=ensureTachMeta();
  const staleShiftBaseline=(t.reducedDailyBaseAt&&state.journeys.some(j=>j.reducedDailyAutoCounted&&j.endDate&&Math.abs(new Date(j.endDate)-new Date(t.reducedDailyBaseAt))<60000));
  const candidates=[staleShiftBaseline?"":t.reducedDailyBaseAt,t.lastWeeklyRestEnd,t.baselineAt].filter(Boolean).map(x=>new Date(x)).filter(d=>!isNaN(d));
  const base=candidates.length?new Date(Math.max(...candidates.map(d=>d.getTime()))):null;
  // A jornada >13 h leaves less than 11 h in the 24-hour daily-rest window.
  // Reconstruct from closed journeys so Recalcular cannot lose the counted rest.
  const journeys=state.journeys.filter(j=>j.startDate&&(j.endDate||j.status==="OPEN")).slice().sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
  let count=0;
  for(let i=0;i<journeys.length;i++){
    const j=journeys[i];if(j.status!=="CLOSED"||!j.endDate)continue;
    const end=new Date(j.endDate),availability=Number(j.availabilityMin)||0;
    if(base&&end<=base)continue;
    const next=journeys[i+1];
    const gap=next&&next.startDate?Math.round((new Date(next.startDate)-end)/60000):null;
    // Count one reduced daily rest per interval: a >13 h working span is
    // provisionally counted at shift close; once the next start is known,
    // a 9–11 h rest is also recognized without double-counting that shift.
    if(j.reducedDailyAutoCounted||availability>780||(gap!==null&&gap>=540&&gap<660))count++;
  }
  return Math.min(3,count);
}
function biweeklyTotal(){
  const now=new Date(),ws=weekStart(now),previous=addDays(ws,-7),twoWeekEnd=addDays(ws,7),t=ensureTachMeta();
  // A manual reading is a real tachograph snapshot. From that exact moment
  // forward we add only journeys that actually start after the snapshot.
  // We never add the old snapshot to the complete two-week journey total.
  const manualBase=t.manualTachBaselineAt?new Date(t.manualTachBaselineAt):null;
  if(manualBase&&!isNaN(manualBase)){
    const snap=Number(t.initialBiweeklySnapshot||t.biweeklyDriveMin)||0;
    return snap+completedJourneys().filter(j=>{
      const d=new Date(j.startDate||j.endDate);
      return !isNaN(d)&&d>=manualBase&&d<twoWeekEnd;
    }).reduce((sum,j)=>sum+(Number(j.driveMin)||0),0);
  }
  // Without a manual baseline, use the fixed Monday-Sunday weeks. This keeps
  // Recalcular from double-counting an old automatic snapshot.
  return calcWeekTotal(ws)+calcWeekTotal(previous);
}
function renderTach(){
  recalculateTachograph(true);const t=ensureTachMeta(),ws=weekStart(new Date()),we=addDays(ws,7),weekTotal=calcWeekTotal(ws),biTotal=biweeklyTotal(),ten=Math.min(2,Number(t.tenHourUsed)||0),red=Math.min(3,Number(t.reducedDailyUsed)||0),latestRest=t.weeklyRests.slice().sort((a,b)=>new Date(b.end)-new Date(a.end))[0];
  t.tenHourUsed=ten;t.reducedDailyUsed=red;updateManualTachButton();
  $("tachWeekValue").textContent=`${minsToLong(weekTotal)} / 56 h`;$("tachWeekRemaining").textContent=minsToLong(Math.max(0,3360-weekTotal));$("tachBiValue").textContent=`${minsToLong(biTotal)} / 90 h`;$("tachBiRemaining").textContent=minsToLong(Math.max(0,5400-biTotal));$("tachTenValue").textContent=`${ten} / 2`;$("tachTenRemaining").textContent=String(Math.max(0,2-ten));$("tachReducedValue").textContent=`${red} / 3`;$("tachReducedRemaining").textContent=String(Math.max(0,3-red));const pending=t.weeklyRests.reduce((sum,r)=>sum+(Number(r.compMin)||0),0);$("tachCompValue").textContent=pending?minsToLong(pending):I18N.t("compNone");
  const last=t.lastWeeklyRestEnd?new Date(t.lastWeeklyRestEnd):null;if(last&&!isNaN(last))$("tachWeeklyDeadline").textContent=formatDate(new Date(last.getTime()+6*24*60*60*1000));else $("tachWeeklyDeadline").textContent=I18N.t("dataIncomplete");
  renderTachAlerts(weekTotal,biTotal,ten,red,last);renderWeekCalendar(ws);
  let statusClass="status-good",statusText=I18N.t("statusOk");if(weekTotal>3360||biTotal>5400){statusClass="status-bad";statusText=I18N.t("statusReview")}else if((3360-weekTotal)<=600||(5400-biTotal)<=600||ten>=2||red>=3){statusClass="status-warn";statusText=I18N.t("statusWarn")}else if(!(weekTotal||biTotal||t.lastWeeklyRestEnd)){statusClass="status-data";statusText=I18N.t("statusOpen")}$('tachStatus').innerHTML=`<span class="${statusClass}">${statusText}</span>`;
}
function renderTachAlerts(weekTotal,biTotal,ten,red,lastRest){
  const box=$("tachAlerts");if(!box)return;const alerts=[];
  // The warning is intentionally reserved for the final ~one normal working day.
  // A driver with 6:50 h available is not “near” the weekly limit merely because
  // the old generic 50 h threshold was crossed.
  const dayBuffer=600;
  if(weekTotal>=3360)alerts.push(["bad",`🔴 ${I18N.t("alertWeeklyLimit")}`]);
  else if((3360-weekTotal)<=dayBuffer)alerts.push(["warn",`🟡 ${I18N.t("alertWeeklySoon",{time:minsToLong(3360-weekTotal)})}`]);
  if(biTotal>=5400)alerts.push(["bad",`🔴 ${I18N.t("alertBiweeklyLimit")}`]);
  else if((5400-biTotal)<=600)alerts.push(["warn",`🟡 ${I18N.t("alertBiweeklySoon",{time:minsToLong(5400-biTotal)})}`]);
  if(ten>=2)alerts.push(["warn",`🟡 ${I18N.t("alertTenUsed")}`]);else if(ten===1)alerts.push(["warn",`🟡 ${I18N.t("alertTenOneLeft")}`]);
  if(red>=3)alerts.push(["bad",`🔴 ${I18N.t("alertReducedLimit")}`]);else if(red===2)alerts.push(["warn",`🟡 ${I18N.t("alertReducedOneLeft")}`]);
  if(lastRest){const deadline=new Date(lastRest.getTime()+6*86400000),hours=(deadline-Date.now())/3600000;if(hours<=0)alerts.push(["bad",`🔴 ${I18N.t("alertWeeklyRestOverdue")}`]);else if(hours<=24)alerts.push(["warn",`🟡 ${I18N.t("alertWeeklyRestSoon",{time:Math.ceil(hours)+" h"})}`])}
  else alerts.push(["warn",`🟡 ${I18N.t("alertNoWeeklyRestData")}`]);
  box.innerHTML=alerts.length?alerts.map(a=>`<div class="tach-alert ${a[0]}">${a[1]}</div>`).join(""):`<div class="tach-alert good">🟢 ${I18N.t("alertAllGood")}</div>`
}
function renderWeekCalendar(ws){
  syncJourneyPauses();
  const box=$("weekCalendar");if(!box)return;const names=["L","M","X","J","V","S","D"];let html=`<div class="week-calendar-head">${names.map(n=>`<span>${n}</span>`).join("")}</div><div class="week-calendar-grid">`;
  const journeys=completedJourneys();
  for(let i=0;i<7;i++){
    const day=addDays(ws,i),next=addDays(day,1),items=journeys.filter(j=>{const d=journeyDateForWeek(j);return d>=day&&d<next});
    // Driving belongs to the journey start day. A pause belongs to the day
    // on which the previous journey actually ended (when the rest begins).
    // This makes the overnight rest visible immediately in the correct square.
    const chronological=state.journeys
      // Include an open journey as the next start boundary. This lets the previous
      // day's rest appear as soon as a new journey is started, without counting
      // driving time for the still-open journey.
      .filter(j=>j.startDate&&((j.status==="CLOSED"&&j.endDate)||j.status==="OPEN"))
      .slice().sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
    // Assign each break to the local calendar day on which the previous
    // journey ended. Compare YYYY-MM-DD local keys, not Date instants, so
    // a Sunday→Monday rest cannot spill into Monday because of timezone/UTC.
    const dayKey=localDateString(day);
    const pause=chronological.reduce((sum,j,idx)=>{
      if(idx>=chronological.length-1||!j.endDate)return sum;
      const end=new Date(j.endDate),nextJourney=chronological[idx+1];
      const nextStart=new Date(nextJourney.startDate);
      if(isNaN(end)||isNaN(nextStart)||localDateString(end)!==dayKey)return sum;
      const gap=Math.max(0,Math.round((nextStart-end)/60000));
      return sum+gap;
    },0);
    const drive=items.reduce((s,j)=>s+(Number(j.driveMin)||0),0);
    const driveCls=drive>600?"metric-bad":drive>540?"metric-warn":"metric-good";
    const pauseCls=pause<540?"metric-bad":pause<660?"metric-warn":"metric-good";
    html+=`<button type="button" class="calendar-day" data-calendar-day="${day.toISOString()}"><strong>${names[i]}</strong><small>${day.getDate()}</small><span class="calendar-icon">🚛</span><b class="${driveCls}">${drive?minsToClock(drive):"—"}</b><span class="calendar-icon">🕐</span><b class="${pauseCls}">${pause?minsToClock(pause):"—"}</b></button>`;
  }
  $("weekCalendarRange").textContent=weekLabel(ws);html+=`</div><div class="calendar-legend"><span>🚛 = ${I18N.t("calendarDrive")}</span><span>🕐 = ${I18N.t("calendarPause")}</span></div>`;box.innerHTML=html;
  box.querySelectorAll("[data-calendar-day]").forEach(b=>b.addEventListener("click",()=>{const d=new Date(b.dataset.calendarDay);const j=completedJourneys().find(x=>{const q=journeyDateForWeek(x);return q>=d&&q<addDays(d,1)});if(j)openJourneyDetail(j.id,"calendar")}))
}
function tachRestTouchingDay(day){const next=addDays(day,1);return (state.tach.weeklyRests||[]).some(r=>new Date(r.start)<next&&new Date(r.end)>day)}
function renderWeeklyRests(){const rows=(state.tach.weeklyRests||[]).slice().sort((a,b)=>new Date(b.start)-new Date(a.start));$("weeklyRestList").innerHTML=rows.map(r=>`<div class="rest-row"><strong>${formatDate(r.start)} → ${formatDate(r.end)}</strong><small>${r.reduced?I18N.t("reducedRest"):I18N.t("normalRest")} · ${minsToLong(r.minutes)}${r.outsideSpain?" · 🇪🇺 "+I18N.t("outsideSpain"):""}${r.compMin?` · ${minsToLong(r.compMin)} ${I18N.t("compHours")}`:""}${r.source==="auto"?" · ⚙️":""}</small></div>`).join("")||`<p>${I18N.t("noRest")}</p>`}
$("weeklyRestForm").addEventListener("submit",e=>{e.preventDefault();const start=$("restStart").value,end=$("restEnd").value;if(!start||!end||new Date(end)<=new Date(start)){toast(I18N.t("reviewEnd"));return}const minutes=Math.round((new Date(end)-new Date(start))/60000),reduced=$("restReduced").checked,outside=$("restOutside").checked;const comp=reduced?Math.max(0,2700-minutes):0;state.tach.weeklyRests=state.tach.weeklyRests||[];const exists=state.tach.weeklyRests.find(r=>Math.abs(new Date(r.start)-new Date(start))<60000&&Math.abs(new Date(r.end)-new Date(end))<60000);if(!exists)state.tach.weeklyRests.push({id:uid("R"),start,end,minutes,reduced,outsideSpain:outside,compMin:comp,source:"manual"});state.tach.pendingCompMin=state.tach.weeklyRests.reduce((sum,r)=>sum+(r.compMin||0),0);state.tach.consecutiveReducedWeekly=reduced?(state.tach.consecutiveReducedWeekly||0)+1:0;state.tach.reducedDailyUsed=0;state.tach.reducedDailyBaseAt=end;state.tach.lastWeeklyRestEnd=end;saveState();toast(I18N.t("restSaved"));$("weeklyRestForm").reset();renderTach()});

function updateUI(){const open=state.journeys.find(j=>j.status==="OPEN"),lastClosed=visibleJourneys("history").filter(j=>j.status==="CLOSED").sort((a,b)=>new Date(b.endDate)-new Date(a.endDate))[0];$("truckPlate").textContent=state.truckPlate||"---";$("journeyStatus").textContent=open?I18N.t("open"):I18N.t("closed");$("journeyStatusDot").classList.toggle("open",!!open);$("startBtn").disabled=!!open;$("finishBtn").disabled=!open;if(open){$("journeyStatusText").textContent=`${I18N.t("openStart")} ${formatDate(open.startDate)} · ${open.startKm.toLocaleString(I18N.lang)} ${I18N.t("kmUnit")}`}else if(lastClosed){$("journeyStatusText").textContent=`${I18N.t("lastFinish")} ${formatDate(lastClosed.endDate)}`}else $("journeyStatusText").textContent=I18N.t("newJourney");$("syncStatus").textContent=I18N.t("deviceSaved");updateJourneyTimer();updateManualTachButton();updateDocumentsAlert()}

function updateJourneyTimer(){const open=state.journeys.find(j=>j.status==="OPEN");const card=$("journeyTimer");if(!card)return;if(open){const mins=Math.max(0,Math.round((Date.now()-new Date(open.startDate))/60000));card.textContent=`${I18N.t("journeyDuration")}: ${minsToClock(mins)} h`;card.classList.add("running")}else{const last=state.journeys.filter(j=>j.status==="CLOSED"&&j.endDate).sort((a,b)=>new Date(b.endDate)-new Date(a.endDate))[0];const mins=last?Math.max(0,Math.round((Date.now()-new Date(last.endDate))/60000)):0;card.textContent=`${I18N.t("pauseSinceLast")}: ${String(Math.floor(mins/60)).padStart(3,"0")}:${String(mins%60).padStart(2,"0")} h (${(mins/1440).toFixed(1)} ${I18N.t("daysUnit")})`;card.classList.remove("running")}}
setInterval(()=>{updateJourneyTimer();const active=document.querySelector("#home.active");if(active)updateUI()},1000);

function exportBackup(){const payload={version:"5.4.0",exportedAt:new Date().toISOString(),data:state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${I18N.t("backupFile")}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(I18N.t("backupReady"))}
function importBackup(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(reader.result),data=payload.data||payload;if(!Array.isArray(data.journeys)||!Array.isArray(data.fuels))throw new Error();const imported=Object.assign({},DEFAULT_STATE,data,{tach:Object.assign({},DEFAULT_STATE.tach,data.tach||{})});/* Backups made before V5.4 do not contain documents: keep current local documents instead of deleting them. */if(!Array.isArray(data.documents))imported.documents=Array.isArray(state.documents)?state.documents:[];else imported.documents=data.documents.filter(d=>d&&typeof d.name==="string"&&typeof d.expiry==="string").map(d=>Object.assign({},d,{id:d.id||uid("D"),name:d.name.trim(),reminder:DOC_REMINDER_DAYS[d.reminder]?d.reminder:"3m"}));if(!confirm(I18N.t("importConfirm")))return;localStorage.setItem(DB_KEY,JSON.stringify(imported));location.reload()}catch(e){toast(I18N.t("backupInvalid"))}finally{$("importFile").value=""}};reader.readAsText(file)}
$("exportBtn").addEventListener("click",exportBackup);$("importFile").addEventListener("change",e=>importBackup(e.target.files[0]));


// V5.4 — Caducidades integradas: datos locales, sin servidor ni notificaciones push.
const DOC_REMINDER_DAYS={"1m":30,"2m":60,"3m":90,"6m":180,"12m":365,"30d":30,"60d":60,"90d":90};
function ensureDocuments(){if(!Array.isArray(state.documents))state.documents=[];return state.documents}
function documentDaysLeft(doc){const today=new Date();today.setHours(0,0,0,0);const expiry=new Date(`${doc.expiry}T00:00:00`);return Math.ceil((expiry-today)/86400000)}
function documentStatus(doc){const days=documentDaysLeft(doc);if(days<0)return {key:"expired",days};if(days<=(DOC_REMINDER_DAYS[doc.reminder]||90))return {key:"soon",days};return {key:"valid",days}}
function updateDocumentsAlert(){
  const docs=ensureDocuments(),expired=docs.some(d=>documentStatus(d).key==="expired"),soon=docs.some(d=>documentStatus(d).key==="soon");
  const btn=$("documentsBtn"),dot=$("documentsAlertDot");if(!btn||!dot)return;
  btn.classList.toggle("documents-alert-expired",expired);btn.classList.toggle("documents-alert-soon",!expired&&soon);
  dot.classList.toggle("hidden",!expired&&!soon);dot.classList.toggle("dot-red",expired);dot.classList.toggle("dot-yellow",!expired&&soon);
  const status=expired?I18N.t("docsExpired"):soon?I18N.t("docsSoon"):"";
  btn.setAttribute("aria-label",status?`${I18N.t("documentsBtn")}: ${status}`:I18N.t("documentsBtn"));
}
function escapeDocHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function formatDocDate(value){if(!value)return "—";const [y,m,d]=value.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString(I18N.lang,{day:"2-digit",month:"2-digit",year:"numeric"})}
function renderDocuments(){
  const docs=ensureDocuments(),q=($("documentsSearch")?.value||"").trim().toLocaleLowerCase(I18N.lang);
  const expired=docs.filter(d=>documentStatus(d).key==="expired").length,soon=docs.filter(d=>documentStatus(d).key==="soon").length;
  $("documentsCountTotal").textContent=String(docs.length);$("documentsCountSoon").textContent=String(soon);$("documentsCountExpired").textContent=String(expired);
  const filtered=docs.filter(d=>String(d.name||"").toLocaleLowerCase(I18N.lang).includes(q)).slice().sort((a,b)=>{const rank={expired:0,soon:1,valid:2};return rank[documentStatus(a).key]-rank[documentStatus(b).key]||String(a.expiry).localeCompare(String(b.expiry))});
  const list=$("documentsList");list.innerHTML="";
  $("documentsEmpty").style.display=filtered.length?"none":"block";
  if(!filtered.length&&q)$("documentsEmpty").textContent=I18N.t("docsNoSearch");else $("documentsEmpty").textContent=I18N.t("docsEmpty");
  filtered.forEach(doc=>{
    const status=documentStatus(doc),card=document.createElement("article");card.className=`document-row document-${status.key}`;
    let statusText=status.key==="expired"?I18N.t("docsExpiredStatus"):status.key==="soon"?I18N.t("docsDueIn",{days:status.days}):I18N.t("docsValid");
    card.innerHTML=`<div class="document-row-main"><strong>${escapeDocHtml(doc.name)}</strong><small>${I18N.t("docsExpiryLabel")}: ${formatDocDate(doc.expiry)}</small><span class="document-status">${escapeDocHtml(statusText)}</span></div><div class="document-row-actions"><button type="button" class="document-edit" aria-label="${escapeDocHtml(I18N.t("docsEdit"))}" title="${escapeDocHtml(I18N.t("docsEdit"))}">✏️</button><button type="button" class="document-delete" aria-label="${escapeDocHtml(I18N.t("docsDelete"))}" title="${escapeDocHtml(I18N.t("docsDelete"))}">🗑️</button></div>`;
    card.querySelector(".document-edit").addEventListener("click",()=>openDocumentDialog(doc));
    card.querySelector(".document-delete").addEventListener("click",()=>deleteDocument(doc.id));
    list.appendChild(card);
  });
  updateDocumentsAlert();
}
function openDocumentDialog(doc=null){
  $("documentForm").reset();$("documentId").value=doc?.id||"";$("documentName").value=doc?.name||"";$("documentExpiry").value=doc?.expiry||"";$("documentReminder").value=doc?.reminder||"3m";
  $("documentDialogTitle").textContent=doc?I18N.t("docsEditTitle"):I18N.t("docsAddTitle");
  $("documentDialog").showModal();setTimeout(()=>$("documentName").focus(),50);
}
function saveDocument(event){
  event.preventDefault();const name=$("documentName").value.trim(),expiry=$("documentExpiry").value,id=$("documentId").value,reminder=$("documentReminder").value;
  if(!name||!expiry){toast(I18N.t("docsInvalid"));return}
  const entry={id:id||uid("D"),name,expiry,reminder:DOC_REMINDER_DAYS[reminder]?reminder:"3m",updatedAt:new Date().toISOString()};
  const docs=ensureDocuments(),index=docs.findIndex(d=>d.id===id);
  if(index>=0)docs[index]=Object.assign({},docs[index],entry);else docs.push(entry);
  saveState();renderDocuments();$("documentDialog").close();toast(I18N.t(index>=0?"docsUpdated":"docsSaved"));
}
function deleteDocument(id){
  const doc=ensureDocuments().find(d=>d.id===id);if(!doc)return;
  if(!confirm(I18N.t("docsDeleteConfirm",{name:doc.name})))return;
  state.documents=ensureDocuments().filter(d=>d.id!==id);saveState();renderDocuments();toast(I18N.t("docsDeleted"));
}
$("documentsBtn").addEventListener("click",()=>{renderDocuments();show("documentsScreen")});
$("documentAddBtn").addEventListener("click",()=>openDocumentDialog());
$("documentCancelBtn").addEventListener("click",()=>$("documentDialog").close());
$("documentForm").addEventListener("submit",saveDocument);
$("documentsSearch").addEventListener("input",renderDocuments);

initSelects();initPeriodEditor();updateUI();
