import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                'wing-area': resolve(__dirname, 'wing-area-new.html'),
                'landing-distance': resolve(__dirname, 'landing-distance.html'),
                'dynamic-thrust': resolve(__dirname, 'dynamic-thrust.html'),
                'sink-rate': resolve(__dirname, 'sink-rate.html'),
                'climb-rate': resolve(__dirname, 'climb-rate.html'),
                'takeoff-distance': resolve(__dirname, 'takeoff-distance.html'),
                'vn-diagram': resolve(__dirname, 'vn-diagram.html'),
                'wheel-track': resolve(__dirname, 'wheel-track.html'),
                'wing-parameter': resolve(__dirname, 'wing-parameter.html'),
            },
        },
    },
});
