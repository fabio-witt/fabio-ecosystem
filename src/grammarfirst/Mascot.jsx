// Mila, the GrammarFirst marmot. Original character, drawn in SVG.
// moods: happy, cheer, think, sad, sleep, wave
export default function Mascot({ mood = "happy", size = 96, label }) {
  const eyes = {
    happy: <><path d="M38 47 q5 -6 10 0" /><path d="M62 47 q5 -6 10 0" /></>,
    cheer: <><path d="M37 46 q6 -8 12 0" /><path d="M61 46 q6 -8 12 0" /></>,
    wave: <><circle cx="43" cy="46" r="4.5" className="m-pupil" /><circle cx="67" cy="46" r="4.5" className="m-pupil" /></>,
    think: <><circle cx="45" cy="44" r="4.5" className="m-pupil" /><circle cx="69" cy="44" r="4.5" className="m-pupil" /></>,
    sad: <><path d="M38 44 q5 5 10 2" /><path d="M62 46 q5 3 10 -2" /></>,
    sleep: <><path d="M38 47 h10" /><path d="M62 47 h10" /></>,
  }[mood] || null;
  const mouth = {
    happy: <path d="M48 62 q7 7 14 0" className="m-line" />,
    cheer: <path d="M46 60 q9 12 18 0 z" className="m-mouth" />,
    wave: <path d="M48 62 q7 6 14 0" className="m-line" />,
    think: <path d="M50 64 h10" className="m-line" />,
    sad: <path d="M48 66 q7 -6 14 0" className="m-line" />,
    sleep: <ellipse cx="55" cy="64" rx="3" ry="2" className="m-mouth" />,
  }[mood];
  const armL = mood === "cheer" ? "M22 74 q-10 -18 -4 -30" : "M24 82 q-8 6 -4 14";
  const armR = mood === "cheer" ? "M88 74 q10 -18 4 -30" : mood === "wave" ? "M88 76 q14 -10 10 -26" : "M86 82 q8 6 4 14";
  return (
    <svg viewBox="0 0 110 120" width={size} height={size * 120 / 110} role="img" aria-label={label || "Mila, das Murmeltier"} className={"mascot m-" + mood}>
      <g className="m-body-g">
        <ellipse cx="55" cy="112" rx="30" ry="5" className="m-shadow" />
        <path d={armL} className="m-arm" />
        <path d={armR} className={"m-arm" + (mood === "wave" ? " m-waving" : "")} />
        <ellipse cx="55" cy="80" rx="33" ry="32" className="m-fur" />
        <ellipse cx="55" cy="86" rx="20" ry="22" className="m-belly" />
        <circle cx="28" cy="26" r="9" className="m-fur" /><circle cx="28" cy="26" r="4.5" className="m-ear" />
        <circle cx="82" cy="26" r="9" className="m-fur" /><circle cx="82" cy="26" r="4.5" className="m-ear" />
        <ellipse cx="55" cy="50" rx="32" ry="28" className="m-fur" />
        <ellipse cx="55" cy="58" rx="18" ry="14" className="m-muzzle" />
        <g className="m-eyes">{eyes}</g>
        <ellipse cx="55" cy="54" rx="5" ry="3.5" className="m-nose" />
        {mouth}
        <rect x="51" y="62" width="4" height="6" rx="1" className="m-tooth" />
        <rect x="55.5" y="62" width="4" height="6" rx="1" className="m-tooth" />
        <circle cx="35" cy="58" r="4" className="m-cheek" /><circle cx="75" cy="58" r="4" className="m-cheek" />
        <ellipse cx="42" cy="110" rx="9" ry="4" className="m-foot" /><ellipse cx="68" cy="110" rx="9" ry="4" className="m-foot" />
        {mood === "sleep" && <text x="84" y="22" className="m-z">z</text>}
        {mood === "think" && <text x="86" y="20" className="m-z">?</text>}
      </g>
    </svg>
  );
}
