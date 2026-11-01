import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { ink:"#0D1020", panel:"#171B30", violet:"#8066ED", cyan:"#18C6D4", lemon:"#FFD166", muted:"#A4A8BC" }, boxShadow: { glow:"0 12px 50px rgba(128,102,237,.25)" } } }, plugins: [] };
export default config;
