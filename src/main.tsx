import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
import 'lenis/dist/lenis.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, matchPath } from 'react-router'
import App from './App.tsx'
import { PROJECT_ROUTE } from './content/projectLookup.ts'
import { dismissArrival } from './state/arrival.ts'
import './styles/tokens.css'
import './styles/global.css'
import './styles/system.css'
import './styles/glass.css'
import './styles/sections.css'
import './styles/overlay.css'
import './styles/arrival.css'
import './styles/hero.css'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element in index.html')

// A visitor who opens a project link directly skips the arrival screen. This
// runs before the first render so the screen never mounts, and never steals focus.
if (matchPath(PROJECT_ROUTE, window.location.pathname)) dismissArrival(true)

createRoot(container).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
