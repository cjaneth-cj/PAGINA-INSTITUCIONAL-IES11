// admin/js/contacto-management.js
// DASH-02: gestión de consultas con ciclo de vida completo.
// Estados: Nuevo -> Leído -> Pendiente de respuesta -> Respondido -> Finalizado.
//
// Compatibilidad: si la base todavía no tiene las columnas estado / responsable /
// respuesta / respondido_at, el módulo sigue funcionando con el campo `leido`
// y muestra un aviso para aplicar qa/sql/migracion-tickets.sql.

document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.getElementById('tablaConsultas') || document.getElementById('tablaMensajes');
  const cantTotal = document.getElementById('cantTotal');
  const cantNuevos = document.getElementById('cantNuevos');
  const cantPendientes = document.getElementById('cantPendientes');
  const cantFinalizados = document.getElementById('cantFinalizados');
  const btnActualizar = document.getElementById('btnActualizar') || document.getElementById('btnActualizarConsultas');
  const filtroEstado = document.getElementById('filtroEstado');
  const avisoEstados = document.getElementById('avisoEstados');

  const modal = document.getElementById('modalMensaje');
  const modalAsunto = document.getElementById('modalAsunto');
  const modalMeta = document.getElementById('modalMeta');
  const modalCuerpo = document.getElementById('modalCuerpo');
  const modalEstado = document.getElementById('modalEstado');
  const modalResponsable = document.getElementById('modalResponsable');
  const modalRespuesta = document.getElementById('modalRespuesta');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const btnAbrirCorreo = document.getElementById('btnAbrirCorreo');
  const btnGuardarRespuesta = document.getElementById('btnGuardarRespuesta');
  const btnFinalizar = document.getElementById('btnFinalizar');

  if (!tabla) return;

  const ESTADOS = ['Nuevo', 'Leído', 'Pendiente de respuesta', 'Respondido', 'Finalizado'];
  const COLUMNAS = {
    estado: false,
    responsable: false,
    respuesta: false,
    respondido_at: false
  };

  let mensajesCache = [];
  let mensajeActual = null;
  let emailAdmin = null;

  // -------------------------------------------------------------------------
  // Utilidades
  // -------------------------------------------------------------------------
  function claseBadge(estado) {
    switch (estado) {
      case 'Nuevo': return 'badge-nuevo';
      case 'Pendiente de respuesta': return 'badge-pendiente';
      case 'Respondido': return 'badge-respondido';
      case 'Finalizado': return 'badge-finalizado';
      default: return 'badge-leido';
    }
  }

  function estadoDe(m) {
    if (COLUMNAS.estado && ESTADOS.includes(m.estado)) return m.estado;
    return m.leido ? 'Leído' : 'Nuevo';
  }

  function fechaDe(valor) {
    if (!valor) return '-';
    return new Date(valor).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  async function obtenerEmailAdmin() {
    if (emailAdmin) return emailAdmin;
    try {
      const { data } = await supabaseClient.auth.getSession();
      emailAdmin = data?.session?.user?.email || 'Admin';
    } catch (e) {
      emailAdmin = 'Admin';
    }
    return emailAdmin;
  }

  async function existeColumna(nombre) {
    const { error } = await supabaseClient
      .from('mensajes_contacto')
      .select(nombre)
      .limit(1);
    return !error;
  }

  async function detectarColumnas() {
    const [estado, responsable, respuesta, respondidoAt] = await Promise.all([
      existeColumna('estado'),
      existeColumna('responsable'),
      existeColumna('respuesta'),
      existeColumna('respondido_at')
    ]);
    COLUMNAS.estado = estado;
    COLUMNAS.responsable = responsable;
    COLUMNAS.respuesta = respuesta;
    COLUMNAS.respondido_at = respondidoAt;

    if (avisoEstados) {
      if (!COLUMNAS.estado) {
        avisoEstados.hidden = false;
        avisoEstados.textContent =
          'El flujo completo de estados no está disponible: falta la columna "estado" en la tabla mensajes_contacto. Aplicá qa/sql/migracion-tickets.sql para habilitar «Pendiente de respuesta», «Respondido» y «Finalizado».';
      } else {
        avisoEstados.hidden = true;
      }
    }
  }

  function crearCelda(texto, opciones = {}) {
    const td = document.createElement('td');
    if (opciones.color) td.style.color = opciones.color;
    if (opciones.fontSize) td.style.fontSize = opciones.fontSize;
    if (opciones.alignRight) td.style.textAlign = 'right';
    if (texto instanceof Node) td.appendChild(texto);
    else td.textContent = texto;
    return td;
  }

  function crearBoton(icono, titulo, clases, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn-action ${clases || ''}`.trim();
    btn.title = titulo;
    btn.setAttribute('aria-label', titulo);
    const i = document.createElement('i');
    i.className = `fa-solid ${icono}`;
    btn.appendChild(i);
    btn.addEventListener('click', onClick);
    return btn;
  }

  // -------------------------------------------------------------------------
  // Carga y render
  // -------------------------------------------------------------------------
  async function cargarConsultas() {
    tabla.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Cargando consultas...</td></tr>';

    try {
      const { data: mensajes, error } = await supabaseClient
        .from('mensajes_contacto')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      mensajesCache = mensajes || [];
      actualizarContadores(mensajesCache);
      renderizarTabla();
    } catch (err) {
      console.error('Error al cargar consultas:', err);
      tabla.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #dc2626; padding: 20px;">No se pudieron cargar las consultas. Reintentá en unos minutos.</td></tr>';
    }
  }

  function actualizarContadores(mensajes) {
    if (cantTotal) cantTotal.textContent = mensajes.length;
    if (cantNuevos) cantNuevos.textContent = mensajes.filter(m => estadoDe(m) === 'Nuevo').length;
    if (cantPendientes) cantPendientes.textContent = mensajes.filter(m => estadoDe(m) === 'Pendiente de respuesta').length;
    if (cantFinalizados) cantFinalizados.textContent = mensajes.filter(m => estadoDe(m) === 'Finalizado').length;
  }

  function renderizarTabla() {
    const filtro = filtroEstado ? filtroEstado.value : '';

    const visibles = mensajesCache.filter(m => {
      if (!filtro) return true;
      if (filtro === 'Activas') return !['Respondido', 'Finalizado'].includes(estadoDe(m));
      return estadoDe(m) === filtro;
    });

    if (visibles.length === 0) {
      tabla.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No hay consultas para el filtro seleccionado.</td></tr>';
      return;
    }

    tabla.textContent = '';

    visibles.forEach(m => {
      const estado = estadoDe(m);
      const tr = document.createElement('tr');

      // Estado
      const tdEstado = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge-status ${claseBadge(estado)}`;
      badge.textContent = estado;
      tdEstado.appendChild(badge);
      tr.appendChild(tdEstado);

      // Fecha
      tr.appendChild(crearCelda(fechaDe(m.created_at), { color: 'var(--text-muted)', fontSize: '0.85rem' }));

      // Remitente
      const tdRemitente = document.createElement('td');
      const strong = document.createElement('strong');
      strong.textContent = m.nombre || 'Anónimo';
      tdRemitente.appendChild(strong);
      tr.appendChild(tdRemitente);

      // Contacto
      const tdContacto = document.createElement('td');
      tdContacto.style.fontSize = '0.85rem';
      const enlace = document.createElement('a');
      enlace.href = `mailto:${m.email || ''}`;
      enlace.style.color = '#2563eb';
      enlace.style.textDecoration = 'none';
      enlace.textContent = m.email || '-';
      tdContacto.appendChild(enlace);
      if (m.telefono) {
        const telefono = document.createElement('small');
        telefono.style.color = 'var(--text-muted)';
        telefono.style.display = 'block';
        telefono.textContent = m.telefono;
        tdContacto.appendChild(telefono);
      }
      tr.appendChild(tdContacto);

      // Asunto
      tr.appendChild(crearCelda(m.asunto || 'Sin asunto'));

      // Responsable
      tr.appendChild(crearCelda(
        (COLUMNAS.responsable && m.responsable) ? m.responsable : 'Sin asignar',
        { color: 'var(--text-muted)', fontSize: '0.8rem' }
      ));

      // Acciones
      const tdAcciones = crearCelda('', { alignRight: true });
      tdAcciones.appendChild(crearBoton('fa-eye', 'Leer mensaje', 'btn-edit-tb', () => verMensaje(m.id)));
      tdAcciones.appendChild(crearBoton('fa-reply', 'Responder consulta', 'btn-mail', () => responderPorCorreo(m.id)));
      tdAcciones.appendChild(crearBoton('fa-check', 'Finalizar atención', 'btn-close-tb', () => finalizarConsulta(m.id)));
      tdAcciones.appendChild(crearBoton('fa-trash', 'Eliminar consulta', 'btn-delete-tb', () => eliminarConsulta(m.id)));
      tr.appendChild(tdAcciones);

      tabla.appendChild(tr);
    });
  }

  // -------------------------------------------------------------------------
  // Cambio de estado
  // -------------------------------------------------------------------------
  async function cambiarEstado(id, nuevoEstado, extras = {}) {
    const payload = { leido: nuevoEstado !== 'Nuevo' };

    if (COLUMNAS.estado) payload.estado = nuevoEstado;
    if (COLUMNAS.responsable) payload.responsable = await obtenerEmailAdmin();
    if (COLUMNAS.respondido_at && ['Respondido', 'Finalizado'].includes(nuevoEstado)) {
      payload.respondido_at = new Date().toISOString();
    }
    if (COLUMNAS.respuesta && typeof extras.respuesta === 'string') {
      payload.respuesta = extras.respuesta;
    }

    const { error } = await supabaseClient
      .from('mensajes_contacto')
      .update(payload)
      .eq('id', id);

    if (error) {
      alert('No se pudo actualizar la consulta: ' + error.message);
      return false;
    }

    // Actualiza la copia local para no recargar toda la tabla
    const mensaje = mensajesCache.find(m => m.id === id);
    if (mensaje) Object.assign(mensaje, payload);

    if (!COLUMNAS.estado && avisoEstados) {
      avisoEstados.hidden = false;
      avisoEstados.textContent =
        'La consulta se marcó como leída. Para usar los estados «Pendiente de respuesta», «Respondido» y «Finalizado», aplicá la migración qa/sql/migracion-tickets.sql.';
    }

    actualizarContadores(mensajesCache);
    renderizarTabla();
    return true;
  }

  // -------------------------------------------------------------------------
  // Modal
  // -------------------------------------------------------------------------
  async function verMensaje(id) {
    try {
      const { data: m, error } = await supabaseClient
        .from('mensajes_contacto')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      mensajeActual = m;
      const estado = estadoDe(m);

      if (modalAsunto) modalAsunto.textContent = m.asunto || 'Consulta sin asunto';
      if (modalMeta) {
        modalMeta.textContent = `De: ${m.nombre || 'Anónimo'} (${m.email || 'sin email'}) · ${fechaDe(m.created_at)}`;
      }
      if (modalCuerpo) modalCuerpo.textContent = m.mensaje || 'Sin contenido';

      if (modalEstado) {
        modalEstado.innerHTML = '';
        ESTADOS.forEach(e => {
          const opcion = document.createElement('option');
          opcion.value = e;
          opcion.textContent = e;
          if (e === estado) opcion.selected = true;
          modalEstado.appendChild(opcion);
        });
        modalEstado.disabled = !COLUMNAS.estado;
      }

      if (modalResponsable) {
        modalResponsable.textContent = (COLUMNAS.responsable && m.responsable)
          ? `Responsable: ${m.responsable}`
          : 'Sin responsable asignado';
      }

      if (modalRespuesta) {
        modalRespuesta.value = (COLUMNAS.respuesta && m.respuesta) ? m.respuesta : '';
        modalRespuesta.disabled = !COLUMNAS.respuesta;
      }

      // Sin la migración, el flujo avanzado queda deshabilitado con aviso visible
      const flujoAvanzadoDisponible = COLUMNAS.estado && COLUMNAS.respuesta;
      if (btnGuardarRespuesta) {
        btnGuardarRespuesta.disabled = !flujoAvanzadoDisponible;
        btnGuardarRespuesta.title = flujoAvanzadoDisponible ? '' : 'Requiere la migración qa/sql/migracion-tickets.sql';
      }
      if (btnFinalizar) {
        btnFinalizar.disabled = !COLUMNAS.estado;
        btnFinalizar.title = COLUMNAS.estado ? '' : 'Requiere la migración qa/sql/migracion-tickets.sql';
      }

      if (btnAbrirCorreo) {
        const asunto = encodeURIComponent(`Respuesta a tu consulta: ${m.asunto || 'IES N° 11'}`);
        btnAbrirCorreo.href = `mailto:${encodeURIComponent(m.email || '')}?subject=${asunto}`;
        btnAbrirCorreo.style.display = m.email ? 'inline-flex' : 'none';
      }

      if (modal) modal.style.display = 'flex';

      // Al abrir una consulta nueva se marca como leída (comportamiento previo)
      if (estado === 'Nuevo') {
        const ok = await cambiarEstado(id, 'Leído');
        if (ok && modalEstado) modalEstado.value = 'Leído';
      }
    } catch (err) {
      console.error('Error al abrir consulta:', err);
      alert('No se pudo abrir la consulta.');
    }
  }

  async function responderPorCorreo(id) {
    const mensaje = mensajesCache.find(m => m.id === id);
    if (!mensaje) return;
    if (mensaje.email) {
      const asunto = encodeURIComponent(`Respuesta a tu consulta: ${mensaje.asunto || 'IES N° 11'}`);
      window.location.href = `mailto:${encodeURIComponent(mensaje.email)}?subject=${asunto}`;
    }
    await cambiarEstado(id, 'Respondido');
  }

  async function finalizarConsulta(id) {
    const mensaje = mensajesCache.find(m => m.id === id);
    if (!mensaje) return;
    if (!COLUMNAS.estado) {
      alert('Para finalizar consultas aplicá primero la migración qa/sql/migracion-tickets.sql.');
      return;
    }
    if (!confirm('¿Marcar esta consulta como finalizada? Se registrará que su atención terminó.')) return;
    await cambiarEstado(id, 'Finalizado');
  }

  async function guardarRespuesta() {
    if (!mensajeActual) return;
    if (!COLUMNAS.estado || !COLUMNAS.respuesta) {
      alert('Para registrar respuestas aplicá primero la migración qa/sql/migracion-tickets.sql.');
      return;
    }

    const texto = modalRespuesta ? modalRespuesta.value.trim() : '';
    if (!texto && COLUMNAS.respuesta) {
      alert('Escribí el texto de la respuesta antes de guardarla.');
      return;
    }

    const nuevoEstado = modalEstado ? modalEstado.value : 'Respondido';
    const ok = await cambiarEstado(mensajeActual.id, nuevoEstado, { respuesta: texto });

    if (ok) {
      if (modal) modal.style.display = 'none';
      mensajeActual = null;
    }
  }

  // -------------------------------------------------------------------------
  // Eliminar
  // -------------------------------------------------------------------------
  async function eliminarConsulta(id) {
    if (!confirm('¿Eliminar esta consulta permanentemente?')) return;
    const { error } = await supabaseClient.from('mensajes_contacto').delete().eq('id', id);
    if (error) {
      alert('No se pudo eliminar la consulta: ' + error.message);
      return;
    }
    mensajesCache = mensajesCache.filter(m => m.id !== id);
    actualizarContadores(mensajesCache);
    renderizarTabla();
  }

  // -------------------------------------------------------------------------
  // Eventos
  // -------------------------------------------------------------------------
  if (btnActualizar) btnActualizar.addEventListener('click', cargarConsultas);
  if (filtroEstado) filtroEstado.addEventListener('change', renderizarTabla);

  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }

  if (btnGuardarRespuesta) btnGuardarRespuesta.addEventListener('click', guardarRespuesta);

  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', async () => {
      if (!mensajeActual) return;
      const ok = await cambiarEstado(mensajeActual.id, 'Finalizado');
      if (ok && modal) modal.style.display = 'none';
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  });

  // Inicio
  (async () => {
    await detectarColumnas();
    await cargarConsultas();
  })();
});
