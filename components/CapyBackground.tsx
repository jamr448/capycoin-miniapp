"use client";

import { useEffect, useRef } from "react";

export default function CapyBackground() {

const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {

const canvas = canvasRef.current!;
const ctx = canvas.getContext("2d")!;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles:any[] = [];

const img = new Image();
img.src = "/capycoin.png";

for(let i=0;i<30;i++){

particles.push({
x: Math.random()*canvas.width,
y: Math.random()*canvas.height,
size: 25 + Math.random()*30,
speed: 0.2 + Math.random()*0.4,
rotation: Math.random()*360,
rotationSpeed: 0.2 + Math.random()*0.5
});

}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height);

particles.forEach(p=>{

p.y -= p.speed;

if(p.y < -50){
p.y = canvas.height + 50;
p.x = Math.random()*canvas.width;
}

p.rotation += p.rotationSpeed;

ctx.save();

ctx.translate(p.x,p.y);
ctx.rotate(p.rotation*Math.PI/180);

ctx.drawImage(
img,
-p.size/2,
-p.size/2,
p.size,
p.size
);

ctx.restore();

});

requestAnimationFrame(animate);

}

animate();

},[]);

return(

<canvas
ref={canvasRef}
style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
zIndex:0,
pointerEvents:"none"
}}
/>

);

}