import { useState, useRef } from "react";

// ─── LESSON DATA ─────────────────────────────────────────────────────────────
const lessons = [
  { id: 10, title: "Essere & Avere: To Be & To Have", language: "Italian", flag: "🇮🇹", color: "#8b1a1a", accent: "#e05c5c",
    grammar: {
      rule: "Italian has two verbs for 'to be/have'. 'Essere' describes identity, origin, and permanent traits. 'Avere' expresses possession. Both are irregular and must be memorised.",
      structure: "essere: sono / sei / è / siamo / siete / sono  |  avere: ho / hai / ha / abbiamo / avete / hanno",
      examples: [
        { native: "Io sono italiano.", english: "I am Italian.", breakdown: ["Io = I", "sono = am (essere)", "italiano = Italian"] },
        { native: "Lei è medica.", english: "She is a doctor.", breakdown: ["Lei = she", "è = is (essere)", "medica = doctor (f.)"] },
        { native: "Noi abbiamo un cane.", english: "We have a dog.", breakdown: ["Noi = we", "abbiamo = have (avere)", "un cane = a dog"] },
      ],
      tip: "💡 You can DROP the subject pronoun in Italian — 'sono stanco' means 'I am tired' because the verb ending tells you who it is (pro-drop language).",
    },
    exercises: [
      { type: "translate", prompt: "Translate to Italian: 'She has a car.'", hint: "car = macchina", options: ["Lei è una macchina.", "Lei ha una macchina.", "Lei avere una macchina.", "Ha lei una macchina."], correct: 1, explanation: "'Avere' is used for possession. 'Ha' is 3rd person singular of avere." },
      { type: "fill", prompt: "Fill in: 'Marco ___ di Roma.' (Marco is from Rome.)", hint: "origin uses essere", options: ["ha", "è", "sei", "sono"], correct: 1, explanation: "Origin uses 'essere'. 3rd person singular = è." },
      { type: "identify", prompt: "Which sentence correctly says 'We are tired'?", hint: "tired = stanchi (plural)", options: ["Abbiamo stanchi.", "Siamo stanchi.", "Sono stanchi noi.", "Essere stanchi."], correct: 1, explanation: "'Siamo' is 1st person plural of essere." },
    ]
  },
  { id: 11, title: "Noun Gender & Articles", language: "Italian", flag: "🇮🇹", color: "#1a4a1a", accent: "#5cb85c",
    grammar: {
      rule: "Every Italian noun is masculine or feminine. The article must match the gender. Masculine nouns usually end in -o, feminine in -a. Articles also change before vowels.",
      structure: "Masc: il / i (pl.)  |  Fem: la / le (pl.)  |  Before vowels: l' (sing.) / gli or le (pl.)",
      examples: [
        { native: "il libro / i libri", english: "the book / the books", breakdown: ["il = the (masc.)", "libro = book", "i = the (masc. pl.)", "libri = books"] },
        { native: "la casa / le case", english: "the house / the houses", breakdown: ["la = the (fem.)", "casa = house", "le = the (fem. pl.)"] },
        { native: "l'amico / gli amici", english: "the friend / the friends", breakdown: ["l' = the (before vowel)", "amico = friend (m.)", "gli = the (masc. pl. before vowel)"] },
      ],
      tip: "💡 Quick rule: -o ending = masculine (il libro), -a ending = feminine (la casa). Nouns ending in -e can be either — learn them!",
    },
    exercises: [
      { type: "identify", prompt: "Choose the correct article for 'pizza' (feminine):", hint: "pizza ends in -a", options: ["il pizza", "la pizza", "lo pizza", "le pizza"], correct: 1, explanation: "'Pizza' is feminine singular → 'la'." },
      { type: "translate", prompt: "How do you say 'the books' (plural of il libro)?", hint: "masculine plural article", options: ["il libri", "i libri", "le libri", "gli libri"], correct: 1, explanation: "Masculine plural: il → i, libro → libri." },
      { type: "fill", prompt: "Fill in: '___ amico è simpatico.' (The friend is nice.)", hint: "amico starts with a vowel!", options: ["Il", "Lo", "L'", "La"], correct: 2, explanation: "Before a vowel, 'il'/'la' become 'l''." },
    ]
  },
  { id: 1, title: "Verb 'To Be': Tá", language: "Irish", flag: "🇮🇪", color: "#2d6a4f", accent: "#52b788",
    grammar: {
      rule: "The verb 'tá' means 'is/am/are' — used for states, conditions, and locations. Unlike English, Irish puts the verb FIRST.",
      structure: "Tá + [subject] + [complement]",
      examples: [
        { native: "Tá mé go maith.", english: "I am well.", breakdown: ["Tá = am", "mé = I", "go maith = well"] },
        { native: "Tá sí ina cónaí in Éirinn.", english: "She lives in Ireland.", breakdown: ["Tá = is", "sí = she", "ina cónaí = living", "in Éirinn = in Ireland"] },
        { native: "Tá an aimsir go hiontach.", english: "The weather is wonderful.", breakdown: ["Tá = is", "an aimsir = the weather", "go hiontach = wonderful"] },
      ],
      tip: "💡 Irish word order is VSO (Verb-Subject-Object) — the verb always comes first!",
    },
    exercises: [
      { type: "translate", prompt: "Translate to Irish: 'I am tired.'", hint: "tired = tuirseach", options: ["Tá mé tuirseach.", "Mé tá tuirseach.", "Tuirseach tá mé.", "Tá tuirseach mé."], correct: 0, explanation: "Verb first! Tá (am) before mé (I)." },
      { type: "fill", prompt: "Fill in: '___ sé go maith.' (He is well.)", options: ["Tá", "Is", "Bí", "An"], correct: 0, explanation: "'Tá' for current states. 'Sé' = he." },
      { type: "identify", prompt: "Which sentence correctly says 'The cat is black'?", hint: "cat = an cat, black = dubh", options: ["An cat tá dubh.", "Tá an cat dubh.", "Dubh tá an cat.", "Tá dubh an cat."], correct: 1, explanation: "Verb (Tá) → Subject (an cat) → Complement (dubh)." },
    ]
  },
  { id: 2, title: "Definite Article: An", language: "Irish", flag: "🇮🇪", color: "#1a3a5c", accent: "#4a9eca",
    grammar: {
      rule: "Irish has only ONE definite article: 'an' (the). There is NO indefinite article — 'cat' means either 'a cat' or just 'cat'.",
      structure: "an + [noun] — 'an' causes lenition (mutations) on some consonants",
      examples: [
        { native: "an cat", english: "the cat", breakdown: ["an = the", "cat = cat"] },
        { native: "an bhean", english: "the woman", breakdown: ["an = the", "bhean = woman (lenited from 'bean')"] },
        { native: "an fear", english: "the man", breakdown: ["an = the", "fear = man (no change — masculine)"] },
      ],
      tip: "💡 After 'an', feminine nouns get lenition (add 'h' after first consonant): bean → an bhean.",
    },
    exercises: [
      { type: "translate", prompt: "How do you say 'the dog' in Irish?", hint: "dog = madra (masculine)", options: ["an madra", "an mhadra", "madra an", "na madra"], correct: 0, explanation: "'Madra' is masculine — no lenition in nominative case." },
      { type: "identify", prompt: "Which is correct for 'the woman'?", hint: "bean (woman) is feminine", options: ["an bean", "an bhean", "na bean", "an bhhean"], correct: 1, explanation: "Feminine nouns are lenited after 'an': b → bh." },
      { type: "fill", prompt: "How do you say just 'a cat' in Irish?", options: ["an cat", "cat", "aon cat", "na cat"], correct: 1, explanation: "No indefinite article in Irish — just the bare noun." },
    ]
  },
];

// ─── GAMIFICATION ─────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, name: "Beginner",  minXP: 0,   color: "#8899aa" },
  { level: 2, name: "Learner",   minXP: 50,  color: "#5cb85c" },
  { level: 3, name: "Student",   minXP: 120, color: "#4a9eca" },
  { level: 4, name: "Scholar",   minXP: 250, color: "#c97c2a" },
  { level: 5, name: "Linguist",  minXP: 450, color: "#a855f7" },
  { level: 6, name: "Master",    minXP: 700, color: "#e05c5c" },
];
const BADGES = [
  { id: "first_lesson",  icon: "🎯", name: "First Step",    desc: "Complete your first lesson",                 check: u => u.completedLessons.length >= 1 },
  { id: "perfect",       icon: "✨", name: "Perfectionist", desc: "Get 100% on any lesson",                     check: u => (u.perfectLessons||0) >= 1 },
  { id: "streak3",       icon: "🔥", name: "On Fire",       desc: "Maintain a 3-day streak",                    check: u => u.streak >= 3 },
  { id: "bilingual",     icon: "🌍", name: "Bilingual",     desc: "Complete lessons in both languages",         check: u => { const s=new Set(u.completedLessons.map(id=>lessons.find(l=>l.id===id)?.language)); return s.size>=2; } },
  { id: "xp100",         icon: "💎", name: "Century",       desc: "Earn 100 XP",                                check: u => u.xp >= 100 },
  { id: "all_italian",   icon: "🍕", name: "Italiano",      desc: "Complete all Italian lessons",               check: u => lessons.filter(l=>l.language==="Italian").every(l=>u.completedLessons.includes(l.id)) },
  { id: "all_irish",     icon: "☘️", name: "Gaeilge",       desc: "Complete all Irish lessons",                 check: u => lessons.filter(l=>l.language==="Irish").every(l=>u.completedLessons.includes(l.id)) },
  { id: "dedicated",     icon: "🏅", name: "Dedicated",     desc: "Complete 4 lessons total",                   check: u => u.completedLessons.length >= 4 },
];
const getLevel    = xp => [...LEVELS].reverse().find(l => xp >= l.minXP) || LEVELS[0];
const getNextLvl  = xp => LEVELS.find(l => l.minXP > xp) || null;

// ─── MOCK USER DB ─────────────────────────────────────────────────────────────
const SEED_USERS = {
  demo:  { username:"demo",  password:"demo123", xp:80,  streak:2, completedLessons:[10], perfectLessons:1, badges:["first_lesson","perfect"], lastActive:new Date().toDateString(), joinDate:"2026-01-15" },
  anna:  { username:"anna",  password:"anna123", xp:210, streak:5, completedLessons:[10,11,1], perfectLessons:2, badges:["first_lesson","perfect","xp100","streak3"], lastActive:"2026-03-04", joinDate:"2026-01-10" },
  marco: { username:"marco", password:"marco123",xp:145, streak:1, completedLessons:[10,11],  perfectLessons:0, badges:["first_lesson","all_italian"], lastActive:"2026-03-01", joinDate:"2026-02-01" },
};

// ─── TINY COMPONENTS ─────────────────────────────────────────────────────────
const XPBar = ({ val, max, color="#52b788" }) => (
  <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:8, height:8, overflow:"hidden", width:"100%" }}>
    <div style={{ height:"100%", width:`${Math.min((val/max)*100,100)}%`, background:`linear-gradient(90deg,${color}99,${color})`, borderRadius:8, transition:"width 0.6s ease" }} />
  </div>
);

const Toast = ({ msg, type }) => (
  <div style={{
    position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)",
    background: type==="badge" ? "linear-gradient(135deg,#7c3aed,#a855f7)" : type==="levelup" ? "linear-gradient(135deg,#b45309,#f0a050)" : "rgba(20,28,38,0.97)",
    border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, padding:"14px 26px",
    color:"#fff", fontSize:15, fontWeight:500, zIndex:999, whiteSpace:"nowrap",
    boxShadow:"0 8px 32px rgba(0,0,0,0.6)", animation:"slideUp 0.3s ease"
  }}>{msg}</div>
);

const GrammarCard = ({ ex }) => (
  <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"16px 20px", marginBottom:12 }}>
    <div style={{ fontSize:18, fontFamily:"'Playfair Display',serif", color:"#e8f4ea", marginBottom:4 }}>{ex.native}</div>
    <div style={{ fontSize:14, color:"#aab8c2", marginBottom:10 }}>{ex.english}</div>
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {ex.breakdown.map((b,i)=>(
        <span key={i} style={{ background:"rgba(82,183,136,0.15)", color:"#95d5b2", border:"1px solid rgba(82,183,136,0.3)", borderRadius:6, padding:"2px 10px", fontSize:12 }}>{b}</span>
      ))}
    </div>
  </div>
);

const ExerciseView = ({ exercise, onAnswer, answered, selectedIdx }) => {
  const ok = selectedIdx === exercise.correct;
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"inline-block", background:"rgba(82,183,136,0.15)", color:"#95d5b2", fontSize:12, padding:"3px 12px", borderRadius:20, marginBottom:12 }}>
          {exercise.type==="translate"?"✍️ Translate":exercise.type==="fill"?"🔤 Fill the blank":"🔍 Identify"}
        </div>
        <div style={{ fontSize:20, color:"#e8f4ea", fontFamily:"'Playfair Display',serif", lineHeight:1.4, marginBottom:8 }}>{exercise.prompt}</div>
        {exercise.hint&&<div style={{ fontSize:13, color:"#7a9aaa", fontStyle:"italic" }}>Hint: {exercise.hint}</div>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {exercise.options.map((opt,i)=>{
          let bg="rgba(255,255,255,0.04)",border="1px solid rgba(255,255,255,0.1)",color="#cdd6dd";
          if(answered){
            if(i===exercise.correct){bg="rgba(82,183,136,0.2)";border="1px solid #52b788";color="#b7e4c7";}
            else if(i===selectedIdx){bg="rgba(220,80,80,0.2)";border="1px solid #e07070";color="#ffb3b3";}
          }
          return(
            <button key={i} onClick={()=>!answered&&onAnswer(i)} style={{ background:bg,border,borderRadius:10,padding:"14px 16px",color,fontSize:15,cursor:answered?"default":"pointer",textAlign:"left",fontFamily:"'Playfair Display',serif",transition:"all 0.2s",lineHeight:1.3 }}>
              <span style={{ opacity:0.5,marginRight:8,fontSize:12 }}>{String.fromCharCode(65+i)}.</span>{opt}
            </button>
          );
        })}
      </div>
      {answered&&(
        <div style={{ background:ok?"rgba(82,183,136,0.15)":"rgba(220,80,80,0.15)", border:`1px solid ${ok?"#52b788":"#e07070"}`, borderRadius:12, padding:"14px 18px" }}>
          <div style={{ fontWeight:600, color:ok?"#95d5b2":"#ffb3b3", marginBottom:4 }}>{ok?"✓ Correct!":"✗ Not quite"}</div>
          <div style={{ color:"#aab8c2", fontSize:14 }}>{exercise.explanation}</div>
        </div>
      )}
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [users,      setUsers]      = useState(SEED_USERS);
  const [me,         setMe]         = useState(null);   // username string
  const [authTab,    setAuthTab]    = useState("login");
  const [form,       setForm]       = useState({ username:"", password:"", confirm:"" });
  const [authErr,    setAuthErr]    = useState("");

  const [screen,     setScreen]     = useState("home");
  const [activeLang, setActiveLang] = useState("Italian");
  const [lesson,     setLesson]     = useState(null);
  const [phase,      setPhase]      = useState("grammar");
  const [exIdx,      setExIdx]      = useState(0);
  const [answered,   setAnswered]   = useState(false);
  const [selOpt,     setSelOpt]     = useState(null);
  const [sesScore,   setSesScore]   = useState(0);
  const [toast,      setToast]      = useState(null);
  const toastRef = useRef(null);

  const u = me ? users[me] : null;

  const showToast = (msg, type="info") => {
    setToast({ msg, type });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3200);
  };

  // ── AUTH ────────────────────────────────────────────────────────────────────
  const doLogin = () => {
    const { username, password } = form;
    if (!username||!password) { setAuthErr("Please fill in all fields."); return; }
    const user = users[username.toLowerCase()];
    if (!user||user.password!==password) { setAuthErr("Incorrect username or password."); return; }
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now()-86400000).toDateString();
    if (user.lastActive !== today) {
      const streak = user.lastActive===yesterday ? user.streak+1 : 1;
      setUsers(p=>({...p,[username.toLowerCase()]:{...user,streak,lastActive:today}}));
    }
    setMe(username.toLowerCase());
    setAuthErr(""); setForm({username:"",password:"",confirm:""});
  };

  const doRegister = () => {
    const { username, password, confirm } = form;
    if (!username||!password||!confirm) { setAuthErr("Please fill in all fields."); return; }
    if (username.length<3) { setAuthErr("Username must be at least 3 characters."); return; }
    if (password.length<5) { setAuthErr("Password must be at least 5 characters."); return; }
    if (password!==confirm) { setAuthErr("Passwords do not match."); return; }
    if (users[username.toLowerCase()]) { setAuthErr("Username already taken."); return; }
    const newUser = { username:username.toLowerCase(), password, xp:0, streak:1, completedLessons:[], perfectLessons:0, badges:[], lastActive:new Date().toDateString(), joinDate:new Date().toISOString().slice(0,10) };
    setUsers(p=>({...p,[username.toLowerCase()]:newUser}));
    setMe(username.toLowerCase());
    setAuthErr(""); setForm({username:"",password:"",confirm:""});
  };

  // ── LESSON FLOW ─────────────────────────────────────────────────────────────
  const startLesson = l => {
    setLesson(l); setPhase("grammar"); setExIdx(0);
    setAnswered(false); setSelOpt(null); setSesScore(0);
    setScreen("lesson");
  };

  const handleAnswer = idx => {
    setSelOpt(idx); setAnswered(true);
    if (idx===lesson.exercises[exIdx].correct) setSesScore(s=>s+1);
  };

  const nextExercise = () => {
    const isLast = exIdx+1 >= lesson.exercises.length;
    if (!isLast) { setExIdx(i=>i+1); setAnswered(false); setSelOpt(null); }
    else {
      const correct = sesScore + (selOpt===lesson.exercises[exIdx].correct?1:0);
      const isPerfect = correct===lesson.exercises.length;
      const xpGain = correct*10 + (isPerfect?20:0);
      setUsers(p => {
        const user = {...p[me]};
        const prevLvl = getLevel(user.xp);
        user.xp += xpGain;
        if (!user.completedLessons.includes(lesson.id)) user.completedLessons=[...user.completedLessons,lesson.id];
        if (isPerfect) user.perfectLessons=(user.perfectLessons||0)+1;
        const newBadges = BADGES.filter(b=>!user.badges.includes(b.id)&&b.check(user)).map(b=>b.id);
        user.badges=[...user.badges,...newBadges];
        if (newBadges.length) {
          const bd=BADGES.find(b=>b.id===newBadges[0]);
          setTimeout(()=>showToast(`${bd.icon} Badge unlocked: ${bd.name}!`,"badge"),1200);
        }
        if (getLevel(user.xp).level > prevLvl.level)
          setTimeout(()=>showToast(`🎉 Level up! You are now ${getLevel(user.xp).name}`,"levelup"),800);
        return {...p,[me]:user};
      });
      setScreen("complete");
    }
  };

  const finalScore = answered ? sesScore+(selOpt===lesson?.exercises[exIdx]?.correct?1:0) : sesScore;
  const langs = [{name:"Italian",flag:"🇮🇹",color:"#e05c5c"},{name:"Irish",flag:"🇮🇪",color:"#52b788"}];
  const board = Object.values(users).sort((a,b)=>b.xp-a.xp).slice(0,10);

  const inp = (key,type,ph) => (
    <input type={type} placeholder={ph} value={form[key]}
      onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
      onKeyDown={e=>e.key==="Enter"&&(authTab==="login"?doLogin():doRegister())}
      style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 16px", color:"#e8f4ea", fontSize:15 }}
    />
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0d0d1a", fontFamily:"'DM Sans',system-ui,sans-serif", color:"#cdd6dd" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input{outline:none;}
        button{transition:all 0.18s;}
        button:hover{filter:brightness(1.13);}
        @keyframes slideUp{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes pop{0%{transform:scale(0.7);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ═══════════════ AUTH ═══════════════ */}
      {!me && (
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ width:"100%", maxWidth:400 }}>
            <div style={{ textAlign:"center", marginBottom:36 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📖</div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, color:"#e8f4ea", fontWeight:400, marginBottom:6 }}>GrammarFirst</h1>
              <p style={{ color:"#556672", fontSize:14 }}>Learn languages the right way</p>
            </div>

            <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:12, padding:4, marginBottom:24 }}>
              {["login","register"].map(tab=>(
                <button key={tab} onClick={()=>{setAuthTab(tab);setAuthErr("");}} style={{
                  flex:1, padding:"10px", borderRadius:9, border:"none", cursor:"pointer",
                  background:authTab===tab?"rgba(255,255,255,0.08)":"transparent",
                  color:authTab===tab?"#e8f4ea":"#556672", fontWeight:authTab===tab?600:400, fontSize:14
                }}>{tab==="login"?"Log In":"Register"}</button>
              ))}
            </div>

            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"28px 24px" }}>
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:12, color:"#7a9aaa", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:7 }}>Username</label>
                {inp("username","text","your_username")}
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:12, color:"#7a9aaa", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:7 }}>Password</label>
                {inp("password","password","••••••••")}
              </div>
              {authTab==="register" && (
                <div style={{ marginBottom:18 }}>
                  <label style={{ fontSize:12, color:"#7a9aaa", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:7 }}>Confirm Password</label>
                  {inp("confirm","password","••••••••")}
                </div>
              )}
              {authErr && (
                <div style={{ background:"rgba(220,80,80,0.15)", border:"1px solid rgba(220,80,80,0.3)", borderRadius:8, padding:"10px 14px", color:"#ffb3b3", fontSize:13, marginBottom:16 }}>{authErr}</div>
              )}
              <button onClick={authTab==="login"?doLogin:doRegister} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#2d6a4f,#52b788)", border:"none", borderRadius:12, color:"#fff", fontSize:16, fontWeight:600, cursor:"pointer" }}>
                {authTab==="login"?"Log In →":"Create Account →"}
              </button>
              {authTab==="login" && (
                <div style={{ textAlign:"center", marginTop:14, color:"#3a4a56", fontSize:12 }}>
                  Demo: <strong style={{color:"#52b788"}}>demo</strong> / <strong style={{color:"#52b788"}}>demo123</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ APP ═══════════════ */}
      {me && u && (
        <>
          {/* NAV */}
          <div style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ maxWidth:640, margin:"0 auto", display:"flex", alignItems:"center", gap:4, height:52, padding:"0 16px" }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"#e8f4ea", marginRight:"auto" }}>📖 GrammarFirst</span>
              {[{id:"home",label:"Learn"},{id:"leaderboard",label:"🏆"},{id:"profile",label:"👤"}].map(t=>(
                <button key={t.id} onClick={()=>setScreen(t.id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, background:screen===t.id?"rgba(82,183,136,0.15)":"transparent", color:screen===t.id?"#95d5b2":"#556672", fontWeight:screen===t.id?600:400 }}>{t.label}</button>
              ))}
              <button onClick={()=>{setMe(null);setScreen("home");}} style={{ padding:"5px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer", fontSize:12, background:"transparent", color:"#3a4a56", marginLeft:4 }}>Out</button>
            </div>
          </div>

          {/* ─── HOME ─── */}
          {screen==="home" && (
            <div style={{ maxWidth:560, margin:"0 auto", padding:"28px 20px" }}>
              {/* User card */}
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"18px 20px", marginBottom:24 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:42, height:42, borderRadius:"50%", background:`${getLevel(u.xp).color}22`, border:`2px solid ${getLevel(u.xp).color}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:getLevel(u.xp).color, fontSize:17 }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontWeight:600, color:"#e8f4ea" }}>{u.username}</span>
                      <div style={{ display:"flex", gap:12 }}>
                        <span style={{ fontSize:13, color:"#f0d080" }}>🔥 {u.streak}d</span>
                        <span style={{ fontSize:13, color:getLevel(u.xp).color }}>⭐ {u.xp} XP</span>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:getLevel(u.xp).color, marginTop:2 }}>{getLevel(u.xp).name} · Level {getLevel(u.xp).level}</div>
                  </div>
                </div>
                <XPBar val={u.xp-getLevel(u.xp).minXP} max={(getNextLvl(u.xp)?.minXP||u.xp+1)-getLevel(u.xp).minXP} color={getLevel(u.xp).color} />
                <div style={{ fontSize:11, color:"#3a4a56", marginTop:5 }}>
                  {getNextLvl(u.xp) ? `${getNextLvl(u.xp).minXP-u.xp} XP to ${getNextLvl(u.xp).name}` : "🏆 Max level!"}
                </div>
              </div>

              {/* Lang tabs */}
              <div style={{ display:"flex", gap:8, marginBottom:22 }}>
                {langs.map(l=>(
                  <button key={l.name} onClick={()=>setActiveLang(l.name)} style={{ flex:1, padding:"10px", borderRadius:12, cursor:"pointer", border:activeLang===l.name?`1px solid ${l.color}`:"1px solid rgba(255,255,255,0.08)", background:activeLang===l.name?`${l.color}22`:"rgba(255,255,255,0.03)", color:activeLang===l.name?l.color:"#7a9aaa", fontSize:14, fontWeight:activeLang===l.name?600:400 }}>
                    {l.flag} {l.name}
                  </button>
                ))}
              </div>

              <div style={{ fontSize:12, letterSpacing:3, color:"#556672", textTransform:"uppercase", marginBottom:14 }}>{activeLang} Lessons</div>
              {lessons.filter(l=>l.language===activeLang).map((l,i)=>{
                const done = u.completedLessons.includes(l.id);
                return (
                  <div key={l.id} onClick={()=>startLesson(l)} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"18px 20px", marginBottom:12, cursor:"pointer", position:"relative", overflow:"hidden" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                    onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                  >
                    <div style={{ position:"absolute", top:0, left:0, width:4, height:"100%", background:`linear-gradient(180deg,${l.color},${l.accent})` }} />
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingLeft:8 }}>
                      <div>
                        <div style={{ fontSize:12, color:"#556672", marginBottom:3 }}>{l.flag} {l.language} · Lesson {i+1}</div>
                        <div style={{ fontSize:17, fontFamily:"'Playfair Display',serif", color:"#e8f4ea" }}>{l.title}</div>
                        <div style={{ fontSize:12, color:"#7a9aaa", marginTop:4 }}>{l.exercises.length} exercises · up to +{l.exercises.length*10+20} XP</div>
                      </div>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:done?"rgba(82,183,136,0.2)":"rgba(255,255,255,0.05)", border:done?"1px solid #52b788":"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                        {done?"✓":"→"}
                      </div>
                    </div>
                  </div>
                );
              })}

              {u.badges.length>0 && (
                <div style={{ marginTop:24 }}>
                  <div style={{ fontSize:12, letterSpacing:3, color:"#556672", textTransform:"uppercase", marginBottom:12 }}>Your Badges</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {u.badges.map(bid=>{const b=BADGES.find(x=>x.id===bid);return b?(<div key={bid} title={b.desc} style={{ background:"rgba(168,85,247,0.12)", border:"1px solid rgba(168,85,247,0.3)", borderRadius:10, padding:"7px 14px", fontSize:13, color:"#c084fc" }}>{b.icon} {b.name}</div>):null;})}
                  </div>
                </div>
              )}
              <div style={{ textAlign:"center", marginTop:32, padding:"20px", borderTop:"1px solid rgba(255,255,255,0.05)", color:"#3a4a56", fontSize:13 }}>More languages coming soon — Welsh, Scots Gaelic, Spanish…</div>
            </div>
          )}

          {/* ─── LEADERBOARD ─── */}
          {screen==="leaderboard" && (
            <div style={{ maxWidth:520, margin:"0 auto", padding:"28px 20px" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#e8f4ea", fontWeight:400, marginBottom:4 }}>Leaderboard</h2>
              <div style={{ fontSize:13, color:"#556672", marginBottom:24 }}>Top learners by XP</div>
              {board.map((lu,i)=>{
                const isMe=lu.username===me;
                const lv=getLevel(lu.xp);
                return(
                  <div key={lu.username} style={{ display:"flex", alignItems:"center", gap:14, background:isMe?"rgba(82,183,136,0.08)":"rgba(255,255,255,0.03)", border:isMe?"1px solid rgba(82,183,136,0.3)":"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 18px", marginBottom:10 }}>
                    <div style={{ fontSize:i<3?22:14, width:32, textAlign:"center", color:i===0?"#f0d080":i===1?"#aab8c2":i===2?"#c97c2a":"#3a4a56", fontWeight:700 }}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                    </div>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:`${lv.color}22`, border:`2px solid ${lv.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:lv.color, fontSize:15 }}>
                      {lu.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ color:isMe?"#95d5b2":"#e8f4ea", fontWeight:isMe?600:400 }}>{lu.username}{isMe?" (you)":""}</div>
                      <div style={{ fontSize:12, color:lv.color }}>{lv.name}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ color:"#f0d080", fontWeight:600 }}>{lu.xp} XP</div>
                      <div style={{ fontSize:11, color:"#3a4a56" }}>🔥 {lu.streak}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── PROFILE ─── */}
          {screen==="profile" && (
            <div style={{ maxWidth:520, margin:"0 auto", padding:"28px 20px" }}>
              <div style={{ textAlign:"center", marginBottom:28 }}>
                <div style={{ width:80, height:80, borderRadius:"50%", background:`${getLevel(u.xp).color}22`, border:`3px solid ${getLevel(u.xp).color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:700, color:getLevel(u.xp).color, margin:"0 auto 14px" }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div style={{ fontSize:22, fontFamily:"'Playfair Display',serif", color:"#e8f4ea", marginBottom:4 }}>{u.username}</div>
                <div style={{ fontSize:14, color:getLevel(u.xp).color, marginBottom:4 }}>{getLevel(u.xp).name} · Level {getLevel(u.xp).level}</div>
                <div style={{ fontSize:12, color:"#3a4a56" }}>Member since {u.joinDate}</div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:24 }}>
                {[{icon:"⭐",label:"Total XP",value:u.xp},{icon:"🔥",label:"Streak",value:`${u.streak}d`},{icon:"📚",label:"Lessons",value:u.completedLessons.length},{icon:"✨",label:"Perfect",value:u.perfectLessons||0},{icon:"🏅",label:"Badges",value:u.badges.length},{icon:"🎯",label:"Level",value:getLevel(u.xp).level}].map((s,i)=>(
                  <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:22 }}>{s.icon}</div>
                    <div style={{ fontSize:22, fontFamily:"'Playfair Display',serif", color:"#e8f4ea", marginTop:4 }}>{s.value}</div>
                    <div style={{ fontSize:11, color:"#3a4a56", marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"18px 20px", marginBottom:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:13, color:"#7a9aaa" }}>Level Progress</span>
                  <span style={{ fontSize:13, color:getLevel(u.xp).color, fontWeight:600 }}>{getLevel(u.xp).name} → {getNextLvl(u.xp)?.name||"MAX"}</span>
                </div>
                <XPBar val={u.xp-getLevel(u.xp).minXP} max={(getNextLvl(u.xp)?.minXP||u.xp+1)-getLevel(u.xp).minXP} color={getLevel(u.xp).color} />
                {getNextLvl(u.xp)&&<div style={{ fontSize:12, color:"#3a4a56", marginTop:6 }}>{getNextLvl(u.xp).minXP-u.xp} XP to next level</div>}
              </div>

              <div style={{ fontSize:12, letterSpacing:3, color:"#556672", textTransform:"uppercase", marginBottom:14 }}>All Badges</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {BADGES.map(b=>{const earned=u.badges.includes(b.id);return(
                  <div key={b.id} style={{ background:earned?"rgba(168,85,247,0.1)":"rgba(255,255,255,0.02)", border:earned?"1px solid rgba(168,85,247,0.3)":"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px", opacity:earned?1:0.4 }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{b.icon}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:earned?"#c084fc":"#556672" }}>{b.name}</div>
                    <div style={{ fontSize:11, color:"#3a4a56", marginTop:2 }}>{b.desc}</div>
                  </div>
                );})}
              </div>
            </div>
          )}

          {/* ─── LESSON ─── */}
          {screen==="lesson" && lesson && (
            <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
                <button onClick={()=>setScreen("home")} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 14px", color:"#7a9aaa", fontSize:13, cursor:"pointer" }}>← Back</button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#556672", marginBottom:3 }}>{phase==="grammar"?"GRAMMAR RULE":`EXERCISE ${exIdx+1} / ${lesson.exercises.length}`}</div>
                  <XPBar val={phase==="grammar"?0:(exIdx/lesson.exercises.length)*100} max={100} color={lesson.accent} />
                </div>
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#e8f4ea", marginBottom:6, fontWeight:400 }}>{lesson.title}</h2>
              <div style={{ fontSize:13, color:"#556672", marginBottom:24 }}>{lesson.flag} {lesson.language} · Grammar-first method</div>

              {phase==="grammar" && (
                <div>
                  <div style={{ background:`linear-gradient(135deg,${lesson.color}22,${lesson.accent}11)`, border:`1px solid ${lesson.accent}33`, borderRadius:16, padding:"20px 22px", marginBottom:20 }}>
                    <div style={{ fontSize:12, letterSpacing:3, color:lesson.accent, textTransform:"uppercase", marginBottom:10 }}>The Rule</div>
                    <p style={{ fontSize:16, color:"#dde8ee", lineHeight:1.7, marginBottom:12 }}>{lesson.grammar.rule}</p>
                    <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:10, padding:"10px 16px", fontFamily:"monospace", fontSize:14, color:lesson.accent }}>{lesson.grammar.structure}</div>
                  </div>
                  <div style={{ fontSize:12, letterSpacing:3, color:"#556672", textTransform:"uppercase", marginBottom:12 }}>Examples</div>
                  {lesson.grammar.examples.map((ex,i)=><GrammarCard key={i} ex={ex} />)}
                  <div style={{ background:"rgba(255,200,100,0.08)", border:"1px solid rgba(255,200,100,0.2)", borderRadius:12, padding:"14px 18px", marginBottom:28, color:"#f0d080", fontSize:14 }}>{lesson.grammar.tip}</div>
                  <button onClick={()=>setPhase("exercises")} style={{ width:"100%", padding:"16px", background:`linear-gradient(135deg,${lesson.color},${lesson.accent})`, border:"none", borderRadius:14, color:"#fff", fontSize:16, fontWeight:600, cursor:"pointer" }}>
                    Start Exercises →
                  </button>
                </div>
              )}

              {phase==="exercises" && (
                <div>
                  <ExerciseView exercise={lesson.exercises[exIdx]} onAnswer={handleAnswer} answered={answered} selectedIdx={selOpt} />
                  {answered && (
                    <button onClick={nextExercise} style={{ width:"100%", marginTop:20, padding:"15px", background:`linear-gradient(135deg,${lesson.color},${lesson.accent})`, border:"none", borderRadius:14, color:"#fff", fontSize:16, fontWeight:600, cursor:"pointer" }}>
                      {exIdx+1<lesson.exercises.length?"Next Exercise →":"Finish Lesson ✓"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── COMPLETE ─── */}
          {screen==="complete" && lesson && (
            <div style={{ maxWidth:480, margin:"0 auto", padding:"50px 20px", textAlign:"center" }}>
              <div style={{ fontSize:64, marginBottom:16, animation:"pop 0.5s ease" }}>
                {finalScore===lesson.exercises.length?"🏆":finalScore>=lesson.exercises.length/2?"⭐":"📚"}
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:"#e8f4ea", fontWeight:400, marginBottom:8 }}>
                {finalScore===lesson.exercises.length?"Perfect!":"Lesson Complete!"}
              </h2>
              <div style={{ color:"#7a9aaa", fontSize:16, marginBottom:28 }}>{finalScore} / {lesson.exercises.length} correct</div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:28 }}>
                {[
                  {label:"Score",value:`${Math.round((finalScore/lesson.exercises.length)*100)}%`},
                  {label:"XP Earned",value:`+${finalScore*10+(finalScore===lesson.exercises.length?20:0)}`},
                  {label:"Streak",value:`🔥 ${u.streak}d`},
                ].map((s,i)=>(
                  <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"16px 10px" }}>
                    <div style={{ fontSize:22, fontFamily:"'Playfair Display',serif", color:"#95d5b2" }}>{s.value}</div>
                    <div style={{ fontSize:12, color:"#556672", marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {u.badges.length>0 && (
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:12, color:"#556672", marginBottom:10 }}>RECENT BADGES</div>
                  <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                    {u.badges.slice(-3).map(bid=>{const b=BADGES.find(x=>x.id===bid);return b?<span key={bid} style={{ background:"rgba(168,85,247,0.15)", border:"1px solid rgba(168,85,247,0.3)", borderRadius:8, padding:"5px 12px", fontSize:13, color:"#c084fc" }}>{b.icon} {b.name}</span>:null;})}
                  </div>
                </div>
              )}

              <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                <button onClick={()=>startLesson(lesson)} style={{ padding:"13px 28px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#aab8c2", fontSize:15, cursor:"pointer" }}>Retry</button>
                <button onClick={()=>setScreen("home")} style={{ padding:"13px 28px", background:"linear-gradient(135deg,#2d6a4f,#52b788)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer" }}>Back to Lessons</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
