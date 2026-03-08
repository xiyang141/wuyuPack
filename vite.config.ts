import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => ({
	define: {
		"process.env.NODE_ENV": JSON.stringify(mode),
	},
	plugins: [
		vue(),
		viteStaticCopy({
			targets: [
				{ src: "audio", dest: "" },
				{ src: "image", dest: "" },
				{ src: "info.json", dest: "" },
				{ src: "LICENSE", dest: "" },
				{ src: "src/bp/image", dest: "src/bp" },
				{ src: "src/bp/index.css", dest: "src/bp" },
				{ src: "src/charactercard/image", dest: "src/charactercard" },
				{ src: "src/charactercard/index.css", dest: "src/charactercard" },
				{ src: "src/eruda/eruda.js", dest: "src/eruda" },
				{ src: "src/skin/asset", dest: "src/skin" },
				{ src: "src/skin/audio", dest: "src/skin" },
				{ src: "src/skin/image", dest: "src/skin" },
				{ src: "src/live2d/assets", dest: "src/live2d" },
				{ src: "src/live2d/live2d.min.js", dest: "src/live2d" },
				{ src: "src/live2d/live2dcubismcore.min.js", dest: "src/live2d" },
			],
		}),
	],

	build: {
		minify: "terser",
		outDir: "dist",
		emptyOutDir: true,
		lib: {
			entry: {
				extension: "extension.ts",
			},
			formats: ["es"],
		},
		rollupOptions: {
			preserveEntrySignatures: "strict",
			external: ["noname", "vue"],
			output: {
				preserveModules: true,
				preserveModulesRoot: ".",
				entryFileNames: "[name].js",
				chunkFileNames: "[name].js",
				assetFileNames: "[name][extname]",
			},
		},
	},
}));
