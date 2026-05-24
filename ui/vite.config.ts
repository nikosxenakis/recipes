import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, mkdirSync, readdirSync, statSync, readFileSync } from "fs";
import { join, resolve } from "path";

const copyPublicPlugin = () => ({
  name: "copy-public",
  closeBundle() {
    const publicDir = join(process.cwd(), "public");
    const distDir = join(process.cwd(), "dist");
    mkdirSync(distDir, { recursive: true });

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

    const skipFiles = new Set(["recipes.json", "users.json"]);
    const files = readdirSync(publicDir);
    files.forEach((file) => {
      const filePath = join(publicDir, file);
      if (statSync(filePath).isDirectory()) {
        if (file === "users") {
          copyDir(filePath, join(distDir, file));
        }
      } else if (!file.endsWith(".md") && !skipFiles.has(file)) {
        copyFileSync(filePath, join(distDir, file));
      }
    });
  },
});

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
const buildDate = new Date().toISOString();

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), copyPublicPlugin()],
  publicDir: "public",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    copyPublicDir: false,
    chunkSizeWarningLimit: 200,
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
