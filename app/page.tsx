"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Image from "next/image";

export default function Home() {

const [tab, setTab] = useState("claim");
const [remaining, setRemaining] = useState<number>(0);
const [balance, setBalance] = useState<number>(0);
const [claiming, setClaiming] = useState(false);
const [rain,setRain] = useState(false);
const [username,setUsername] = useState("Verified Human");

useEffect(() => {

MiniKit.install();

const nullifier = localStorage.getItem("capyNullifier");

if (nullifier) loadUser(nullifier);

}, []);

const loadUser = async (nullifier:string)=>{

const res = await fetch(`/api/claim?nullifier=${nullifier}`);
const data = await res.json();

if(data.remaining !== undefined) setRemaining(data.remaining);
if(data.balance !== undefined) setBalance(data.balance);

}

useEffect(()=>{

const interval = setInterval(()=>{

setRemaining((prev)=>{
if(prev <= 0) return 0;
return prev - 1;
});

},1000);

return ()=> clearInterval(interval);

},[]);

const formatTime = (t:number)=>{

const h = Math.floor(t/3600);
const m = Math.floor((t%3600)/60);
const s = t%60;

return `${h.toString().padStart(2,"0")}:${m
.toString()
.padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

}

const verifyAndClaim = async ()=>{

if(claiming || remaining > 0) return;

setClaiming(true);

try{

const res = await MiniKit.commandsAsync.verify({
action:"claimcapycoin"
});

if(!res || !res.finalPayload){
setClaiming(false);
return;
}

let nullifier = "";

if("nullifier_hash" in res.finalPayload){

nullifier = res.finalPayload.nullifier_hash;

}else if("proofs" in res.finalPayload){

const proofs = res.finalPayload.proofs as any[];

if(proofs && proofs.length > 0){
nullifier = proofs[0].nullifier_hash;
}

}

if(!nullifier){
console.log("No nullifier received");
setClaiming(false);
return;
}

localStorage.setItem("capyNullifier",nullifier);

const response = await fetch("/api/claim",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({nullifier})
});

const data = await response.json();

console.log("claim response",data);

if(data.success){

setRain(true);

setTimeout(()=>{
setRain(false);
},3000);

setBalance(data.balance ?? balance);

if(data.remaining !== undefined){
setRemaining(data.remaining);
}

}

}catch(err){

console.log("claim error",err);

}

setClaiming(false);

}

return (

<>

<video autoPlay loop muted playsInline className="video-bg">
<source src="/capy-bg.mp4" type="video/mp4" />
</video>

<main style={styles.container}>

<div style={styles.topCards}>

<div style={styles.infoCard}>
<span style={styles.icon}>👤</span>
<span>Verified Human</span>
</div>

<div style={styles.infoCard}>
<span style={styles.icon}>🪙</span>
<span>{balance} CAPYCOIN</span>
</div>

<div style={styles.infoCard}>
<img src="/verified.png" style={styles.verifiedIcon}/>
<span>Verified with World ID</span>
</div>

</div>

<div style={styles.tabs}>

<button
style={{
...styles.tab,
background: tab === "claim" ? "#0ea5e9" : "#fff",
color: tab === "claim" ? "#fff" : "#000"
}}
onClick={()=>setTab("claim")}
>
Reclamar
</button>

<button
style={{
...styles.tab,
background: tab === "about" ? "#0ea5e9" : "#fff",
color: tab === "about" ? "#fff" : "#000"
}}
onClick={()=>setTab("about")}
>
Acerca de
</button>

</div>

{tab === "claim" && (

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
{formatTime(remaining)}
</h1>

<p style={styles.message}>

{remaining === 0
? "🟢 Tu Capycoin está listo para reclamar"
: "⏳ Tu próximo Capycoin estará disponible pronto"}

</p>

<button
style={{
...styles.button,
opacity: remaining > 0 || claiming ? 0.6 : 1
}}
onClick={verifyAndClaim}
disabled={remaining > 0 || claiming}
>
{claiming
? "Procesando..."
: remaining > 0
? "Espera..."
: "Verificar y Reclamar Capycoin"}
</button>

</>

)}

{tab === "about" && (

<div style={styles.aboutBox}>

<div style={styles.aboutCard}>
<h2 style={styles.aboutTitle}>¿Qué es Capycoin?</h2>
<p style={styles.aboutText}>
Capycoin es una memecoin comunitaria creada en WorldChain
para recompensar a usuarios verificados con World ID.
Nuestro objetivo es construir una comunidad divertida
y descentralizada alrededor del capybara más famoso
del mundo cripto.
</p>
</div>

<div style={styles.aboutCard}>
<h2 style={styles.aboutTitle}>Tokenomics</h2>
<ul style={styles.tokenomics}>
<li>Supply Total: 100,000,000 Capycoin</li>
<li>Airdrop Comunidad: 15%</li>
<li>Liquidez: 40%</li>
<li>Marketing: 25%</li>
<li>Token Burn: 5%</li>
<li>Equipo: 15%</li>
</ul>
</div>

<div style={styles.aboutCard}>
<h2 style={styles.aboutTitle}>Red</h2>
<p style={styles.aboutText}>
Capycoin vive en WorldChain y puede ser reclamado
por usuarios verificados usando World ID.

Capycoin utiliza World ID para verificar que cada usuario
es único y humano. No recopilamos información personal.

12.000 Holders y contando!
</p>
</div>

<a
href="https://worldcoin.org/mini-app?app_id=app_e5ba7c3061400e361f98ce44d8b1b9c4&app_mode=mini-app"
target="_blank"
style={styles.swapButton}
>

<img src="/puff.png" alt="Puff" style={styles.swapLogo}/>

Intercambiar Capycoin

</a>

</div>

)}

<div style={styles.socials}>

<a href="https://x.com/Capycoin_cpcoin" target="_blank" style={styles.socialButton}>
<img src="/x.png" alt="Twitter X" style={styles.socialIcon}/>
</a>

<a href="https://t.me/+LEokjKFRaDFkNzEx" target="_blank" style={styles.socialButton}>
<img src="/telegram.png" alt="Telegram" style={styles.socialIcon}/>
</a>

</div>

<style jsx global>{`

@keyframes coinSpin {
0% { transform: rotateY(0deg); }
50% { transform: rotateY(180deg); }
100% { transform: rotateY(360deg); }
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

const styles:any = {

privacy:{
marginTop:"20px",
fontSize:"14px",
opacity:0.8,
lineHeight:"1.5"
},

worldVerified:{
marginTop:"5px",
fontSize:"14px",
background:"rgba(255,255,255,0.9)",
padding:"5px 12px",
borderRadius:"20px",
fontWeight:"bold",
color:"#065f46",
boxShadow:"0 2px 6px rgba(0,0,0,0.15)"
},

topBar:{
width:"100%",
display:"flex",
justifyContent:"space-between",
alignItems:"center"
},

user:{
background:"#ffffff",
padding:"8px 15px",
borderRadius:"20px",
fontWeight:"bold",
boxShadow:"0 3px 8px rgba(0,0,0,0.15)"
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

icon:{
fontSize:"18px"
},

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
background:"#fff",
fontWeight:"bold"
},

logoBox:{
marginTop:"40px"
},

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

socials:{
marginTop:"30px",
display:"flex",
gap:"20px"
},

socialButton:{
width:"50px",
height:"50px",
background:"#fff",
borderRadius:"50%",
display:"flex",
alignItems:"center",
justifyContent:"center",
boxShadow:"0 4px 10px rgba(0,0,0,0.2)"
},

socialIcon:{
width:"24px",
height:"24px"
},

aboutBox:{
marginTop:"40px",
maxWidth:"420px"
},

aboutCard:{
background:"rgba(255,255,255,0.85)",
padding:"20px",
borderRadius:"20px",
marginTop:"20px",
boxShadow:"0 6px 15px rgba(0,0,0,0.15)",
backdropFilter:"blur(6px)"
},

aboutTitle:{
fontSize:"22px"
},

aboutText:{
marginTop:"10px",
fontSize:"16px",
lineHeight:"1.5"
},

tokenomics:{
marginTop:"10px",
textAlign:"left"
},

swapButton:{
marginTop:"30px",
background:"#fff",
padding:"14px 20px",
borderRadius:"30px",
display:"flex",
alignItems:"center",
justifyContent:"center",
gap:"10px",
fontWeight:"bold",
textDecoration:"none",
color:"#000",
boxShadow:"0 4px 10px rgba(0,0,0,0.15)"
},

swapLogo:{
width:"24px",
height:"24px"
}

}