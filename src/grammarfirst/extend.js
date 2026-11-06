// Adds lessons 7 to 26 to every course.
import { DE, EN, ES, FR } from "./courses1.js";
import { RU, PL, GSW, IT, GA } from "./courses2.js";
import mDE from "./more_de.js"; import mEN from "./more_en.js"; import mES from "./more_es.js"; import mFR from "./more_fr.js";
import mRU from "./more_ru.js"; import mPL from "./more_pl.js"; import mGSW from "./more_gsw.js"; import mIT from "./more_it.js"; import mGA from "./more_ga.js";
[[DE, mDE], [EN, mEN], [ES, mES], [FR, mFR], [RU, mRU], [PL, mPL], [GSW, mGSW], [IT, mIT], [GA, mGA]].forEach(([c, more]) => {
  if (!c.units.some(u => u.lessons.some(l => l.id === more[0].lessons[0].id))) c.units.push(...more);
});

import "./en_extra.js"; import "./reading7.js";
// Einheit 7 (B2)
import { DE7, EN7, ES7, FR7, IT7, RU7, PL7, GSW7 } from "./more_b2.js";
[[DE, DE7], [EN, EN7], [ES, ES7], [FR, FR7], [IT, IT7], [RU, RU7], [PL, PL7], [GSW, GSW7]].forEach(([c, u]) => { if (!c.units.some(x => x.lessons.some(l => l.id === u.lessons[0].id))) c.units.push(u); });
// Extended explanations, tables and reading texts
import * as dDE from "./deep_de.js"; import * as dGSW from "./deep_gsw.js"; import * as dES from "./deep_es.js";
import * as dEN from "./deep_en.js"; import * as dFR from "./deep_fr.js"; import * as dIT from "./deep_it.js"; import * as dRU from "./deep_ru.js"; import * as dPL from "./deep_pl.js";
[[DE, dDE], [GSW, dGSW], [ES, dES], [EN, dEN], [FR, dFR], [IT, dIT], [RU, dRU], [PL, dPL]].forEach(([c, d]) => {
  c.units.forEach((u, ui) => {
    u.lessons.forEach(l => { const x = d.DEEP[l.id]; if (x) { l.more = x.more; l.table = x.table; } });
    const r = d.READINGS[ui]; if (r && !u.reading) u.reading = { ...r, id: c.id + "-r" + (ui + 1), rule: "", structure: "", examples: [], tip: "" };
  });
});
