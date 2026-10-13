import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AcademiaLogin from './academia/AcademiaLogin.tsx'
import AcademiaPanel from './academia/AcademiaPanel.tsx'

const esAcademia = window.location.pathname === '/academia'

function AcademiaLoginWrapper() {
  const [logueado, setLogueado] = useState(false)

if (logueado) {
  return <AcademiaPanel />
}

  return (
    <AcademiaLogin
      onLogin={() => {
        setLogueado(true)
      }}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {esAcademia ? <AcademiaLoginWrapper /> : <App />}
  </StrictMode>,
)