import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './AcademiaPanel.css'


type Alerta = {
  id: number
  created_at: string
  matricula: string
  nombre: string
  carrera: string
  grado: string | null
  grupo: string | null
  turno: string | null
  categoria: string
  motivo: string
  prioridad: string
  estado: string
  observaciones: string | null
  fecha_cierre: string | null
  nota_cierre: string | null
}

type UsuarioAcademia = {
  id: number
  nombre: string
  rol: string
}

export default function AcademiaPanel() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [alertaCerrando, setAlertaCerrando] = useState<number | null>(null)
  const [notaCierre, setNotaCierre] = useState('')
  const [vista, setVista] = useState<'activas' | 'historico'>('activas')
  const [filtroCarrera, setFiltroCarrera] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [usuarioAcademia, setUsuarioAcademia] =
        useState<UsuarioAcademia | null>(null)
        useEffect(() => {
        cargarUsuario()
        cargarAlertas()
        }, [])
  const [busquedaPanel, setBusquedaPanel] = useState('')

  async function cerrarSesion() {
  await supabase.auth.signOut()
  window.location.href = '/academia'
}

async function cargarUsuario() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data, error } = await supabase
    .from('usuarios_academia')
    .select('id, nombre, rol')
    .eq('auth_user_id', user.id)
    .eq('activo', true)
    .maybeSingle()

  if (error) {
    console.error(error)
    return
  }

  setUsuarioAcademia(data)
}
  async function cargarAlertas() {
    setCargando(true)
    setMensaje('')

    const { data: alertasData, error: alertasError } = await supabase
      .from('alertas')
      .select(`
        id,
        created_at,
        matricula,
        categoria,
        motivo,
        observaciones,
        prioridad,
        estado,
        fecha_cierre,
        nota_cierre        
      `)
      .order('created_at', { ascending: false })

    if (alertasError) {
      console.error(alertasError)
      setCargando(false)
      setMensaje('No pudimos cargar las alertas.')
      return
    }

    const matriculas = (alertasData ?? []).map(
      (alerta) => alerta.matricula
    )

    if (matriculas.length === 0) {
      setAlertas([])
      setCargando(false)
      return
    }

    const { data: alumnosData, error: alumnosError } = await supabase
      .from('students')
      .select('matricula, nombre, carrera, grado, grupo, turno')
      .in('matricula', matriculas)

    if (alumnosError) {
      console.error(alumnosError)
      setCargando(false)
      setMensaje('No pudimos cargar los datos de los estudiantes.')
      return
    }

    const alertasCompletas = (alertasData ?? []).map((alerta) => {
      const alumno = (alumnosData ?? []).find(
        (a) => a.matricula === alerta.matricula
      )

      return {
        ...alerta,
        nombre: alumno?.nombre ?? 'Sin nombre',
        carrera: alumno?.carrera ?? 'Sin carrera',
        grado: alumno?.grado ?? null,
        grupo: alumno?.grupo ?? null,
        turno: alumno?.turno ?? null,
      }
    })

    setAlertas(alertasCompletas)
    setCargando(false)
  }

async function iniciarSeguimiento(id: number) {
  const { error } = await supabase
    .from('alertas')
    .update({
      estado: 'En seguimiento',
    })
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('No pudimos iniciar el seguimiento de esta alerta.')
    return
  }

  await cargarAlertas()
}

async function cerrarAlerta(id: number) {
  const nota = notaCierre.trim()

  if (!nota) {
    alert('Escribe una nota de cierre antes de cerrar la alerta.')
    return
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    alert('No se pudo identificar al usuario académico.')
    return
  }

  const { error } = await supabase
    .from('alertas')
    .update({
      estado: 'Cerrada',
      fecha_cierre: new Date().toISOString(),
      nota_cierre: nota,
      cerrado_por: user.id,
    })
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('No pudimos cerrar la alerta.')
    return
  }

  setAlertaCerrando(null)
  setNotaCierre('')
  await cargarAlertas()
}

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  function clasePrioridad(prioridad: string) {
    if (prioridad.includes('Alta')) return 'prioridad-alta'
    if (prioridad === 'Media') return 'prioridad-media'
    return 'prioridad-baja'
  }

  if (cargando) {
    return (
      <main className="academia-page">
        <p>Cargando alertas...</p>
      </main>
    )
  }

const alertasActivas = alertas.filter(
  (alerta) => alerta.estado !== 'Cerrada'
)

const alertasCerradas = alertas.filter(
  (alerta) => alerta.estado === 'Cerrada'
)

const nuevas = alertas.filter(
  (alerta) => alerta.estado === 'Nueva'
).length

const enSeguimiento = alertas.filter(
  (alerta) => alerta.estado === 'En seguimiento'
).length

const cerradas = alertasCerradas.length

const baseAlertas =
  vista === 'activas' ? alertasActivas : alertasCerradas

const alertasMostradas = baseAlertas.filter((alerta) => {
  const textoBusqueda = busquedaPanel.trim().toLowerCase()

  const coincideBusqueda =
    !textoBusqueda ||
    alerta.nombre.toLowerCase().includes(textoBusqueda) ||
    alerta.matricula.toLowerCase().includes(textoBusqueda)

  const coincideCarrera =
    !filtroCarrera || alerta.carrera === filtroCarrera

  const coincidePrioridad =
    !filtroPrioridad || alerta.prioridad === filtroPrioridad

  const coincideEstado =
    !filtroEstado || alerta.estado === filtroEstado

  return (
    coincideBusqueda &&
    coincideCarrera &&
    coincidePrioridad &&
    coincideEstado
  )
})

const carrerasDisponibles = Array.from(
  new Set(alertas.map((alerta) => alerta.carrera))
).sort()

const urgentes = alertas.filter(
  (alerta) =>
    alerta.estado !== 'Cerrada' &&
    alerta.prioridad === 'Alta / Urgente'
).length
  
  return (
    <main className="academia-page">
     <div className="academia-header">
  <div>
<div className="resumen-alertas">
  <div className="resumen-card">
    <span>Nuevas</span>
    <strong>{nuevas}</strong>
  </div>

  <div className="resumen-card">
    <span>En seguimiento</span>
    <strong>{enSeguimiento}</strong>
  </div>

  <div className="resumen-card">
    <span>Cerradas</span>
    <strong>{cerradas}</strong>
  </div>
</div>
    <h1>
  {usuarioAcademia?.rol === 'coordinadora'
    ? 'Panel Académico — Vista General'
    : 'Panel Académico'}
</h1>
{usuarioAcademia?.rol === 'coordinadora' && (
  <div className="resumen-card resumen-urgente">
    <span>Urgentes</span>
    <strong>{urgentes}</strong>
  </div>
)}






<p>
  {usuarioAcademia?.rol === 'coordinadora'
    ? 'Seguimiento general de alertas estudiantiles'
    : 'Seguimiento de alertas de tus carreras'}
</p>

{usuarioAcademia && (
  <span className="usuario-panel">
    {usuarioAcademia.nombre}
  </span>
)}
  </div>

  <div className="academia-header-actions">
    <div className="contador-alertas">
      {alertasActivas.length}{' '}
      {alertasActivas.length === 1 ? 'activa' : 'activas'}
    </div>

    <button
      type="button"
      className="btn-cerrar-sesion"
      onClick={cerrarSesion}
    >
      Cerrar sesión
    </button>
  </div>
</div>

<div className="panel-tabs">
  <button
    type="button"
    className={vista === 'activas' ? 'tab-activa' : ''}
    onClick={() => {
  setVista('activas')
  setFiltroEstado('')
}}
  >
    Alertas activas
  </button>

  <button
    type="button"
    className={vista === 'historico' ? 'tab-activa' : ''}
    onClick={() => {
  setVista('historico')
  setFiltroEstado('')
}}
  >
    Histórico
  </button>
</div>

<div className="filtros-alertas">
  <select
    value={filtroCarrera}
    onChange={(e) => setFiltroCarrera(e.target.value)}
  >
    <option value="">Todas las carreras</option>

    {carrerasDisponibles.map((carrera) => (
      <option key={carrera} value={carrera}>
        {carrera}
      </option>
    ))}
  </select>

  <select
    value={filtroPrioridad}
    onChange={(e) => setFiltroPrioridad(e.target.value)}
  >
    <option value="">Todas las prioridades</option>
    <option value="Baja">Baja</option>
    <option value="Media">Media</option>
    <option value="Alta / Urgente">Alta / Urgente</option>
  </select>

 <select
  value={filtroEstado}
  onChange={(e) => setFiltroEstado(e.target.value)}
>
  <option value="">Todos los estados</option>

  {vista === 'activas' ? (
    <>
      <option value="Nueva">Nueva</option>
      <option value="En seguimiento">En seguimiento</option>
    </>
  ) : (
    <option value="Cerrada">Cerrada</option>
  )}
</select>
<input
  className="filtro-busqueda"
  type="text"
  value={busquedaPanel}
  onChange={(e) => setBusquedaPanel(e.target.value)}
  placeholder="Buscar por alumno o matrícula"
/>
  {(filtroCarrera || filtroPrioridad || filtroEstado) && (
    <button
      type="button"
      className="btn-limpiar-filtros"
      onClick={() => {
        setFiltroCarrera('')
        setFiltroPrioridad('')
        setFiltroEstado('')
        setBusquedaPanel('')
      }}
    >
      Limpiar filtros
    </button>
  )}
</div>

      {mensaje && <p className="academia-error">{mensaje}</p>}

      {alertas.length === 0 ? (
        <div className="sin-alertas">
          <h2>Sin alertas</h2>
          <p>No hay alertas disponibles para tus carreras.</p>
        </div>
      ) : (
        <div className="alertas-grid">
          {alertasMostradas.map((alerta) => (
            <article className="alerta-card" key={alerta.id}>
              <div className="alerta-card-header">
                <div>
                  <h2>{alerta.nombre}</h2>
                  <span className="matricula">{alerta.matricula}</span>
                </div>

                <span
                  className={`badge ${clasePrioridad(alerta.prioridad)}`}
                >
                  {alerta.prioridad}
                </span>
              </div>

              <div className="datos-alumno">
                <p>
                  <strong>Carrera</strong>
                  <span>{alerta.carrera}</span>
                </p>

                <p>
                  <strong>Grado</strong>
                  <span>{alerta.grado || 'Sin dato'}</span>
                </p>

                <p>
                  <strong>Grupo</strong>
                  <span>{alerta.grupo || 'Sin dato'}</span>
                </p>

                <p>
                  <strong>Turno</strong>
                  <span>{alerta.turno || 'Sin dato'}</span>
                </p>
              </div>

              <div className="alerta-contenido">
                <span className="categoria">{alerta.categoria}</span>

                <h3>{alerta.motivo}</h3>
                {alerta.observaciones && (
                <div className="observaciones-box">
                <strong>Observaciones</strong>
                <p>{alerta.observaciones}</p>

{alerta.estado === 'Cerrada' && alerta.nota_cierre && (
  <div className="resolucion-box">
    <strong>Resolución / cierre</strong>
    <p>{alerta.nota_cierre}</p>

    {alerta.fecha_cierre && (
      <small>
        Cerrada el {formatearFecha(alerta.fecha_cierre)}
      </small>
    )}
  </div>
)}

                </div>
                )}
              </div>

              <div className="alerta-footer">
                <div className="estado-acciones">
  <span className="estado">{alerta.estado}</span>

  {alerta.estado === 'Nueva' && (
    <button
      type="button"
      className="btn-seguimiento"
      onClick={() => iniciarSeguimiento(alerta.id)}
    >
      Iniciar seguimiento
    </button>
  )}
</div>

{alerta.estado === 'En seguimiento' && (
  <div className="cierre-alerta">
    {alertaCerrando === alerta.id ? (
      <>
       <textarea
  value={notaCierre}
  onChange={(e) => setNotaCierre(e.target.value)}
  placeholder="Describe brevemente la resolución o seguimiento final."
  rows={4}
  maxLength={500}
/>

<p className="contador-cierre">
  {notaCierre.length}/500
</p>

        <div className="cierre-acciones">
          <button
            type="button"
            className="btn-confirmar-cierre"
            onClick={() => cerrarAlerta(alerta.id)}
          >
            Confirmar cierre
          </button>

          <button
            type="button"
            className="btn-cancelar-cierre"
            onClick={() => {
              setAlertaCerrando(null)
              setNotaCierre('')
            }}
          >
            Cancelar
          </button>
        </div>
      </>
    ) : (
      <button
        type="button"
        className="btn-cerrar-alerta"
        onClick={() => setAlertaCerrando(alerta.id)}
      >
        Cerrar alerta
      </button>
    )}
  </div>
)}
                <span>{formatearFecha(alerta.created_at)}</span>
              </div>
            </article>
          ))}
          
        </div>
      )}
    </main>
  )
}