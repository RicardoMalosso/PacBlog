import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prepareNotes } from '../postNotes';

function Note({label,text}: {label:React.ReactNode;text:string}) {
  const id = useId(); const [open,setOpen] = useState(false);
  return <span className={`post-note ${open ? 'note-open' : ''}`} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}><button type="button" aria-describedby={id} aria-expanded={open} onClick={()=>setOpen(x=>!x)} onBlur={()=>setOpen(false)}>{label}</button><span id={id} className="post-note-box" role="tooltip"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{p:({children})=><span className="note-paragraph">{children}</span>,ul:({children})=><span role="list" className="note-list">{children}</span>,ol:({children})=><span role="list" className="note-list">{children}</span>,li:({children})=><span role="listitem" className="note-list-item">{children}</span>,h1:({children})=><span className="note-heading">{children}</span>,h2:({children})=><span className="note-heading">{children}</span>,h3:({children})=><span className="note-heading">{children}</span>}}>{text}</ReactMarkdown></span></span>;
}
function Markdown({text,notes={}}: {text:string;notes?:Record<string,string>}) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{a:({href,title,children})=>href && notes[href] ? <Note label={children} text={notes[href]}/> : href === '#note' && title ? <Note label={children} text={title}/> : <a href={href} title={title}>{children}</a>}}>{text}</ReactMarkdown>;
}
function Panel({title,body,notes,defaultOpen=true}: {title:string;body:string;notes:Record<string,string>;defaultOpen?:boolean}) {
  const {t}=useTranslation(); const [open,setOpen]=useState(defaultOpen); const [large,setLarge]=useState(false);
  const id=useId(); const trigger=useRef<HTMLButtonElement>(null); const dialog=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!large)return;
    const previous=document.body.style.overflow; document.body.style.overflow='hidden';
    const frame=requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>('button')?.focus());
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){e.preventDefault();setLarge(false);}
      if(e.key==='Tab'){
        const elements=[...dialog.current?.querySelectorAll<HTMLElement>('button,a[href],input,textarea,select,[tabindex="0"]')||[]];
        const first=elements[0],last=elements[elements.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return ()=>{cancelAnimationFrame(frame);document.body.style.overflow=previous;document.removeEventListener('keydown',key);trigger.current?.focus();};
  },[large]);
  return <section className="post-panel"><header><button className="panel-summary" onClick={()=>setOpen(x=>!x)} aria-expanded={open} aria-controls={id}><span aria-hidden="true">{open?'−':'+'}</span> {title}</button><button ref={trigger} type="button" className="panel-expand" onClick={()=>setLarge(true)} aria-label={`${t('maximizeSection')}: ${title}`}>⤢ {t('maximizeSection')}</button></header><div id={id} className="panel-body" hidden={!open}><Markdown text={body} notes={notes}/></div>{large&&createPortal(<div className="panel-backdrop" onClick={e=>{if(e.target===e.currentTarget)setLarge(false);}}><div ref={dialog} className="panel-dialog" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button onClick={()=>setLarge(false)}>{t('restoreSection')} ×</button></header><div className="prose"><Markdown text={body} notes={notes}/></div></div></div>,document.body)}</section>;
}
/** Panels are delimited by :::panel Title and ::: on their own lines. */
export default function PostMarkdown({children}: {children:string}) {
  const prepared=prepareNotes(children); const notes=prepared.notes;
  const lines=prepared.text.split('\n'); const blocks:React.ReactNode[]=[]; let normal:string[]=[]; let fence='';
  const flush=()=>{if(normal.length){blocks.push(<Markdown key={blocks.length} text={normal.join('\n')} notes={notes}/>);normal=[];}};
  for(let i=0;i<lines.length;i++){
    const code=lines[i].match(/^\s*(`{3,}|~{3,})/);
    if(code){if(!fence)fence=code[1][0];else if(fence===code[1][0])fence='';}
    const match=!fence&&lines[i].match(/^:::panel(-collapsed)?\s+(.+)$/);
    if(match){const end=lines.findIndex((line,index)=>index>i&&line.trim()===':::');if(end>=0){flush();blocks.push(<Panel key={blocks.length} title={match[2]} defaultOpen={!match[1]} notes={notes} body={lines.slice(i+1,end).join('\n')}/>);i=end;continue;}}
    normal.push(lines[i]);
  }
  flush();return <>{blocks}</>;
}
