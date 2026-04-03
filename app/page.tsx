"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Image from "next/image";

export default function Home() {

const [tab,setTab] = useState("home");
const [remaining,setRemaining] = useState<number>(0);
const [balance,setBalance] = useState<number>(0);
const [streak,setStreak] = useState<number>(1);
const [reward,setReward] = useState<number>(0);
const [verified,setVerified] = useState(false);
const [claiming,setClaiming] = useState(false);
const [clicks,setClicks] = useState(0);
const [loading,setLoading] = useState(true);
const [showClaiming,setShowClaiming] = useState(false);
const [showReward,setShowReward] = useState(false);
const [nextClaimTime,setNextClaimTime] = useState<number>(0);
const [username,setUsername] = useState<string | null>(null);
const [wallet,setWallet] = useState<string | null>(null);
const [copied,setCopied] = useState(false);
const [streakMessage,setStreakMessage] = useState("");
const [explode,setExplode] = useState(false);
const [lang,setLang] = useState<"en" | "es">("en");
const text = {

en:{
dashboard:"Capycoin Dashboard",
balance:"Balance",
streak:"Streak",
verified:"Verified",
claimInfo:"Claim Capycoin every 24 hours and increase your streak."
},

es:{
dashboard:"Panel Capycoin",
balance:"Balance",
streak:"Racha",
verified:"Verificado",
claimInfo:"Reclama Capycoin cada 24 horas y aumenta tu racha."
}

};

useEffect(()=>{

MiniKit.install();

setTimeout(()=>{

const user = MiniKit.user;

if(user?.username){
setUsername(user.username);
}

if(user?.walletAddress){
setWallet(user.walletAddress);
}

},500);

const init = async ()=>{

const saved = localStorage.getItem("capyNullifier");

if(saved){
setVerified(true);
loadUser(saved);
return;
}

try{

const res = await MiniKit.commandsAsync.verify({
action:"claimcapycoin"
});

if(!res?.finalPayload) return;

let nullifier="";

if("nullifier_hash" in res.finalPayload){
nullifier=res.finalPayload.nullifier_hash;
}else if("proofs" in res.finalPayload){
const proofs=res.finalPayload.proofs as any[];
if(proofs?.length>0){
nullifier=proofs[0].nullifier_hash;
}
}

if(!nullifier) return;

localStorage.setItem("capyNullifier",nullifier);

setVerified(true);

loadUser(nullifier);

}catch(err){
console.log(err);
}

};

init();

},[]);

const loadUser = async (nullifier:string)=>{

try{

const res = await fetch(`/api/claim?nullifier=${nullifier}`,{
cache:"no-store"
});

const data = await res.json();

if(data.remaining !== undefined){
const next = Date.now() + (data.remaining * 1000);
setNextClaimTime(next);
}

if(data.balance !== undefined){
setBalance(data.balance);
}

if(data.reward !== undefined){
setReward(data.reward);
}

if(data.streak !== undefined){
setStreak(data.streak);
}
if(data.streakMessage){
setStreakMessage(data.streakMessage);
}
}catch(err){
console.log(err);
}

setLoading(false);

};

useEffect(()=>{

const interval = setInterval(()=>{

if(nextClaimTime === 0) return;

const diff = Math.floor((nextClaimTime - Date.now()) / 1000);

setRemaining(diff > 0 ? diff : 0);

},1000);

return ()=>clearInterval(interval);

},[nextClaimTime]);

useEffect(()=>{

const user = MiniKit.user;

if(user){

if(user.username){
setUsername(user.username);
}

if(user.walletAddress){
setWallet(user.walletAddress);
}

}

},[]);

const formatTime = (t:number)=>{

const h = Math.floor(t/3600);
const m = Math.floor((t%3600)/60);
const s = t%60;

return `${h.toString().padStart(2,"0")}:${m
.toString()
.padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

};

const shortAddress = (addr:string)=>{

return addr.slice(0,6) + "..." + addr.slice(-4);

};

const loginUser = ()=>{

try{

const user = MiniKit.user;

if(user){

if(user.username){
setUsername(user.username);
}

if(user.walletAddress){
setWallet(user.walletAddress);
}

}

}catch(err){

console.log("World App user not available",err);

}

};

const claimCapycoin = async ()=>{

if(claiming || remaining > 0) return;

const nullifier = localStorage.getItem("capyNullifier");
if(!nullifier) return;

const nextClicks = clicks + 1;
setClicks(nextClicks);

if(nextClicks < 3) return;

setClicks(0);

// 🔐 verificación adicional
try{

const verify = await MiniKit.commandsAsync.verify({
action:"claimcapycoin"
});

if(!verify?.finalPayload){
return;
}

}catch(err){
console.log("Verification failed",err);
return;
}

setClaiming(true);
setShowClaiming(true);

try{

const res = await fetch("/api/claim",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({nullifier})
});

const data = await res.json();

setShowClaiming(false);

if(!data.success){

if(data.remaining !== undefined){
setNextClaimTime(Date.now() + (data.remaining * 1000));
}

setClaiming(false);
return;

}

setBalance(data.balance);

if(data.reward !== undefined){
setReward(data.reward);
}

if(data.streak !== undefined){
setStreak(data.streak);
}

setNextClaimTime(data.nextClaim);

setShowReward(true);

setExplode(true);

setTimeout(()=>{
setExplode(false);
},1200);

setTimeout(()=>{
setShowReward(false);
},2000);

}catch(err){

console.log(err);
setShowClaiming(false);

}

setClaiming(false);

};

return(

<>

<main style={styles.container}>

<div style={styles.header}>

<div style={styles.userHeader}>

{username || wallet ? (

<div>

<div>
🟢 {username ? username : shortAddress(wallet!)}
</div>

<div style={styles.userStatus}>
Verified Human
</div>

</div>

) : (

<button
style={styles.loginButton}
onClick={loginUser}
>
Connect
</button>

)}

</div>

<div style={styles.langSelector}>
<select
value={lang}
onChange={(e)=>setLang(e.target.value as "en" | "es")}
style={styles.langSelect}
>
<option value="en">🇺🇸 EN</option>
<option value="es">🇪🇸 ES</option>
</select>
</div>

</div>

{tab === "home" && (

<div style={styles.dashboard}>

<h2 style={styles.dashboardTitle}>
🪙 {text[lang].dashboard}
</h2>

<div style={styles.nextClaimCard}>

<div style={styles.nextClaimLabel}>
Next Claim
</div>

<div style={styles.nextClaimTimer}>
{loading ? "..." : formatTime(remaining)}
</div>

</div>

<div style={styles.dashboardCards}>

<div style={styles.dashboardCard}>
<span style={styles.dashboardIcon}>🪙</span>
<h3>{balance}</h3>
<p>{text[lang].balance}</p>
</div>

<div style={styles.dashboardCard}>
<span style={styles.dashboardIcon}>🔥</span>
<h3>{streak}</h3>
<p>{text[lang].streak}</p>
</div>

<div style={styles.dashboardCard}>
<span style={styles.dashboardIcon}>✔</span>
<h3>Verified</h3>
<p>{text[lang].verified}</p>
</div>

</div>

<p style={styles.dashboardText}>
{text[lang].claimInfo}
</p>

</div>

)}

{/* CLAIM TAB */}

{tab==="claim" && (

<>

<div style={styles.topCards}>

{streakMessage && (
<div style={styles.streakMessage}>
{streakMessage}
</div>
)}

<div style={styles.infoCard}>
<span style={styles.icon}>🔥</span>
<span>Streak {streak}</span>
</div>

<div style={styles.infoCard}>
<span style={styles.icon}>🪙</span>
<span>{balance} CAPYCOIN</span>
</div>

<div style={styles.infoCard}>
<img src="/verified.png" style={styles.verifiedIcon}/>
<span>World ID</span>
</div>

</div>

<div style={styles.logoBox}>

<Image
src="/capycoin.png"
alt="Capycoin"
width={260}
height={260}
style={{
animation:
explode
? "coinExplode 1s ease-out"
: remaining === 0
? "coinReady 1.2s ease-in-out infinite"
: "coinSpin 10s linear infinite",
transformStyle:"preserve-3d",
filter:
remaining === 0
? "drop-shadow(0 0 30px gold)"
: "drop-shadow(0 0 10px gold)"
}}
/>

</div>

<div style={styles.timerCard}>
<h1 style={styles.timer}>
{loading ? "..." : formatTime(remaining)}
</h1>
</div>

<p style={styles.message}>
{remaining===0
? "🟢 Tu Capycoin está listo para reclamar"
: "⏳ Tu próximo Capycoin estará disponible pronto"}
</p>

<button
style={{
...styles.button,
opacity:remaining>0 || claiming ? 0.6 : 1
}}
onClick={claimCapycoin}
disabled={remaining>0 || claiming}
>
{claiming
?"Procesando..."
:remaining>0
?"Espera..."
:clicks===0
?"Presiona 3 veces para reclamar"
:`${3-clicks} presiones restantes`}
</button>

<div style={styles.socialCard}>

<p style={styles.socialText}>
Sigue a Capycoin en nuestras redes
</p>

<div style={styles.socialButtons}>

<a
href="https://x.com/Capycoin_cpcoin"
target="_blank"
style={styles.xButton}
>
<img src="/x.png" className="x-anim"/>
<span>Síguenos</span>
</a>

<a
href="https://t.me/+LEokjKFRaDFkNzEx"
target="_blank"
style={styles.telegramButton}
>
<img src="/telegram.png" style={styles.socialIcon}/>
<span>Telegram</span>
</a>

</div>

</div>
</>

)}

{/* ABOUT TAB */}

{tab==="about" && (

<div style={styles.aboutBox}>

<h2>🪙 <strong>¿Qué es Capycoin?</strong></h2>

<p>
Capycoin es una memecoin comunitaria creada para humanos verificados
dentro de World App. Su objetivo es construir una comunidad activa
dentro del ecosistema de Worldchain.
</p>

<div style={styles.statsBox}>

<div style={styles.statItem}>
<span style={styles.statNumber}>17K+</span>
<span style={styles.statLabel}><strong>Holders</strong></span>
</div>

<div style={styles.statItem}>
<span style={styles.statNumber}>5M+</span>
<span style={styles.statLabel}><strong>CAPYCOIN distribuidos</strong></span>
</div>

</div>

<h3>🔥<strong>Sistema de Streak</strong></h3>

<p>
Cada día consecutivo aumenta tu recompensa hasta un máximo de
<strong> 10 CAPYCOIN</strong>. Si pierdes un día, el streak vuelve a comenzar.
</p>

<h3>📊 <strong>Tokenomics</strong></h3>

<ul style={styles.tokenList}>
<li>15% — Distribución de Airdrop</li>
<li>20% — Reserva</li>
<li>25% — Comunidad</li>
<li>5% — Marketing</li>
<li>5% — Token Burns</li>
<li>30% — Liquidez</li>
</ul>

<div style={styles.contractCard}>

<div style={styles.contractHeader}>
<span style={styles.contractTitle}>📄 Contrato Capycoin</span>
</div>

<div style={styles.contractRow}>

<span style={styles.contractText}>
0xe55B...928B2
</span>

<button
style={styles.copyButton}
onClick={()=>{
navigator.clipboard.writeText(
"0xe55BA4Ea7835c221a521e43BA05bC1a9508928B2"
);

setCopied(true);

setTimeout(()=>{
setCopied(false);
},2000);

}}
>
{copied ? "✓ Copiado" : "Copiar"}
</button>

</div>

<div style={styles.contractButtons}>

<a
href="https://worldscan.org/token/0xe55BA4Ea7835c221a521e43BA05bC1a9508928B2"
target="_blank"
style={styles.scanButton}
>
Worldscan
</a>

<a
href="https://worldcoin.org/mini-app?app_id=app_e5ba7c3061400e361f98ce44d8b1b9c4&app_mode=mini-app"
target="_blank"
style={styles.swapButton}
>
Swap
</a>

</div>

</div>

<a
href="https://jamr448.github.io/capycoin.io/#home"
target="_blank"
style={styles.exchangeButton}
>
<img src="/capycoin.png" style={styles.exchangeLogo}/>
<span>Sitio Web</span>
</a>

{/* 🔥 TARJETA COMUNIDAD */}

<div className="community-glow" style={styles.communityCard}>

<h3 style={{marginBottom:"10px"}}>
Únete a la comunidad de Capycoin
</h3>

<p style={styles.communityText}>
Mantente al día con noticias, actualizaciones y novedades del proyecto.
Síguenos en nuestras redes oficiales y no te pierdas ningún anuncio.
</p>

<div style={styles.socialButtons}>

<a
href="https://x.com/Capycoin_cpcoin"
target="_blank"
style={styles.xButton}
>
<img src="/x.png" className="x-anim"/>
<span>Síguenos</span>
</a>

<a
href="https://t.me/+LEokjKFRaDFkNzEx/"
target="_blank"
style={styles.telegramButton}
>
<img src="/telegram.png" style={styles.socialIcon}/>
<span>Telegram</span>
</a>

</div>

</div>

</div>

)}
{showReward && (
<div style={styles.overlay}>
<div style={styles.rewardCard}>
<h2>🎉 Reclamo exitoso</h2>
<p>Has recibido <strong>{reward} CAPYCOIN</strong></p>
<p>🔥 Streak: {streak}</p>
</div>
</div>
)}

<div style={styles.bottomNav}>

<button
style={{
...styles.navButton,
color: tab==="home" ? "#0ea5e9" : "#fff"
}}
onClick={()=>setTab("home")}
>
🏠
<span>Home</span>
</button>

<button
style={{
...styles.navButton,
color: tab==="claim" ? "#0ea5e9" : "#fff"
}}
onClick={()=>setTab("claim")}
>
🪙
<span>Claim</span>
</button>

<button
style={{
...styles.navButton,
color: tab==="about" ? "#0ea5e9" : "#fff"
}}
onClick={()=>setTab("about")}
>
ℹ️
<span>Info</span>
</button>

</div>

<style jsx global>{`

html,body{
margin:0;
padding:0;
height:100%;
overscroll-behavior:none;
touch-action: manipulation;
overflow-x: hidden;
}

@keyframes coinExplode {

0%{
transform:scale(1) rotate(0deg);
filter:drop-shadow(0 0 30px gold);
}

30%{
transform:scale(1.4) rotate(180deg);
filter:drop-shadow(0 0 60px gold);
}

60%{
transform:scale(0.8) rotate(360deg);
filter:drop-shadow(0 0 40px orange);
}

100%{
transform:scale(1) rotate(360deg);
filter:drop-shadow(0 0 20px gold);
}

}

.container{
height:100vh;
overflow-y:auto;
-webkit-overflow-scrolling:touch;
}

@keyframes coinSpin {
0%{transform:rotateY(0deg);}
50%{transform:rotateY(180deg);}
100%{transform:rotateY(360deg);}
}

@keyframes coinReady {

0%{transform:translateY(0px) scale(1);filter:drop-shadow(0 0 0px gold);}
50%{transform:translateY(-15px) scale(1.08);filter:drop-shadow(0 0 15px gold);}
100%{transform:translateY(0px) scale(1);filter:drop-shadow(0 0 0px gold);}

}


.video-bg{
position:fixed;
top:0;
left:0;
width:100vw;
height:100vh;
object-fit:cover;
z-index:-1;
pointer-events:none;
opacity:0.35;
}

@keyframes xPulse {

0%{
transform:scale(1);
}

50%{
transform:scale(1.2);
}

100%{
transform:scale(1);
}

}

.x-anim{
width:18px;
height:18px;
animation:xPulse 2s infinite;
}

@keyframes cardGlow {

0%{
box-shadow:0 0 0 rgba(14,165,233,0);
}

50%{
box-shadow:0 0 20px rgba(14,165,233,0.6);
}

100%{
box-shadow:0 0 0 rgba(14,165,233,0);
}

}

.community-glow{
animation:cardGlow 3s infinite;
}

`}</style>

</main>

</>

);

}

const styles:any={

container:{
minHeight:"100vh",
overflowY:"auto",
backgroundImage:"url('/bg-capy.jpg')",
backgroundSize:"cover",
backgroundPosition:"center",
backgroundRepeat:"no-repeat",
backgroundColor:"rgba(0,0,0,0.55)",
backgroundBlendMode:"overlay",
display:"flex",
flexDirection:"column",
alignItems:"center",
padding:"20px",
paddingBottom:"90px",
color:"#fff",
fontFamily:"sans-serif"
},

streakMessage:{
marginTop:"10px",
background:"#fff7ed",
padding:"8px 14px",
borderRadius:"20px",
fontWeight:"bold",
color:"#b45309",
boxShadow:"0 2px 6px rgba(0,0,0,0.1)"
},

userBox:{
marginTop:"10px",
background:"#ffffff",
padding:"10px 20px",
borderRadius:"20px",
fontWeight:"bold",
color:"#065f46",
boxShadow:"0 4px 10px rgba(0,0,0,0.15)"
},

rewardCard:{
background:"#111",
padding:"30px",
borderRadius:"20px",
textAlign:"center",
boxShadow:"0 0 30px rgba(255,215,0,0.5)",
color:"#fff",
maxWidth:"280px"
},

statsBox:{
display:"flex",
justifyContent:"space-around",
marginTop:"20px",
marginBottom:"25px"
},

statItem:{
display:"flex",
flexDirection:"column",
alignItems:"center"
},

userStatus:{
fontSize:"12px",
opacity:0.7
},

nextClaimCard:{
marginTop:"10px",
marginBottom:"20px",
background:"linear-gradient(135deg,#0ea5e9,#2563eb)",
padding:"20px",
borderRadius:"20px",
textAlign:"center",
boxShadow:"0 10px 25px rgba(0,0,0,0.4)"
},

nextClaimLabel:{
fontSize:"14px",
opacity:0.9
},

nextClaimTimer:{
fontSize:"32px",
fontWeight:"bold",
marginTop:"5px"
},

statNumber:{
fontSize:"22px",
fontWeight:"bold",
color:"#065f46"
},

statLabel:{
fontSize:"14px",
opacity:0.8
},

tabs:{
display:"flex",
justifyContent:"space-between",
width:"100%",
marginTop:"10px",
marginBottom:"10px"
},

tab:{
padding:"10px 20px",
borderRadius:"20px",
border:"none",
fontWeight:"bold"
},

socialCard:{
marginTop:"40px",
background:"#ffffff",
padding:"18px",
borderRadius:"18px",
width:"100%",
boxShadow:"0 4px 10px rgba(0,0,0,0.15)",
textAlign:"center"
},

communityCard:{
marginTop:"30px",
background:"#f8fafc",
padding:"22px",
borderRadius:"18px",
width:"100%",
boxShadow:"0 4px 10px rgba(0,0,0,0.1)",
textAlign:"center"
},

communityText:{
fontSize:"14px",
marginBottom:"15px",
lineHeight:"1.5"
},

socialText:{
marginBottom:"12px",
fontWeight:"bold"
},

socialButtons:{
display:"flex",
justifyContent:"center",
gap:"12px",
marginTop:"10px"
},

xButton:{
display:"flex",
alignItems:"center",
gap:"6px",
background:"#000",
color:"#fff",
padding:"10px 16px",
borderRadius:"25px",
textDecoration:"none",
fontWeight:"bold"
},

telegramButton:{
display:"flex",
alignItems:"center",
gap:"6px",
background:"#0088cc",
color:"#fff",
padding:"10px 16px",
borderRadius:"25px",
textDecoration:"none",
fontWeight:"bold"
},

socialIcon:{
width:"18px",
height:"18px"
},

topCards:{
display:"flex",
justifyContent:"space-between",
gap:"10px",
width:"100%",
marginTop:"10px"
},

infoCard:{
flex:1,
background:"#ffffff",
borderRadius:"30px",
padding:"12px 10px",
display:"flex",
alignItems:"center",
justifyContent:"center",
gap:"6px",
fontWeight:"bold",
color:"#065f46",
boxShadow:"0 4px 10px rgba(0,0,0,0.15)",
fontSize:"13px",
textAlign:"center"
},

icon:{fontSize:"18px"},

verifiedIcon:{width:"18px",height:"18px"},

logoBox:{marginTop:"40px"},

timer:{fontSize:"48px",marginTop:"20px"},

message:{marginTop:"10px",fontSize:"18px",textAlign:"center"},

button:{
marginTop:"30px",
background:"#0ea5e9",
color:"white",
padding:"18px 30px",
borderRadius:"40px",
border:"none",
fontSize:"18px",
width:"80%"
},

homeCard:{
marginTop:"40px",
background:"#ffffff",
padding:"25px",
borderRadius:"20px",
color:"#064e3b",
boxShadow:"0 4px 12px rgba(0,0,0,0.15)",
textAlign:"center",
lineHeight:"1.6"
},

dashboard:{
marginTop:"40px",
width:"100%",
textAlign:"center"
},

dashboardTitle:{
fontSize:"22px",
marginBottom:"20px"
},

dashboardCards:{
display:"flex",
gap:"10px",
justifyContent:"space-between",
marginBottom:"20px"
},

dashboardCard:{
flex:1,
background:"rgba(255,255,255,0.08)",
borderRadius:"20px",
padding:"18px",
backdropFilter:"blur(10px)",
boxShadow:"0 8px 20px rgba(0,0,0,0.3)",
textAlign:"center"
},

dashboardIcon:{
fontSize:"22px",
display:"block",
marginBottom:"8px"
},

dashboardText:{
opacity:0.8,
fontSize:"14px"
},

contractAddressFull:{
fontSize:"12px",
wordBreak:"break-all",
marginBottom:"12px",
textAlign:"center"
},

contractCard:{
marginTop:"20px",
background:"#f8fafc",
padding:"18px",
borderRadius:"16px",
width:"100%",
boxShadow:"0 4px 10px rgba(0,0,0,0.1)"
},

contractTitle:{
fontWeight:"bold",
marginBottom:"10px",
color:"#065f46"
},

copyButton:{
background:"#0ea5e9",
border:"none",
color:"#fff",
padding:"6px 12px",
borderRadius:"20px",
cursor:"pointer",
fontWeight:"bold",
whiteSpace:"nowrap"
},

overlay:{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.7)",
display:"flex",
flexDirection:"column",
alignItems:"center",
justifyContent:"center",
color:"#fff",
zIndex:9999,
textAlign:"center",
fontSize:"22px",
gap:"20px"
},

aboutBox:{
marginTop:"30px",
background:"#ffffff",
padding:"25px",
borderRadius:"20px",
color:"#064e3b",
boxShadow:"0 4px 12px rgba(0,0,0,0.15)",
lineHeight:"1.6",
fontSize:"15px"
},

tokenList:{
marginTop:"10px",
marginBottom:"20px",
paddingLeft:"20px"
},

contractIcon:{
fontSize:"18px"
},

contractAddress:{
textAlign:"center",
fontSize:"12px",
marginTop:"6px",
opacity:0.7
},

contractHeader:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"8px"
},

contractRow:{
display:"flex",
alignItems:"center",
justifyContent:"space-between",
gap:"10px",
marginBottom:"10px"
},

contractText:{
fontSize:"14px",
fontWeight:"bold",
color:"#065f46"
},

contractButtons:{
display:"flex",
gap:"10px"
},

scanButton:{
flex:1,
background:"#065f46",
color:"#fff",
padding:"10px",
borderRadius:"20px",
textDecoration:"none",
textAlign:"center",
fontWeight:"bold"
},

swapButton:{
flex:1,
background:"#0ea5e9",
color:"#fff",
padding:"10px",
borderRadius:"20px",
textDecoration:"none",
textAlign:"center",
fontWeight:"bold"
},

exchangeButton:{
display:"flex",
alignItems:"center",
justifyContent:"center",
gap:"10px",
background:"#0ea5e9",
color:"#fff",
padding:"14px",
borderRadius:"40px",
textDecoration:"none",
fontWeight:"bold",
marginTop:"15px"
},

bottomNav:{
position:"fixed",
bottom:0,
left:0,
width:"100%",
height:"70px",
background:"#020617",
display:"flex",
justifyContent:"space-around",
alignItems:"center",
borderTop:"1px solid #1e293b",
zIndex:1000
},

navButton:{
display:"flex",
flexDirection:"column",
alignItems:"center",
fontSize:"12px",
color:"#fff",
background:"none",
border:"none"
},

header:{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"60px",
background:"rgba(2,6,23,0.9)",
backdropFilter:"blur(8px)",
display:"flex",
justifyContent:"space-between",
alignItems:"center",
padding:"0 20px",
zIndex:1000
},

userHeader:{
fontWeight:"bold",
color:"#fff"
},

langSelector:{},

langSelect:{
background:"#020617",
color:"#fff",
border:"1px solid #1e293b",
borderRadius:"10px",
padding:"5px 8px"
},

timerCard:{
marginTop:"80px",
background:"rgba(0,0,0,0.5)",
padding:"20px",
borderRadius:"20px",
width:"100%",
textAlign:"center",
boxShadow:"0 10px 30px rgba(0,0,0,0.4)"
},

exchangeLogo:{width:"24px",height:"24px"}

};