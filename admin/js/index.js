// admin/js/index.js
// Lógica y métricas para el Dashboard principal de administración

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mostrar la fecha actual formateada en español
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaActualElemento = document.getElementById('currentDate');
  if (fechaActualElemento) {
    fechaActualElemento.innerText = new Date().toLocaleDateString('es-AR', options);
  }

  // 2. Cargar métricas reales y actividad reciente desde Supabase
  cargarMetricasDashboard();
});

async function cargarMetricasDashboard() {
  if (typeof supabaseClient === 'undefined') {
    console.error('Supabase no está inicializado.');
    return;
  }

  try {
    // 1. Conteo de Carreras
    const { count: cCount, error: errCarreras } = await supabaseClient
      .from('carreras')
      .select('*', { count: 'exact', head: true });
    
    if (!errCarreras) {
      document.getElementById('countCarreras').innerText = cCount ?? 0;
    }

    // 2. Conteo de Noticias
    const { count: nCount, error: errNoticias } = await supabaseClient
      .from('noticias')
      .select('*', { count: 'exact', head: true });
    
    if (!errNoticias) {
      document.getElementById('countNoticias').innerText = nCount ?? 0;
    }

    // 3. Conteo de Agenda
    const { count: aCount, error: errAgenda } = await supabaseClient
      .from('agenda')
      .select('*', { count: 'exact', head: true });
    
    if (!errAgenda) {
      document.getElementById('countAgenda').innerText = aCount ?? 0;
    }

    // 4. Conteo de Mensajes de Contacto
    const { count: mCount, error: errMensajes } = await supabaseClient
      .from('mensajes_contacto')
      .select('*', { count: 'exact', head: true });
    
    if (!errMensajes) {
      document.getElementById('countMensajes').innerText = mCount ?? 0;
    }

    // 5. Cargar los últimos 3 mensajes para la tabla de actividad reciente
    const { data: ultimosMensajes, error: errUltimos } = await supabaseClient
      .from('mensajes_contacto')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const tablaRecientes = document.getElementById('tablaRecientes');
    if (tablaRecientes && !errUltimos) {
      // DASH-02: refleja el estado real del ciclo de atención cuando existe.
      const estilosEstado = {
        'Nuevo': ['#fee2e2', '#b91c1c'],
        'Leído': ['#f1f5f9', '#64748b'],
        'Pendiente de respuesta': ['#fef3c7', '#b45309'],
        'Respondido': ['#dbeafe', '#1d4ed8'],
        'Finalizado': ['#dcfce7', '#15803d']
      };

      tablaRecientes.textContent = '';

      if (ultimosMensajes && ultimosMensajes.length > 0) {
        ultimosMensajes.forEach(m => {
          const estado = m.estado || (m.leido ? 'Leído' : 'Nuevo');
          const [fondo, color] = estilosEstado[estado] || estilosEstado['Leído'];
          const fechaFormateada = new Date(m.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

          const fila = document.createElement('tr');

          const tdNombre = document.createElement('td');
          const nombre = document.createElement('strong');
          nombre.textContent = m.nombre || 'Anónimo';
          tdNombre.appendChild(nombre);

          const tdAsunto = document.createElement('td');
          tdAsunto.textContent = m.asunto || 'Sin asunto';

          const tdFecha = document.createElement('td');
          tdFecha.style.color = 'var(--text-muted)';
          tdFecha.textContent = fechaFormateada;

          const tdEstado = document.createElement('td');
          const badge = document.createElement('span');
          badge.style.cssText = `font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; background: ${fondo}; color: ${color};`;
          badge.textContent = estado;
          tdEstado.appendChild(badge);

          fila.append(tdNombre, tdAsunto, tdFecha, tdEstado);
          tablaRecientes.appendChild(fila);
        });
      } else {
        tablaRecientes.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); text-align: center;">No hay mensajes registrados aún.</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error al cargar las métricas del dashboard:', error);
  }
}