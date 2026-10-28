// Verificar si hay sesión iniciada; si no hay, redirige al login
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    window.location.href = 'login.html';
  }
});
// Referencias del DOM
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

let urlPdfExistente = null; // Para conservar el PDF si se edita sin subir uno nuevo

// 1. Cargar las carreras de Supabase y pintarlas en la tabla
async function cargarCarreras() {
  const { data: carreras, error } = await supabase
    .from('carreras')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al traer carreras:', error);
    tablaCarreras.innerHTML = '<tr><td colspan="5">Error al cargar datos.</td></tr>';
    return;
  }

  if (!carreras || carreras.length === 0) {
    tablaCarreras.innerHTML = '<tr><td colspan="5">No hay carreras registradas todavía.</td></tr>';
    return;
  }

  tablaCarreras.innerHTML = '';
  carreras.forEach(c => {
    const enlacePdf = c.plan_estudio_url 
      ? `<a href="${c.plan_estudio_url}" target="_blank">Ver PDF</a>` 
      : 'Sin archivo';

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td><strong>${c.nombre}</strong></td>
      <td>${c.duracion || '-'}</td>
      <td>${c.titulo_otorgado || '-'}</td>
      <td>${enlacePdf}</td>
      <td>
        <button class="btn-edit" onclick="prepararEdicion(${c.id})">Editar</button>
        <button class="btn-delete" onclick="eliminarCarrera(${c.id})">Eliminar</button>
      </td>
    `;
    tablaCarreras.appendChild(fila);
  });
}

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

  // Subir el PDF a Supabase Storage si seleccionaron uno nuevo
  if (archivoPdf) {
    const extension = archivoPdf.name.split('.').pop();
    const nombreLimpio = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const path = `planes/${Date.now()}-${nombreLimpio}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('archivos')
      .upload(path, archivoPdf, { upsert: true });

    if (uploadError) {
      alert('Error al subir el archivo PDF: ' + uploadError.message);
      return;
    }

    // Obtener la URL pública del archivo
    const { data: publicData } = supabase.storage
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
    // Modo Edición
    const { error } = await supabase
      .from('carreras')
      .update(datosCarrera)
      .eq('id', id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      alert('Carrera actualizada correctamente');
      limpiarFormulario();
      cargarCarreras();
    }
  } else {
    // Modo Creación
    const { error } = await supabase
      .from('carreras')
      .insert([datosCarrera]);

    if (error) {
      alert('Error al crear: ' + error.message);
    } else {
      alert('Carrera guardada con éxito');
      limpiarFormulario();
      cargarCarreras();
    }
  }
});

// 3. Preparar formulario para Editar
window.prepararEdicion = async (id) => {
  const { data: c, error } = await supabase
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

  formTitulo.innerText = 'Editar Carrera';
  btnCancelar.style.display = 'inline-block';

  if (c.plan_estudio_url) {
    pdfActualInfo.style.display = 'block';
    pdfActualInfo.innerHTML = `Plan actual: <a href="${c.plan_estudio_url}" target="_blank">Ver archivo cargado</a> (seleccioná otro si querés reemplazarlo).`;
  } else {
    pdfActualInfo.style.display = 'none';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 4. Eliminar Carrera
window.eliminarCarrera = async (id) => {
  const confirmar = confirm('¿Estás seguro de que querés eliminar esta carrera?');
  if (!confirmar) return;

  const { error } = await supabase
    .from('carreras')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Error al eliminar: ' + error.message);
  } else {
    cargarCarreras();
  }
};

// 5. Cancelar edición y limpiar formulario
btnCancelar.addEventListener('click', limpiarFormulario);

function limpiarFormulario() {
  form.reset();
  carreraIdInput.value = '';
  urlPdfExistente = null;
  formTitulo.innerText = 'Agregar Nueva Carrera';
  btnCancelar.style.display = 'none';
  pdfActualInfo.style.display = 'none';
}

// Iniciar cargando la lista al abrir la página
cargarCarreras();