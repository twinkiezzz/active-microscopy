const parts = [];
const add = (vertices, faces, color) => parts.push({ vertices, faces, color });

function box(x,y,z,w,h,d,color) {
  const a=w/2,b=h/2,c=d/2;
  add([
    [x-a,y-b,z-c],[x+a,y-b,z-c],[x+a,y+b,z-c],[x-a,y+b,z-c],
    [x-a,y-b,z+c],[x+a,y-b,z+c],[x+a,y+b,z+c],[x-a,y+b,z+c]
  ], [[3,2,1,0],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]], color);
}

function cylinder(x,y,z,r,h,color,topRadius=r) {
  const n=24, vertices=[], faces=[];
  for (let j=0;j<2;j++) {
    const radius=j?topRadius:r;
    for (let i=0;i<n;i++) {
      const t=2*Math.PI*i/n;
      vertices.push([x+radius*Math.cos(t),y+(j-.5)*h,z+radius*Math.sin(t)]);
    }
  }
  for (let i=0;i<n;i++) {
    const j=(i+1)%n;
    faces.push([i,i+n,j+n,j]);
  }
  faces.push(Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>2*n-1-i));
  add(vertices,faces,color);
}

function hose(points,r,color) {
  const vertices=[],faces=[],sides=9;
  points.forEach(([x,y,z],i)=>{
    const a=points[Math.max(i-1,0)],b=points[Math.min(i+1,points.length-1)];
    const d=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const nx=-(b[1]-a[1])/d,ny=(b[0]-a[0])/d;
    for(let j=0;j<sides;j++){
      const t=j*Math.PI*2/sides;
      vertices.push([x+r*Math.cos(t)*nx,y+r*Math.cos(t)*ny,z+r*Math.sin(t)]);
    }
  });
  for(let i=0;i<points.length-1;i++)for(let j=0;j<sides;j++){
    const k=(j+1)%sides,A=i*sides,B=(i+1)*sides;
    faces.push([A+j,A+k,B+k,B+j]);
  }
  add(vertices,faces,color);
}

const steel=[171,182,190], bright=[211,219,223], middle=[132,147,159], black=[45,56,68], blue=[52,102,138], white=[225,230,232];
// Table, pedestals and working surface.
box(-.42,1.11,0,3.70,.19,1.30,bright);
box(-1.69,.55,0,.67,1.02,1.05,steel);
box(.83,.55,0,.70,1.02,1.05,middle);
box(.83,.56,.537,.54,.78,.022,steel);
for(const x of [-1.91,-1.46,.60,1.04])for(const z of [-.42,.42])cylinder(x,.065,z,.080,.12,black);
// Base stage, specimen chamber and stepped electron column.
cylinder(.36,1.24,0,.52,.10,black);
cylinder(.36,1.37,0,.39,.21,steel);
cylinder(.36,1.51,0,.32,.11,bright);
cylinder(.36,1.66,0,.34,.25,middle);
cylinder(.36,1.83,0,.37,.10,bright);
cylinder(.36,2.03,0,.28,.31,steel);
cylinder(.36,2.23,0,.37,.08,middle);
cylinder(.36,2.43,0,.23,.33,bright);
cylinder(.36,2.63,0,.28,.09,steel);
cylinder(.36,2.82,0,.21,.31,steel);
cylinder(.36,3.00,0,.25,.08,bright);
cylinder(.36,3.14,0,.15,.21,middle);
cylinder(.36,3.31,0,.14,.16,bright);
box(.36,1.67,.31,.41,.23,.32,steel);
box(.36,1.67,.49,.33,.15,.045,bright);
box(.65,2.09,.04,.39,.10,.10,bright);
box(.09,2.52,.03,.32,.085,.11,bright);
// Two monitors and desk controls.
for(const x of [-1.67,-.92]){
  box(x,1.30,-.27,.34,.04,.24,black);
  box(x,1.45,-.28,.08,.28,.08,middle);
  box(x,1.71,-.29,.69,.43,.075,black);
  box(x,1.71,-.246,.61,.35,.018,blue);
  box(x,1.59,-.234,.56,.025,.008,[115,165,186]);
}
box(-1.28,1.23,.30,.65,.065,.24,black);
box(-.67,1.25,.33,.21,.085,.22,middle);
box(-.67,1.31,.33,.08,.07,.07,black);
// Auxiliary cabinet and corrugated connection.
box(1.98,.49,-.14,.79,.87,.88,bright);
box(1.98,.49,.312,.64,.69,.025,middle);
for(let i=0;i<7;i++)box(1.99,.30+i*.064,.329,.48,.022,.021,black);
box(1.98,.95,-.14,.68,.085,.69,steel);
cylinder(1.98,1.02,-.14,.11,.08,black);
hose([[.37,3.32,0],[.40,3.50,0],[.57,3.57,0],[.78,3.55,-.015],[1.02,3.38,-.03],[1.25,3.13,-.05],[1.48,2.82,-.07],[1.68,2.47,-.10],[1.85,2.08,-.13],[1.96,1.70,-.14],[1.98,1.36,-.14],[1.98,1.04,-.14]],.072,black);
box(-1.7,.52,.54,.525,.72,.035,white);
box(-1.7,.72,.565,.30,.062,.012,black);

export { parts };

export function normal(vertices) {
  const a=vertices[0],b=vertices[1],c=vertices[2];
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  const x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;
  const length=Math.hypot(x,y,z)||1;
  return [x/length,y/length,z/length];
}
