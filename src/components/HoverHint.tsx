import { useEffect, useState } from 'react';
import { base } from '../data';

// Only post-body explanations should trigger or dismiss the SVG hint.
// Synchronized lyric annotations live inside .music-player, outside .prose.
const bodyNoteSelector = 'article .prose .post-note > button';

export default function HoverHint() {
  const [position,setPosition]=useState<{x:number;y:number}|null>(null);
  const [leaving,setLeaving]=useState(false);
  useEffect(()=>{
    const desktop=window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
    let seen=false;
    setLeaving(false);
    let shown=false, frame=0, timer=0;
    let lastScrollY=window.scrollY, scrollingDown=false;
    const update=()=>{
      frame=0;if(seen||!desktop.matches){if(!seen)setPosition(null);return;}
      const target=document.querySelector<HTMLElement>(bodyNoteSelector);
      if(!target)return;
      const rect=target.getBoundingClientRect(); const y=rect.top+rect.height/2;
      // Reveal only after downward scrolling carries the note 70% up the viewport.
      if(!shown && scrollingDown && y>0 && y<=innerHeight*.3)shown=true;
      scrollingDown=false;
      if(shown && y>0 && y<innerHeight)setPosition({x:Math.max(8,rect.left-142),y:y-48});
      else setPosition(null);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const onScroll=()=>{
      const currentY=window.scrollY;
      scrollingDown=currentY>lastScrollY;
      lastScrollY=currentY;
      schedule();
    };
    const discovered=(event:Event)=>{
      if(seen||!(event.target instanceof Element)||!event.target.closest(bodyNoteSelector))return;
      seen=true;
      setLeaving(true);timer=window.setTimeout(()=>setPosition(null),450);
    };
    document.addEventListener('pointerover',discovered,true);
    document.addEventListener('focusin',discovered,true);
    window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',schedule);desktop.addEventListener('change',schedule);
    schedule();
    return ()=>{cancelAnimationFrame(frame);clearTimeout(timer);document.removeEventListener('pointerover',discovered,true);document.removeEventListener('focusin',discovered,true);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',schedule);desktop.removeEventListener('change',schedule);};
  },[]);
  return position ? <img className={`hover-hint ${leaving?'is-leaving':''}`} src={`${base}images/mouseover-hint.svg`} width={130} height={117} style={{left:position.x,top:position.y}} alt="" aria-hidden="true"/> : null;
}
