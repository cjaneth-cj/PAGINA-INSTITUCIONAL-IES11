// admin/js/agenda-management.js
// Lógica para la gestión de la Agenda Institucional conectada a Supabase

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formAgenda');
  const eventoIdInput = document.getElementById('eventoId');
  const tituloInput = document.getElementById('titulo');
  const fechaInput = document.getElementById('fecha');
  const horaInput = document.getElementById('hora');
  const categoriaInput = document.getElementById('categoria');
  const lugarInput = document.getElementById('lugar');
  const descripcionInput = document.getElementById('descripcion');
  const tablaAgenda = document.getElementById('tablaAgenda');
  const formTitle = document.getElementById('formTitle');
  const btnCancelar = document.getElementById('btnCancelar');

  // Cargar eventos iniciales al abrir la página
  cargarEventos();

  // Función para cargar y pintar los eventos de la tabla
  async function cargarEventos() {
    if (typeof supabaseClient === 'undefined') {
      console.error('Supabase no está disponible.');
      return;
    }

    const { data: eventos, error } = await supabaseClient
      .from('agenda')
      .select('*')
      .order('fecha', { ascending: true });

    if (error) {
      tablaAgenda.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error al cargar datos.</td></tr>';
      return;
    }

    if (!eventos || eventos.length === 0) {
      tablaAgenda.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">No hay eventos agendados aún.</td></tr>';
      return;
    }

    tablaAgenda.innerHTML = '';
    eventos.forEach(ev => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>
          <strong>${ev.fecha}</strong>
          ${ev.hora ? `<br><small style="color:var(--text-muted);">${ev.hora.slice(0,5)} hs</small>` : ''}
        </td>
        <td>
          <strong>${ev.titulo}</strong>
          ${ev.lugar ? `<br><small style="color:var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${ev.lugar}</small>` : ''}
        </td>
        <td><span class="tag">${ev.categoria}</span></td>
        <td style="text-align: right;">
          <button class="btn-action btn-edit-tb" onclick="window.editarEvento(${ev.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-action btn-delete-tb" onclick="window.eliminarEvento(${ev.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tablaAgenda.appendChild(fila);
    });
  }

  // Manejar el envío del formulario (Crear o Actualizar)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = eventoIdInput.value;
    const datos = {
      titulo: tituloInput.value.trim(),
      fecha: fechaInput.value,
      hora: horaInput.value || null,
      categoria: categoriaInput.value,
      lugar: lugarInput.value.trim() || null,
      descripcion: descripcionInput.value.trim() || null
    };

    if (id) {
      const { error } = await supabaseClient.from('agenda').update(datos).eq('id', id);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        limpiar();
        cargarEventos();
      }
    } else {
      const { error } = await supabaseClient.from('agenda').insert([datos]);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        limpiar();
        cargarEventos();
      }
    }
  });

  // Preparar formulario para editar evento (expuesto globalmente para el onclick del HTML)
  window.editarEvento = async (id) => {
    const { data: ev, error } = await supabaseClient.from('agenda').select('*').eq('id', id).single();
    if (error) return;

    eventoIdInput.value = ev.id;
    tituloInput.value = ev.titulo;
    fechaInput.value = ev.fecha;
    horaInput.value = ev.hora || '';
    categoriaInput.value = ev.categoria;
    lugarInput.value = ev.lugar || '';
    descripcionInput.value = ev.descripcion || '';

    formTitle.innerHTML = '<i class="fa-solid fa-pen" style="color: var(--agenda-primary, #d97706);"></i> Editar Evento';
    btnCancelar.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Eliminar evento de la base de datos (expuesto globalmente)
  window.eliminarEvento = async (id) => {
    if (!confirm('¿Eliminar este evento de la agenda?')) return;
    const { error } = await supabaseClient.from('agenda').delete().eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      cargarEventos();
    }
  };

  // Botón cancelar edición
  btnCancelar.addEventListener('click', limpiar);

  function limpiar() {
    form.reset();
    eventoIdInput.value = '';
    formTitle.innerHTML = '<i class="fa-solid fa-calendar-plus" style="color: var(--agenda-primary, #d97706);"></i> Nuevo Evento';
    btnCancelar.style.display = 'none';
  }
});