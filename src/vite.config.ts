import {defineConfig} from "vite";

export default defineConfig({
    base: "./",
    build: {
        minify: false, // kaboom js doesn't work with minify?
    },
});