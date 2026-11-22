import './styles/main.css';
import gsap from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event as ev, sessions, competitions, hackathon } from './config/event.js';
gsap.registerPlugin(ScrollTrigger);
const $=s=>document.querySelector(s), body=document.body, reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.textContent=h;return e};
// ---------- content from config (textContent only; no injection) ----------
const tba='To be announced';
$('#mDate').textContent=ev.date||tba;$('#mVenue').textContent=ev.venue||tba;$('#mLoc').textContent=ev.location;
if(ev.collegeLogo){const i=new Image();i.src=ev.collegeLogo;i.alt=ev.organiser+' logo';i.style.maxWidth='220px';$('#logoSlot').replaceWith(i)}
if(ev.collegeWebsite){const a=el('a','link','Visit college website →');a.href=ev.collegeWebsite;a.rel='noopener';a.target='_blank';$('#collegeLink').append(a)}
const sl=$('#sessionList');
if(!sessions.length){sl.append(el('div','tba mono','Session programme and speakers to be announced.'))}
sessions.forEach(s=>{const c=el('article');c.append(el('p','mono',[s.category,s.datetime].filter(Boolean).join(' · ')),el('h3','',s.title),el('p','',[s.speaker,s.bio].filter(Boolean).join(' — ')),el('p','',s.description||''));if(s.photo){const i=new Image();i.src=s.photo;i.alt=s.speaker||'';i.width=64;c.prepend(i)}sl.append(c)});
Object.entries(hackathon).forEach(([k,v])=>{const c=el('div');c.append(el('p','mono',k),el('p',v?'':'tba',v||tba));$('#hackList').append(c)});
if(competitions.length){$('#competitions').hidden=false;competitions.forEach(x=>{const c=el('article');c.append(el('h3','',x.name),el('p','',x.description||''));if(x.url){const a=el('a','link','Details →');a.href=x.url;c.append(a)}$('#compList').append(c)})}else $('#navComp').hidden=true;
const cta=$('#cta');if(ev.registrationUrl){const a=el('a','btn','REGISTER NOW');a.href=ev.registrationUrl;a.rel='noopener';cta.append(a)}else{const b=el('span','btn','REGISTRATION OPENING SOON');b.setAttribute('aria-disabled','true');cta.append(b)}
$('#contact').textContent=ev.email?'':'Official contact details to be announced';if(ev.email){const a=el('a','link',ev.email);a.href='mailto:'+ev.email;$('#contact').append(a)}
Object.entries(ev.social).filter(([,u])=>u).forEach(([k,u])=>{const a=el('a','',k);a.href=u;a.rel='noopener';a.target='_blank';$('#social').append(a)});
// ---------- nav ----------
const menu=$('#menu'),links=$('#links');menu.onclick=()=>{const o=links.classList.toggle('open');menu.setAttribute('aria-expanded',o)};links.addEventListener('click',e=>{if(e.target.tagName==='A'){links.classList.remove('open');menu.setAttribute('aria-expanded',false)}});
addEventListener('keydown',e=>{if(e.key==='Escape')links.classList.remove('open')});
// ---------- quality ----------
const auto=()=>{const m=navigator.deviceMemory||4,c=navigator.hardwareConcurrency||4,mob=matchMedia('(pointer:coarse)').matches||innerWidth<700;return mob||m<=2||c<=2?'performance':(m>=8&&c>=8)?'high':'balanced'};
let quality=localStorage.getItem('vyron-q')||auto();$('#quality').value=quality;
// ---------- 3D (isolated: failure never blocks the site) ----------
let world=null;
const hasGL=()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch{return false}};
async function start3D(){
  if(world){world.dispose();world=null}
  if(!hasGL()||quality==='performance'&&matchMedia('(max-width:480px)').matches&&false){return fail3D()}
  try{const {createWorld}=await import('./scene/world.js');world=createWorld($('#gl'),quality);world.onLost(fail3D);body.classList.remove('no-webgl');$('#gl').hidden=false}catch(e){console.warn('3D disabled:',e);fail3D()}
}
function fail3D(){try{world?.dispose()}catch{}world=null;body.classList.add('no-webgl');$('#gl').hidden=true}
$('#quality').onchange=e=>{quality=e.target.value;localStorage.setItem('vyron-q',quality);start3D()};
ScrollTrigger.create({trigger:document.documentElement,start:'top top',end:'bottom bottom',onUpdate:s=>world?.setProgress(s.progress)});
if(!reduced)gsap.utils.toArray('.panel > *, .final > *').forEach(n=>{n.classList.add('rv');gsap.to(n,{opacity:1,y:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:n,start:'top 88%',once:true}})});
// ---------- loader (bounded: always resolves within 6s) ----------
const bar=$('#bar'),loader=$('#loader');let progress=0,ready=false,entered=false;
const setP=p=>{progress=Math.max(progress,p);bar.style.width=progress*100+'%'};
const t0=performance.now(),tick=setInterval(()=>{setP(Math.min(.9,(performance.now()-t0)/2800))},100);
const fonts=document.fonts?.ready||Promise.resolve();
Promise.race([Promise.all([fonts,start3D()]),new Promise(r=>setTimeout(r,5500))]).catch(()=>{}).finally(()=>{clearInterval(tick);setP(1);ready=true;
  const wait=Math.max(0,2500-(performance.now()-t0));setTimeout(()=>{$('#enter').hidden=false;$('#enterQuiet').hidden=false;$('#enter').focus({preventScroll:true})},wait)});
setTimeout(()=>{if(!ready){setP(1);$('#enterQuiet').hidden=false}},6500); // hard backstop: Continue always appears
// ---------- teaser ----------
const teaser=$('#teaser'),vid=$('#vid');let done=false;
function reveal(){if(done)return;done=true;body.classList.remove('is-loading');vid.pause();teaser.classList.add('out');loader.classList.add('out');setTimeout(()=>{teaser.hidden=true;loader.hidden=true},1100);ScrollTrigger.refresh();window.scrollTo(0,0)}
function playTeaser(sound){loader.classList.add('out');done=false;teaser.hidden=false;teaser.classList.remove('out');vid.muted=!sound;$('#tmute').textContent=sound?'SOUND ON':'SOUND OFF';
  let settled=false;const bail=()=>{if(!settled){settled=true;reveal()}};
  vid.onerror=bail;vid.onended=reveal;vid.onloadeddata=()=>{settled=true};setTimeout(()=>{if(!settled)bail()},4000);
  if(!vid.src)vid.src=ev.teaserVideo;vid.currentTime=0;vid.play().catch(()=>{vid.muted=true;$('#tmute').textContent='SOUND OFF';vid.play().catch(bail)})}
const begin=s=>{if(entered)return;entered=true;playTeaser(s)};
$('#enter').onclick=()=>begin(true);$('#enterQuiet').onclick=()=>begin(false);
$('#tskip').onclick=reveal;$('#tmute').onclick=()=>{vid.muted=!vid.muted;$('#tmute').textContent=vid.muted?'SOUND OFF':'SOUND ON'};
addEventListener('keydown',e=>{if(e.key==='Escape'&&!teaser.hidden)reveal()});
$('#replay').onclick=()=>{links.classList.remove('open');body.classList.add('is-loading');playTeaser(true)};
// vid.src is only set at play time, so a missing file falls through to reveal() above.
