"use client";

import CapyBackground from "@/components/CapyBackground";
import CoinRain from "@/components/CoinRain";
import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Image from "next/image";

export default function Home() {

const [tab, setTab] = useState("claim");
const [remaining, setRemaining] = useState<number>(0);
const [balance, setBalance] = useState<number>(0);
const [status, setStatus] = useState("Verificar para reclamar");
const [claiming, setClaiming] = useState(false);

const [rain,setRain] = useState(false);
useEffect(() => {

  MiniKit.install();

  const nullifier = localStorage.getItem("capyNullifier");

  if (nullifier) {
    loadUser(nullifier);
  }

}, []);

const loadUser = async (nullifier:string)=>{

  const res = await fetch(`/api/claim?nullifier=${nullifier}`);
  const data = await res.json();

  if(data.remaining){
    setRemaining(data.remaining);
  }

  if(data.balance !== undefined){
    setBalance(data.balance);
  }

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

    setStatus("🔍 Verificando identidad...");

    const res = await MiniKit.commandsAsync.verify({
      action:"claimcapycoin"
    });

    let nullifier = "";

    if("nullifier_hash" in res.finalPayload){
      nullifier = res.finalPayload.nullifier_hash;
    }else if("proofs" in res.finalPayload){
      const proofs = res.finalPayload.proofs as any[];
      nullifier = proofs[0]?.nullifier_hash;
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

    if(data.success){

setStatus("🎉 Has reclamado Capycoin!");

setRain(true);

setTimeout(()=>{
setRain(false);
},3000);

setBalance(data.balance);

if(data.remaining){
setRemaining(data.remaining);
}

    }else{

      if(data.remaining){
        setRemaining(data.remaining);
      }

      setStatus("⛔ Debes esperar para reclamar nuevamente");

    }

  }catch{

    setStatus("❌ Error verificando");

  }

  setClaiming(false);

}

return(

<>

<video
autoPlay
loop
muted
playsInline
className="video-bg"
>
<source src="/capy-bg.mp4" type="video/mp4" />
</video>

<main style={styles.container}>

<div style={styles.balance}>
🪙 {balance} CAPYCOIN
</div>

<div style={styles.header}>

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
? "🟢 ¡Tus capycoin estan listo para reclamar!"
: "🔒 Bloqueado hasta tu proximo reclamo"}

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
: "Reclamar Capycoin"}
</button>

</>

)}

{tab === "about" && (

<div style={styles.aboutBox}>

<h2 style={styles.aboutTitle}>
¿Qué es Capycoin?
</h2>

<p style={styles.aboutText}>
Capycoin es una memecoin comunitaria creada en WorldChain
para recompensar a usuarios verificados con World ID.
Nuestro objetivo es construir una comunidad divertida
y descentralizada alrededor del capybara más famoso
del mundo cripto.
</p>

<h2 style={styles.aboutTitle}>
Tokenomics
</h2>

<ul style={styles.tokenomics}>
<li>Supply Total: 100,000,000 Capycoin</li>
<li>Airdrop Comunidad: 15%</li>
<li>Liquidez: 40%</li>
<li>Marketing: 25%</li>
<li>Token Burn: 5%</li>
<li>Equipo: 15%</li>
</ul>

<h2 style={styles.aboutTitle}>
Red
</h2>

<p style={styles.aboutText}>
Capycoin vive en WorldChain y puede ser reclamado
por usuarios verificados usando World ID.
11.100 Holders y contando!
</p>

</div>

)}

<div style={styles.socials}>

<a href="https://x.com/Capycoin_cpcoin" target="_blank" style={styles.social}>
𝕏
</a>

<a href="https://t.me/+LEokjKFRaDFkNzEx" target="_blank" style={styles.social}>
Telegram
</a>

</div>

<style jsx global>{`

@keyframes coinSpin {

0% {
transform: rotateY(0deg);
}

50% {
transform: rotateY(180deg);
}

100% {
transform: rotateY(360deg);
}
/* VIDEO BACKGROUND */
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

)

}

const styles:any = {

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

header:{
width:"100%",
display:"flex",
justifyContent:"space-between",
alignItems:"center"
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

balance:{
background:"#fff",
padding:"8px 15px",
borderRadius:"20px",
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

aboutBox:{
marginTop:"40px",
padding:"20px",
maxWidth:"400px",
textAlign:"center"
},

aboutTitle:{
fontSize:"22px",
marginTop:"20px"
},

aboutText:{
marginTop:"10px",
fontSize:"16px",
lineHeight:"1.5"
},

tokenomics:{
marginTop:"10px",
textAlign:"left",
fontSize:"16px"
},

social:{
textDecoration:"none",
fontWeight:"bold",
color:"#000"
}


}