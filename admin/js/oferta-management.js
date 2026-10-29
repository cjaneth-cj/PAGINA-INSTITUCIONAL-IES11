// admin/js/oferta-management.js
// Lógica para la gestión de Oferta Académica y Carreras conectada a Supabase

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCarrera');
  const carreraIdInput = document.getElementById('carreraId');
  const nombreInput = document.getElementById('nombre');
  const descripcionInput = document.getElementById('descripcion');
  const duracionInput = document.getElementById('duracion');
  const tituloInput = document.getElementById('titulo');
  const pdfPlanInput = document.getElementById('pdfPlan');
  const tablaCarreras = document.getElementById('tablaCarreras');
  const formTitulo = document.getElementById('formTitulo');
  const btnCancelar = document.getElementById('btnCancelar');
  const pdfActualInfo = document.getElementById('pdfActualInfo');
  const fileSelectedText = document.getElementById('fileSelectedText');

  let urlPdfExistente = null;

  // Mostrar nombre del PDF seleccionado
  pdfPlanInput.addEventListener('change', () => {
    if (pdfPlanInput.files[0]) {
      fileSelectedText.style.display = 'block';
      fileSelectedText.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Archivo: <strong>${pdfPlanInput.files[0].name}</strong>`;
    }
  });

  // 1. Cargar las carreras de Supabase
  async function cargarCarreras() {
    if (typeof supabaseClient === 'undefined') {
      console.error('Supabase no está disponible.');
      return;
    }

    const { data: carreras, error } = await supabaseClient
      .from('carreras')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al traer carreras:', error);
      tablaCarreras.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error al cargar datos.</td></tr>';
      return;
    }

    if (!carreras || carreras.length === 0) {
      tablaCarreras.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">No hay carreras registradas todavía.</td></tr>';
      return;
    }

    tablaCarreras.innerHTML = '';
    carreras.forEach(c => {
      const enlacePdf = c.plan_estudio_url 
        ? `<a href="${c.plan_estudio_url}" target="_blank" class="pdf-badge"><i class="fa-solid fa-file-pdf"></i> Ver PDF</a>` 
        : '<span class="pdf-empty">Sin archivo</span>';

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><strong>${c.nombre}</strong></td>
        <td>${c.duracion || '-'}</td>
        <td>${enlacePdf}</td>
        <td style="text-align: right;">
          <button class="btn-action btn-edit-tb" data-id="${c.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-action btn-delete-tb" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tablaCarreras.appendChild(fila);
    });
  }

  // Delegación de eventos para la tabla
  tablaCarreras.addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('.btn-edit-tb');
    const btnDel = e.target.closest('.btn-delete-tb');

    if (btnEdit) {
      const id = parseInt(btnEdit.getAttribute('data-id'));
      await prepararEdicion(id);
    }

    if (btnDel) {
      const id = parseInt(btnDel.getAttribute('data-id'));
      await eliminarCarrera(id);
    }
  });

  // 2. Guardar (Crear nueva o Editar existente)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = carreraIdInput.value;
    const nombre = nombreInput.value.trim();
    const descripcion = descripcionInput.value.trim();
    const duracion = duracionInput.value.trim();
    const titulo_otorgado = tituloInput.value.trim();
    const archivoPdf = pdfPlanInput.files[0];

    let plan_estudio_url = urlPdfExistente;

    if (archivoPdf) {
      const extension = archivoPdf.name.split('.').pop();
      const nombreLimpio = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const path = `planes/${Date.now()}-${nombreLimpio}.${extension}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('archivos')
        .upload(path, archivoPdf, { upsert: true });

      if (uploadError) {
        alert('Error al subir el archivo PDF: ' + uploadError.message);
        return;
      }

      const { data: publicData } = supabaseClient.storage
        .from('archivos')
        .getPublicUrl(path);

      plan_estudio_url = publicData.publicUrl;
    }

    const datosCarrera = {
      nombre,
      descripcion,
      duracion,
      titulo_otorgado,
      plan_estudio_url
    };

    if (id) {
      const { error } = await supabaseClient
        .from('carreras')
        .update(datosCarrera)
        .eq('id', id);

      if (error) {
        alert('Error al actualizar: ' + error.message);
      } else {
        limpiarFormulario();
        cargarCarreras();
      }
    } else {
      const { error } = await supabaseClient
        .from('carreras')
        .insert([datosCarrera]);

      if (error) {
        alert('Error al crear: ' + error.message);
      } else {
        limpiarFormulario();
        cargarCarreras();
      }
    }
  });

  // 3. Preparar formulario para Editar
  async function prepararEdicion(id) {
    const { data: c, error } = await supabaseClient
      .from('carreras')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      alert('No se pudieron obtener los datos de la carrera.');
      return;
    }

    carreraIdInput.value = c.id;
    nombreInput.value = c.nombre;
    descripcionInput.value = c.descripcion || '';
    duracionInput.value = c.duracion || '';
    tituloInput.value = c.titulo_otorgado || '';
    urlPdfExistente = c.plan_estudio_url;

    formTitulo.innerHTML = '<i class="fa-solid fa-pen" style="color: var(--oferta-primary, #2563eb);"></i> Editar Carrera';
    btnCancelar.style.display = 'inline-block';

    if (c.plan_estudio_url) {
      pdfActualInfo.style.display = 'block';
      pdfActualInfo.innerHTML = `Plan actual: <a href="${c.plan_estudio_url}" target="_blank">Ver archivo cargado</a> (seleccioná otro si querés reemplazarlo).`;
    } else {
      pdfActualInfo.style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 4. Eliminar Carrera
  async function eliminarCarrera(id) {
    const confirmar = confirm('¿Estás seguro de que querés eliminar esta carrera?');
    if (!confirmar) return;

    const { error } = await supabaseClient
      .from('carreras')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      cargarCarreras();
    }
  }

  // 5. Cancelar edición y limpiar formulario
  btnCancelar.addEventListener('click', limpiarFormulario);

  function limpiarFormulario() {
    form.reset();
    carreraIdInput.value = '';
    urlPdfExistente = null;
    formTitulo.innerHTML = '<i class="fa-solid fa-plus-circle" style="color: var(--oferta-primary, #2563eb);"></i> Nueva Carrera';
    btnCancelar.style.display = 'none';
    pdfActualInfo.style.display = 'none';
    fileSelectedText.style.display = 'none';
  }

  // Iniciar cargando la lista al abrir la página
  cargarCarreras();
});