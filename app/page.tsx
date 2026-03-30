"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Image from "next/image";

export default function Home() {

const [tab,setTab] = useState("claim");
const [remaining,setRemaining] = useState<number>(0);
const [balance,setBalance] = useState<number>(0);
const [verified,setVerified] = useState(false);
const [claiming,setClaiming] = useState(false);
const [clicks,setClicks] = useState(0);
const [loading,setLoading] = useState(true);
const [showClaiming,setShowClaiming] = useState(false);
const [showReward,setShowReward] = useState(false);
const [nextClaimTime,setNextClaimTime] = useState<number>(0);
const [username,setUsername] = useState<string | null>(null);

useEffect(()=>{

MiniKit.install();

const user = MiniKit.user;

if(user){
setUsername(user.username ?? "World User");
}

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

console.log("auto verify error",err);

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

}catch(err){

console.log("load user error",err);

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

if(nextClicks < 3){
return;
}

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

// iniciar contador inmediatamente
const cooldown = data.remaining ?? 60;

setNextClaimTime(data.nextClaim);
setRemaining(cooldown);

setShowReward(true);

setTimeout(()=>{
setShowReward(false);
},2000);

}catch(err){

console.log("claim error",err);

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

<img
src="/capycoin.png"
style={{
width:"120px",
animation:"coinSpin 2s linear infinite"
}}
/>

<h2>Reclamando Capycoin...</h2>

</div>

)}

{showReward && (

<div style={styles.overlay}>

<img
src="/capycoin.png"
style={{
width:"120px",
animation:"coinSpin 2s linear infinite"
}}
/>

<h2>Has reclamado 5 Capycoin</h2>

</div>

)}

<div style={styles.topCards}>

<div style={styles.infoCard}>
<span style={styles.icon}>👤</span>
<span>{verified ? "Verified Human" : "Verifying..."}</span>
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

<div style={styles.logoBox}>

<Image
src="/capycoin.png"
alt="Capycoin"
width={260}
height={260}
style={{
animation:"coinSpin 4s linear infinite",
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

</>

)}

<style jsx global>{`

@keyframes coinSpin {
0%{transform:rotateY(0deg);}
50%{transform:rotateY(180deg);}
100%{transform:rotateY(360deg);}
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

`}</style>

</main>

</>

);

}

const styles:any={

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

verifiedIcon:{
width:"18px",
height:"18px"
},

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

logoBox:{marginTop:"40px"},

timer:{
fontSize:"48px",
marginTop:"20px"
},

message:{
marginTop:"10px",
fontSize:"18px",
textAlign:"center"
},

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
}

};