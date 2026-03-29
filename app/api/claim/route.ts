import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const COOLDOWN = 60;
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

// usuario nuevo
if(!user){

const nextClaim = now + COOLDOWN * 1000;

await supabase
.from("claims")
.insert([{
nullifier,
last_claim:new Date(now).toISOString(),
balance:REWARD,
next_claim_timestamp:nextClaim
}]);

return NextResponse.json({
success:true,
balance:REWARD,
nextClaim
});

}

// verificar cooldown
if(now < user.next_claim_timestamp){

const remaining = Math.floor((user.next_claim_timestamp - now)/1000);

return NextResponse.json({
success:false,
remaining,
balance:user.balance ?? 0
});

}

// nuevo balance
const newBalance = (user.balance ?? 0) + REWARD;
const nextClaim = now + COOLDOWN * 1000;

await supabase
.from("claims")
.update({
last_claim:new Date(now).toISOString(),
balance:newBalance,
next_claim_timestamp:nextClaim
})
.eq("nullifier",nullifier);

return NextResponse.json({
success:true,
balance:newBalance,
nextClaim
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

const remaining = Math.max(
0,
Math.floor((data.next_claim_timestamp - now)/1000)
);

return NextResponse.json({
success:true,
remaining,
balance:data.balance ?? 0
});

}