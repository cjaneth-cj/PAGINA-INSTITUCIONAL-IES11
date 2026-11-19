// admin/js/estudiantes-management.js
// Conecta la bandeja de trámites y el formulario de mesas de examen con Supabase

document.addEventListener('DOMContentLoaded', () => {
  // Referencias del DOM de trámites (coinciden con estudiantes-management.html)
  const tablaTramites = document.getElementById('tablaTramites');
  const filtroPreceptor = document.getElementById('filtroPreceptor');
  const filtroEstado = document.getElementById('filtroEstado');

  // Referencias del DOM de mesas de examen
  const formTurnoExamen = document.getElementById('formTurnoExamen');
  const turnoConvocatoriaInput = document.getElementById('turnoConvocatoria');
  const periodoExamenesInput = document.getElementById('periodoExamenes');
  const cierreInscripcionInput = document.getElementById('cierreInscripcion');
  const estadoTurnoInput = document.getElementById('estadoTurno');

  // Contenedor opcional si más adelante agregás una tabla de turnos en el HTML
  const tablaTurnosExamen = document.getElementById('tablaTurnosExamen');

  let listaTramites = [];

  // Verifica que supabaseClient esté disponible
  function tieneSupabase() {
    if (typeof supabaseClient === 'undefined') {
      console.error('El cliente supabaseClient no está disponible.');
      return false;
    }
    return true;
  }

  // -----------------------------------------------------------------------
  // 1. TRÁMITES ESTUDIANTILES
  // -----------------------------------------------------------------------
  async function cargarTramites() {
    if (!tieneSupabase() || !tablaTramites) return;

    const { data, error } = await supabaseClient
      .from('solicitudes_estudiantes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar trámites:', error);
      tablaTramites.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#dc2626; padding:24px;">Error al cargar trámites.</td></tr>';
      return;
    }

    listaTramites = data || [];
    poblarFiltroPreceptores(listaTramites);
    renderizarTramites();
  }

  function poblarFiltroPreceptores(tramites) {
    if (!filtroPreceptor) return;
    const valorActual = filtroPreceptor.value;
    const preceptoresUnicos = [...new Set(tramites.map((t) => t.preceptor).filter(Boolean))];

    filtroPreceptor.innerHTML = '<option value="">Todos los Preceptores</option>';
    preceptoresUnicos.forEach((preceptor) => {
      const option = document.createElement('option');
      option.value = preceptor;
      option.textContent = preceptor;
      filtroPreceptor.appendChild(option);
    });

    filtroPreceptor.value = valorActual;
  }

  function renderizarTramites() {
    if (!tablaTramites) return;

    const pFiltro = filtroPreceptor ? filtroPreceptor.value.trim().toLowerCase() : '';
    const eFiltro = filtroEstado ? filtroEstado.value.trim() : '';

    const filtrados = listaTramites.filter((t) => {
      const coincidePreceptor =
        !pFiltro || (t.preceptor && t.preceptor.toLowerCase().includes(pFiltro));
      const coincideEstado = !eFiltro || t.estado === eFiltro;
      return coincidePreceptor && coincideEstado;
    });

    if (filtrados.length === 0) {
      tablaTramites.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:28px;">No hay trámites para mostrar.</td></tr>';
      return;
    }

    tablaTramites.innerHTML = '';

    filtrados.forEach((t) => {
      const fecha = t.created_at
        ? new Date(t.created_at).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '-';

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><small style="color:var(--text-muted);">${fecha}</small></td>
        <td>
          <strong>${t.nombre_completo || 'Sin nombre'}</strong><br>
          <small style="color:var(--text-muted);">DNI: ${t.dni || '-'}</small>
        </td>
        <td>
          ${t.carrera || '-'}<br>
          <small style="color:var(--text-muted);">Preceptor: ${t.preceptor || 'Sin asignar'}</small>
        </td>
        <td>
          <strong>${t.tipo_tramite || '-'}</strong>
          ${t.mensaje_adicional ? `<br><small style="color:var(--text-muted);">${t.mensaje_adicional}</small>` : ''}
        </td>
        <td>
          <select class="select-estado-tramite" data-id="${t.id}">
            <option value="Pendiente" ${t.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="En Proceso" ${t.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
            <option value="Completado" ${t.estado === 'Completado' ? 'selected' : ''}>Completado</option>
            <option value="Listo para retirar" ${t.estado === 'Listo para retirar' ? 'selected' : ''}>Listo para retirar</option>
          </select>
        </td>
        <td style="text-align:right;">
          <button type="button" class="btn-action btn-mail-tramite" data-email="${t.email || ''}" data-nombre="${t.nombre_completo || ''}" data-tramite="${t.tipo_tramite || ''}" title="Enviar correo">
            <i class="fa-solid fa-envelope"></i>
          </button>
          <button type="button" class="btn-action btn-delete-tb btn-eliminar-tramite" data-id="${t.id}" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      tablaTramites.appendChild(fila);
    });
  }

  // Cambio de estado en la fila
  if (tablaTramites) {
    tablaTramites.addEventListener('change', async (e) => {
      if (!e.target.classList.contains('select-estado-tramite')) return;

      const id = e.target.getAttribute('data-id');
      const nuevoEstado = e.target.value;

      const { error } = await supabaseClient
        .from('solicitudes_estudiantes')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) {
        alert('Error al actualizar el estado: ' + error.message);
        return;
      }

      const item = listaTramites.find((t) => String(t.id) === String(id));
      if (item) item.estado = nuevoEstado;
      renderizarTramites();
    });

    // Acciones de correo y eliminar
    tablaTramites.addEventListener('click', async (e) => {
      const btnMail = e.target.closest('.btn-mail-tramite');
      const btnDelete = e.target.closest('.btn-eliminar-tramite');

      if (btnMail) {
        const email = btnMail.getAttribute('data-email');
        const nombre = btnMail.getAttribute('data-nombre');
        const tramite = btnMail.getAttribute('data-tramite');

        if (!email) {
          alert('Esta solicitud no tiene correo electrónico registrado.');
          return;
        }

        const asunto = encodeURIComponent(`Trámite ${tramite} - IES N° 11`);
        const cuerpo = encodeURIComponent(
          `Hola ${nombre},\n\nTe contactamos desde el IES N° 11 respecto a tu solicitud de "${tramite}".\n\nSaludos cordiales.`
        );
        window.location.href = `mailto:${email}?subject=${asunto}&body=${cuerpo}`;
      }

      if (btnDelete) {
        const id = btnDelete.getAttribute('data-id');
        if (!confirm('¿Eliminar esta solicitud de trámite?')) return;

        const { error } = await supabaseClient
          .from('solicitudes_estudiantes')
          .delete()
          .eq('id', id);

        if (error) {
          alert('Error al eliminar trámite: ' + error.message);
          return;
        }

        await cargarTramites();
      }
    });
  }

  if (filtroPreceptor) {
    filtroPreceptor.addEventListener('change', renderizarTramites);
  }
  if (filtroEstado) {
    filtroEstado.addEventListener('change', renderizarTramites);
  }

  // -----------------------------------------------------------------------
  // 2. MESAS DE EXAMEN
  // -----------------------------------------------------------------------
  async function cargarTurnosExamen() {
    if (!tieneSupabase() || !tablaTurnosExamen) return;

    const { data, error } = await supabaseClient
      .from('calendario_examenes')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al cargar turnos de examen:', error);
      return;
    }

    const turnos = data || [];
    if (turnos.length === 0) {
      tablaTurnosExamen.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px;">No hay turnos cargados.</td></tr>';
      return;
    }

    tablaTurnosExamen.innerHTML = '';
    turnos.forEach((ex) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><strong>${ex.turno}</strong></td>
        <td>${ex.periodo}</td>
        <td>${ex.cierre_inscripcion || '-'}</td>
        <td>${ex.estado}</td>
      `;
      tablaTurnosExamen.appendChild(fila);
    });
  }

  if (formTurnoExamen) {
    formTurnoExamen.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!tieneSupabase()) return;

      const datosTurno = {
        turno: turnoConvocatoriaInput ? turnoConvocatoriaInput.value.trim() : '',
        periodo: periodoExamenesInput ? periodoExamenesInput.value.trim() : '',
        cierre_inscripcion: cierreInscripcionInput ? cierreInscripcionInput.value.trim() : '',
        estado: estadoTurnoInput ? estadoTurnoInput.value : 'Programado'
      };

      const { error } = await supabaseClient
        .from('calendario_examenes')
        .insert([datosTurno]);

      if (error) {
        alert('Error al guardar el turno de examen: ' + error.message);
        return;
      }

      formTurnoExamen.reset();
      alert('Turno de examen guardado correctamente.');
      await cargarTurnosExamen();
    });
  }

  // Carga inicial
  cargarTramites();
  cargarTurnosExamen();
});