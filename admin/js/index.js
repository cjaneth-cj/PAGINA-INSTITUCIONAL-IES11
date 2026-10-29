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
      if (ultimosMensajes && ultimosMensajes.length > 0) {
        tablaRecientes.innerHTML = '';
        ultimosMensajes.forEach(m => {
          const fechaFormateada = new Date(m.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
          tablaRecientes.innerHTML += `
            <tr>
              <td><strong>${m.nombre}</strong></td>
              <td>${m.asunto || 'Sin asunto'}</td>
              <td style="color: var(--text-muted);">${fechaFormateada}</td>
              <td>
                <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: ${m.leido ? '#f1f5f9' : '#fee2e2'}; color: ${m.leido ? '#64748b' : '#b91c1c'}; font-weight: 700;">
                  ${m.leido ? 'Leído' : 'Nuevo'}
                </span>
              </td>
            </tr>
          `;
        });
      } else {
        tablaRecientes.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); text-align: center;">No hay mensajes registrados aún.</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error al cargar las métricas del dashboard:', error);
  }
}