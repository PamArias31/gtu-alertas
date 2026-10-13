import { useState } from 'react'
import { supabase } from './lib/supabase'

import './App.css'


type Docente = {
  id: number
  nombre: string
  correo: string
  telefono: string | null
  activo: boolean
}

type Alumno = {
  matricula: string
  nombre: string
  carrera: string
  grado: string | null
  grupo: string | null
  turno: string | null
  estatus: string | null
}

function App() {
  const [correo, setCorreo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [docente, setDocente] = useState<Docente | null>(null)
  const [categoria, setCategoria] = useState('')
  const [motivo, setMotivo] = useState('')
  const [otroMotivo, setOtroMotivo] = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
const [mensajeEnvio, setMensajeEnvio] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnoSeleccionado, setAlumnoSeleccionado] =
    useState<Alumno | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [mensajeAlumno, setMensajeAlumno] = useState('')
 
 
  async function identificarDocente(e: React.FormEvent) {
    e.preventDefault()

    const correoLimpio = correo.trim().toLowerCase()

    if (!correoLimpio) {
      setMensaje('Ingresa tu correo institucional.')
      return
    }

    setCargando(true)
    setMensaje('')

    const { data, error } = await supabase
      .from('docentes')
      .select('id, nombre, correo, telefono, activo')
      .ilike('correo', correoLimpio)
      .maybeSingle()

    setCargando(false)

    if (error) {
      console.error(error)
      setMensaje('No pudimos verificar tu correo. Intenta nuevamente.')
      return
    }

    if (!data) {
      setMensaje('Este correo no está registrado como docente activo.')
      return
    }

    if (!data.activo) {
      setMensaje('Este docente se encuentra inactivo.')
      return
    }

    setDocente(data)
  }

  async function buscarAlumno(e: React.FormEvent) {
    e.preventDefault()

    const texto = busqueda.trim()

    if (texto.length < 3) {
      setMensajeAlumno('Escribe al menos 3 caracteres.')
      return
    }

    setBuscando(true)
    setMensajeAlumno('')
    setAlumnoSeleccionado(null)

    const { data, error } = await supabase
      .from('students')
      .select(
        'matricula, nombre, carrera, grado, grupo, turno, estatus'
      )
      .or(`nombre.ilike.%${texto}%,matricula.ilike.%${texto}%`)
      .limit(15)

    setBuscando(false)

    if (error) {
      console.error(error)
      setMensajeAlumno('No pudimos buscar alumnos. Intenta nuevamente.')
      return
    }

    setAlumnos(data ?? [])

    if (!data || data.length === 0) {
      setMensajeAlumno('No encontramos alumnos con esa búsqueda.')
    }
  }

  function seleccionarAlumno(alumno: Alumno) {
    setAlumnoSeleccionado(alumno)
    setAlumnos([])
    setBusqueda(alumno.nombre)
    setMensajeAlumno('')
  }

async function enviarAlerta() {
  if (!docente || !alumnoSeleccionado) {
    setMensajeEnvio('Selecciona un estudiante.')
    return
  }

  if (!categoria) {
    setMensajeEnvio('Selecciona el tipo de alerta.')
    return
  }

  const motivoFinal =
    categoria === 'Otros' ? otroMotivo.trim() : motivo

  if (!motivoFinal) {
    setMensajeEnvio('Selecciona o escribe el motivo de la alerta.')
    return
  }

  if (!prioridad) {
    setMensajeEnvio('Selecciona la prioridad.')
    return
  }

  setEnviando(true)
  setMensajeEnvio('')

  const { error } = await supabase
    .from('alertas')
    .insert({
      docente_id: docente.id,
      matricula: alumnoSeleccionado.matricula,
      categoria,
      motivo: motivoFinal,
      observaciones: observaciones.trim() || null,
      prioridad,
      estado: 'Nueva',
    })

  setEnviando(false)

  if (error) {
    console.error(error)
    setMensajeEnvio('No pudimos enviar la alerta. Intenta nuevamente.')
    return
  }

  setMensajeEnvio('✅ Alerta enviada correctamente.')
  setCategoria('')
setMotivo('')
setOtroMotivo('')
setPrioridad('')
setObservaciones('')
setAlumnoSeleccionado(null)
setBusqueda('')
setAlumnos([])
setMensajeAlumno('')
}

  if (docente) {
    return (
      <main className="app">
      <div className="card">

        <h1>GTU Alertas</h1>

        <p>
          Reporta: <strong>{docente.nombre}</strong>
        </p>

        {!alumnoSeleccionado ? (
          <>
            <h2>Buscar estudiante</h2>

            <form onSubmit={buscarAlumno} className="student-search">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre o matrícula"
              />

              <button type="submit" disabled={buscando}>
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {mensajeAlumno && <p>{mensajeAlumno}</p>}

            {alumnos.length > 0 && (
               <div className="student-results">
                {alumnos.map((alumno) => (
                  <button
                key={alumno.matricula}
                type="button"
                 className="student-result"
                 onClick={() => seleccionarAlumno(alumno)}
>
  <span>{alumno.nombre}</span>
  <small>{alumno.matricula}</small>
</button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
           <h2>Estudiante seleccionado</h2>

<div className="student-card">
  <div className="student-card-header">
    <strong>{alumnoSeleccionado.nombre}</strong>
    <span>{alumnoSeleccionado.matricula}</span>
  </div>

  <div className="student-data">
    <p>
      <small>Carrera</small>
      <span>{alumnoSeleccionado.carrera}</span>
    </p>

    <p>
      <small>Grado</small>
      <span>{alumnoSeleccionado.grado || 'Sin dato'}</span>
    </p>

    <p>
      <small>Grupo</small>
      <span>{alumnoSeleccionado.grupo || 'Sin dato'}</span>
    </p>

    <p>
      <small>Turno</small>
      <span>{alumnoSeleccionado.turno || 'Sin dato'}</span>
    </p>

    <p>
      <small>Estatus</small>
      <span>{alumnoSeleccionado.estatus || 'Sin dato'}</span>
    </p>
  </div>
</div>

            <h3>Tipo de alerta</h3>

<select
  value={categoria}
 onChange={(e) => {
  setCategoria(e.target.value)
  setMotivo('')
}}
>
  <option value="">Selecciona una opción</option>
  <option value="Alerta académica">Alerta académica</option>
  <option value="Asistencia y Conducta">Asistencia y Conducta</option>
  <option value="Otros">Otros</option>
</select>
{categoria === 'Alerta académica' && (
  <>
    <h3>Motivo</h3>

    <select
      value={motivo}
      onChange={(e) => setMotivo(e.target.value)}
    >
      <option value="">Selecciona un motivo</option>
      <option value="Bajo rendimiento o calificaciones deficientes">
        Bajo rendimiento o calificaciones deficientes
      </option>
      <option value="Entregas tardías o incumplimiento de tareas">
        Entregas tardías o incumplimiento de tareas
      </option>
      <option value="Riesgo reprobatorio o pérdida de asignatura">
        Riesgo reprobatorio o pérdida de asignatura
      </option>
    </select>
  </>
)}

{categoria === 'Asistencia y Conducta' && (
  <>
    <h3>Motivo</h3>

    <select
      value={motivo}
      onChange={(e) => setMotivo(e.target.value)}
    >
      <option value="">Selecciona un motivo</option>
      <option value="Ausencias recurrentes / Faltas injustificadas">
        Ausencias recurrentes / Faltas injustificadas
      </option>
      <option value="Retardos constantes">
        Retardos constantes
      </option>
      <option value="Desinterés, apatía o desconexión en clase">
        Desinterés, apatía o desconexión en clase
      </option>
      <option value="Conductas disruptivas o cambios drásticos de comportamiento">
        Conductas disruptivas o cambios drásticos de comportamiento
      </option>
    </select>
  </>
)}
{categoria === 'Otros' && (
  <>
    <h3>Especifica el motivo</h3>

    <textarea
  value={otroMotivo}
  onChange={(e) => setOtroMotivo(e.target.value)}
  placeholder="Describe brevemente el motivo"
  maxLength={250}
  rows={3}
/>
   <p className="char-counter">
  {otroMotivo.length}/250
</p>
  </>
)}
<h3>Prioridad</h3>

<select
  value={prioridad}
  onChange={(e) => setPrioridad(e.target.value)}
>
  <option value="">Selecciona una prioridad</option>
  <option value="Baja">Baja — Situación preventiva o inicial</option>
  <option value="Media">Media — Problema persistente que requiere intervención pronta</option>
  <option value="Alta / Urgente">Alta / Urgente — Crisis activa que requiere atención inmediata</option>
</select>

<div className="risk-warning">
  <span>⚠️</span>
  <p>
    <strong>¿La situación requiere atención inmediata?</strong>
    Si existe un riesgo inmediato para la salud o integridad del estudiante,
    contacta directamente a Coordinación/Dirección o a los servicios de
    emergencia correspondientes.
  </p>
</div>
<h3>Observaciones</h3>
<textarea
  value={observaciones}
  onChange={(e) => setObservaciones(e.target.value)}
  placeholder="Describe brevemente la situación observada y cualquier información relevante para su seguimiento."
  maxLength={1000}
  rows={5}
/>
<p className="char-counter">
  {observaciones.length}/1000
</p>

<div className="form-actions">
<button
  type="button"
  className="btn-primary"
  onClick={enviarAlerta}
  disabled={enviando}
>
  {enviando ? 'Enviando...' : 'Enviar alerta'}
</button>

{mensajeEnvio && <p>{mensajeEnvio}</p>}


            <button
              type="button"
              className="btn-tertiary"
              onClick={() => {
  setAlumnoSeleccionado(null)
  setBusqueda('')
  setAlumnos([])
  setMensajeAlumno('')
  setCategoria('')
  setMotivo('')
  setOtroMotivo('')
  setPrioridad('')
  setObservaciones('')
  setMensajeEnvio('')
}}
            >
              Cambiar estudiante
            </button>
            </div>
          </>
        )}

        <hr />

        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setDocente(null)
            setCorreo('')
            setMensaje('')
            setBusqueda('')
            setAlumnos([])
            setAlumnoSeleccionado(null)
          }}
        >
          Salir / Cambiar docente
        </button>
        </div>
        </main>
    )
  }

  return (
    <main className="app">
  <div className="card">
      <h1>GTU Alertas</h1>

      <p>
        Sistema de identificación y seguimiento de alertas estudiantiles.
      </p>

      <form onSubmit={identificarDocente}>
        <label htmlFor="correo">Correo institucional</label>
        <br />

        <input
          id="correo"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="correo@institucion.edu.mx"
          autoComplete="email"
        />

        <br />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Verificando...' : 'Continuar'}
        </button>
      </form>

      {mensaje && <p>{mensaje}</p>}
      </div>
</main>
  )
}

export default App