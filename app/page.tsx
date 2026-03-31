"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Image from "next/image";

export default function Home() {

const [tab,setTab] = useState("claim");
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

const claimCapycoin = async ()=>{

if(claiming || remaining > 0) return;

const nullifier = localStorage.getItem("capyNullifier");
if(!nullifier) return;

const nextClicks = clicks + 1;
setClicks(nextClicks);

if(nextClicks < 3) return;

setClicks(0);
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

<video autoPlay loop muted playsInline className="video-bg">
<source src="/capy-bg.mp4" type="video/mp4"/>
</video>

<main style={styles.container}>

<div style={styles.userBox}>
👋 Hola {
username
? username
: wallet
? shortAddress(wallet)
: "Capy Holder"
}
</div>

{showClaiming && (
<div style={styles.overlay}>
<img src="/capycoin.png" style={{width:"120px",animation:"coinSpin 2s linear infinite"}}/>
<h2>Reclamando Capycoin...</h2>
</div>
)}

{showReward && (
<div style={styles.overlay}>
<img src="/capycoin.png" style={{width:"120px",animation:"coinSpin 2s linear infinite"}}/>
<h2>Has reclamado {reward} Capycoin</h2>
</div>
)}

<div style={styles.tabs}>

<button
style={{
...styles.tab,
background:tab==="claim"?"#0ea5e9":"#fff",
color:tab==="claim"?"#fff":"#000"
}}
onClick={()=>setTab("claim")}
>
Reclamar
</button>

<button
style={{
...styles.tab,
background:tab==="about"?"#0ea5e9":"#fff",
color:tab==="about"?"#fff":"#000"
}}
onClick={()=>setTab("about")}
>
Acerca de
</button>

</div>

{/* CLAIM TAB */}

{tab==="claim" && (

<>

<div style={styles.topCards}>

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
remaining === 0
? "coinReady 1.2s ease-in-out infinite"
: "coinSpin 10s linear infinite",
transformStyle:"preserve-3d"
}}
/>

</div>

<h1 style={styles.timer}>
{loading ? "..." : formatTime(remaining)}
</h1>

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
...
</div>

<a
href="https://worldcoin.org/mini-app?app_id=app_e5ba7c3061400e361f98ce44d8b1b9c4&app_mode=mini-app"
target="_blank"
style={styles.exchangeButton}
>
<img src="/puff.png" style={styles.exchangeLogo}/>
<span>Intercambiar Capycoin</span>
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

<style jsx global>{`

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
width:100%;
height:100%;
object-fit:cover;
z-index:-1;
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
background:"rgba(0,0,0,0.35)",
display:"flex",
flexDirection:"column",
alignItems:"center",
padding:"20px",
color:"#063",
fontFamily:"sans-serif"
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
marginTop:"40px"
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

contractAddressFull:{
fontSize:"12px",
wordBreak:"break-all",
marginBottom:"12px",
textAlign:"center"
},

contractButtons:{
display:"flex",
justifyContent:"center",
gap:"10px",
marginTop:"10px"
},

scanButton:{
background:"#065f46",
color:"#fff",
padding:"8px 14px",
borderRadius:"20px",
textDecoration:"none",
fontWeight:"bold",
fontSize:"14px"
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

contractRow:{
display:"flex",
alignItems:"center",
justifyContent:"space-between",
gap:"10px"
},

contractText:{
fontSize:"12px",
wordBreak:"break-all",
flex:1
},

copyButton:{
background:"#0ea5e9",
border:"none",
color:"#fff",
padding:"8px 14px",
borderRadius:"20px",
cursor:"pointer",
fontWeight:"bold"
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

contractButton:{
display:"flex",
alignItems:"center",
justifyContent:"center",
gap:"10px",
background:"#065f46",
color:"#fff",
padding:"14px",
borderRadius:"40px",
textDecoration:"none",
fontWeight:"bold",
marginTop:"15px"
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

exchangeLogo:{width:"24px",height:"24px"}

};