import { NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC = "https://worldchain-mainnet.g.alchemy.com/public";

const CONTRACT = "0xe55BA4Ea7835c221a521e43BA05bC1a9508928B2";

const ABI = [
"function totalSupply() view returns (uint256)",
"function decimals() view returns (uint8)"
];

export async function GET(){

try{

const provider = new ethers.JsonRpcProvider(RPC);

const contract = new ethers.Contract(CONTRACT, ABI, provider);

const supply = await contract.totalSupply();

const decimals = await contract.decimals();

const formattedSupply = ethers.formatUnits(supply, decimals);

return NextResponse.json({
supply: formattedSupply
});

}catch(err){

console.log(err);

return NextResponse.json({
supply:0
});

}

}