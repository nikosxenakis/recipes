import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import string from "vite-plugin-string";

// https://vite.dev/config/
export default defineConfig({
    base: "/recipes/", // Needed for github pages
    plugins: [
        react(),
        string({
            include: ["**/*.md"],
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
                        return "react";
                    }
                    if (id.includes("Rezeptbuch.md")) return "rezeptbuch";
                },
            },
        },
    },
});
