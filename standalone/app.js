// Simple chat demo in vanilla JS
// Sample messages with mixed content
const messages = [
  { id: 1, sender: 'them', text: 'Hey there 👋', time: new Date(Date.now() - 1000*60*60*24*2 + 1000*60*3), status: 'read' },
  { id: 2, sender: 'me', text: 'Hi! How are you?', time: new Date(Date.now() - 1000*60*60*24*2 + 1000*60*5), status: 'read' },
  { id: 3, sender: 'them', text: 'Check this out', attachments: [{ type:'image', src:'assets/sample-image.svg' }], time: new Date(Date.now() - 1000*60*60*24 + 1000*60*2), status:'delivered' },
  { id: 4, sender: 'me', text: 'Looks great!', time: new Date(Date.now() - 1000*60*60*24 + 1000*60*4), status:'sent', replyTo:3 },
  { id: 5, sender: 'them', text: 'Here is a file', attachments:[{ type:'file', name:'report.pdf', size:'120KB' }], time:new Date(Date.now() - 1000*60*60*24 + 1000*60*6), status:'read', reactions:[{emoji:'❤️',count:1}] },
  { id: 6, sender: 'me', text: 'Check https://example.com', link:{ title:'Example', description:'Example description', image:'assets/sample-image.svg', url:'https://example.com' }, time:new Date(Date.now() - 1000*60*30), status:'read' },
  { id: 7, sender: 'them', text: 'Nice link!', time:new Date(Date.now() - 1000*60*25), status:'read' },
  { id: 8, sender: 'me', text: 'Another message', time:new Date(Date.now() - 1000*60*5), status:'sent' },
  { id: 9, sender: 'them', text: 'Last one for now', time:new Date(Date.now() - 1000*60*2), status:'sent' }
];

let unreadIndex = 5; // position where unread divider appears
let replyingTo = null;
let editing = null;

// Element refs
const messageList = document.getElementById('messageList');
const sendBtn = document.getElementById('sendBtn');
const composerInput = document.getElementById('composerInput');
const scrollFab = document.getElementById('scrollFab');
const unreadBadge = document.getElementById('unreadBadge');
const typingIndicator = document.getElementById('typingIndicator');
const replyBar = document.getElementById('replyBar');
const connectivity = document.getElementById('connectivity');
const overflowMenu = document.getElementById('overflowMenu');
const menuBtn = document.getElementById('menuBtn');
const actionSheet = document.getElementById('actionSheet');

// Render skeleton first
messageList.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
setTimeout(renderMessages, 600);

function groupByDay(msgs) {
  return msgs.reduce((acc,m)=>{
    const day = formatDay(m.time);
    acc[day] = acc[day] || [];
    acc[day].push(m);
    return acc;
  },{});
}

function formatDay(date){
  const today = new Date();
  const d = new Date(date);
  const diff = today.setHours(0,0,0,0) - d.setHours(0,0,0,0);
  if(diff===0) return 'Today';
  if(diff===86400000) return 'Yesterday';
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function formatTime(date){
  return new Date(date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function renderMessages(){
  messageList.innerHTML = '';
  const groups = groupByDay(messages);
  let index = 0;
  Object.keys(groups).sort((a,b)=> new Date(groups[a][0].time) - new Date(groups[b][0].time)).forEach(day=>{
    const header = document.createElement('div');
    header.className='time-header';
    header.textContent = day;
    messageList.appendChild(header);
    groups[day].forEach((m)=>{
      if(index===unreadIndex){
        const divider=document.createElement('div');
        divider.className='unread-divider';
        divider.innerHTML='<span>New</span>';
        messageList.appendChild(divider);
      }
      const el = buildMessage(m, index);
      messageList.appendChild(el);
      index++;
    });
  });
  const unreadCount = messages.length - unreadIndex;
  unreadBadge.textContent = unreadCount;
  unreadBadge.classList.toggle("hidden", unreadCount <= 0);
  scrollToBottom();
}

function buildMessage(m, index){
  const div=document.createElement('div');
  div.className=`msg ${m.sender}`;
  // tail logic
  const next=messages[index+1];
  if(!next || next.sender!==m.sender) div.classList.add('tail');

  // long press handler
  div.addEventListener('contextmenu',e=>{e.preventDefault();openActionSheet(m);});

  // reply preview
  if(m.replyTo){
    const original=messages.find(x=>x.id===m.replyTo);
    if(original){
      const reply=document.createElement('div');
      reply.className='reply';
      reply.textContent = original.text.slice(0,40);
      div.appendChild(reply);
    }
  }
  // text content
  if(m.text){
    const span=document.createElement('span');
    span.textContent=m.text;
    div.appendChild(span);
  }
  // attachments
  if(m.attachments){
    const cont=document.createElement('div');
    cont.className='attachments';
    m.attachments.forEach(att=>{
      if(att.type==='image'){
        const img=document.createElement('img');
        img.src=att.src; img.alt='';
        img.style.maxWidth='100%';
        img.style.borderRadius='12px';
        img.addEventListener('click',()=>openMediaViewer(att.src));
        cont.appendChild(img);
      } else if(att.type==='file'){
        const card=document.createElement('div');
        card.className='file-card';
        card.innerHTML=`<strong>${att.name}</strong><br><small>${att.size}</small>`;
        cont.appendChild(card);
      }
    });
    div.appendChild(cont);
  }
  // link preview
  if(m.link){
    const a=document.createElement('a');
    a.href=m.link.url; a.target='_blank'; a.className='link-card';
    a.innerHTML=`<img src="${m.link.image}" alt=""/><div><strong>${m.link.title}</strong><p>${m.link.description}</p></div>`;
    div.appendChild(a);
  }
  // meta row
  const meta=document.createElement('div');
  meta.className='meta';
  const time=document.createElement('span');
  time.textContent=formatTime(m.time);
  meta.appendChild(time);
  const state=document.createElement('span');
  state.innerHTML=statusIcon(m.status);
  meta.appendChild(state);
  div.appendChild(meta);

  // reactions
  if(m.reactions){
    const rs=document.createElement('div'); rs.className='reactions';
    m.reactions.forEach(r=>{
      const pill=document.createElement('span'); pill.className='reaction'; pill.textContent=`${r.emoji} ${r.count}`;
      rs.appendChild(pill);
    });
    div.appendChild(rs);
  }
  return div;
}

function statusIcon(state){
  switch(state){
    case 'sending': return '⏱';
    case 'sent': return '✓';
    case 'delivered': return '✓✓';
    case 'read': return '<span style="color:var(--success)">✓✓</span>';
    default: return '';
  }
}

function appendMessage(text){
  if(editing){ editing.text=text; editing=null; replyBar.classList.add('hidden'); renderMessages(); return; }
  const msg={ id:Date.now(), sender:'me', text, time:new Date(), status:'sent' };
  if(replyingTo){ msg.replyTo=replyingTo.id; replyingTo=null; replyBar.classList.add('hidden'); }
  messages.push(msg);
  renderMessages();
}

function scrollToBottom(){
  requestAnimationFrame(()=>{ messageList.scrollTop = messageList.scrollHeight; });
}

// Typing indicator
function setTyping(v){ typingIndicator.classList.toggle('hidden', !v); }
// Connectivity banner
function setConnectivity(v){ connectivity.classList.toggle('hidden', v); }
// Theme toggle
function toggleTheme(){ document.documentElement.classList.toggle('theme-dark'); }
function openMediaViewer(src){ alert('Open media: '+src); }

// Overflow menu toggle
menuBtn.addEventListener('click',()=> overflowMenu.classList.toggle('hidden') );
overflowMenu.addEventListener('click',e=>{
  const action=e.target.dataset.action;
  if(!action) return;
  overflowMenu.classList.add('hidden');
  if(action==='theme') toggleTheme();
});

// Composer logic
composerInput.addEventListener('input',()=>{
  composerInput.style.height='auto';
  composerInput.style.height=Math.min(composerInput.scrollHeight,120)+"px";
  sendBtn.disabled=!composerInput.value.trim();
});

sendBtn.addEventListener('click',()=>{
  const text=composerInput.value.trim();
  if(!text) return;
  appendMessage(text);
  composerInput.value='';
  composerInput.dispatchEvent(new Event('input'));
});

// Scroll fab visibility
messageList.addEventListener('scroll',()=>{
  const nearBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 50;
  scrollFab.classList.toggle('hidden', nearBottom);
});
scrollFab.addEventListener('click',scrollToBottom);

// Action sheet for message
function openActionSheet(msg){
  actionSheet.classList.remove('hidden');
  actionSheet.onclick=(e)=>{
    if(e.target.dataset.action==='reply'){
      replyingTo=msg; replyBar.textContent='Replying to: '+msg.text; replyBar.classList.remove('hidden');
    } else if(e.target.dataset.action==='edit'){
      editing=msg; composerInput.value=msg.text; composerInput.focus(); sendBtn.disabled=false; replyBar.textContent='Editing message'; replyBar.classList.remove('hidden');
    } else if(e.target.dataset.action==='copy'){
      navigator.clipboard?.writeText(msg.text||'');
    } else if(e.target.dataset.action==='delete'){
      const idx=messages.indexOf(msg); if(idx>-1){ messages.splice(idx,1); renderMessages(); }
    } else if(e.target.dataset.action==='react'){
      msg.reactions = msg.reactions || []; msg.reactions.push({emoji:'👍',count:1}); renderMessages();
    }
    actionSheet.classList.add('hidden');
  };
  actionSheet.querySelector('.sheet-backdrop').onclick=()=> actionSheet.classList.add('hidden');
}

// Reply bar cancel
replyBar.addEventListener('click',()=>{ replyingTo=null; editing=null; replyBar.classList.add('hidden'); });

// Typing & connectivity demo toggles
window.setTyping = setTyping;
window.setConnectivity = setConnectivity;
window.toggleTheme = toggleTheme;

