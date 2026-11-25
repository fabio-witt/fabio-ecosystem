const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const { parseEnv } = require("node:util");

const source = path.resolve(process.argv[2] || path.join(__dirname, "../lingora"));
const read = (file) => fs.readFileSync(file, "utf8");
const envFile = path.join(source, ".env");
const settings = { ...(fs.existsSync(envFile) ? parseEnv(read(envFile)) : {}), ...process.env };
if (!settings.EXPO_PUBLIC_SUPABASE_URL || !settings.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or create src/lingora/.env using .env.example.");
}
const url = new URL(settings.EXPO_PUBLIC_SUPABASE_URL);
const key = settings.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const role = () => {
  try { return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role; }
  catch { return null; }
};
if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || !(key?.startsWith("sb_publishable_") || role() === "anon")) {
  throw new Error("Use the GrammarBay project URL and a public Supabase key.");
}

const ts = require(path.join(source, "node_modules/typescript"));
require.extensions[".ts"] = (module, file) => module._compile(ts.transpileModule(read(file), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  fileName: file,
}).outputText, file);
const { courses } = require(path.join(source, "src/features/learn/catalog.ts"));
fs.writeFileSync(path.join(__dirname, "lingora-courses.json"), JSON.stringify(courses));
fs.writeFileSync(path.join(__dirname, "lingora-config.js"), `// Generated from GrammarBay's public web configuration.
export const url = ${JSON.stringify(url.origin)};
export const key = ${JSON.stringify(key)};
`);

const route = "/grammarfirst/lingora";
const iconVersion = createHash("sha256")
  .update(fs.readFileSync(path.join(source, "assets/images/pwa-512.png")))
  .digest("hex").slice(0, 12);
const iconUrl = (name) => `${route}/${name}?v=${iconVersion}`;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "grammarfirst-expo-"));
try {
  for (const name of ["src", "assets", "package.json", "tsconfig.json"]) {
    fs.cpSync(path.join(source, name), path.join(temp, name), { recursive: true });
  }
  fs.symlinkSync(path.join(source, "node_modules"), path.join(temp, "node_modules"), "dir");
  const app = JSON.parse(read(path.join(source, "app.json")));
  app.expo.web = { ...app.expo.web, output: "single" };
  app.expo.experiments = { ...app.expo.experiments, baseUrl: route };
  fs.writeFileSync(path.join(temp, "app.json"), JSON.stringify(app));
  const themeFile = path.join(temp, "src/constants/theme.ts");
  const palette = {
    "#5145B5": "#107C5C", "#403593": "#086348", "#EFEDF9": "#DDF4EA",
    "#F7F7F8": "#F6F7FB", "#1E2029": "#1D2433", "#E3E4EB": "#E4E7EC",
    "#BDB4FF": "#8AD9B7", "#6554C4": "#137B5D", "#5242AD": "#086348",
    "#302A48": "#223C34", "#15161B": "#0F1420", "#1E2027": "#182031",
    "#292B35": "#202B3F", "#F1F1F5": "#E7EBF3", "#353844": "#2A3447",
  };
  fs.writeFileSync(themeFile, read(themeFile).replace(/#[0-9A-F]{6}/g, (color) => palette[color] || color));
  // Email confirmation links must come back to /grammarfirst/lingora/auth/callback.
  const redirectFile = path.join(temp, "src/lib/auth-redirect.ts");
  const redirectCall = "Linking.createURL('auth/callback')";
  if (!read(redirectFile).includes(redirectCall)) throw new Error("auth-redirect.ts changed: update the callback patch.");
  fs.writeFileSync(redirectFile, read(redirectFile).replace(
    redirectCall,
    `typeof window !== 'undefined' ? new URL('${route}/auth/callback', window.location.origin).href : ${redirectCall}`
  ));
  const dist = path.join(temp, "dist");
  const result = spawnSync(process.execPath, [
    path.join(temp, "node_modules/expo/bin/cli"), "export", "--platform", "web", "--output-dir", dist, "--clear",
  ], {
    cwd: temp, stdio: "inherit",
    env: { ...process.env, CI: "1", EXPO_PUBLIC_SUPABASE_URL: url.origin, EXPO_PUBLIC_SUPABASE_ANON_KEY: key },
  });
  if (result.error || result.status !== 0) throw result.error || new Error("GrammarBay web export failed.");
  const output = path.resolve(__dirname, "../../grammarfirst/lingora");
  fs.rmSync(output, { recursive: true, force: true });
  fs.cpSync(dist, output, { recursive: true });
  fs.copyFileSync(path.join(source, "assets/images/apple-touch-icon.png"), path.join(output, "apple-touch-icon.png"));
  for (const size of [192, 512]) {
    fs.copyFileSync(path.join(source, `assets/images/pwa-${size}.png`), path.join(output, `pwa-${size}.png`));
  }
  // Offline mode: the app shell and every loaded lesson bundle stay available without internet.
  const version = Date.now().toString(36);
  fs.writeFileSync(path.join(output, "sw.js"), `const CACHE = "lingora-${version}";
const SCOPE = "${route}/";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([SCOPE, SCOPE + "manifest.webmanifest"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("lingora-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  if (request.mode === "navigate") {
    // Network first, so updates arrive at once; the cached shell works offline.
    event.respondWith(fetch(request).then((response) => {
      if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(SCOPE, copy)));
      }
      return response;
    }).catch(() => caches.match(SCOPE)));
    return;
  }
  // Bundles and images have content hashes in their names: cache first.
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => {
    if (response.ok && (url.pathname.includes("/_expo/") || url.pathname.includes("/assets/"))) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});
`);
  // Lets people install GrammarBay from the browser like an app.
  fs.writeFileSync(path.join(output, "manifest.webmanifest"), JSON.stringify({
    name: "GrammarBay – Learn languages. Connect cultures.",
    short_name: "GrammarBay",
    description: "Learn languages with short lessons, a vocabulary trainer and real language partners.",
    start_url: `${route}/`,
    scope: `${route}/`,
    display: "standalone",
    background_color: "#0B0B0D",
    theme_color: "#0B0B0D",
    icons: [192, 512].map((size) => ({ src: iconUrl(`pwa-${size}.png`), sizes: `${size}x${size}`, type: "image/png", purpose: "any" })),
  }, null, 2));
  patchMobileShell(path.join(output, "index.html"));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

// iPhone Safari: size the app to the visible viewport (dvh) so the browser
// toolbar never covers the tab bar, respect the home indicator, and stop the
// automatic zoom when a text field gets focus.
function patchMobileShell(file) {
  const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />';
  const reset = "</style>";
  let html = read(file);
  if (!html.includes(viewport) || !html.includes(reset)) throw new Error("Expo index.html changed: update the mobile shell patch.");
  html = html.replace(`href="${route}/favicon.ico"`, `href="${iconUrl("favicon.ico")}"`);
  html = html.replace(viewport, [
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    '<meta name="theme-color" content="#0B0B0D" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '<meta name="apple-mobile-web-app-title" content="GrammarBay" />',
    `<link rel="apple-touch-icon" href="${iconUrl("apple-touch-icon.png")}" />`,
    `<link rel="manifest" href="${iconUrl("manifest.webmanifest")}" />`,
    '<meta name="description" content="GrammarBay: learn German, English, Spanish, French and more with short lessons, a vocabulary trainer, stories and real language partners. Free to start, no account needed." />',
    '<meta property="og:title" content="GrammarBay – Learn languages. Connect cultures." />',
    '<meta property="og:description" content="Short lessons, vocabulary trainer, stories and real language partners. Free to start." />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:image" content="${iconUrl("pwa-512.png")}" />`,
    '<meta name="twitter:card" content="summary" />',
  ].join("\n    "));
  html = html.replace(reset, `
      html, body { height: 100%; height: 100dvh; overscroll-behavior: none; -webkit-text-size-adjust: 100%; }
      #root { height: 100%; height: 100dvh; }
      * { -webkit-tap-highlight-color: transparent; }
      @media (max-width: 680px) { input, textarea, select { font-size: 16px !important; } }
    </style>`);
  const title = "<title>GrammarBay</title>";
  if (!html.includes(title)) throw new Error("Expo index.html changed: update the title patch.");
  html = html.replace(title, "<title>GrammarBay – Learn languages. Connect cultures.</title>");
  fs.writeFileSync(file, html);
}
