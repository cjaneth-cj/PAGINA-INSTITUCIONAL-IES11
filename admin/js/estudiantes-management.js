// admin/js/estudiantes-management.js
// Lógica para la gestión de solicitudes estudiantiles conectada a Supabase

document.addEventListener('DOMContentLoaded', () => {
  const tablaSolicitudes = document.getElementById('tablaSolicitudes');
  const filtroPreceptor = document.getElementById('filtroPreceptor');
  const filtroEstado = document.getElementById('filtroEstado');
  const btnImprimir = document.getElementById('btnImprimir');

  let listaSolicitudes = [];

  // 1. Cargar las solicitudes desde Supabase
  async function cargarSolicitudes() {
    if (typeof supabaseClient === 'undefined') {
      console.error('Supabase no está disponible.');
      return;
    }

    const { data, error } = await supabaseClient
      .from('solicitudes_estudiantes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar solicitudes:', error);
      tablaSolicitudes.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error al cargar datos.</td></tr>';
      return;
    }

    listaSolicitudes = data || [];
    poblarFiltroPreceptores(listaSolicitudes);
    renderizarTabla(listaSolicitudes);
  }

  // 2. Poblar opciones del selector de preceptores de forma automática según los registros
  function poblarFiltroPreceptores(solicitudes) {
    const preceptoresUnicos = [...new Set(solicitudes.map(s => s.preceptor).filter(Boolean))];
    const valorActual = filtroPreceptor.value;
    
    filtroPreceptor.innerHTML = '<option value="">Todos los preceptores</option>';
    preceptoresUnicos.forEach(p => {
      filtroPreceptor.innerHTML += `<option value="${p}">${p}</option>`;
    });
    filtroPreceptor.value = valorActual;
  }

  // 3. Renderizar filas en la tabla según filtros aplicados
  function renderizarTabla(solicitudes) {
    const pFiltro = filtroPreceptor.value.toLowerCase();
    const eFiltro = filtroEstado.value;

    const filtradas = solicitudes.filter(s => {
      const matchPreceptor = pFiltro === '' || (s.preceptor && s.preceptor.toLowerCase().includes(pFiltro));
      const matchEstado = eFiltro === '' || s.estado === eFiltro;
      return matchPreceptor && matchEstado;
    });

    if (filtradas.length === 0) {
      tablaSolicitudes.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No se encontraron solicitudes registradas.</td></tr>';
      return;
    }

    tablaSolicitudes.innerHTML = '';
    filtradas.forEach(s => {
      const fecha = new Date(s.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      let badgeClass = 'estado-pend';
      if (s.estado === 'En Proceso') badgeClass = 'estado-proc';
      if (s.estado === 'Listo para retirar') badgeClass = 'estado-list';

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><small style="color: var(--text-muted);">${fecha}</small></td>
        <td>
          <strong>${s.nombre_completo}</strong><br>
          <small style="color: var(--text-muted);">DNI: ${s.dni}</small>
        </td>
        <td>
          ${s.carrera}<br>
          <small style="color: var(--text-muted);">Ingreso: ${s.anio_inicio}</small>
        </td>
        <td>
          <strong>${s.tipo_tramite}</strong>
          ${s.mensaje_adicional ? `<br><small style="color: var(--text-muted);">Obs: ${s.mensaje_adicional}</small>` : ''}
        </td>
        <td>${s.preceptor || 'Sin asignar'}</td>
        <td>
          <select class="select-estado" data-id="${s.id}">
            <option value="Pendiente" ${s.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="En Proceso" ${s.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
            <option value="Listo para retirar" ${s.estado === 'Listo para retirar' ? 'selected' : ''}>Listo para retirar</option>
          </select>
        </td>
        <td style="text-align: right;" class="no-print">
          <button class="btn-action btn-mail" data-email="${s.email}" data-nombre="${s.nombre_completo}" data-tramite="${s.tipo_tramite}" title="Enviar Correo de Aviso"><i class="fa-solid fa-envelope"></i></button>
          <button class="btn-action btn-delete" data-id="${s.id}" title="Eliminar Solicitud"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tablaSolicitudes.appendChild(fila);
    });
  }

  // 4. Cambiar estado directamente desde el select de la tabla
  tablaSolicitudes.addEventListener('change', async (e) => {
    if (e.target.classList.contains('select-estado')) {
      const id = e.target.getAttribute('data-id');
      const nuevoEstado = e.target.value;

      const { error } = await supabaseClient
        .from('solicitudes_estudiantes')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) {
        alert('Error al actualizar el estado: ' + error.message);
      } else {
        // Actualizar localmente
        const item = listaSolicitudes.find(s => s.id == id);
        if (item) item.estado = nuevoEstado;
        renderizarTabla(listaSolicitudes);
      }
    }
  });

  // 5. Botones de acción en la tabla (Correo y Eliminar)
  tablaSolicitudes.addEventListener('click', async (e) => {
    const btnMail = e.target.closest('.btn-mail');
    const btnDel = e.target.closest('.btn-delete');

    if (btnMail) {
      const email = btnMail.getAttribute('data-email');
      const nombre = btnMail.getAttribute('data-nombre');
      const tramite = btnMail.getAttribute('data-tramite');
      
      const asunto = encodeURIComponent(`Actualización sobre tu trámite: ${tramite} - IES N° 11`);
      const cuerpo = encodeURIComponent(`Hola ${nombre},\n\nTe escribimos desde Bedelía del IES N° 11 para informarte que tu solicitud de "${tramite}" ha sido procesada y ya se encuentra lista para retirar.\n\nSaludos cordiales.`);
      
      window.location.href = `mailto:${email}?subject=${asunto}&body=${cuerpo}`;
    }

    if (btnDel) {
      const id = btnDel.getAttribute('data-id');
      if (!confirm('¿Estás seguro de eliminar esta solicitud del registro?')) return;

      const { error } = await supabaseClient
        .from('solicitudes_estudiantes')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        cargarSolicitudes();
      }
    }
  });

  // Eventos de filtrado
  filtroPreceptor.addEventListener('change', () => renderizarTabla(listaSolicitudes));
  filtroEstado.addEventListener('change', () => renderizarTabla(listaSolicitudes));

  // Evento de impresión
  btnImprimir.addEventListener('click', () => {
    window.print();
  });

  // Carga inicial
  cargarSolicitudes();
});

// ==========================================
// GESTIÓN DE CALENDARIO DE EXÁMENES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const formExamen = document.getElementById('formExamen');
  const examenIdInput = document.getElementById('examenId');
  const turnoInput = document.getElementById('turno');
  const periodoInput = document.getElementById('periodo');
  const cierreInput = document.getElementById('cierre');
  const estadoExamenInput = document.getElementById('estadoExamen');
  const tablaExamenesAdmin = document.getElementById('tablaExamenesAdmin');
  const formExamenTitulo = document.getElementById('formExamenTitulo');
  const btnCancelarExamen = document.getElementById('btnCancelarExamen');
  const btnGuardarExamen = document.getElementById('btnGuardarExamen');

  let listaExamenes = [];

  async function cargarExamenesAdmin() {
    if (typeof supabaseClient === 'undefined') return;

    const { data, error } = await supabaseClient
      .from('calendario_examenes')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al cargar exámenes:', error);
      return;
    }

    listaExamenes = data || [];
    renderizarTablaExamenes(listaExamenes);
  }

  function renderizarTablaExamenes(examenes) {
    if (!examenes.length) {
      tablaExamenesAdmin.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No hay turnos cargados.</td></tr>';
      return;
    }

    tablaExamenesAdmin.innerHTML = '';
    examenes.forEach(ex => {
      let badgeStyle = 'background: #f1f5f9; color: #64748b;';
      if (ex.estado === 'Inscripciones Abiertas') badgeStyle = 'background: #dcfce7; color: #15803d;';
      if (ex.estado === 'Concluido') badgeStyle = 'background: #fee2e2; color: #b91c1c;';

      tablaExamenesAdmin.innerHTML += `
        <tr>
          <td><strong>${ex.turno}</strong></td>
          <td>${ex.periodo}</td>
          <td>${ex.cierre_inscripcion}</td>
          <td><span style="font-size:0.75rem; padding:3px 8px; border-radius:4px; font-weight:700; ${badgeStyle}">${ex.estado}</span></td>
          <td style="text-align: right;">
            <button class="btn-action btn-edit-ex" data-id="${ex.id}" style="background:#fef3c7; color:#b45309; border:none; padding:6px 8px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-action btn-del-ex" data-id="${ex.id}" style="background:#fee2e2; color:#dc2626; border:none; padding:6px 8px; border-radius:6px; cursor:pointer; margin-left:4px;"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `;
    });
  }

  formExamen.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = examenIdInput.value;
    const datos = {
      turno: turnoInput.value.trim(),
      periodo: periodoInput.value.trim(),
      cierre_inscripcion: cierreInput.value.trim(),
      estado: estadoExamenInput.value
    };

    if (id) {
      const { error } = await supabaseClient.from('calendario_examenes').update(datos).eq('id', id);
      if (error) alert('Error al actualizar: ' + error.message);
      else { limpiarFormExamen(); cargarExamenesAdmin(); }
    } else {
      const { error } = await supabaseClient.from('calendario_examenes').insert([datos]);
      if (error) alert('Error al crear: ' + error.message);
      else { limpiarFormExamen(); cargarExamenesAdmin(); }
    }
  });

  tablaExamenesAdmin.addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('.btn-edit-ex');
    const btnDel = e.target.closest('.btn-del-ex');

    if (btnEdit) {
      const id = btnEdit.getAttribute('data-id');
      const ex = listaExamenes.find(item => item.id == id);
      if (!ex) return;

      examenIdInput.value = ex.id;
      turnoInput.value = ex.turno;
      periodoInput.value = ex.periodo;
      cierreInput.value = ex.cierre_inscripcion;
      estadoExamenInput.value = ex.estado;

      formExamenTitulo.innerText = 'Editar Turno de Examen';
      btnCancelarExamen.style.display = 'block';
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    if (btnDel) {
      const id = btnDel.getAttribute('data-id');
      if (!confirm('¿Eliminar este turno del calendario?')) return;

      const { error } = await supabaseClient.from('calendario_examenes').delete().eq('id', id);
      if (error) alert('Error al eliminar: ' + error.message);
      else cargarExamenesAdmin();
    }
  });

  btnCancelarExamen.addEventListener('click', limpiarFormExamen);

  function limpiarFormExamen() {
    formExamen.reset();
    examenIdInput.value = '';
    formExamenTitulo.innerText = 'Nuevo Turno de Examen';
    btnCancelarExamen.style.display = 'none';
  }

  cargarExamenesAdmin();
});