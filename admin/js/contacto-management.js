document.addEventListener('DOMContentLoaded', () => {
  // 1. Obtener referencias con fallback de IDs
  const tabla = document.getElementById('tablaConsultas') || document.getElementById('tablaMensajes');
  const cantTotal = document.getElementById('cantTotal');
  const cantNuevos = document.getElementById('cantNuevos');
  const btnActualizar = document.getElementById('btnActualizar') || document.getElementById('btnActualizarConsultas');

  // Modal (si existe)
  const modal = document.getElementById('modalMensaje');
  const modalAsunto = document.getElementById('modalAsunto');
  const modalMeta = document.getElementById('modalMeta');
  const modalCuerpo = document.getElementById('modalCuerpo');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const btnMarcarLeido = document.getElementById('btnMarcarLeido');

  // 2. Función para cargar consultas desde Supabase
  async function cargarConsultas() {
    if (!tabla) return;
    tabla.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">Cargando consultas...</td></tr>';

    try {
      const { data: mensajes, error } = await supabaseClient
        .from('mensajes_contacto')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Actualizar contadores si existen en el HTML
      if (cantTotal) cantTotal.textContent = mensajes ? mensajes.length : 0;
      if (cantNuevos) {
        const sinLeer = mensajes ? mensajes.filter(m => !m.leido).length : 0;
        cantNuevos.textContent = sinLeer;
      }

      if (!mensajes || mensajes.length === 0) {
        tabla.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No hay mensajes registrados aún.</td></tr>';
        return;
      }

      tabla.innerHTML = '';
      mensajes.forEach(m => {
        const fecha = new Date(m.created_at).toLocaleDateString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        const badgeEstado = m.leido
          ? '<span style="font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; background: #f1f5f9; color: #64748b; font-weight: 700;">Leído</span>'
          : '<span style="font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; background: #fee2e2; color: #b91c1c; font-weight: 700;">Nuevo</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${badgeEstado}</td>
          <td style="color: var(--text-muted); font-size: 0.85rem;">${fecha}</td>
          <td><strong>${m.nombre || 'Anónimo'}</strong></td>
          <td style="font-size: 0.85rem;">
            <a href="mailto:${m.email}" style="color: #2563eb; text-decoration: none;">${m.email || '-'}</a>
            ${m.telefono ? `<br><small style="color: var(--text-muted);">${m.telefono}</small>` : ''}
          </td>
          <td>${m.asunto || 'Sin asunto'}</td>
          <td style="text-align: right;">
            <button class="btn-action btn-edit-tb" onclick="verMensaje(${m.id})" title="Leer mensaje">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn-action btn-delete-tb" onclick="eliminarConsulta(${m.id})" title="Eliminar">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
        tabla.appendChild(tr);
      });
    } catch (err) {
      console.error('Error al cargar consultas:', err);
      tabla.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #dc2626; padding: 20px;">Error al cargar datos: ${err.message}</td></tr>`;
    }
  }

  // 3. Listener seguro de botón Actualizar
  if (btnActualizar) {
    btnActualizar.addEventListener('click', cargarConsultas);
  }

  // 4. Modal de visualización
  window.verMensaje = async (id) => {
    try {
      const { data: m, error } = await supabaseClient
        .from('mensajes_contacto')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Marcar como leído en Supabase
      if (!m.leido) {
        await supabaseClient
          .from('mensajes_contacto')
          .update({ leido: true })
          .eq('id', id);
        cargarConsultas();
      }

      if (modal) {
        if (modalAsunto) modalAsunto.textContent = m.asunto || 'Consulta sin asunto';
        if (modalMeta) modalMeta.textContent = `De: ${m.nombre} (${m.email})`;
        if (modalCuerpo) modalCuerpo.textContent = m.mensaje || 'Sin contenido';
        modal.style.display = 'flex';
      } else {
        alert(`De: ${m.nombre} (${m.email})\nAsunto: ${m.asunto}\n\nMensaje:\n${m.mensaje}`);
      }
    } catch (err) {
      alert('Error al abrir mensaje: ' + err.message);
    }
  };

  // Cerrar modal
  if (btnCerrarModal && modal) {
    btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
  }
  if (btnMarcarLeido && modal) {
    btnMarcarLeido.addEventListener('click', () => modal.style.display = 'none');
  }

  // 5. Eliminar consulta
  window.eliminarConsulta = async (id) => {
    if (!confirm('¿Eliminar esta consulta permanentemente?')) return;
    const { error } = await supabaseClient.from('mensajes_contacto').delete().eq('id', id);
    if (error) alert('Error: ' + error.message);
    else cargarConsultas();
  };

  // Carga inicial
  cargarConsultas();
});