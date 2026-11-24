// Four pages, picked by the address: the wall for the projector, the host's controls, the page
// the QR code opens, and the feedback form everywhere else.
import App from './App.tsx'
import Admin from './admin/Admin.tsx'
import Join from './auth/Join.tsx'
import Wall from './wall/Wall.tsx'

export default function Page() {
  const path = window.location.pathname
  if (path === '/wall') return <Wall />
  if (path === '/admin') return <Admin />
  if (path.startsWith('/join/')) {
    const token = decodeURIComponent(path.slice('/join/'.length))
    return <Join token={token} onJoined={() => window.location.replace('/')} />
  }
  return <App />
}
