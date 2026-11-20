import { parts, normal } from "./microscope-model.js";

const scene=document.querySelector("[data-microscope]");
const canvas=scene.querySelector("canvas");
const context=canvas.getContext("2d");
if (context) {
  const initial={yaw:-.43,pitch:.25,zoom:1};
  const state={...initial};
  const faces=parts.flatMap(part=>part.faces.map(indices=>{
    const vertices=indices.map(index=>part.vertices[index]);
    return {vertices,normal:normal(vertices),color:part.color};
  }));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  let frame=0;
  let pointer=null;

  function draw(){
    frame=0;
    const bounds=canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const width=bounds.width,height=bounds.height;
    const pixelsWide=Math.round(width*ratio),pixelsHigh=Math.round(height*ratio);
    if(canvas.width!==pixelsWide||canvas.height!==pixelsHigh){canvas.width=pixelsWide;canvas.height=pixelsHigh;}
    context.setTransform(ratio,0,0,ratio,0,0);
    context.clearRect(0,0,width,height);
    const scale=Math.min(width/5.55,height/4.25)*state.zoom;
    const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
    const turn=([x,y,z])=>{
      const k=cy*z-sy*x;
      return [cy*x+sy*z,cp*y-sp*k,sp*y+cp*k];
    };
    const point=([x,y,z])=>turn([x,y-1.78,z]);
    const screen=([x,y])=>[width*.5+x*scale,height*.52-y*scale];

    const [shadowX,shadowY]=screen(point([-.1,.02,0]));
    context.fillStyle="rgba(38,64,93,.13)";
    context.beginPath();
    context.ellipse(shadowX,shadowY,scale*2.65,scale*.27,0,0,Math.PI*2);
    context.fill();

    const visible=[];
    for(const face of faces){
      const n=turn(face.normal);
      if(n[2]<=.004) continue;
      const vertices=face.vertices.map(point);
      visible.push({vertices,depth:vertices.reduce((z,p)=>z+p[2],0)/vertices.length,shade:.61+.39*Math.max(0,-.34*n[0]+.83*n[1]+.44*n[2]),color:face.color});
    }
    visible.sort((a,b)=>a.depth-b.depth);
    for(const face of visible){
      const [first,...rest]=face.vertices.map(screen);
      const [r,g,b]=face.color.map(value=>Math.round(value*face.shade));
      context.beginPath();
      context.moveTo(...first);
      for(const p of rest)context.lineTo(...p);
      context.closePath();
      context.fillStyle="rgb("+r+","+g+","+b+")";
      context.fill();
      context.lineWidth=.55;
      context.strokeStyle="rgba(25,45,67,.16)";
      context.stroke();
    }
  }

  function schedule(){ if(!frame)frame=requestAnimationFrame(draw); }
  function rotate(x,y){
    state.yaw=(state.yaw+x)%(2*Math.PI);
    state.pitch=clamp(state.pitch+y,-.42,.94);
    schedule();
  }
  function zoom(amount){state.zoom=clamp(state.zoom+amount,.78,1.72);schedule();}
  canvas.addEventListener("pointerdown",event=>{
    if(!event.isPrimary || (event.pointerType==="mouse" && event.button!==0)) return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove",event=>{
    if(!pointer||pointer.id!==event.pointerId) return;
    rotate((event.clientX-pointer.x)*.011,(event.clientY-pointer.y)*.009);
    pointer.x=event.clientX;
    pointer.y=event.clientY;
  });
  canvas.addEventListener("lostpointercapture",()=>{pointer=null;canvas.classList.remove("dragging");});
  const controls={
    left:()=>rotate(-.26,0), right:()=>rotate(.26,0),
    up:()=>rotate(0,.16), down:()=>rotate(0,-.16),
    closer:()=>zoom(.19), farther:()=>zoom(-.19),
    reset:()=>{Object.assign(state,initial);schedule();}
  };
  const keys={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","+":"closer","=":"closer","-":"farther",Home:"reset"};
  canvas.addEventListener("keydown",event=>{
    if(!Object.hasOwn(keys,event.key)) return;
    event.preventDefault();
    controls[keys[event.key]]();
  });
  scene.querySelectorAll("[data-model-control]").forEach(button=>{
    button.addEventListener("click",()=>controls[button.dataset.modelControl]());
  });
  scene.dataset.ready="true";
  new ResizeObserver(schedule).observe(canvas);
  draw();
}
