// admin/js/novedades-management.js
// Lógica para la gestión de Novedades y Noticias conectada a Supabase

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formNoticia');
  const noticiaIdInput = document.getElementById('noticiaId');
  const tituloInput = document.getElementById('titulo');
  const fechaInput = document.getElementById('fecha');
  const contenidoInput = document.getElementById('contenido');
  const imagenInput = document.getElementById('imagenNoticia');
  const tablaNoticias = document.getElementById('tablaNoticias');
  const formTitulo = document.getElementById('formTitulo');
  const btnCancelar = document.getElementById('btnCancelar');
  const btnGuardar = document.getElementById('btnGuardar');
  const fileSelectedText = document.getElementById('fileSelectedText');
  const imgActualInfo = document.getElementById('imgActualInfo');

  let urlImagenExistente = null;

  // Fecha de hoy por defecto al cargar el formulario
  fechaInput.value = new Date().toISOString().split('T')[0];

  // Mostrar el nombre del archivo seleccionado en el dropzone
  imagenInput.addEventListener('change', () => {
    if (imagenInput.files[0]) {
      fileSelectedText.style.display = 'block';
      fileSelectedText.innerHTML = `<i class="fa-solid fa-file-image"></i> Archivo: <strong>${imagenInput.files[0].name}</strong>`;
    }
  });

  // 1. Cargar noticias desde Supabase
  async function cargarNoticias() {
    if (typeof supabaseClient === 'undefined') {
      console.error('Supabase no está disponible.');
      return;
    }

    const { data: noticias, error } = await supabaseClient
      .from('noticias')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      tablaNoticias.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error al cargar noticias.</td></tr>';
      return;
    }

    if (!noticias || noticias.length === 0) {
      tablaNoticias.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">No hay noticias publicadas aún.</td></tr>';
      return;
    }

    tablaNoticias.innerHTML = '';
    noticias.forEach(n => {
      const imgTag = n.imagen_url 
        ? `<img src="${n.imagen_url}" class="thumb" alt="Preview">` 
        : `<div class="thumb" style="background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:#94a3b8;"><i class="fa-solid fa-image"></i></div>`;

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${imgTag}</td>
        <td><strong>${n.titulo}</strong></td>
        <td style="color: var(--text-muted);">${n.fecha}</td>
        <td style="text-align: right;">
          <button class="btn-action btn-edit-tb" data-id="${n.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-action btn-delete-tb" data-id="${n.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tablaNoticias.appendChild(fila);
    });
  }

  // Delegación de eventos para la tabla (Editar y Eliminar)
  tablaNoticias.addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('.btn-edit-tb');
    const btnDel = e.target.closest('.btn-delete-tb');

    if (btnEdit) {
      const id = parseInt(btnEdit.getAttribute('data-id'));
      await prepararEdicion(id);
    }

    if (btnDel) {
      const id = parseInt(btnDel.getAttribute('data-id'));
      await eliminarNoticia(id);
    }
  });

  // 2. Guardar Noticia (Crear o Actualizar)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnGuardar.disabled = true;
    btnGuardar.innerText = 'Guardando...';

    const id = noticiaIdInput.value;
    const titulo = tituloInput.value.trim();
    const fecha = fechaInput.value;
    const contenido = contenidoInput.value.trim();
    const archivoImagen = imagenInput.files[0];

    let imagen_url = urlImagenExistente;

    // Subir imagen al Storage de Supabase si se seleccionó una nueva
    if (archivoImagen) {
      const ext = archivoImagen.name.split('.').pop();
      const path = `noticias/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('archivos')
        .upload(path, archivoImagen, { upsert: true });

      if (uploadError) {
        alert('Error al subir la imagen: ' + uploadError.message);
        btnGuardar.disabled = false;
        btnGuardar.innerText = 'Publicar Noticia';
        return;
      }

      const { data: publicData } = supabaseClient.storage
        .from('archivos')
        .getPublicUrl(path);

      imagen_url = publicData.publicUrl;
    }

    const datos = { titulo, fecha, contenido, imagen_url };

    if (id) {
      const { error } = await supabaseClient.from('noticias').update(datos).eq('id', id);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        limpiarFormulario();
        cargarNoticias();
      }
    } else {
      const { error } = await supabaseClient.from('noticias').insert([datos]);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        limpiarFormulario();
        cargarNoticias();
      }
    }

    btnGuardar.disabled = false;
    btnGuardar.innerText = 'Publicar Noticia';
  });

  // 3. Preparar formulario para edición
  async function prepararEdicion(id) {
    const { data: n, error } = await supabaseClient.from('noticias').select('*').eq('id', id).single();
    if (error) return;

    noticiaIdInput.value = n.id;
    tituloInput.value = n.titulo;
    fechaInput.value = n.fecha;
    contenidoInput.value = n.contenido;
    urlImagenExistente = n.imagen_url;

    formTitulo.innerHTML = '<i class="fa-solid fa-pen" style="color: var(--novedades-primary, #16a34a);"></i> Editar Noticia';
    btnCancelar.style.display = 'inline-block';

    if (n.imagen_url) {
      imgActualInfo.style.display = 'block';
      imgActualInfo.innerHTML = `Foto actual: <a href="${n.imagen_url}" target="_blank">Ver imagen</a> (subí otra si querés cambiarla).`;
    } else {
      imgActualInfo.style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 4. Eliminar Noticia
  async function eliminarNoticia(id) {
    if (!confirm('¿Seguro que querés eliminar esta noticia?')) return;
    const { error } = await supabaseClient.from('noticias').delete().eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      cargarNoticias();
    }
  }

  // Cancelar edición
  btnCancelar.addEventListener('click', limpiarFormulario);

  function limpiarFormulario() {
    form.reset();
    noticiaIdInput.value = '';
    urlImagenExistente = null;
    fechaInput.value = new Date().toISOString().split('T')[0];
    formTitulo.innerHTML = '<i class="fa-solid fa-plus-circle" style="color: var(--novedades-primary, #16a34a);"></i> Nueva Noticia';
    btnCancelar.style.display = 'none';
    imgActualInfo.style.display = 'none';
    fileSelectedText.style.display = 'none';
  }

  // Cargar lista inicial
  cargarNoticias();
});