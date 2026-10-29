// Inicialización del cliente de Supabase
const SUPABASE_URL = 'https://smoizmmrkhdgrirfcynu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-lAeJuIOfnpOeA8ixU2fEQ_Jqy0lLU1';
const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('formLogin');
const mensajeError = document.getElementById('mensajeError');
const btnIngresar = document.getElementById('btnIngresar');

// Verificar si ya existe una sesión activa al cargar la página
dbClient.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    window.location.href = 'index.html';
  }
});

// Manejo del evento submit del formulario de inicio de sesión
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensajeError.style.display = 'none';
  btnIngresar.innerText = 'Verificando...';
  btnIngresar.disabled = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const { data, error } = await dbClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('Error de autenticación:', error);
      mensajeError.innerText = 'Error: ' + error.message;
      mensajeError.style.display = 'block';
    } else {
      console.log('Login exitoso:', data);
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.error('Error general:', err);
    mensajeError.innerText = 'Ocurrió un problema de conexión.';
    mensajeError.style.display = 'block';
  } finally {
    btnIngresar.innerText = 'Iniciar Sesión';
    btnIngresar.disabled = false;
  }
});