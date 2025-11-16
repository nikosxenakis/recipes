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

        // Recursive copy function
        const copyDir = (src: string, dest: string) => {
            mkdirSync(dest, { recursive: true });
            const files = readdirSync(src);
            files.forEach((file) => {
                const srcPath = join(src, file);
                const destPath = join(dest, file);
                if (statSync(srcPath).isDirectory()) {
                    copyDir(srcPath, destPath);
                } else if (!file.endsWith(".md")) {
                    copyFileSync(srcPath, destPath);
                }
            });
        };

        // Copy all files from public except .md files and recipes folder
        const files = readdirSync(publicDir);
        files.forEach((file) => {
            const filePath = join(publicDir, file);
            if (statSync(filePath).isDirectory()) {
                // Copy users directory, skip recipes directory
                if (file === "users") {
                    copyDir(filePath, join(distDir, file));
                }
            } else if (!file.endsWith(".md")) {
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
