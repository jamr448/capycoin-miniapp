"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function Home() {

  const [status, setStatus] = useState("Verifica tu identidad");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [verified, setVerified] = useState(false);
  const [tab, setTab] = useState("claim");

  useEffect(() => {
    MiniKit.install();
  }, []);

  // contador en vivo
  useEffect(() => {

    if (remaining === null) return;

    const interval = setInterval(() => {

      setRemaining((prev) => {

        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setStatus("🎉 Ya puedes reclamar!");
          return null;
        }

        return prev - 1;

      });

    }, 1000);

    return () => clearInterval(interval);

  }, [remaining]);

  const formatTime = (t:number) => {

    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;

    return `${h.toString().padStart(2,"0")}:${m
      .toString()
      .padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

  };

  // verificar identidad
  const handleVerify = async () => {

    try {

      setStatus("🔐 Verificando...");

      const res = await MiniKit.commandsAsync.verify({
        action: "claimcapycoin",
      });

      let nullifier = "";

      if ("nullifier_hash" in res.finalPayload) {
        nullifier = res.finalPayload.nullifier_hash;
      } else if ("proofs" in res.finalPayload) {
        const proofs = res.finalPayload.proofs as any[];
        nullifier = proofs[0]?.nullifier_hash;
      }

      localStorage.setItem("capyNullifier", nullifier);

      if (
        res.finalPayload?.status === "success" ||
        (res.finalPayload as any)?.status === "verified"
      ) {

        setVerified(true);
        setStatus("✅ Verificado");

        const response = await fetch(`/api/claim?nullifier=${nullifier}`);
        const data = await response.json();

        if (data.remaining && data.remaining > 0) {
          setRemaining(data.remaining);
        }

        if (data.balance !== undefined) {
          setBalance(data.balance);
        }

      } else {

        setStatus("❌ Falló verificación");

      }

    } catch (err) {

      console.error(err);
      setStatus("❌ Error verificando identidad");

    }

  };

  // claim
  const handleClaim = async () => {

    try {

      setStatus("⏳ Procesando...");

      const nullifier = localStorage.getItem("capyNullifier");

      if (!nullifier) {
        setStatus("❌ Usuario no verificado");
        return;
      }

      const response = await fetch("/api/claim", {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({ nullifier })
      });

      const data = await response.json();

      if (data.success) {

        setStatus("💰 Claim exitoso!");
        setBalance((prev)=>prev + 5);

      } else {

        if (data.remaining) {
          setStatus("⛔ Debes esperar");
          setRemaining(data.remaining);
        } else {
          setStatus("⛔ "+data.message);
        }

      }

    } catch (err) {

      console.error(err);
      setStatus("❌ Error en claim");

    }

  };

  // pantalla login
  if (!verified) {

    return (

      <main style={styles.container}>

        <img
          src="/capycoin.png"
          style={{
            width:"240px",
            marginBottom:"20px",
            animation:"spinCoin 10s linear infinite"
          }}
        />

        <h1 style={{fontSize:"34px"}}>Capycoin</h1>

        <p style={{opacity:0.7,marginBottom:"30px"}}>
          Memecoin comunitaria en WorldChain
        </p>

        <button style={styles.button} onClick={handleVerify}>
          Iniciar Sesión
        </button>

        <p style={{marginTop:"20px"}}>{status}</p>

      </main>

    );

  }

  // app principal
  return (

    <main style={styles.container}>

      <div style={styles.tabs}>

        <button onClick={()=>setTab("claim")} style={styles.tab}>
          Reclamar
        </button>

        <button onClick={()=>setTab("about")} style={styles.tab}>
          Acerca de
        </button>

      </div>

      {tab === "claim" && (

        <>

          <h2>💰 Tu balance</h2>

          <p style={{fontSize:"26px",fontWeight:"bold"}}>
            {balance} CAPYCOIN
          </p>

          <h2 style={{marginTop:"20px"}}>

            {remaining !== null
              ? `⏱️ ${formatTime(remaining)}`
              : "🟢 Disponible para reclamar"}

          </h2>

          <button
            style={{
              ...styles.claimButton,
              opacity: remaining ? 0.5 : 1
            }}
            onClick={handleClaim}
            disabled={remaining !== null}
          >

            {remaining !== null ? "Espera..." : "Reclamar"}

          </button>

          <p style={{marginTop:"30px"}}>
            🔥 11,150 usuarios  
            <br/>
            🪙 54,230 Capycoin reclamados
          </p>

        </>

      )}

      {tab === "about" && (

        <>

          <h2>Capycoin</h2>

          <p style={{marginBottom:"20px"}}>
            Memecoin comunitaria en WorldChain 🚀
          </p>

          <h3>Tokenomics</h3>

          <div style={{width:"260px"}}>

            <div style={styles.tokenBar}>
              <span>Airdrop</span>
              <span>40%</span>
            </div>
            <div style={styles.bar}>
              <div style={{...styles.fill,width:"40%"}}/>
            </div>

            <div style={styles.tokenBar}>
              <span>Liquidity</span>
              <span>25%</span>
            </div>
            <div style={styles.bar}>
              <div style={{...styles.fill,width:"25%"}}/>
            </div>

            <div style={styles.tokenBar}>
              <span>Ecosystem</span>
              <span>20%</span>
            </div>
            <div style={styles.bar}>
              <div style={{...styles.fill,width:"20%"}}/>
            </div>

            <div style={styles.tokenBar}>
              <span>Team</span>
              <span>10%</span>
            </div>
            <div style={styles.bar}>
              <div style={{...styles.fill,width:"10%"}}/>
            </div>

            <div style={styles.tokenBar}>
              <span>Marketing</span>
              <span>5%</span>
            </div>
            <div style={styles.bar}>
              <div style={{...styles.fill,width:"5%"}}/>
            </div>

          </div>

        </>

      )}

      <p>{status}</p>

      <style jsx global>{`

        @keyframes spinCoin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }

      `}</style>

    </main>

  );

}

const styles:any = {

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
    color:"white",
    marginTop:"20px"
  },

  claimButton:{
    padding:"20px",
    borderRadius:"30px",
    background:"#0ea5e9",
    border:"none",
    color:"white",
    marginTop:"40px",
    width:"200px"
  },

  tabs:{
    display:"flex",
    gap:"10px",
    marginBottom:"10px"
  },

  tab:{
    padding:"10px 20px",
    borderRadius:"20px",
    background:"#1e293b",
    color:"white",
    border:"none"
  },

  tokenBar:{
    display:"flex",
    justifyContent:"space-between",
    marginTop:"15px",
    fontSize:"14px"
  },

  bar:{
    width:"100%",
    height:"8px",
    background:"#1e293b",
    borderRadius:"10px",
    marginTop:"5px"
  },

  fill:{
    height:"100%",
    background:"#22c55e",
    borderRadius:"10px"
  }

};