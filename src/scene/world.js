import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
const Q = { high:{dpr:2,city:420,rain:5000,fx:1}, balanced:{dpr:1.5,city:220,rain:2200,fx:.6}, performance:{dpr:1,city:100,rain:600,fx:.3} };
const tex = (w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};
const windows = (p)=>tex(256,512,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=10)for(let x=0;x<w;x+=8)if(Math.random()<p){g.fillStyle=Math.random()<.12?'#b3141d':'#cfc9bd';g.fillRect(x+1,y+2,5,5)}});
export function createWorld(canvas, qualityName='balanced'){
  const q = Q[qualityName]; const R = new THREE.WebGLRenderer({canvas,antialias:qualityName!=='performance',powerPreference:'high-performance'});
  R.setPixelRatio(Math.min(devicePixelRatio,q.dpr)); R.toneMapping=THREE.ACESFilmicToneMapping; R.toneMappingExposure=.9; R.shadowMap.enabled=q.fx>.5;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x060607); scene.fog=new THREE.FogExp2(0x0a0a0c,.0105);
  const pm=new THREE.PMREMGenerator(R); const envRT=pm.fromScene(new RoomEnvironment(),.04); scene.environment=envRT.texture; scene.environmentIntensity=.12;
  const cam=new THREE.PerspectiveCamera(42,1,.5,700);
  scene.add(new THREE.HemisphereLight(0x8a8f99,0x050505,.25));
  const key=new THREE.DirectionalLight(0xbfc7d6,.7);key.position.set(-60,90,40);key.castShadow=q.fx>.5;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-90,right:90,top:90,bottom:-40,far:300});scene.add(key);
  const redL=new THREE.PointLight(0xb3141d,900,120,1.6);redL.position.set(0,6,16);scene.add(redL);
  // wet ground
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:0x0b0b0d,roughness:.14,metalness:.55,envMapIntensity:1.6}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  // roads
  const roadM=new THREE.MeshBasicMaterial({color:0x151518});[[0,0,300,6],[0,-50,300,5]].forEach(([x,z,l,w])=>{const r=new THREE.Mesh(new THREE.PlaneGeometry(l,w),roadM);r.rotation.x=-Math.PI/2;r.position.set(x,.03,z+30);scene.add(r)});
  const lm=new THREE.Group(); scene.add(lm);
  const metal=new THREE.MeshStandardMaterial({color:0x17171a,roughness:.38,metalness:.9});
  const glass=new THREE.MeshStandardMaterial({color:0x0a0b0d,roughness:.08,metalness:.7,emissive:0xffffff,emissiveMap:windows(.28),emissiveIntensity:.9});
  const concrete=new THREE.MeshStandardMaterial({color:0x2a2a2d,roughness:.9,metalness:.05});
  const add=(m,mat,x,y,z)=>{m.material=mat;m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;lm.add(m);return m};
  add(new THREE.Mesh(new THREE.BoxGeometry(46,4,46)),concrete,0,2,0); add(new THREE.Mesh(new THREE.BoxGeometry(34,3,34)),metal,0,5.5,0);
  // twisting, tapering shaft in 16 stacked segments
  let y=7, rad=11, twist=0; const segH=5.2;
  for(let i=0;i<16;i++){const g=new THREE.CylinderGeometry(rad*.94,rad,segH,6,1);const s=add(new THREE.Mesh(g),glass,0,y+segH/2,0);s.rotation.y=twist;
    const slab=add(new THREE.Mesh(new THREE.CylinderGeometry(rad*1.04,rad*1.04,.5,6)),metal,0,y+segH,0);slab.rotation.y=twist;
    y+=segH;rad*=.955;twist+=.07}
  // structural ribs (6 leaning exoskeleton columns)
  const H=y-5;for(let i=0;i<6;i++){const a=i/6*Math.PI*2+Math.PI/6;const r0=12.3,r1=4.6;const len=Math.hypot(H,r0-r1);const rib=new THREE.Mesh(new THREE.BoxGeometry(.9,len,1.4));
    rib.position.set(Math.cos(a)*(r0+r1)/2,7+H/2,Math.sin(a)*(r0+r1)/2);rib.lookAt(Math.cos(a)*r1,7+H,Math.sin(a)*r1);rib.rotateX(Math.PI/2);rib.material=metal;rib.castShadow=true;lm.add(rib)}
  // red light rings + spire
  const redM=new THREE.MeshStandardMaterial({color:0x200204,emissive:0xb3141d,emissiveIntensity:2.2});
  [30,58,84].forEach((h,i)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(12.5-i*2.6,.16,8,6),redM);t.rotation.x=Math.PI/2;t.rotation.z=Math.PI/6;t.position.y=h;lm.add(t)});
  add(new THREE.Mesh(new THREE.CylinderGeometry(.1,.7,28,6)),metal,0,y+14,0); const tip=new THREE.Mesh(new THREE.SphereGeometry(.7,12,12),redM);tip.position.y=y+28;lm.add(tip);
  const tipL=new THREE.PointLight(0xb3141d,500,90,1.8);tipL.position.y=y+28;lm.add(tipL);
  // city ring (instanced), taller toward the centre, clear zone around landmark, open "sea" side to +z
  const geo=new THREE.BoxGeometry(1,1,1),wm=new THREE.MeshStandardMaterial({color:0x101113,roughness:.5,metalness:.6,emissive:0xffffff,emissiveMap:windows(.14),emissiveIntensity:.7});
  const city=new THREE.InstancedMesh(geo,wm,q.city),d=new THREE.Object3D();let n=0,tries=0;
  while(n<q.city&&tries++<9999){const a=Math.random()*Math.PI*2,r=48+Math.pow(Math.random(),.7)*190,x=Math.cos(a)*r,z=Math.sin(a)*r-10;if(z>70)continue;
    const w=5+Math.random()*12,dd=5+Math.random()*12,h=(8+Math.random()*70)*(1.25-Math.min(r,200)/260);d.position.set(x,h/2,z);d.scale.set(w,h,dd);d.rotation.y=Math.round(Math.random()*3)*.0+(Math.random()<.3?.4:0);d.updateMatrix();city.setMatrixAt(n++,d.matrix)}
  city.count=n;city.castShadow=q.fx>.5;scene.add(city);
  // rain
  const N=q.rain,pos=new Float32Array(N*6);const seed=[];for(let i=0;i<N;i++)seed.push([(Math.random()-.5)*260,Math.random()*120,(Math.random()-.5)*260]);
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(pos,3));const rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0x9aa3b0,transparent:true,opacity:.28}));rain.frustumCulled=false;scene.add(rain);
  const rainStep=(dt,still)=>{for(let i=0;i<N;i++){const s=seed[i];if(!still)s[1]-=dt*70;if(s[1]<0)s[1]+=120;pos.set([s[0],s[1],s[2],s[0]-.15,s[1]+1.6,s[2]],i*6)}rg.attributes.position.needsUpdate=true};rainStep(0,true);
  // camera path
  const P=new THREE.CatmullRomCurve3([[0,16,118],[34,22,84],[46,30,40],[24,36,26],[-26,46,24],[-30,70,12],[0,96,26],[0,60,60],[0,34,92]].map(a=>new THREE.Vector3(...a)),false,'catmullrom',.4);
  const T=new THREE.CatmullRomCurve3([[0,38,0],[0,40,0],[0,42,0],[0,48,0],[0,58,0],[0,66,0],[0,56,0],[0,46,0],[0,40,0]].map(a=>new THREE.Vector3(...a)));
  const cur={t:0};const look=new THREE.Vector3();
  const resize=()=>{const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.fov=w/h<.8?58:42;cam.updateProjectionMatrix()};resize();addEventListener('resize',resize);
  let target=0,running=true,last=performance.now(),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,raf;
  const frame=(now)=>{raf=requestAnimationFrame(frame);if(!running)return;const dt=Math.min(.05,(now-last)/1e3);last=now;
    cur.t+=(target-cur.t)*(reduced?1:1-Math.exp(-dt*3.2));const t=Math.min(.999,cur.t);P.getPoint(t,cam.position);T.getPoint(t,look);
    if(!reduced)cam.position.x+=Math.sin(now/5000)*.6;cam.lookAt(look);
    tip.material.emissiveIntensity=2+Math.sin(now/700)*.8;redL.intensity=800+Math.sin(now/1300)*80;rainStep(dt,reduced);R.render(scene,cam)};
  raf=requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{running=!document.hidden;last=performance.now()});
  return {setProgress:v=>{target=v},onLost(cb){canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cb()})},
    dispose(){cancelAnimationFrame(raf);removeEventListener('resize',resize);scene.traverse(o=>{o.geometry?.dispose();[].concat(o.material||[]).forEach(m=>{m.map?.dispose();m.emissiveMap?.dispose();m.dispose()})});envRT.dispose();pm.dispose();R.dispose()}};
}
