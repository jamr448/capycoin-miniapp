import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const COOLDOWN = 60; // 60 segundos (1 minuto)
const REWARD = 5;

export async function POST(req: Request) {

try{

const { nullifier } = await req.json();

if(!nullifier){
return NextResponse.json({success:false});
}

const now = Date.now();

const { data:user, error } = await supabase
.from("claims")
.select("*")
.eq("nullifier",nullifier)
.maybeSingle();

if(error){
console.error(error);
return NextResponse.json({success:false});
}

if(!user){

const nowISO = new Date().toISOString();

await supabase
.from("claims")
.insert([{
nullifier,
last_claim:nowISO,
balance:REWARD
}]);

return NextResponse.json({
success:true,
balance:REWARD,
remaining:COOLDOWN
});

}

const lastClaim = new Date(user.last_claim).getTime();
const diff = Math.floor((now-lastClaim)/1000);

if(diff < COOLDOWN){

return NextResponse.json({
success:false,
remaining:COOLDOWN-diff,
balance:user.balance ?? 0
});

}

const nowISO = new Date().toISOString();

await supabase
.from("claims")
.update({
last_claim:nowISO,
balance:(user.balance ?? 0)+REWARD
})
.eq("nullifier",nullifier);

// 🔥 obtener balance actualizado
const { data:updated } = await supabase
.from("claims")
.select("balance")
.eq("nullifier",nullifier)
.maybeSingle();

return NextResponse.json({
success:true,
balance:updated?.balance ?? user.balance + REWARD,
remaining:COOLDOWN
});

}catch(err){

console.error(err);

return NextResponse.json({
success:false
});

}

}

export async function GET(req: Request){

const { searchParams } = new URL(req.url);
const nullifier = searchParams.get("nullifier");

if(!nullifier){
return NextResponse.json({success:false});
}

const { data } = await supabase
.from("claims")
.select("*")
.eq("nullifier",nullifier)
.maybeSingle();

if(!data){

return NextResponse.json({
success:true,
remaining:0,
balance:0
});

}

const now = Date.now();
const lastClaim = new Date(data.last_claim).getTime();

const diff = Math.floor((now-lastClaim)/1000);

const remaining = diff >= COOLDOWN ? 0 : COOLDOWN-diff;

return NextResponse.json({
success:true,
remaining,
balance:data.balance ?? 0
});

}