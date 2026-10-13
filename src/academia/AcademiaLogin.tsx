import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './AcademiaLogin.css'

type AcademiaLoginProps = {
  onLogin: () => void
}

export default function AcademiaLogin({ onLogin }: AcademiaLoginProps) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault()

    if (!correo.trim() || !password) {
      setMensaje('Ingresa tu correo y contraseña.')
      return
    }

    setCargando(true)
    setMensaje('')

    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password,
    })

    setCargando(false)

    if (error) {
      console.error(error)
      setMensaje('Correo o contraseña incorrectos.')
      return
    }

    onLogin()
  }

  return (
  <main className="academia-login-page">
    <div className="academia-login-card">
      <h1>Panel Académico</h1>
      <p className="academia-login-subtitle">
        Ingresa con tu cuenta autorizada.
      </p>

      <form onSubmit={iniciarSesion}>
        <label>
          Correo institucional
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@gtu..."
            autoComplete="email"
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      {mensaje && (
        <p className="academia-login-mensaje">
          {mensaje}
        </p>
      )}
    </div>
  </main>
)
}