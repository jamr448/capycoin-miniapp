import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const COOLDOWN = 86400; // 24 horas

export async function POST(req: Request) {

try{

const { nullifier, wallet } = await req.json();

if(!nullifier){
return NextResponse.json({success:false});
}

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

const today = new Date().toLocaleDateString("en-CA");

// 🆕 usuario nuevo
if(!user){

const streak = 1;
const reward = 1;

const nextClaim = now + COOLDOWN * 1000;

await supabase
.from("claims")
.insert([{
nullifier,
wallet,
last_claim:new Date(now).toISOString(),
balance:reward,
next_claim_timestamp:nextClaim,
streak:streak,
last_claim_day:today
}]);

return NextResponse.json({
success:true,
balance:reward,
reward,
streak,
streakMessage:`🔥 ¡Racha de ${streak} días!`,
nextClaim
});

}

// ⏱ verificar cooldown
if(now < user.next_claim_timestamp){

const remaining = Math.floor((user.next_claim_timestamp - now)/1000);

return NextResponse.json({
success:false,
remaining,
balance:user.balance ?? 0,
streak:user.streak ?? 1
});

}

// 🔥 calcular streak

let streak = user.streak ?? 1;

if(user.last_claim_day){

const last = new Date(user.last_claim_day);
const nowDate = new Date(today);

const diffDays = Math.floor(
(nowDate.getTime() - last.getTime()) / (1000*60*60*24)
);

// día consecutivo
if(diffDays === 1){
streak += 1;
}
else if(diffDays > 1){
streak = 1;
}

}

// recompensa máxima 10
const reward = streak >= 10 ? 10 : streak;

// nuevo balance
const newBalance = (user.balance ?? 0) + reward;

// siguiente reclamo
const nextClaim = now + COOLDOWN * 1000;

// actualizar usuario

await supabase
.from("claims")
.update({
wallet,
last_claim:new Date(now).toISOString(),
balance:newBalance,
next_claim_timestamp:nextClaim,
streak:streak,
last_claim_day:today
})
.eq("nullifier",nullifier);

return NextResponse.json({
success:true,
balance:newBalance,
reward,
streak,
streakMessage:`🔥 ¡Racha de ${streak} días!`,
nextClaim
});

}catch(err){

console.error(err);

return NextResponse.json({
success:false
});

}

}

// GET estado usuario

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
balance:0,
streak:1
});

}

const now = Date.now();

const remaining = Math.max(
0,
Math.floor((data.next_claim_timestamp - now)/1000)
);

return NextResponse.json({
success:true,
remaining,
balance:data.balance ?? 0,
streak:data.streak ?? 1
});

}