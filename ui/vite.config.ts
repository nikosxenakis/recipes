import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

// Custom plugin to copy public files except markdown and recipes subfolder
const copyPublicPlugin = () => ({
    name: "copy-public",
    closeBundle() {
        const publicDir = join(process.cwd(), "public");
        const distDir = join(process.cwd(), "dist");
        mkdirSync(distDir, { recursive: true });

        // Copy all files from public except .md files and recipes folder
        const files = readdirSync(publicDir);
        files.forEach((file) => {
            const filePath = join(publicDir, file);
            // Skip directories (like recipes folder) and .md files
            if (statSync(filePath).isFile() && !file.endsWith(".md")) {
                copyFileSync(filePath, join(distDir, file));
            }
        });
    },
});

// Read version from package.json
const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));

// Get build date
const buildDate = new Date().toISOString();

// https://vite.dev/config/
export default defineConfig({
    base: "/recipes/", // Needed for github pages
    plugins: [react(), copyPublicPlugin()],
    publicDir: "public", // Serve all public files in dev
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        __BUILD_DATE__: JSON.stringify(buildDate),
    },
    build: {
        copyPublicDir: false, // Disable default public dir copying, use our custom plugin
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
                        return "react";
                    }
                },
            },
        },
    },
});
