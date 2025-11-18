import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [vue()],
	server: {
		port: 4000,
		strictPort: true,
		proxy: {
			"/api": {
				target: "http://localhost:4001",
				changeOrigin: true,
			},
		},
	},
});
