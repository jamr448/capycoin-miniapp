"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Image from "next/image";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";
export default function Home() {

const [tab,setTab] = useState("home");
const [remaining,setRemaining] = useState<number>(0);
const [balance,setBalance] = useState<number>(0);
const [wldBalance,setWldBalance] = useState(0);
const [capyBalance,setCapyBalance] = useState(0);
const [pufBalance,setPufBalance] = useState(0);
const [streak,setStreak] = useState<number>(1);
const [reward,setReward] = useState<number>(0);
const [animatedReward,setAnimatedReward] = useState(0);
const [verified,setVerified] = useState(false);
const [claiming,setClaiming] = useState(false);
const [clicks,setClicks] = useState(0);
const [loading,setLoading] = useState(true);
const [showReward,setShowReward] = useState(false);
const [nextClaimTime,setNextClaimTime] = useState<number>(0);
const [username,setUsername] = useState<string | null>(null);
const [wallet,setWallet] = useState<string | null>(null);
const [copied,setCopied] = useState(false);
const [explode,setExplode] = useState(false);
const [lang,setLang] = useState<"en" | "es">("en");
const [leaders,setLeaders] = useState<any[]>([]);
const [connected,setConnected] = useState(false);
const [swapToken,setSwapToken] = useState("WLD");
const [swapAmount,setSwapAmount] = useState("");
const [sendAddress,setSendAddress] = useState("");
const [sendAmount,setSendAmount] = useState("");
const [showReceive,setShowReceive] = useState(false);
const text = {

en:{
dashboard:"Capycoin Dashboard",
balance:"Balance",
streak:"Streak",
verified:"Verified",
claimInfo:"Claim Capycoin every 24 hours and increase your streak.",
nextClaim:"Next Claim",

aboutTitle:"About Capycoin",
aboutText:"Capycoin is a community memecoin created for verified humans inside World App. Its goal is to build an active community within the Worldchain ecosystem.",

holders:"Holders",
distributed:"CAPYCOIN Distributed",

streakSystem:"Streak System",
streakText:"Claim every day to increase your streak and earn more rewards. The streak can reach up to 10 CAPYCOIN. If you miss a day, it resets.",

tokenomics:"Tokenomics",

contract:"Capycoin Contract",
copy:"Copy",
copied:"Copied",

website:"Website",

communityTitle:"Join the Capycoin Community",
communityText:"Stay up to date with news, announcements and updates from the project.",

follow:"Follow",
telegram:"Telegram"
},

es:{
dashboard:"Panel Capycoin",
balance:"Balance",
streak:"Racha",
verified:"Verificado",
claimInfo:"Reclama Capycoin cada 24 horas y aumenta tu racha.",
nextClaim:"Próximo Reclamo",

aboutTitle:"Sobre Capycoin",
aboutText:"Capycoin es una memecoin comunitaria creada para humanos verificados dentro de World App. Su objetivo es construir una comunidad activa dentro del ecosistema Worldchain.",

holders:"Holders",
distributed:"CAPYCOIN distribuidos",

streakSystem:"Sistema de Racha",
streakText:"Reclama cada día para aumentar tu racha y ganar más recompensas. La racha puede llegar hasta 10 CAPYCOIN. Si pierdes un día se reinicia.",

tokenomics:"Tokenomics",

contract:"Contrato Capycoin",
copy:"Copiar",
copied:"Copiado",

website:"Sitio Web",

communityTitle:"Únete a la comunidad de Capycoin",
communityText:"Mantente al día con noticias, anuncios y novedades del proyecto.",

follow:"Síguenos",
telegram:"Telegram"
}

};

useEffect(()=>{

MiniKit.install();

// idioma guardado
const savedLang = localStorage.getItem("capyLang");

if(savedLang === "es" || savedLang === "en"){
setLang(savedLang);
}else{

const browserLang = navigator.language || "en";

if(browserLang.startsWith("es")){
setLang("es");
}else{
setLang("en");
}

}

// iniciar verificación
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
loadLeaderboard();

},[]);

useEffect(()=>{

if(!showReward) return;

let current = 0;

setAnimatedReward(0);

const interval = setInterval(()=>{

current++;

setAnimatedReward(current);

if(current >= reward){
clearInterval(interval);
}

},200);

return ()=>clearInterval(interval);

},[showReward,reward]);

const loadLeaderboard = async ()=>{

try{

const res = await fetch("/api/leaderboard",{cache:"no-store"});

const data = await res.json();

if(data.leaders){
setLeaders(data.leaders);
}

}catch(err){
console.log(err);
}

};
const loadWalletBalances = async (wallet:string)=>{

try{

const provider = new ethers.JsonRpcProvider(
"https://rpc.worldchain.org"
);

// ABI mínima ERC20
const abi=[
"function balanceOf(address owner) view returns (uint256)",
"function decimals() view returns (uint8)"
];

// contratos
const capyContract = new ethers.Contract(
"0xe55BA4Ea7835c221a521e43BA05bC1a9508928B2",
abi,
provider
);

const pufContract = new ethers.Contract(
"0x1aE3498f1B417fe31BE544B04B711F27Ba437bd3",
abi,
provider
);

const wldContract = new ethers.Contract(
"0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
abi,
provider
);

// balances
const capyRaw = await capyContract.balanceOf(wallet);
const pufRaw = await pufContract.balanceOf(wallet);
const wldRaw = await wldContract.balanceOf(wallet);

// decimals
const capyDecimals = await capyContract.decimals();
const pufDecimals = await pufContract.decimals();
const wldDecimals = await wldContract.decimals();

// convertir
setCapyBalance(Number(ethers.formatUnits(capyRaw,capyDecimals)));
setPufBalance(Number(ethers.formatUnits(pufRaw,pufDecimals)));
setWldBalance(Number(ethers.formatUnits(wldRaw,wldDecimals)));

}catch(err){
console.log(err);
}

};

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
const connectWallet = async () => {

try{

const user = MiniKit.user;

if(!user){
alert("Wallet not available");
return;
}

const address =
user.walletAddress ||
user?.wallet?.address ||
null;

const name =
user.username ||
user?.profile?.username ||
null;

if(address){
setWallet(address);
loadWalletBalances(address);
}

if(name){
setUsername(name);
}

setConnected(true);

}catch(err){

console.log(err);

}

};
useEffect(()=>{

const interval = setInterval(()=>{

if(nextClaimTime === 0) return;

const diff = Math.floor((nextClaimTime - Date.now()) / 1000);

setRemaining(diff > 0 ? diff : 0);

},1000);

return ()=>clearInterval(interval);

},[nextClaimTime]);

const totalCooldown = 86400; // 24 horas

const progress =
remaining > 0
? ((totalCooldown - remaining) / totalCooldown) * 100
: 100;

const formatTime = (t:number)=>{

const h = Math.floor(t/3600);
const m = Math.floor((t%3600)/60);
const s = t%60;

return `${h.toString().padStart(2,"0")}:${m
.toString()
.padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

};

const shortAddress = (addr?:string | null)=>{

if(!addr) return "";

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

// verificación
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

try{

const res = await fetch("/api/claim",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
nullifier,
wallet
})
});

const data = await res.json();

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
setAnimatedReward(0);

setExplode(true);

setTimeout(()=>{
setExplode(false);
},1200);

setTimeout(()=>{
setShowReward(false);
},5000);

}catch(err){

console.log(err);

}

setClaiming(false);

};

const sendCapycoin = async () => {

if(!sendAddress || !sendAmount){
alert("Enter address and amount");
return;
}

try{

const tokenAddress = "0xe55BA4Ea7835c221a521e43BA05bC1a9508928B2";

const abi = [
"function transfer(address to,uint256 amount)"
];

const iface = new ethers.Interface(abi);

const amount = ethers.parseUnits(sendAmount,18);

const calldata = iface.encodeFunctionData(
"transfer",
[sendAddress,amount]
);

await MiniKit.commandsAsync.sendTransaction({
transaction: [
{
address: tokenAddress,
data: calldata,
value: "0"
}
]
} as any);

alert("Transaction sent");

if(wallet){
loadWalletBalances(wallet);
}

}catch(err){

console.log(err);
alert("Transaction failed");

}

};

const swapTokenAction = ()=>{

if(!swapAmount) return;

const url =
"https://worldcoin.org/mini-app?app_id=app_36b1f21c5c3f8f63e2f4a0f6a6a5b5a0";

window.open(url,"_blank");

};

return(

<>

<main style={styles.container}>

<div style={styles.header}>

<div>

<div style={styles.userHeader}>

{wallet ? (

<>
🟢 {username ? `@${username}` : shortAddress(wallet)}
</>

) : (

<button
style={styles.connectButton}
onClick={connectWallet}
>
Connect Wallet
</button>

)}

</div>

<div style={styles.userStatus}>
{wallet ? shortAddress(wallet) : ""}
</div>

</div>

<div style={styles.langSelector}>

<select
value={lang}
onChange={(e)=>{
const newLang = e.target.value as "en" | "es";
setLang(newLang);
localStorage.setItem("capyLang",newLang);
}}
style={styles.langSelect}
>
<option value="en">🇺🇸 EN</option>
<option value="es">🇪🇸 ES</option>
</select>
</div>

</div>
{/* home TAB */}

{tab === "home" && (

<div style={styles.dashboard}>

<h2 style={styles.dashboardTitle}>
🪙 {text[lang].dashboard}
</h2>

<div style={styles.nextClaimCard}>

<div
style={{
...styles.progressCircle,
background: remaining === 0
? `conic-gradient(#22c55e 100%, #1e293b 100%)`
: `conic-gradient(#0ea5e9 ${progress}%, #1e293b ${progress}%)`
}}
>

<div style={styles.progressInner}>

<div style={styles.nextClaimTimer}>
{loading ? "..." : formatTime(remaining)}
</div>

<div style={styles.nextClaimLabel}>
{remaining === 0
? (lang==="es" ? "Listo para reclamar" : "Ready to Claim")
: text[lang].nextClaim}
</div>

</div>

</div>

</div>

<div style={styles.dashboardCards}>

<div style={styles.dashboardCard}>
<span style={styles.dashboardIcon}>🔥</span>
<h3>{streak}</h3>
<p>{text[lang].streak}</p>
</div>

<div style={styles.dashboardCard}>
<span style={styles.dashboardIcon}>🪙</span>
<h3>{balance}</h3>
<p>{lang==="es" ? "Reclamados" : "Rewards"}</p>
</div>

<div style={styles.dashboardCard}>
<span style={styles.dashboardIcon}>✔</span>
<h3>{text[lang].verified}</h3>
<p>World ID</p>
</div>

</div>

<div style={styles.leaderboardCard}>

<h3 style={{marginBottom:"10px"}}>
🏆 {lang==="es" ? "Mejores Rachas" : "Top Claimers"}
</h3>

{leaders.length === 0 ? (

<p style={{opacity:0.7,fontSize:"14px"}}>
No claimers yet
</p>

) : (

leaders.map((u,i)=>{

const medals=["🥇","🥈","🥉","🏅","🏅"];

const name =
u.username
? `@${u.username}`
: u.wallet
? shortAddress(u.wallet)
: "anonymous";

return(

<div key={i} style={styles.leaderRow}>

<span>{medals[i]}</span>

<span>
{name} — 🔥 {u.streak}
</span>

</div>

);

})

)}

</div>
<p style={styles.dashboardText}>
{text[lang].claimInfo}
</p>

</div>

)}

{/* CLAIM TAB */}

{tab==="claim" && (

<div style={styles.claimContainer}>

<div style={styles.logoBox}>

<div
style={{
...styles.energyRing,
boxShadow:
remaining === 0
? "0 0 60px rgba(255,215,0,0.8)"
: "none"
}}
>

<Image
src="/capycoin.png"
alt="Capycoin"
width={200}
height={200}
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
opacity:remaining>0 || claiming ? 0.6 : 1,
animation: remaining===0 ? "claimPulse 1.6s infinite" : "none"
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
<span>{text[lang].telegram}</span>
</a>

</div>

</div>
</div>

)}

{/* WALLET TAB */}

{tab==="wallet" && (

<div style={styles.infoContainer}>

<h2 style={{textAlign:"center"}}>
💼 Capycoin Wallet
</h2>

{/* BALANCES */}

<div style={styles.infoCard}>

<div style={styles.statsBox}>

<div style={styles.statItem}>
<span style={styles.statNumber}>{capyBalance.toFixed(2)}</span>
<span style={styles.statLabel}>CAPYCOIN</span>
</div>

<div style={styles.statItem}>
<span style={styles.statNumber}>{pufBalance.toFixed(2)}</span>
<span style={styles.statLabel}>PUF</span>
</div>

<div style={styles.statItem}>
<span style={styles.statNumber}>{wldBalance.toFixed(4)}</span>
<span style={styles.statLabel}>WLD</span>
</div>

</div>

</div>

{/* SWAP */}

<div style={styles.infoCard}>

<h3>🔁 Swap</h3>

<input
placeholder="Amount CAPYCOIN"
value={swapAmount}
onChange={(e)=>setSwapAmount(e.target.value)}
style={styles.input}
/>

<select
value={swapToken}
onChange={(e)=>setSwapToken(e.target.value)}
style={styles.input}
>

<option value="WLD">WLD</option>
<option value="PUF">PUF</option>

</select>

<button
style={styles.button}
onClick={swapTokenAction}
>
Swap
</button>

</div>

{/* SEND */}

<div style={styles.infoCard}>

<h3>📤 Send</h3>

<input
placeholder="Wallet address"
value={sendAddress}
onChange={(e)=>setSendAddress(e.target.value)}
style={styles.input}
/>

<input
placeholder="Amount CAPYCOIN"
value={sendAmount}
onChange={(e)=>setSendAmount(e.target.value)}
style={styles.input}
/>

<button
style={styles.button}
onClick={sendCapycoin}
>
Send Capycoin
</button>

</div>

{/* RECEIVE */}

<div style={styles.infoCard}>

<h3>📥 Receive</h3>

<button
style={styles.button}
onClick={()=>setShowReceive(!showReceive)}
>
Show QR
</button>

{showReceive && wallet && (

<div style={{marginTop:"15px"}}>

<QRCodeSVG
value={wallet}
size={180}
/>

<p style={{fontSize:"12px",marginTop:"10px"}}>
{wallet}
</p>

</div>

)}

</div>

</div>

)}

{/* ABOUT TAB */}

{tab==="about" && (

<div style={styles.infoContainer}>

<div style={styles.infoCard}>

<h3>🪙 {text[lang].aboutTitle}</h3>

<p>
{text[lang].aboutText}
</p>

</div>

<div style={styles.infoCard}>

<div style={styles.statsBox}>

<div style={styles.statItem}>
<img src="/capycoin.png" width="28"/>
<span style={styles.statNumber}>
{capyBalance.toFixed(2)}
</span>
<span style={styles.statLabel}>CAPYCOIN</span>
</div>

<div style={styles.statItem}>
<img src="/puf.png" width="28"/>
<span style={styles.statNumber}>
{pufBalance.toFixed(2)}
</span>
<span style={styles.statLabel}>PUF</span>
</div>

<div style={styles.statItem}>
<img src="/wld.png" width="28"/>
<span style={styles.statNumber}>
{wldBalance.toFixed(4)}
</span>
<span style={styles.statLabel}>WLD</span>
</div>

</div>

</div>

<div style={styles.infoCard}>

<h3>🔥 {text[lang].streakSystem}</h3>

<p>
{text[lang].streakText}
</p>

</div>

<div style={styles.infoCard}>

<h3>📊 {text[lang].tokenomics}</h3>

<ul style={styles.tokenList}>
<li>15% — Airdrop Distribution</li>
<li>20% — Reserve</li>
<li>25% — Community</li>
<li>5% — Marketing</li>
<li>5% — Token Burns</li>
<li>30% — Liquidity</li>
</ul>

</div>

<div style={styles.infoCard}>

<div className="contract-glow" style={styles.contractCard}>

<div style={styles.contractHeader}>
<span style={styles.contractTitle}>📄 {text[lang].contract}</span>
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
{copied ? `✓ ${text[lang].copied}` : text[lang].copy}
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

<a
href="https://jamr448.github.io/capycoin.io/#home"
target="_blank"
style={styles.exchangeButton}
>
<img src="/capycoin.png" style={styles.exchangeLogo}/>
<span>{text[lang].website}</span>
</a>

</div>

</div>

{/* 🔥 TARJETA COMUNIDAD */}

<div style={styles.infoCard}>

<div className="community-glow" style={styles.communityCard}>

<h3 style={{marginBottom:"10px"}}>
{text[lang].communityTitle}
</h3>

<p style={styles.communityText}>
{text[lang].communityText}
</p>

<div style={styles.socialButtons}>

<a
href="https://x.com/Capycoin_cpcoin"
target="_blank"
style={styles.xButton}
>
<img src="/x.png" className="x-anim"/>
<span>{text[lang].follow}</span>
</a>

<a
href="https://t.me/+LEokjKFRaDFkNzEx/"
target="_blank"
style={styles.telegramButton}
>
<img src="/telegram.png" style={styles.socialIcon}/>
<span>{text[lang].telegram}</span>
</a>

</div>

</div>

</div>

</div>
)}
{showReward && (
<div style={styles.overlay}>

<div style={styles.rewardCard}>

<button
style={styles.closeReward}
onClick={()=>setShowReward(false)}
>
✕
</button>

<h2>
🎉 {lang==="es"
? `¡Acabas de reclamar ${animatedReward} Capycoin!`
: `You just claimed ${animatedReward} Capycoin!`}
</h2>

<p style={{marginTop:"10px"}}>
{lang==="es"
? "🔥 Sigue acumulando Capycoin para desbloquear más recompensas dentro de la app."
: "🔥 Keep stacking Capycoin to unlock more rewards inside the app."}
</p>

<p style={{
marginTop:"8px",
fontSize:"14px",
opacity:0.8
}}>
🔥 Streak: {streak}
</p>
<p style={{
marginTop:"15px",
fontSize:"12px",
opacity:0.7
}}>
{lang==="es"
? "O convierte a USD / WLD usando:"
: "Or convert to USD / WLD using:"}
</p>
<a
href="https://worldcoin.org/mini-app?app_id=app_36b1f21c5c3f8f63e2f4a0f6a6a5b5a0"
target="_blank"
style={styles.pufButton}
>
<img
src="/puff.png"
style={{width:"20px",height:"20px"}}
/>

<span>Puf Wallet</span>

</a>
</div>

<div className="coinRain">

<img src="/capycoin-drop.png"/>
<img src="/capycoin-drop.png"/>
<img src="/capycoin-drop.png"/>
<img src="/capycoin-drop.png"/>
<img src="/capycoin-drop.png"/>
<img src="/capycoin-drop.png"/>
<img src="/capycoin-drop.png"/>
<img src="/capycoin-drop.png"/>

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
color: tab==="wallet" ? "#0ea5e9" : "#fff"
}}
onClick={()=>setTab("wallet")}
>
💼
<span>Wallet</span>
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

@keyframes claimPulse {

0%{
transform:scale(1);
box-shadow:0 0 0 rgba(34,197,94,0.6);
}

50%{
transform:scale(1.05);
box-shadow:0 0 20px rgba(34,197,94,0.8);
}

100%{
transform:scale(1);
box-shadow:0 0 0 rgba(34,197,94,0.6);
}

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

0%{transform:translateY(0px) scale(1);}
50%{transform:translateY(-8px) scale(1.05);}
100%{transform:translateY(0px) scale(1);}

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

@keyframes contractGlow {

0%{
box-shadow:0 0 0 rgba(34,197,94,0);
}

50%{
box-shadow:0 0 25px rgba(34,197,94,0.6);
}

100%{
box-shadow:0 0 0 rgba(34,197,94,0);
}

}

.contract-glow{
animation:contractGlow 3s infinite;
}

.community-glow{
animation:cardGlow 3s infinite;
}

@keyframes energySpin {

0%{
transform:rotate(0deg);
}

100%{
transform:rotate(360deg);
}

}

.coinRain{
position:fixed;
top:-150px;
left:0;
width:100%;
height:100%;
pointer-events:none;
overflow:hidden;
}

.coinRain img{
position:absolute;
width:70px;
animation:coinFall linear forwards;
filter:drop-shadow(0 0 6px gold);
}

.coinRain img:nth-child(2),
.coinRain img:nth-child(5),
.coinRain img:nth-child(7){

filter:drop-shadow(0 0 14px gold)
drop-shadow(0 0 28px gold);

animation:coinFall linear forwards,
coinGlow 2s ease-in-out infinite;
}

.coinRain img:nth-child(1){left:5%;animation-duration:7s;}
.coinRain img:nth-child(2){left:20%;animation-duration:6.5s;}
.coinRain img:nth-child(3){left:35%;animation-duration:7.5s;}
.coinRain img:nth-child(4){left:50%;animation-duration:6s;}
.coinRain img:nth-child(5){left:65%;animation-duration:7s;}
.coinRain img:nth-child(6){left:75%;animation-duration:6.8s;}
.coinRain img:nth-child(7){left:85%;animation-duration:7.2s;}
.coinRain img:nth-child(8){left:95%;animation-duration:6.6s;}

@keyframes coinFall{

0%{
transform:translateY(-200px) rotate(0deg);
opacity:0;
}

20%{
opacity:1;
}

100%{
transform:translateY(900px) rotate(360deg);
opacity:0;
}

}

@keyframes coinGlow{

0%{
filter:drop-shadow(0 0 6px gold);
}

50%{
filter:drop-shadow(0 0 20px gold)
drop-shadow(0 0 40px gold);
}

100%{
filter:drop-shadow(0 0 6px gold);
}

}

.closeReward:hover{
opacity:1;
transform:scale(1.2);
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

rewardCard:{
position:"relative",
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

leaderboardCard:{
marginTop:"14px",
background:"rgba(255,255,255,0.08)",
backdropFilter:"blur(10px)",
borderRadius:"20px",
padding:"18px",
boxShadow:"0 8px 20px rgba(0,0,0,0.35)"
},

leaderRow:{
display:"flex",
justifyContent:"space-between",
marginBottom:"6px",
fontSize:"14px"
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

claimContainer:{
flex:1,
display:"flex",
flexDirection:"column",
alignItems:"center",
justifyContent:"space-between",
textAlign:"center",
width:"100%",
height:"calc(100vh - 130px)",
paddingTop:"10px",
paddingBottom:"10px"
},

energyRing:{
position:"relative",
borderRadius:"50%",
padding:"10px",
display:"flex",
alignItems:"center",
justifyContent:"center",
boxShadow:"0 0 0 rgba(255,215,0,0)"
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

balanceHeader:{
fontWeight:"bold",
fontSize:"14px",
background:"rgba(255,255,255,0.08)",
padding:"6px 12px",
borderRadius:"20px",
backdropFilter:"blur(8px)"
},

closeReward:{
position:"absolute",
top:"10px",
right:"12px",
background:"transparent",
border:"none",
color:"#fff",
fontSize:"20px",
cursor:"pointer",
opacity:0.8
},

nextClaimLabel:{
fontSize:"14px",
opacity:0.9
},

pufButton:{
marginTop:"10px",
display:"flex",
alignItems:"center",
justifyContent:"center",
gap:"8px",
background:"#22c55e",
color:"#fff",
padding:"10px 16px",
borderRadius:"30px",
textDecoration:"none",
fontWeight:"bold",
boxShadow:"0 4px 12px rgba(0,0,0,0.4)"
},

nextClaimTimer:{
fontSize:"36px",
fontWeight:"bold"
},

statNumber:{
fontSize:"28px",
fontWeight:"bold",
color:"#22c55e"
},

statLabel:{
fontSize:"14px",
opacity:0.8
},

progressCircle:{
width:"180px",
height:"180px",
borderRadius:"50%",
background:"conic-gradient(#0ea5e9 0%, #1e293b 0%)",
display:"flex",
alignItems:"center",
justifyContent:"center",
margin:"0 auto",
boxShadow:"0 10px 25px rgba(0,0,0,0.4)"
},

progressInner:{
width:"150px",
height:"150px",
borderRadius:"50%",
background:"#020617",
display:"flex",
flexDirection:"column",
alignItems:"center",
justifyContent:"center",
textAlign:"center"
},

socialCard:{
marginTop:"10px",
background:"rgba(255,255,255,0.08)",
backdropFilter:"blur(10px)",
padding:"20px",
borderRadius:"20px",
width:"90%",
maxWidth:"420px",
boxShadow:"0 8px 20px rgba(0,0,0,0.35)",
textAlign:"center"
},

communityCard:{
marginTop:"10px",
background:"rgba(255,255,255,0.08)",
backdropFilter:"blur(10px)",
padding:"22px",
borderRadius:"20px",
width:"100%",
boxShadow:"0 8px 20px rgba(0,0,0,0.35)",
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
alignItems:"center",
gap:"14px",
marginTop:"12px",
flexWrap:"wrap"
},

xButton:{
display:"flex",
alignItems:"center",
gap:"6px",
background:"#000",
color:"#fff",
padding:"10px 18px",
borderRadius:"30px",
textDecoration:"none",
fontWeight:"bold",
boxShadow:"0 4px 12px rgba(0,0,0,0.4)"
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
background:"rgba(255,255,255,0.08)",
backdropFilter:"blur(10px)",
borderRadius:"20px",
padding:"18px",
boxShadow:"0 8px 20px rgba(0,0,0,0.35)",
lineHeight:"1.6"
},

icon:{fontSize:"18px"},

verifiedIcon:{width:"18px",height:"18px"},

logoBox:{marginTop:"20px"},

timer:{fontSize:"40px",marginTop:"10px"},

message:{marginTop:"10px",fontSize:"18px",textAlign:"center"},

button:{
marginTop:"10px",
background:"#0ea5e9",
color:"white",
padding:"18px 30px",
borderRadius:"40px",
border:"none",
fontSize:"18px",
width:"80%"
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
justifyContent:"center",
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

infoContainer:{
marginTop:"90px",
width:"100%",
maxWidth:"420px",
display:"flex",
flexDirection:"column",
gap:"16px"
},

contractAddressFull:{
fontSize:"12px",
wordBreak:"break-all",
marginBottom:"12px",
textAlign:"center"
},

contractCard:{
marginTop:"20px",
background:"rgba(255,255,255,0.05)",
backdropFilter:"blur(8px)",
padding:"18px",
borderRadius:"16px",
width:"100%",
boxShadow:"0 4px 10px rgba(0,0,0,0.1)"
},

contractTitle:{
fontWeight:"bold",
marginBottom:"10px",
color:"#fff"
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

input:{
width:"100%",
padding:"10px",
borderRadius:"12px",
border:"none",
marginTop:"10px"
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
color:"#fff"
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
position:"sticky",
top:0,
zIndex:1000,
display:"flex",
justifyContent:"space-between",
alignItems:"center",
background:"#020617",
padding:"10px 14px",
borderBottom:"1px solid #1e293b"
},

connectButton:{
background:"#0ea5e9",
color:"#fff",
border:"none",
padding:"8px 16px",
borderRadius:"20px",
fontWeight:"bold",
cursor:"pointer"
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
marginTop:"20px",
background:"rgba(0,0,0,0.5)",
padding:"20px",
borderRadius:"20px",
width:"100%",
textAlign:"center",
boxShadow:"0 10px 30px rgba(0,0,0,0.4)"
},

exchangeLogo:{width:"24px",height:"24px"}

};