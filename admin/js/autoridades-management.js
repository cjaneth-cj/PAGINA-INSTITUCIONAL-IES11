// admin/js/autoridades-management.js
const BUCKET_NAME = 'archivos';
const CARPETA_FOTOS = 'autoridades';

// Elementos del DOM
const form = document.getElementById('formAutoridad');
const autoridadIdInput = document.getElementById('autoridadId');
const tipoInput = document.getElementById('tipo');
const nombreInput = document.getElementById('nombre');
const cargoInput = document.getElementById('cargo');
const areaOResolucionInput = document.getElementById('areaOResolucion');
const turnoInput = document.getElementById('turno');
const emailInput = document.getElementById('email');
const carrerasInput = document.getElementById('carreras');
const ubicacionInput = document.getElementById('ubicacion');
const descripcionInput = document.getElementById('descripcion');
const fotoInput = document.getElementById('fotoAutoridad');

const fileSelectedText = document.getElementById('fileSelectedText');
const fotoActualInfo = document.getElementById('fotoActualInfo');
const tablaAutoridades = document.getElementById('tablaAutoridades');
const formTitulo = document.getElementById('formTitulo');
const btnCancelar = document.getElementById('btnCancelar');
const btnGuardar = document.getElementById('btnGuardar');

let urlFotoExistente = null;
let registrosCache = [];

function obtenerIdRegistro(item) {
  return item?.id ?? item?.['identificación'] ?? null;
}

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Convierte y comprime una imagen a WebP usando Canvas
function convertirImagenAWebP(file, maxAncho = 800, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let ancho = img.width;
        let alto = img.height;

        if (ancho > maxAncho) {
          alto = Math.round((alto * maxAncho) / ancho);
          ancho = maxAncho;
        }

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de imagen.'));
          return;
        }

        ctx.drawImage(img, 0, 0, ancho, alto);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo convertir la imagen a formato WebP.'));
              return;
            }
            const nombreBase = (file.name || 'autoridad')
              .replace(/\.[^/.]+$/, '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-') || 'autoridad';

            const archivoWebP = new File([blob], `${nombreBase}.webp`, {
              type: 'image/webp',
              lastModified: Date.now()
            });

            resolve(archivoWebP);
          },
          'image/webp',
          calidad
        );
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen seleccionada.'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

// Feedback al seleccionar archivo
if (fotoInput) {
  fotoInput.addEventListener('change', () => {
    const archivo = fotoInput.files && fotoInput.files[0];
    if (archivo && fileSelectedText) {
      fileSelectedText.style.display = 'block';
      fileSelectedText.innerHTML = `<i class="fa-solid fa-file-image"></i> Seleccionada: <strong>${escaparHtml(archivo.name)}</strong> (se convertirá a .webp)`;
    } else if (fileSelectedText) {
      fileSelectedText.style.display = 'none';
      fileSelectedText.innerHTML = '';
    }
  });
}

function formatearCategoria(tipo) {
  if (tipo === 'directivo') return 'Cuerpo Directivo';
  if (tipo === 'coordinador') return 'Coordinador de Área / Carrera';
  return tipo || '-';
}

// 1. Cargar integrantes desde Supabase
async function cargarAutoridades() {
  if (!tablaAutoridades) return;

  if (typeof supabaseClient === 'undefined' || !supabaseClient) {
    tablaAutoridades.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #dc2626; padding: 24px;">No se pudo conectar con Supabase.</td></tr>';
    return;
  }

  const { data, error } = await supabaseClient
    .from('autoridades')
    .select('*');

  if (error) {
    console.error('Error al cargar autoridades:', error);
    tablaAutoridades.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #dc2626; padding: 24px;">Error al cargar registros: ${escaparHtml(error.message)}</td></tr>`;
    return;
  }

  registrosCache = data || [];

  if (registrosCache.length === 0) {
    tablaAutoridades.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No hay integrantes registrados todavía.</td></tr>';
    return;
  }

  tablaAutoridades.innerHTML = '';

  registrosCache.forEach((item) => {
    const idRegistro = obtenerIdRegistro(item);
    const cargoRaw = item.cargo ?? item['carga'] ?? '';
    const cargoTexto = typeof cargoRaw === 'object' ? '' : String(cargoRaw).trim();
    const areaRaw = item.area_o_resolucion ?? item['área_o_resolución'] ?? '';
    const areaTexto = typeof areaRaw === 'object' ? '' : String(areaRaw).trim();

    const fotoHtml = item.foto_url
      ? `<img src="${escaparHtml(item.foto_url)}" alt="${escaparHtml(item.nombre || 'Foto')}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);">`
      : `<div style="width: 44px; height: 44px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-user"></i></div>`;

    const idParam = typeof idRegistro === 'string' ? `'${idRegistro}'` : idRegistro;

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${fotoHtml}</td>
      <td>
        <strong>${escaparHtml(item.nombre || '-')}</strong>
        ${cargoTexto ? `<br><small style="color: var(--text-muted);">${escaparHtml(cargoTexto)}</small>` : ''}
      </td>
      <td><span class="badge-tipo">${escaparHtml(formatearCategoria(item.tipo))}</span></td>
      <td>
        ${areaTexto ? escaparHtml(areaTexto) : '<span style="color: var(--text-muted);">Sin área/resolución</span>'}
        ${item.turno ? `<br><small style="color: var(--text-muted);">Turno: ${escaparHtml(item.turno)}</small>` : ''}
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-action btn-edit-tb" onclick="prepararEdicion(${idParam})" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="btn-action btn-delete-tb" onclick="eliminarAutoridad(${idParam})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tablaAutoridades.appendChild(fila);
  });
}

// 2. Guardar (Crear o Editar)
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
      alert('No hay conexión activa con Supabase.');
      return;
    }

    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerText = 'Guardando...';
    }

    try {
      const id = autoridadIdInput ? autoridadIdInput.value.trim() : '';
      const tipo = tipoInput ? tipoInput.value : 'coordinador';
      const nombre = nombreInput ? nombreInput.value.trim() : '';
      const cargo = cargoInput ? cargoInput.value.trim() : '';
      const areaOResolucion = areaOResolucionInput ? areaOResolucionInput.value.trim() : '';
      const turno = turnoInput ? turnoInput.value.trim() : '';
      const correoElectronico = emailInput ? emailInput.value.trim() : '';
      const carreras = carrerasInput ? carrerasInput.value.trim() : '';
      const ubicacion = ubicacionInput ? ubicacionInput.value.trim() : '';
      const descripcion = descripcionInput ? descripcionInput.value.trim() : '';
      const archivoOriginal = fotoInput && fotoInput.files ? fotoInput.files[0] : null;

      let fotoUrl = urlFotoExistente;

      if (archivoOriginal) {
        const archivoWebP = await convertirImagenAWebP(archivoOriginal);
        const slugNombre = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'integrante';
        const rutaStorage = `${CARPETA_FOTOS}/${Date.now()}-${slugNombre}.webp`;

        const { error: errUpload } = await supabaseClient.storage
          .from(BUCKET_NAME)
          .upload(rutaStorage, archivoWebP, {
            contentType: 'image/webp',
            upsert: true
          });

        if (errUpload) {
          throw new Error('Error al subir la fotografía: ' + errUpload.message);
        }

        const { data: pubData } = supabaseClient.storage
          .from(BUCKET_NAME)
          .getPublicUrl(rutaStorage);

        fotoUrl = pubData.publicUrl;
      }

      const payload = {
        tipo,
        nombre,
        cargo: cargo || null,
        area_o_resolucion: areaOResolucion || null,
        turno: turno || null,
        carreras: carreras || null,
        ubicacion: ubicacion || null,
        descripcion: descripcion || null,
        email: correoElectronico || null,
        foto_url: fotoUrl
      };

      const { error: errDb } = id
        ? await supabaseClient.from('autoridades').update(payload).eq('id', id)
        : await supabaseClient.from('autoridades').insert([payload]);

      if (errDb) {
        throw new Error((id ? 'Error al actualizar: ' : 'Error al guardar: ') + errDb.message);
      }

      limpiarFormulario();
      await cargarAutoridades();
    } catch (err) {
      alert(err.message || 'Ocurrió un error inesperado al guardar.');
    } finally {
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.innerText = 'Guardar Registro';
      }
    }
  });
}

// 3. Preparar edición
window.prepararEdicion = async (id) => {
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

  const { data: item, error } = await supabaseClient
    .from('autoridades')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !item) {
    alert('No se pudo cargar el registro para editar.');
    return;
  }

  const cargoVal = item.cargo ?? item['carga'] ?? '';
  const areaVal = item.area_o_resolucion ?? item['área_o_resolución'] ?? '';
  const emailVal = item.email ?? item['correo electrónico'] ?? '';
  const ubicacionVal = item.ubicacion ?? item['ubicación'] ?? '';
  const descripcionVal = item.descripcion ?? item['descripción'] ?? '';

  if (autoridadIdInput) autoridadIdInput.value = obtenerIdRegistro(item) ?? '';
  if (tipoInput) tipoInput.value = item.tipo || 'coordinador';
  if (nombreInput) nombreInput.value = item.nombre || '';
  if (cargoInput) cargoInput.value = typeof cargoVal === 'object' ? '' : cargoVal;
  if (areaOResolucionInput) areaOResolucionInput.value = typeof areaVal === 'object' ? '' : areaVal;
  if (turnoInput) turnoInput.value = item.turno || '';
  if (emailInput) emailInput.value = typeof emailVal === 'object' ? '' : emailVal;
  if (carrerasInput) carrerasInput.value = item.carreras || '';
  if (ubicacionInput) ubicacionInput.value = typeof ubicacionVal === 'object' ? '' : ubicacionVal;
  if (descripcionInput) descripcionInput.value = typeof descripcionVal === 'object' ? '' : descripcionVal;

  urlFotoExistente = item.foto_url || null;

  if (formTitulo) {
    formTitulo.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Integrante';
  }
  if (btnCancelar) {
    btnCancelar.style.display = 'inline-block';
  }
  if (fotoActualInfo) {
    if (item.foto_url) {
      fotoActualInfo.style.display = 'block';
      fotoActualInfo.innerHTML = `Foto actual: <a href="${escaparHtml(item.foto_url)}" target="_blank" style="color: var(--autoridades-primary); font-weight: 600;">Ver imagen</a> (subí otra solo si querés cambiarla).`;
    } else {
      fotoActualInfo.style.display = 'none';
      fotoActualInfo.innerHTML = '';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 4. Eliminar registro
window.eliminarAutoridad = async (id) => {
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
  if (!confirm('¿Seguro que querés eliminar este registro?')) return;

  const { error } = await supabaseClient
    .from('autoridades')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Error al eliminar: ' + error.message);
  } else {
    await cargarAutoridades();
  }
};

function limpiarFormulario() {
  if (form) form.reset();
  if (autoridadIdInput) autoridadIdInput.value = '';
  urlFotoExistente = null;

  if (formTitulo) {
    formTitulo.innerHTML = '<i class="fa-solid fa-user-plus"></i> Nueva Autoridad / Coordinador';
  }
  if (btnCancelar) {
    btnCancelar.style.display = 'none';
  }
  if (fileSelectedText) {
    fileSelectedText.style.display = 'none';
    fileSelectedText.innerHTML = '';
  }
  if (fotoActualInfo) {
    fotoActualInfo.style.display = 'none';
    fotoActualInfo.innerHTML = '';
  }
}

if (btnCancelar) {
  btnCancelar.addEventListener('click', limpiarFormulario);
}

cargarAutoridades();