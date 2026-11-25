window.FW_SITE_CONFIG = {
  contactEmail: "fabiowitt@gmx.de",
  // GrammarFirst Shop: Checkout-Links von Lemon Squeezy, Paddle oder Creem hier eintragen.
  // Leer lassen = Knopf führt zur Warteliste.
  shop: {
    provider: "",
    earlyBirdUrl: "",
    // Ein Kauf-Link pro Grammatikheft (Sprache-Erklärsprache). Leer = Warteliste.
    workbooks: {
      "gsw-de": "",
      "gsw-en": "",
      "de-en": "",
      "en-de": "",
      "es-de": "",
      "es-en": "",
      "fr-de": "",
      "fr-en": "",
      "it-de": "",
      "it-en": "",
      "ru-de": "",
      "ru-en": "",
      "pl-de": "",
      "pl-en": "",
      "ga-de": "",
      "ga-en": "",
    }
  },
  // Online-Buchung (z. B. Cal.com oder Calendly). Link eintragen = Kalender-Knöpfe erscheinen.
  // Leer lassen = die Knöpfe bleiben versteckt und das Anfrageformular wird genutzt.
  booking: {
    sprachkurse: "",   // z. B. "https://cal.com/fabiowitt/probelektion"
    sap: ""            // z. B. "https://cal.com/fabiowitt/sap-erstgespraech"
  },
  // Echte Kundenstimmen. Nur mit Einverständnis der Person eintragen.
  // Leer = der Bereich wird nicht angezeigt.
  // Beispiel: { quote: "…", name: "Anna M.", role: "Deutsch B2, Zürich" }
  references: {
    sprachkurse: [],
    sap: [],
    services: []
  },
  // Drohnen- und Videoarbeiten für "Weitere Services".
  // url: YouTube-, Vimeo- oder .mp4-Link. Leer = kein Portfolio-Bereich.
  // Beispiel: { title: "Hotel am See – Drohnenfilm", url: "https://youtu.be/…" }
  portfolio: [],
  paypalDonationUrl: "https://www.paypal.com/donate/?hosted_button_id=DEIN_PAYPAL_BUTTON_ID"
};
// Replace DEIN_PAYPAL_BUTTON_ID with your real PayPal hosted donation button ID.
// Alternative: use a verified PayPal.Me URL.
