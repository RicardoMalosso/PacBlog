/** Extract Markdown notes before Markdown parses their paragraphs and parentheses. */
export function prepareNotes(input: string): {text:string; notes:Record<string,string>} {
  const notes:Record<string,string> = {};
  let text=input.replace(/^:::note[ \t]+([\w-]+)[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm,(_,id,body)=>{notes[`#note-${id}`]=body;return '';});
  let output='',i=0,fence='';
  while(i<text.length){
    if(i===0||text[i-1]==='\n'){
      const match=text.slice(i).match(/^[ \t]*(`{3,}|~{3,})[^\n]*(?:\n|$)/);
      if(match){if(!fence)fence=match[1][0];else if(fence===match[1][0])fence='';output+=match[0];i+=match[0].length;continue;}
    }
    if(!fence&&text[i]==='['&&(i===0||text[i-1]!=='\\')){
      const labelEnd=text.indexOf('](#',i+1);
      if(labelEnd>=0&&!text.slice(i,labelEnd).includes('\n')){
        const start=labelEnd+3;
        // Existing #note title links and ordinary anchors retain their normal syntax.
        if(/\s/.test(text[start]||'')){
          let depth=1,j=start;
          for(;j<text.length;j++){
            if(text[j]==='\\'){j++;continue;}
            if(text[j]==='(')depth++;
            if(text[j]===')'){depth--;if(depth===0)break;}
          }
          if(j<text.length){const id=`#note-inline-${Object.keys(notes).length}`;notes[id]=text.slice(start,j).trim();output+=`${text.slice(i,labelEnd+1)}(${id})`;i=j+1;continue;}
        }
      }
    }
    output+=text[i++];
  }
  return {text:output,notes};
}
