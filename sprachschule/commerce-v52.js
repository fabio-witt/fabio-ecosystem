document.addEventListener("DOMContentLoaded",()=>{
  const select=document.getElementById("sw52-package");
  const map={"Economy":"Economy: CHF 75 / 60 Min.","Standard":"Standard: CHF 199 / Monat","Premium":"Premium: CHF 279 / Monat","Pro":"Pro: CHF 499 / Monat","Einstufung + Lernplan":"Einstufung + Lernplan: gratis","Writing Review":"Writing Review: CHF 45","Conversation Booster":"Conversation Booster: CHF 99","Geschenkgutschein":"Geschenkgutschein: ab CHF 75","Firmenpaket 10x60":"Firmenpaket 10×60: ab CHF 1'690"};
  document.querySelectorAll(".sw52-buy[data-plan]").forEach(a=>a.addEventListener("click",()=>{
    const plan=a.dataset.plan||""; if(select && map[plan]) select.value=map[plan];
    document.querySelectorAll(".sw52-card").forEach(c=>c.classList.toggle("is-selected",c.dataset.plan===plan));
    try{sessionStorage.setItem("sprachwerk_selected_plan",plan)}catch(e){}
  }));
  try{const plan=sessionStorage.getItem("sprachwerk_selected_plan"); if(plan&&select&&map[plan]) select.value=map[plan]}catch(e){}
});
