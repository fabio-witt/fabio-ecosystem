import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
const host = document.getElementById("grammarfirst-root");
const shadow = host.attachShadow({ mode: "open" });
const mount = document.createElement("div");
shadow.appendChild(mount);
createRoot(mount).render(<App />);
