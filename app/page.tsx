"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Image from "next/image";

export default function Home() {

const [tab, setTab] = useState("claim");
const [remaining, setRemaining] = useState<number>(0);
const [balance, setBalance] = useState<number>(0);
const [status, setStatus] = useState("Verificar para reclamar");

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

  try{

    setStatus("Verificando identidad...");

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

      setStatus("Claim exitoso");

      setBalance(data.balance);

      if(data.remaining){
        setRemaining(data.remaining);
      }

    }else{

      if(data.remaining){

        setRemaining(data.remaining);

      }

      setStatus(data.message);

    }

  }catch{

    setStatus("Error verificando");

  }

}

return(

<main style={styles.container}>

{/* HEADER */}

<div style={styles.header}>

<div style={styles.tabs}>

<button
style={styles.tab}
onClick={()=>setTab("claim")}
>
Reclamar
</button>

<button
style={styles.tab}
onClick={()=>setTab("about")}
>
Acerca de
</button>

</div>

<div style={styles.balance}>

🪙 {balance} CAPYCOIN

</div>

</div>

{tab === "claim" && (

<>
{/* LOGO */}

<div style={styles.logoBox}>

<Image
src="/capycoin.png"
alt="Capycoin"
width={260}
height={260}
/>

</div>

{/* TIMER */}

<h1 style={styles.timer}>
{formatTime(remaining)}
</h1>

{/* MENSAJE */}

<p style={styles.message}>

{remaining === 0
? "¡Tu Capycoin esta listo para Reclamar!"
: "Tu próximo Capycoin estará disponible pronto"}

</p>

{/* BOTON */}

<button
style={styles.button}
onClick={verifyAndClaim}
>
Verificar para Reclamar
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

<li>Airdrop Comunidad: 40%</li>

<li>Liquidez: 30%</li>

<li>Marketing: 20%</li>

<li>Equipo: 10%</li>

</ul>

<h2 style={styles.aboutTitle}>
Red
</h2>

<p style={styles.aboutText}>
Capycoin vive en WorldChain y puede ser reclamado
por usuarios verificados usando World ID.
</p>

</div>

)}
{/* REDES */}

<div style={styles.socials}>

<a
href="https://x.com"
target="_blank"
style={styles.social}
>
𝕏
</a>

<a
href="https://t.me"
target="_blank"
style={styles.social}
>
Telegram
</a>

</div>

</main>

)

}

const styles:any = {

container:{
minHeight:"100vh",
background:"linear-gradient(180deg,#34d399,#10b981)",
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
gap:"10px"
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