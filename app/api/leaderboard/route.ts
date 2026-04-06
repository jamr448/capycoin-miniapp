import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(){

try{

const { data } = await supabase
.from("claims")
.select("wallet, streak")
.order("streak",{ascending:false})
.limit(5);

return NextResponse.json({leaders:data});

}catch(err){

return NextResponse.json({leaders:[]});

}

}