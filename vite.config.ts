import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // iframe에서 사용하기 위한 최적화
        rollupOptions: {
          output: {
            // 코드 분할 최소화로 iframe 로드 안정성 향상
            manualChunks: undefined
          }
        }
      },
      server: {
        // 개발 환경에서도 iframe 테스트 가능하도록 설정
        headers: {
          'X-Frame-Options': 'SAMEORIGIN',
          'Content-Security-Policy': "frame-ancestors *;"
        }
      }
    };
});
