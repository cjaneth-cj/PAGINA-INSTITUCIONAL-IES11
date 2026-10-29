// admin/js/admin-auth.js
// Control centralizado de autenticación y seguridad para el panel de administración

// Nota: Aseguramos la inicialización o el uso de la instancia de Supabase
// Si ya se carga supabaseClient globalmente en el HTML, lo usamos directamente.
document.addEventListener('DOMContentLoaded', () => {
  // 1. Validar si hay una sesión activa al cargar la página
  if (typeof supabaseClient !== 'undefined') {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = 'login.html';
      }
    });

    // 2. Manejar el evento de cerrar sesión en el botón del aside
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
          console.error('Error al cerrar sesión:', error.message);
        }
        window.location.href = 'login.html';
      });
    }
  } else {
    console.error('El cliente de Supabase no está disponible.');
    window.location.href = 'login.html';
  }
});