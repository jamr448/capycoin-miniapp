import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(){

try{

// total usuarios
const { count } = await supabase
.from("claims")
.select("*",{count:"exact",head:true});

// total capycoin distribuidos
const { data } = await supabase
.from("claims")
.select("balance");

let totalClaimed = 0;

if(data){
for(const u of data){
totalClaimed += u.balance || 0;
}
}

return NextResponse.json({
users: count || 0,
claimed: totalClaimed
});

}catch(err){

return NextResponse.json({
users:0,
claimed:0
});

}

}