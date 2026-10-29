// admin/js/contacto-management.js
// Lógica para el buzón de consultas y mensajes de contacto conectados a Supabase

document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.getElementById('tablaMensajes');
  const btnActualizar = document.getElementById('btnActualizar');
  const modalLectura = document.getElementById('modalLectura');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  
  let listaMensajes = [];

  // Función principal para cargar los mensajes
  async function cargarMensajes() {
    if (typeof supabaseClient === 'undefined') {
      console.error('Supabase no está disponible.');
      return;
    }

    const { data, error } = await supabaseClient
      .from('mensajes_contacto')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tabla.innerHTML = '<tr><td colspan="6" style="text-align:center;">Error al cargar consultas.</td></tr>';
      return;
    }

    if (!data || data.length === 0) {
      tabla.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No hay consultas en el buzón actualmente.</td></tr>';
      return;
    }

    listaMensajes = data;
    tabla.innerHTML = '';

    data.forEach(m => {
      const fechaFormateada = new Date(m.created_at).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${m.leido ? '<span class="badge-leido">Leído</span>' : '<span class="badge-nuevo">Nuevo</span>'}</td>
        <td>${fechaFormateada}</td>
        <td><strong>${m.nombre}</strong></td>
        <td>${m.email}<br><small style="color:var(--text-muted)">${m.telefono || '-'}</small></td>
        <td>${m.asunto || 'Sin asunto'}</td>
        <td style="text-align: right;">
          <button class="btn-action btn-view" data-id="${m.id}"><i class="fa-solid fa-eye"></i> Leer</button>
          <button class="btn-action btn-del" data-id="${m.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tabla.appendChild(fila);
    });
  }

  // Evento para los botones de la tabla (Delegación de eventos)
  tabla.addEventListener('click', async (e) => {
    const btnView = e.target.closest('.btn-view');
    const btnDel = e.target.closest('.btn-del');

    if (btnView) {
      const id = parseInt(btnView.getAttribute('data-id'));
      await verMensaje(id);
    }

    if (btnDel) {
      const id = parseInt(btnDel.getAttribute('data-id'));
      await eliminarMensaje(id);
    }
  });

  // Ver mensaje en el modal
  async function verMensaje(id) {
    const msg = listaMensajes.find(m => m.id === id);
    if (!msg) return;

    document.getElementById('modalAsunto').innerText = msg.asunto || 'Consulta sin asunto';
    document.getElementById('modalDe').innerText = msg.nombre;
    document.getElementById('modalEmail').innerText = msg.email;
    document.getElementById('modalTel').innerText = msg.telefono || 'No especificado';
    document.getElementById('modalTexto').innerText = msg.mensaje;

    modalLectura.style.display = 'flex';

    // Marcar como leído en Supabase si era nuevo
    if (!msg.leido) {
      await supabaseClient
        .from('mensajes_contacto')
        .update({ leido: true })
        .eq('id', id);
      msg.leido = true;
    }
  }

  // Cerrar modal
  function cerrarModal() {
    modalLectura.style.display = 'none';
    cargarMensajes();
  }

  btnCerrarModal.addEventListener('click', cerrarModal);

  // Eliminar mensaje
  async function eliminarMensaje(id) {
    if (!confirm('¿Eliminar esta consulta?')) return;
    const { error } = await supabaseClient.from('mensajes_contacto').delete().eq('id', id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      cargarMensajes();
    }
  }

  // Botón de actualización manual
  btnActualizar.addEventListener('click', cargarMensajes);

  // Inicializar carga al abrir
  cargarMensajes();
});