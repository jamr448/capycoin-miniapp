"use client";

import { useEffect, useRef } from "react";

export default function CoinRain({active}:{active:boolean}) {

const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(()=>{

if(!active) return;

const canvas = canvasRef.current!;
const ctx = canvas.getContext("2d")!;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const coins:any[] = [];

const img = new Image();
img.src = "/capycoin.png";

for(let i=0;i<40;i++){

coins.push({
x: Math.random()*canvas.width,
y: -Math.random()*canvas.height,
speed: 3 + Math.random()*4,
size: 30 + Math.random()*20,
rotation: Math.random()*360
});

}

let running = true;

function animate(){

if(!running) return;

ctx.clearRect(0,0,canvas.width,canvas.height);

coins.forEach(c=>{

c.y += c.speed;
c.rotation += 3;

ctx.save();

ctx.translate(c.x,c.y);
ctx.rotate(c.rotation*Math.PI/180);

ctx.drawImage(img,-c.size/2,-c.size/2,c.size,c.size);

ctx.restore();

});

requestAnimationFrame(animate);

}

animate();

setTimeout(()=>{

running = false;
ctx.clearRect(0,0,canvas.width,canvas.height);

},3000);

},[active]);

return(

<canvas
ref={canvasRef}
style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
pointerEvents:"none",
zIndex:20
}}
/>

);

}