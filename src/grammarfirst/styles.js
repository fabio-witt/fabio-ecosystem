// GrammarFirst styles, scoped inside the shadow root.
export default `
:host{all:initial;display:block}
*,*::before,*::after{box-sizing:border-box}
.app{--ink:#1d2433;--muted:#667085;--bg:#f6f7fb;--card:#fff;--line:#e4e7ec;--green:#107c5c;--green2:#0b5e46;--gold:#f2b705;--red:#e63946;--blue:#3a86ff;--shadow:0 2px 0 rgba(16,24,40,.08),0 6px 18px rgba(16,24,40,.06);
  font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--bg);border-radius:24px;max-width:560px;margin:0 auto;min-height:max(600px,calc(100vh - 66px));position:relative;overflow:clip;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
.app h1,.app h2,.app h3,.app p{margin:0}
.app h1{font-size:30px;letter-spacing:-.02em}
.app h2{font-size:21px}
.app h3{font-size:16px;margin:18px 0 8px}
.app button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
.app button:disabled{cursor:default}
.app button:focus-visible,.app input:focus-visible{outline:3px solid var(--blue);outline-offset:2px}
.app input{font:inherit}
.muted{color:var(--muted)}
.flag{display:inline-block;border-radius:6px;object-fit:cover;box-shadow:0 0 0 1px rgba(0,0,0,.1);vertical-align:middle;flex:none}
.screen{padding:18px 16px 26px}
.main{padding:0 0 12px;flex:1}
.card{background:var(--card);border-radius:18px;padding:16px;box-shadow:var(--shadow);margin:12px 0}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.lead{color:var(--muted);margin:8px 0 14px}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 18px;border-radius:14px;font-weight:700;background:#fff;box-shadow:inset 0 -3px 0 rgba(0,0,0,.12),0 0 0 2px var(--line);transition:transform .08s}
.btn:active{transform:translateY(2px)}
.btn.primary{background:var(--green);color:#fff;box-shadow:inset 0 -4px 0 var(--green2)}
.btn.danger{background:var(--red);color:#fff;box-shadow:inset 0 -4px 0 #a4242f}
.btn.big{width:100%;padding:16px;font-size:18px;margin-top:18px}
.btn.small{padding:7px 12px;font-size:14px;border-radius:10px}
.btn.light{background:rgba(255,255,255,.9);color:#1d2433}
.btn.ghost{background:transparent;box-shadow:none;color:var(--muted)}
.btn.danger-text{color:var(--red)}
.btn:disabled{opacity:.45;transform:none}

/* onboarding */
.onboarding{text-align:center;display:flex;flex-direction:column;align-items:center}
.onboarding .mascot{margin:6px 0}
.onboarding .lead{margin:8px 0 18px}
.lang-toggle{align-self:flex-end;display:flex;background:#fff;border-radius:999px;padding:3px;box-shadow:0 0 0 2px var(--line)}
.lang-toggle button{padding:5px 12px;border-radius:999px;font-weight:700;font-size:13px;color:var(--muted)}
.lang-toggle button.on{background:var(--ink);color:#fff}
.field{display:flex;flex-direction:column;gap:6px;width:100%;text-align:left;font-weight:600;font-size:14px}
.field input,.type-in{width:100%;padding:13px 14px;border-radius:14px;border:2px solid var(--line);background:#fff;font-size:17px}
.field input:focus,.type-in:focus{border-color:var(--blue);outline:none}
.course-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%}
.course-pick{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;border-radius:16px;background:#fff;box-shadow:0 0 0 2px var(--line),inset 0 -3px 0 var(--line)}
.course-pick b{font-size:13px;line-height:1.2}
.course-pick small{font-size:11px;color:var(--muted)}
.course-pick.on{box-shadow:0 0 0 3px var(--green),inset 0 -3px 0 var(--green);background:#ecfdf5}
.goal-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%}
.goal{padding:12px 6px;border-radius:14px;background:#fff;box-shadow:0 0 0 2px var(--line);display:flex;flex-direction:column}
.goal small{color:var(--muted);font-size:12px}
.goal.on{box-shadow:0 0 0 3px var(--green);background:#ecfdf5}

/* HUD + tabs */
.hud{position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:10px 14px;background:rgba(246,247,251,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.hud-course{padding:4px;border-radius:10px}
.hud-course:hover{background:#fff}
.hud-item{display:flex;align-items:center;gap:4px;font-size:15px;white-space:nowrap}
.hud-item small{color:var(--red);font-size:11px}
.ring{position:relative;display:inline-grid;place-items:center;flex:none}
.ring svg{position:absolute;inset:0;transform:rotate(-90deg)}
.ring-bg{fill:none;stroke:var(--line);stroke-width:6}
.ring-fg{fill:none;stroke-width:6;stroke-linecap:round;transition:stroke-dashoffset .6s}
.ring span{position:relative;font-weight:800;font-size:12px}
.tabs{position:sticky;bottom:0;z-index:6;display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border-top:1px solid var(--line);padding:6px 6px 8px}
.tabs button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px;border-radius:12px;font-size:12px;font-weight:700;color:var(--muted)}
.tabs button span{font-size:20px;line-height:1}
.tabs button.on{color:var(--green);background:#ecfdf5}

/* learn */
.mascot-row{display:flex;align-items:flex-end;gap:10px;margin:4px 0 8px}
.mascot-row.small{margin:0 0 10px}
.bubble{position:relative;background:#fff;border-radius:16px;padding:10px 14px;box-shadow:var(--shadow);font-weight:600;margin-bottom:22px;animation:pop .35s ease}
.bubble::after{content:"";position:absolute;left:-7px;bottom:12px;border:8px solid transparent;border-right-color:#fff;border-left:0}
.course-head{display:flex;align-items:center;gap:12px;color:#fff;border-radius:18px;padding:14px;box-shadow:var(--shadow)}
.course-head div{flex:1;display:flex;flex-direction:column;min-width:0}
.course-head b{font-size:18px}
.course-head small{opacity:.9;font-size:13px}
.unit{margin:22px 0 6px}
.unit-title{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:15px;padding:10px 14px;border-radius:14px;background:#fff;box-shadow:var(--shadow)}
.unit-title small{color:var(--muted);font-weight:600}
.path{display:flex;flex-direction:column;align-items:center;gap:14px;padding:18px 0 6px}
.node-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;transition:transform .3s}
.node{--acc:#107c5c;position:relative;width:74px;height:70px;border-radius:50%;display:grid;place-items:center;background:#d0d5dd;box-shadow:inset 0 -6px 0 rgba(0,0,0,.15);font-size:28px}
.node.open{background:var(--acc);color:#fff;box-shadow:inset 0 -6px 0 rgba(0,0,0,.22),0 0 0 6px color-mix(in srgb,var(--acc) 22%,transparent);animation:bob 2.4s ease-in-out infinite}
.node.done{background:var(--gold);box-shadow:inset 0 -6px 0 #b98a00}
.node.locked{background:#e4e7ec;font-size:22px}
.node:not(:disabled):active{transform:translateY(3px)}
.node-icon{line-height:1}
.crowns{position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);background:#fff;border-radius:999px;padding:0 6px;font-size:11px;box-shadow:0 1px 3px rgba(0,0,0,.15);white-space:nowrap}
.node-label{font-size:13px;font-weight:700;max-width:150px;text-align:center;margin-top:6px}
.chest{width:64px;height:58px;border-radius:14px;font-size:30px;background:#e4e7ec;filter:grayscale(1);opacity:.7}
.chest.ready{filter:none;opacity:1;background:#fff3c4;box-shadow:0 0 0 3px var(--gold);animation:wiggle 1.6s ease-in-out infinite}
.chest.opened{filter:none;opacity:.6;background:#f2f4f7}
.practice-card{display:flex;align-items:center;gap:12px}
.practice-card div{flex:1}
.quest{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}
.quest:last-child{border-bottom:0}
.quest .bar{grid-column:1/-1}
.quest small{color:var(--muted);font-weight:700;grid-row:1;grid-column:2}
.bar{height:10px;background:#eaecf0;border-radius:999px;overflow:hidden;flex:1}
.bar i{display:block;height:100%;background:var(--green);border-radius:999px;transition:width .4s}

/* league */
.board{list-style:none;margin:0;padding:0}
.board li{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:12px}
.board li.top .pos{background:var(--gold);color:#fff}
.board li.me{background:#ecfdf5;box-shadow:0 0 0 2px var(--green)}
.board .pos{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#f2f4f7;font-weight:800;font-size:13px;flex:none}
.board .av{font-size:22px}
.board .nm{flex:1;font-weight:600}

/* profile + shop */
.profile-head{display:flex;gap:14px;align-items:center}
.profile-head>div{flex:1;display:flex;flex-direction:column;gap:4px}
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.stat{background:#fff;border-radius:16px;padding:12px;box-shadow:var(--shadow);display:flex;flex-direction:column}
.stat b{font-size:22px}
.stat small{color:var(--muted)}
.stat.gold b{color:#c48f00}.stat.green b{color:var(--green)}.stat.red b{color:var(--red)}
.ach-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ach{text-align:center;padding:10px 4px;border-radius:14px;background:#f2f4f7;filter:grayscale(1);opacity:.55;font-size:12px;display:flex;flex-direction:column;align-items:center;gap:2px}
.ach span{font-size:26px}
.ach.on{filter:none;opacity:1;background:#fff8db;box-shadow:0 0 0 2px var(--gold)}
.set select,.set input:not([type=checkbox]){padding:6px 10px;border-radius:10px;border:2px solid var(--line);background:#fff;max-width:55%}
.set{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}
.set:last-child{border-bottom:0}
.course-row{display:flex;align-items:center;gap:10px;width:100%;padding:8px 0;text-align:left}
.course-row span{width:110px;font-weight:600;font-size:14px}
.course-row small{color:var(--muted);width:40px;text-align:right}
.shop-item{display:flex;align-items:center;gap:12px}
.shop-item>div{flex:1}
.big-ic{font-size:36px}

/* modal + toast */
.modal{position:fixed;inset:0;z-index:20;background:rgba(16,24,40,.45);display:grid;place-items:center;padding:16px;animation:fade .2s}
.modal-card{background:#fff;border-radius:22px;padding:20px;width:100%;max-width:360px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;animation:pop .3s}
.modal-card.wide{max-width:520px;max-height:90%;overflow:auto}
.modal-card .btn{width:100%}
.toast{position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:30;background:var(--ink);color:#fff;padding:10px 16px;border-radius:999px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:toast 2.6s ease forwards;white-space:nowrap}

/* lesson */
.lesson,.lesson-intro,.lesson-end{flex:1;display:flex;flex-direction:column}
.lesson-top{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.lesson-top .bar{height:14px}
.x{width:36px;height:36px;border-radius:50%;font-size:18px;color:var(--muted);flex:none}
.x:hover{background:#eaecf0}
.crumb{display:flex;align-items:center;gap:8px;font-weight:700}
.hearts{font-weight:800;color:var(--red);white-space:nowrap}
.rule-card{border:3px solid var(--green)}
.rule-card h2{margin-bottom:6px}
.structure{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#f2f4f7;border-radius:12px;padding:10px 12px;margin:10px 0;font-size:14px;overflow-wrap:anywhere}
.examples{list-style:none;padding:0;margin:8px 0;display:flex;flex-direction:column;gap:8px}
.examples li{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:#f9fafb}
.examples li div{display:flex;flex-direction:column}
.examples small{color:var(--muted)}
.speak{width:34px;height:34px;border-radius:50%;background:#e0edff;flex:none;font-size:16px}
.speak:hover{background:#cfe2ff}
.tip{background:#fff8db;border-radius:12px;padding:10px 12px;font-size:14px;margin-top:8px}
.combo-badge{display:inline-block;background:linear-gradient(90deg,#ff7a00,#f2b705);color:#fff;font-weight:800;padding:3px 10px;border-radius:999px;font-size:13px;animation:pop .3s}
.retry-badge{display:inline-block;background:#fde8ea;color:var(--red);font-weight:700;padding:3px 10px;border-radius:999px;font-size:12px}
.ex-body{flex:1;display:flex;flex-direction:column;gap:12px}
.ex-body h2{font-size:20px}
.choices{display:flex;flex-direction:column;gap:10px}
.choice{display:flex;align-items:center;gap:12px;text-align:left;padding:14px;border-radius:16px;background:#fff;box-shadow:0 0 0 2px var(--line),inset 0 -3px 0 var(--line);font-size:17px}
.choice:not(:disabled):hover{background:#f9fafb}
.choice kbd{font:700 12px ui-monospace,monospace;color:var(--muted);border:2px solid var(--line);border-radius:7px;padding:1px 6px}
.choice.is-right{background:#ecfdf5;box-shadow:0 0 0 3px var(--green)}
.choice.is-wrong{background:#fde8ea;box-shadow:0 0 0 3px var(--red);animation:shake .35s}
.build{display:flex;flex-direction:column;gap:16px}
.build-line{min-height:62px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;padding:8px 0;border-bottom:2px solid var(--line);border-top:2px solid var(--line)}
.build-bank{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.tile{padding:9px 14px;border-radius:12px;background:#fff;box-shadow:0 0 0 2px var(--line),inset 0 -3px 0 var(--line);font-size:16px;font-weight:600;transition:transform .08s}
.tile:not(:disabled):active{transform:translateY(2px)}
.tile.is-used{background:#eaecf0;color:transparent;box-shadow:none}
.tile.wide{width:100%;text-align:left}
.tile.is-sel{background:#e0edff;box-shadow:0 0 0 3px var(--blue)}
.tile.is-done{background:#ecfdf5;color:#7fb8a5;box-shadow:0 0 0 2px #b7e4d4}
.tile.is-wrong{background:#fde8ea;box-shadow:0 0 0 3px var(--red);animation:shake .35s}
.ph{color:var(--muted)}
.hint{color:var(--muted);font-size:14px}
.match{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.match>div{display:flex;flex-direction:column;gap:8px}
.match-done{color:var(--green);font-weight:700}
.keyhint{color:var(--muted);font-size:12px;text-align:center;margin-top:8px}
.feedback{margin:14px -16px -26px;padding:16px;display:flex;flex-direction:column;gap:10px;background:#fff;border-top:2px solid var(--line)}
.feedback.ok{background:#d7f5e8;border-color:#b7e4d4}
.feedback.bad{background:#fde8ea;border-color:#f8c9cf}
.feedback .btn{width:100%}
.fb-text{display:flex;flex-direction:column;gap:4px;font-size:15px}
.fb-text b{font-weight:800;font-size:19px}
.fb-text:empty{display:none}
.feedback.ok .fb-text{color:var(--green2)}
.feedback.bad .fb-text{color:#a4242f}
.explain{font-size:14px}
.lesson-end{align-items:center;justify-content:center;text-align:center;gap:10px}
.perfect{color:#c48f00;font-weight:800}
.end-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;margin:10px 0}

/* confetti */
.confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:25}
.confetti i{position:absolute;top:-12px;width:8px;height:14px;border-radius:2px;animation:fall 1.9s ease-in forwards}

/* mascot */
.mascot{display:block;flex:none;overflow:visible}
.m-fur{fill:#8b5a2b}
.m-belly,.m-muzzle{fill:#f1dcb8}
.m-ear{fill:#d9a37a}
.m-nose{fill:#2b1d14}
.m-pupil{fill:#2b1d14}
.m-eyes path{fill:none;stroke:#2b1d14;stroke-width:3.2;stroke-linecap:round}
.m-line{fill:none;stroke:#2b1d14;stroke-width:2.6;stroke-linecap:round}
.m-mouth{fill:#7a2e2e}
.m-tooth{fill:#fff;stroke:#d0c4b0;stroke-width:.6}
.m-cheek{fill:#ff8fab;opacity:.55}
.m-foot{fill:#6e4520}
.m-arm{fill:none;stroke:#7a4c22;stroke-width:9;stroke-linecap:round}
.m-shadow{fill:rgba(0,0,0,.08)}
.m-z{font:800 18px system-ui,sans-serif;fill:#3a86ff}
.m-body-g{transform-origin:55px 110px;animation:breathe 3.2s ease-in-out infinite}
.m-cheer .m-body-g{animation:jump .7s ease-in-out infinite}
.m-sad .m-body-g{animation:none}
.m-waving{transform-origin:88px 76px;animation:wave 1s ease-in-out infinite}
.m-sleep .m-z{animation:float 2s ease-in-out infinite}

@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.02,.98)}}
@keyframes jump{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-22deg)}}
@keyframes float{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(-4px);opacity:.5}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes wiggle{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-8deg)}90%{transform:rotate(8deg)}95%{transform:rotate(-4deg)}}
@keyframes pop{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@keyframes fall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(700px) rotate(540deg);opacity:0}}
@keyframes toast{0%{opacity:0;transform:translate(-50%,-10px)}10%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-10px)}}
@media (max-width:420px){.course-grid{grid-template-columns:repeat(2,1fr)}.app{border-radius:0}.hud-item{font-size:14px}}
@media (prefers-reduced-motion:reduce){.app *{animation:none!important;transition:none!important}}
`;
