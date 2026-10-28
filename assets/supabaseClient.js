// assets/supabaseClient.js
const SUPABASE_URL = 'https://smoizmmrkhdgrirfcynu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-lAeJuIOfnpOeA8ixU2fEQ_Jqy0lLU1';

// Usamos supabaseClient para que no choque con la librería
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);