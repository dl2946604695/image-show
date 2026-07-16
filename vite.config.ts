import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Readable } from 'node:stream'
import { resolve } from 'node:path'
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from '@tailwindcss/vite'
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { loadEnv } from 'vite'

function pagesFunctionsAgentDevPlugin(env: Record<string, string>) {
  return {
    name: 'local-pages-functions-agent',
    configureServer(server) {
      server.middlewares.use('/api/agent', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.end()
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          }

          const request = new Request(`http://${req.headers.host || 'localhost'}${req.url || ''}`, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          })

          const { onRequest } = await import('./functions/api/agent.js')
          const response = await onRequest({
            request,
            env,
            params: {},
            waitUntil: () => undefined,
            next: () => Promise.resolve(new Response(null, { status: 404 })),
            data: {},
          })

          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })

          if (response.body) {
            Readable.fromWeb(response.body as any).pipe(res)
          } else {
            res.end(await response.text())
          }
        } catch (error) {
          server.config.logger.error(error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ success: false, error: 'Local agent function failed' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv('production', process.cwd(), ''),
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  }

  return {
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: 'hidden',
  },
  server: {
    watch: {
      exclude: ['backend/**'],
    },
  },
  plugins: [
    tsconfigPaths(),
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tailwindcss(),
    pagesFunctionsAgentDevPlugin(env),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }),
  ],
  }
})
