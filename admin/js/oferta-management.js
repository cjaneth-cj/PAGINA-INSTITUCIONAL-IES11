// Elementos del DOM
const form = document.getElementById('formCarrera');
const carreraIdInput = document.getElementById('carreraId');
const nombreInput = document.getElementById('nombre');
const descripcionInput = document.getElementById('descripcion');
const duracionInput = document.getElementById('duracion');
const tituloInput = document.getElementById('titulo');
const categoriaInput = document.getElementById('categoria'); // <-- Toma el selector de categoría
const logoCarreraInput = document.getElementById('logoCarrera');
const pdfPlanInput = document.getElementById('pdfPlan');
const tablaCarreras = document.getElementById('tablaCarreras');
const formTitulo = document.getElementById('formTitulo');
const btnCancelar = document.getElementById('btnCancelar');
const btnGuardar = document.getElementById('btnGuardar');

// Feedbacks visuales
const fileSelectedLogoText = document.getElementById('fileSelectedLogoText');
const fileSelectedPdfText = document.getElementById('fileSelectedPdfText');
const logoActualInfo = document.getElementById('logoActualInfo');
const pdfActualInfo = document.getElementById('pdfActualInfo');

let urlLogoExistente = null;
let urlPdfExistente = null;

// Aviso al seleccionar logo
if (logoCarreraInput) {
  logoCarreraInput.addEventListener('change', () => {
    if (logoCarreraInput.files[0] && fileSelectedLogoText) {
      fileSelectedLogoText.style.display = 'block';
      fileSelectedLogoText.innerHTML = `<i class="fa-solid fa-file-image"></i> Logo: <strong>${logoCarreraInput.files[0].name}</strong>`;
    }
  });
}

// Aviso al seleccionar PDF
if (pdfPlanInput) {
  pdfPlanInput.addEventListener('change', () => {
    if (pdfPlanInput.files[0] && fileSelectedPdfText) {
      fileSelectedPdfText.style.display = 'block';
      fileSelectedPdfText.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Plan: <strong>${pdfPlanInput.files[0].name}</strong>`;
    }
  });
}

// 1. Cargar carreras de Supabase
async function cargarCarreras() {
  if (!tablaCarreras) return;

  const { data: carreras, error } = await supabaseClient
    .from('carreras')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tablaCarreras.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Error al cargar carreras.</td></tr>';
    return;
  }

  if (!carreras || carreras.length === 0) {
    tablaCarreras.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No hay carreras registradas todavía.</td></tr>';
    return;
  }

  tablaCarreras.innerHTML = '';
  carreras.forEach(c => {
    const enlacePdf = c.plan_estudio_url 
      ? `<a href="${c.plan_estudio_url}" target="_blank" class="pdf-badge" style="display:inline-flex; align-items:center; gap:6px; background:#eff6ff; color:#2563eb; padding:4px 10px; border-radius:6px; font-size:0.8rem; font-weight:700; text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> Ver Plan</a>` 
      : '<span style="color:var(--text-muted); font-size:0.8rem; font-style:italic;">Sin PDF</span>';

    const logoImg = c.logo_url
      ? `<img src="${c.logo_url}" class="thumb-carrera" alt="Logo">`
      : `<div class="thumb-carrera" style="display:flex; align-items:center; justify-content:center; color:#94a3b8;"><i class="fa-solid fa-graduation-cap"></i></div>`;

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${logoImg}</td>
      <td>
        <strong>${c.nombre}</strong>
        ${c.categoria ? `<br><small style="color: var(--primary); text-transform: capitalize; font-weight: 600;">${c.categoria}</small>` : ''}
      </td>
      <td>${c.duracion || '-'}</td>
      <td>${enlacePdf}</td>
      <td style="text-align: right;">
        <button class="btn-action btn-edit-tb" onclick="prepararEdicion(${c.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-action btn-delete-tb" onclick="eliminarCarrera(${c.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tablaCarreras.appendChild(fila);
  });
}

// 2. Guardar (Crear o Editar)
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnGuardar.disabled = true;
    btnGuardar.innerText = 'Guardando...';

    const id = carreraIdInput.value;
    const nombre = nombreInput.value.trim();
    const descripcion = descripcionInput ? descripcionInput.value.trim() : '';
    const duracion = duracionInput ? duracionInput.value.trim() : '';
    const titulo_otorgado = tituloInput ? tituloInput.value.trim() : '';
    const categoria = categoriaInput ? categoriaInput.value : ''; // <-- Lee la categoría elegida
    const archivoLogo = logoCarreraInput ? logoCarreraInput.files[0] : null;
    const archivoPdf = pdfPlanInput ? pdfPlanInput.files[0] : null;

    let logo_url = urlLogoExistente;
    let plan_estudio_url = urlPdfExistente;

    const nombreLimpio = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Subir Logo si se seleccionó uno nuevo
    if (archivoLogo) {
      const extLogo = archivoLogo.name.split('.').pop();
      const pathLogo = `logos/${Date.now()}-${nombreLimpio}.${extLogo}`;

      const { error: errLogo } = await supabaseClient.storage
        .from('archivos')
        .upload(pathLogo, archivoLogo, { upsert: true });

      if (errLogo) {
        alert('Error al subir el logo: ' + errLogo.message);
        btnGuardar.disabled = false;
        btnGuardar.innerText = 'Guardar Carrera';
        return;
      }

      const { data: pubLogo } = supabaseClient.storage.from('archivos').getPublicUrl(pathLogo);
      logo_url = pubLogo.publicUrl;
    }

    // Subir PDF si se seleccionó uno nuevo
    if (archivoPdf) {
      const extPdf = archivoPdf.name.split('.').pop();
      const pathPdf = `planes/${Date.now()}-${nombreLimpio}.${extPdf}`;

      const { error: errPdf } = await supabaseClient.storage
        .from('archivos')
        .upload(pathPdf, archivoPdf, { upsert: true });

      if (errPdf) {
        alert('Error al subir el plan PDF: ' + errPdf.message);
        btnGuardar.disabled = false;
        btnGuardar.innerText = 'Guardar Carrera';
        return;
      }

      const { data: pubPdf } = supabaseClient.storage.from('archivos').getPublicUrl(pathPdf);
      plan_estudio_url = pubPdf.publicUrl;
    }

    const datosCarrera = {
      nombre,
      descripcion,
      duracion,
      titulo_otorgado,
      categoria, // <-- Se envía a Supabase
      logo_url,
      plan_estudio_url
    };

    if (id) {
      const { error } = await supabaseClient.from('carreras').update(datosCarrera).eq('id', id);
      if (error) alert('Error al actualizar: ' + error.message);
      else {
        limpiarFormulario();
        cargarCarreras();
      }
    } else {
      const { error } = await supabaseClient.from('carreras').insert([datosCarrera]);
      if (error) alert('Error al guardar: ' + error.message);
      else {
        limpiarFormulario();
        cargarCarreras();
      }
    }

    btnGuardar.disabled = false;
    btnGuardar.innerText = 'Guardar Carrera';
  });
}

// 3. Preparar edición
window.prepararEdicion = async (id) => {
  const { data: c, error } = await supabaseClient.from('carreras').select('*').eq('id', id).single();
  if (error) return;

  carreraIdInput.value = c.id;
  nombreInput.value = c.nombre;
  if (descripcionInput) descripcionInput.value = c.descripcion || '';
  if (duracionInput) duracionInput.value = c.duracion || '';
  if (tituloInput) tituloInput.value = c.titulo_otorgado || '';
  if (categoriaInput) categoriaInput.value = c.categoria || ''; // <-- Pone la categoría que ya tenía cargada
  urlLogoExistente = c.logo_url;
  urlPdfExistente = c.plan_estudio_url;

  if (formTitulo) formTitulo.innerHTML = '<i class="fa-solid fa-pen" style="color: var(--primary);"></i> Editar Carrera';
  if (btnCancelar) btnCancelar.style.display = 'inline-block';

  if (c.logo_url && logoActualInfo) {
    logoActualInfo.style.display = 'block';
    logoActualInfo.innerHTML = `Logo actual: <a href="${c.logo_url}" target="_blank" style="color:var(--primary); font-weight:600;">Ver imagen</a> (subí otra solo si querés cambiarla).`;
  } else if (logoActualInfo) {
    logoActualInfo.style.display = 'none';
  }

  if (c.plan_estudio_url && pdfActualInfo) {
    pdfActualInfo.style.display = 'block';
    pdfActualInfo.innerHTML = `Plan actual: <a href="${c.plan_estudio_url}" target="_blank" style="color:var(--primary); font-weight:600;">Ver PDF</a> (subí otro solo si querés cambiarlo).`;
  } else if (pdfActualInfo) {
    pdfActualInfo.style.display = 'none';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 4. Eliminar carrera
window.eliminarCarrera = async (id) => {
  if (!confirm('¿Seguro que querés eliminar esta carrera?')) return;
  const { error } = await supabaseClient.from('carreras').delete().eq('id', id);
  if (error) alert('Error al eliminar: ' + error.message);
  else cargarCarreras();
};

if (btnCancelar) {
  btnCancelar.addEventListener('click', limpiarFormulario);
}

function limpiarFormulario() {
  if (form) form.reset();
  carreraIdInput.value = '';
  if (categoriaInput) categoriaInput.value = '';
  urlLogoExistente = null;
  urlPdfExistente = null;
  if (formTitulo) formTitulo.innerHTML = '<i class="fa-solid fa-plus-circle" style="color: var(--primary);"></i> Nueva Carrera';
  if (btnCancelar) btnCancelar.style.display = 'none';
  if (logoActualInfo) logoActualInfo.style.display = 'none';
  if (pdfActualInfo) pdfActualInfo.style.display = 'none';
  if (fileSelectedLogoText) fileSelectedLogoText.style.display = 'none';
  if (fileSelectedPdfText) fileSelectedPdfText.style.display = 'none';
}

cargarCarreras();