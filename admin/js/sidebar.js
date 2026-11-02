document.addEventListener('DOMContentLoaded', () => {
  // 1. Detectar en qué archivo HTML está parado el usuario
  const path = window.location.pathname;
  const currentPage = path.split('/').pop() || 'index.html';

  // 2. Estructura HTML del Sidebar
  const sidebarHTML = `
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon"><i class="fa-solid fa-graduation-cap"></i></div>
        <span>IES N° 11 Jujuy</span>
      </div>

      <ul class="sidebar-nav-links">
        <li>
          <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">
            <i class="fa-solid fa-chart-pie"></i> <span>Dashboard</span>
          </a>
        </li>
        <li>
          <a href="oferta-management.html" class="${currentPage === 'oferta-management.html' ? 'active' : ''}">
            <i class="fa-solid fa-book-bookmark"></i> <span>Carreras</span>
          </a>
        </li>
        <li>
          <a href="estudiantes-management.html" class="${currentPage === 'estudiantes-management.html' ? 'active' : ''}">
            <i class="fa-solid fa-user-graduate"></i> <span>Estudiantes</span>
          </a>
        </li>
        <li>
          <a href="novedades-management.html" class="${currentPage === 'novedades-management.html' ? 'active' : ''}">
            <i class="fa-solid fa-bullhorn"></i> <span>Noticias</span>
          </a>
        </li>
        <li>
          <a href="agenda-management.html" class="${currentPage === 'agenda-management.html' ? 'active' : ''}">
            <i class="fa-solid fa-calendar-check"></i> <span>Agenda</span>
          </a>
        </li>
        <li>
          <a href="contacto-management.html" class="${currentPage === 'contacto-management.html' ? 'active' : ''}">
            <i class="fa-solid fa-inbox"></i> <span>Consultas</span>
          </a>
        </li>
        <li>
          <a href="../index.html" target="_blank">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> <span>Ver Sitio Web</span>
          </a>
        </li>
      </ul>

      <div class="sidebar-user-footer">
        <div>
          <div style="font-size: 0.85rem; font-weight: 700;">Admin</div>
          <div style="font-size: 0.75rem; color: #64748b;">En línea</div>
        </div>
        <button class="sidebar-btn-logout" id="btnLogoutSidebar" title="Cerrar sesión">
          <i class="fa-solid fa-power-off"></i>
        </button>
      </div>
    </aside>
  `;

  // 3. Inyectar el sidebar al inicio del body
  document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

  // 4. Conectar el botón de logout de Supabase
  const btnLogout = document.getElementById('btnLogoutSidebar');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (typeof supabaseClient !== 'undefined') {
        await supabaseClient.auth.signOut();
      }
      window.location.href = 'login.html';
    });
  }
});