import express from 'express'
import { fileURLToPath } from 'node:url'

// Thin optional Node server. Vercel serves the same built pages as static assets.
const app = express()
app.disable('x-powered-by')
app.get('/api/health', (_request, response) => response.json({ status: 'ok', lab: 'Swing Discovery Lab' }))
app.use(express.static(fileURLToPath(new URL('./dist/', import.meta.url))))
const port = Number(process.env.PORT) || 3000
app.listen(port, () => console.log(`MagikLayout is ready at http://localhost:${port}/swing-ar.html`))
