// assets/supabaseClient.js
const SUPABASE_URL = 'https://smoizmmrkhdgrirfcynu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-lAeJuIOfnpOeA8ixU2fEQ_Jqy0lLU1';

// Si el CDN de Supabase no cargó (red lenta, caída o bloqueada por la red del
// instituto), window.supabase no existe y esta línea tiraba
// "Cannot read properties of undefined (reading 'createClient')", cortando
// TODO el JavaScript de la página. Con el guard, supabaseClient queda en null
// y cada página decide qué mostrarle al visitante.
const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (!supabaseClient) {
  console.warn('Supabase no disponible: no se pudo cargar la librería desde el CDN.');
}