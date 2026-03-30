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
const [copied,setCopied] = useState(false);

const [holders,setHolders] = useState<number>(0);
const [supply,setSupply] = useState<number>(0);

useEffect(()=>{

MiniKit.install();

const loadTokenData = async ()=>{

try{

const res = await fetch("/api/token");
const data = await res.json();

setSupply(Number(data.supply));
setHolders(Number(data.holders));

}catch(err){
console.log(err);
}

};

loadTokenData();

setTimeout(()=>{

const user = MiniKit.user;

if(user?.username){
setUsername(user.username);
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

{username && (
<div style={styles.userBox}>
👋 Hola {username}
</div>
)}

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

{tab==="claim" && (

<>

<div style={styles.topCards}>

<div style={styles.infoCard}>
🔥 Streak {streak}
</div>

<div style={styles.infoCard}>
🪙 {balance} CAPYCOIN
</div>

<div style={styles.infoCard}>
<img src="/verified.png" style={styles.verifiedIcon}/>
World ID
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
: "coinSpin 10s linear infinite"
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

</>

)}

{tab==="about" && (

<div style={styles.aboutBox}>

<h2>🪙 ¿Qué es Capycoin?</h2>

<p>
Capycoin es una memecoin comunitaria creada para humanos verificados
dentro de World App.
</p>

<div style={styles.statsBox}>

<div style={styles.statItem}>
<span style={styles.statNumber}>{holders.toLocaleString()}</span>
<span style={styles.statLabel}>Holders</span>
</div>

<div style={styles.statItem}>
<span style={styles.statNumber}>5M+</span>
<span style={styles.statLabel}>CAPY distribuidos</span>
</div>

<div style={styles.statItem}>
<span style={styles.statNumber}>{supply.toLocaleString()}</span>
<span style={styles.statLabel}>Supply</span>
</div>

</div>

</div>

)}

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
padding:"20px"
},

tabs:{
display:"flex",
gap:"10px",
marginTop:"40px"
},

tab:{
padding:"10px 20px",
borderRadius:"20px",
border:"none",
fontWeight:"bold"
},

topCards:{
display:"flex",
gap:"10px",
marginTop:"20px"
},

infoCard:{
background:"#fff",
padding:"10px 15px",
borderRadius:"20px",
fontWeight:"bold"
},

verifiedIcon:{width:"18px"},

logoBox:{marginTop:"30px"},

timer:{fontSize:"48px",marginTop:"20px"},

message:{marginTop:"10px"},

button:{
marginTop:"30px",
background:"#0ea5e9",
color:"#fff",
padding:"18px 30px",
borderRadius:"40px",
border:"none"
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
zIndex:9999
},

aboutBox:{
marginTop:"30px",
background:"#fff",
padding:"25px",
borderRadius:"20px"
},

statsBox:{
display:"flex",
justifyContent:"space-around",
marginTop:"20px"
},

statItem:{
display:"flex",
flexDirection:"column",
alignItems:"center"
},

statNumber:{
fontSize:"22px",
fontWeight:"bold"
},

statLabel:{
fontSize:"14px"
}

};