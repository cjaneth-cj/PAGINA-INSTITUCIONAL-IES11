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