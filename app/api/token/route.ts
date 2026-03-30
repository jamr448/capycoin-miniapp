import { NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC = "https://worldchain-mainnet.g.alchemy.com/public";

const CONTRACT = "0xe55BA4Ea7835c221a521e43BA05bC1a9508928B2";

const ABI = [
"function totalSupply() view returns (uint256)",
"function decimals() view returns (uint8)",
"event Transfer(address indexed from, address indexed to, uint256 value)"
];

export async function GET(){

try{

const provider = new ethers.JsonRpcProvider(RPC);

const contract = new ethers.Contract(CONTRACT, ABI, provider);

// obtener supply
const supply = await contract.totalSupply();
const decimals = await contract.decimals();

const formattedSupply = ethers.formatUnits(supply, decimals);

// obtener eventos transfer
const filter = contract.filters.Transfer();

const events = await contract.queryFilter(filter, 0, "latest");

const holders = new Set<string>();

for(const e of events){

const event = e as ethers.EventLog;

const from = event.args[0];
const to = event.args[1];

if(to && to !== ethers.ZeroAddress){
holders.add(to);
}

if(from && from !== ethers.ZeroAddress){
holders.add(from);
}

}

return NextResponse.json({
supply: Number(formattedSupply),
holders: holders.size
});

}catch(err){

console.log(err);

return NextResponse.json({
supply:0,
holders:0
});

}

}