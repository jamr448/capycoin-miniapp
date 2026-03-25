"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function Home() {

const [status, setStatus] = useState("Verifica tu identidad");
const [remaining, setRemaining] = useState<number | null>(null);
const [balance, setBalance] = useState(0);
const [verified, setVerified] = useState(false);
const [claiming, setClaiming] = useState(false);
const [tab, setTab] = useState("claim");

useEffect(()=>{

MiniKit.install();

// 🔹 restaurar sesión si existe
const nullifier = localStorage.getItem("capyNullifier");

if(nullifier){
loadUserState(nullifier);
}

},[]);


// cargar estado real desde backend
const loadUserState = async (nullifier:string)=>{

try{

const response = await fetch(`/api/claim?nullifier=${nullifier}`);
const data = await response.json();

if(data.remaining > 0){
setRemaining(data.remaining);
}

setBalance(data.balance ?? 0);
setVerified(true);

}catch(err){

console.error(err);

}

};


// contador en vivo
useEffect(()=>{

if(remaining === null) return;

const interval = setInterval(()=>{

setRemaining(prev=>{

if(prev === null || prev <=1){
clearInterval(interval);
setStatus("🎉 Ya puedes reclamar!");
return null;
}

return prev - 1;

});

},1000);

return ()=>clearInterval(interval);

},[remaining]);


const formatTime=(t:number)=>{

const h=Math.floor(t/3600);
const m=Math.floor((t%3600)/60);
const s=t%60;

return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

};


// 🔐 VERIFICAR IDENTIDAD
const handleVerify=async()=>{

try{

setStatus("🔐 Verificando...");

const res = await MiniKit.commandsAsync.verify({
action:"claimcapycoin"
});

if(!res.finalPayload){
setStatus("❌ Verificación fallida");
return;
}

let nullifier="";

if("nullifier_hash" in res.finalPayload){
nullifier=res.finalPayload.nullifier_hash;
}else if("proofs" in res.finalPayload){
const proofs=res.finalPayload.proofs as any[];
nullifier=proofs[0]?.nullifier_hash;
}

if(!nullifier){
setStatus("❌ Error verificando identidad");
return;
}

localStorage.setItem("capyNullifier",nullifier);

await loadUserState(nullifier);

setStatus("✅ Verificado");

}catch(err){

console.error(err);
setStatus("❌ Error verificando identidad");

}

};


// 💰 CLAIM
const handleClaim=async()=>{

if(claiming) return;

try{

setClaiming(true);
setStatus("⏳ Procesando...");

const nullifier = localStorage.getItem("capyNullifier");

if(!nullifier){
setStatus("❌ Usuario no verificado");
setClaiming(false);
return;
}

const response = await fetch("/api/claim",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({nullifier})
});

const data = await response.json();

if(data.success){

setBalance(data.balance);
setRemaining(data.remaining);
setStatus("💰 Claim exitoso!");

}else{

if(data.remaining){
setRemaining(data.remaining);
setStatus("⛔ Debes esperar");
}else{
setStatus("⛔ "+data.message);
}

}

}catch(err){

console.error(err);
setStatus("❌ Error en claim");

}finally{

setClaiming(false);

}

};


// pantalla login
if(!verified){

return(

<main style={styles.container}>

<img
src="/capycoin.png"
style={{
width:"200px",
marginBottom:"20px",
animation:"spinCoin 10s linear infinite"
}}
/>

<h1>Capycoin</h1>

<button style={styles.button} onClick={handleVerify}>
Verificar identidad
</button>

<p>{status}</p>

</main>

);

}


// APP PRINCIPAL
return(

<main style={styles.container}>

<div style={styles.tabs}>

<button onClick={()=>setTab("claim")} style={styles.tab}>
Reclamar
</button>

<button onClick={()=>setTab("about")} style={styles.tab}>
Acerca de
</button>

</div>

{tab==="claim" &&(

<>

<h2>💰 Balance</h2>

<p style={{fontSize:"26px"}}>

{balance} Capycoin

</p>

<h2>

{remaining !== null
? `⏱️ ${formatTime(remaining)}`
: "🟢 Disponible"}

</h2>

<button
style={{
...styles.claimButton,
opacity:remaining?0.5:1
}}
disabled={remaining!==null || claiming}
onClick={handleClaim}
>

{claiming
? "Procesando..."
: remaining
? "Espera..."
: "Reclamar"}

</button>

</>

)}

{tab==="about" &&(

<>
<h2>Capycoin</h2>
<p>Memecoin comunitaria en WorldChain 🚀</p>
</>

)}

<p>{status}</p>

<style jsx global>{`

@keyframes spinCoin{
0%{transform:rotateY(0deg)}
100%{transform:rotateY(360deg)}
}

`}</style>

</main>

);

}


const styles:any={

container:{
minHeight:"100vh",
background:"#020617",
color:"white",
display:"flex",
flexDirection:"column",
alignItems:"center",
justifyContent:"center"
},

button:{
padding:"15px 25px",
borderRadius:"20px",
background:"#22c55e",
border:"none",
color:"white"
},

claimButton:{
padding:"20px",
borderRadius:"30px",
background:"#0ea5e9",
border:"none",
color:"white",
marginTop:"30px",
width:"200px"
},

tabs:{
display:"flex",
gap:"10px",
marginBottom:"20px"
},

tab:{
padding:"10px 20px",
borderRadius:"20px",
background:"#1e293b",
color:"white",
border:"none"
}

};