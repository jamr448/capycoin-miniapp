import { NextResponse } from "next/server";

export async function GET() {

try{

const res = await fetch(
"https://worldscan.org/api?module=token&action=tokenholdercount&contractaddress=0xe55BA4Ea7835c221a521e43BA05bC1a9508928B2"
);

const data = await res.json();

return NextResponse.json({
holders: Number(data.result) || 0
});

}catch(err){

return NextResponse.json({
holders:0
});

}

}