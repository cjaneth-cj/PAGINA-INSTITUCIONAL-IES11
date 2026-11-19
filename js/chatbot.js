/**
 * =========================================================
 * CHATBOT INTELIGENTE CON GEMINI + SUPABASE - IES N° 11 JUJUY
 * Con control de Timeout (10s) y Respaldo Local Automático
 * =========================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURACIÓN PRINCIPAL (Pega aquí tu API Key de Google AI Studio)
    const GEMINI_API_KEY = '';
    const GEMINI_MODEL = 'gemini-3.8-flash';

    // 2. INYECTAR LA INTERFAZ HTML EN LA PÁGINA
    const chatHTML = `
        <button class="ies-chat-launcher" id="iesChatLauncher" aria-label="Abrir asistente virtual">
            <span class="material-symbols-outlined">smart_toy</span>
        </button>

        <div class="ies-chat-window" id="iesChatWindow" role="dialog" aria-label="Asistente Virtual IES 11">
            <div class="ies-chat-header">
                <div class="ies-chat-header-info">
                    <div class="ies-chat-avatar">
                        <span class="material-symbols-outlined">school</span>
                    </div>
                    <div class="ies-chat-title">
                        <h4>Asistente IES N° 11</h4>
                        <span><i class="ies-status-dot"></i> En línea</span>
                    </div>
                </div>
                <button class="ies-chat-close" id="iesChatClose" aria-label="Cerrar chat">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="ies-chat-messages" id="iesChatMessages">
                <div class="ies-msg bot">
                    ¡Hola! Soy el asistente virtual del <strong>IES N° 11 Jujuy</strong>. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre carreras, horarios, requisitos de ingreso o trámites.
                </div>
            </div>

            <div class="ies-quick-actions" id="iesQuickActions">
                <button type="button" class="ies-chip" data-prompt="¿Qué carreras tienen disponibles?">📚 Ver carreras</button>
                <button type="button" class="ies-chip" data-prompt="¿Cuáles son los horarios de atención y dónde queda?">🕒 Horarios y Sede</button>
                <button type="button" class="ies-chip" data-prompt="¿Qué requisitos necesito para el Ingreso 2027?">📝 Requisitos Ingreso</button>
                <button type="button" class="ies-chip" data-prompt="¿Cómo me comunico con secretaría o contacto?">✉️ Contacto</button>
            </div>

            <form class="ies-chat-input-area" id="iesChatForm">
                <input type="text" class="ies-chat-input" id="iesChatInput" placeholder="Escribí tu consulta..." aria-label="Escribí tu consulta para el asistente" autocomplete="off" required>
                <button type="submit" class="ies-chat-send" id="iesChatSend" aria-label="Enviar mensaje">
                    <span class="material-symbols-outlined">send</span>
                </button>
            </form>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // 3. REFERENCIAS A ELEMENTOS DEL DOM
    const launcher = document.getElementById('iesChatLauncher');
    const chatWindow = document.getElementById('iesChatWindow');
    const closeBtn = document.getElementById('iesChatClose');
    const chatForm = document.getElementById('iesChatForm');
    const chatInput = document.getElementById('iesChatInput');
    const sendBtn = document.getElementById('iesChatSend');
    const messagesContainer = document.getElementById('iesChatMessages');
    const quickChips = document.querySelectorAll('.ies-chip');

    let conversationHistory = [];
    let listaCarrerasHTML = '• Tecnicaturas Superiores en Desarrollo de Software, Enfermería, Industrias Alimentarias y más (ver <a href="oferta-academica.html">Oferta Académica</a>).';
    let carrerasContextoIA = 'Tecnicaturas Superiores en Desarrollo de Software, Enfermería, Industrias Alimentarias, etc.';

    // 4. OBTENER CARRERAS EN TIEMPO REAL DESDE SUPABASE
    // OFE-03: nombres y títulos con la misma escritura que en la oferta.
    const normalizar = (valor) =>
        typeof normalizarDenominacion === 'function'
            ? normalizarDenominacion(valor)
            : String(valor || '').trim();

    async function cargarCarrerasDesdeSupabase() {
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data, error } = await supabaseClient
                    .from('carreras')
                    .select('nombre, categoria, duracion, titulo_otorgado');

                if (!error && data && data.length > 0) {
                    carrerasContextoIA = data.map(c => 
                        `- ${normalizar(c.nombre)} (${c.duracion || '3 años'}, Título: ${normalizar(c.titulo_otorgado) || 'A confirmar'})`
                    ).join('\n');

                    listaCarrerasHTML = data.map(c => 
                        `• <b>${normalizar(c.nombre)}</b> (${c.duracion || '3 años'})`
                    ).join('<br>');
                }
            }
        } catch (err) {
            console.warn('Aviso Supabase chatbot:', err);
        }
    }
    cargarCarrerasDesdeSupabase();

    // 5. BASE DE CONOCIMIENTO INSTITUCIONAL
    function construirInstruccionesSistema() {
        return `
Eres el asistente virtual oficial del Instituto de Educación Superior N° 11 (IES N° 11) de San Salvador de Jujuy, Argentina.
Responde siempre de forma amable, clara, breve y en español argentino.
Usa etiquetas HTML simples como <b>negritas</b> o <br> para saltos de línea, NO uses asteriscos de Markdown.

INFORMACIÓN OFICIAL DEL INSTITUTO:
- Ubicación / Sede Central: Alvear 1151, San Salvador de Jujuy.
- Teléfono: +54 (0388) 6014588.
- Correo electrónico: contacto@ies11jujuy.edu.ar.
- Horario general del edificio: Lunes a Viernes de 08:00 a 22:30 hs.
- Atención de Alumnos por Turnos:
  * Turno Mañana: 08:30 a 12:30 hs.
  * Turno Tarde: 13:00 a 18:30 hs.
  * Turno Vespertino: 18:30 a 22:00 hs.
- Campus Virtual Moodle: https://superior.jujuy.edu.ar/login/index.php

CARRERAS DISPONIBLES ACTUALMENTE:
${carrerasContextoIA}

INGRESO 2027 Y REQUISITOS:
- Preinscripción Online: 01 de Noviembre al 15 de Diciembre.
- Recepción de Legajos en Bedelía: 05 al 20 de Febrero.
- Cursillo de Ambientación (Obligatorio): 01 al 20 de Marzo.
- Documentación: DNI actualizado (original y copia), Título Secundario o Constancia, 2 fotos carnet 4x4 y Certificado de Aptitud Psicofísica.
        `.trim();
    }

    // 6. RESPUESTA DE RESPALDO LOCAL (Si la API tarda más de 10s o falla)
    function respuestaRespaldoLocal(pregunta) {
        const q = pregunta.toLowerCase();
        if (q.includes('carrera') || q.includes('estudiar') || q.includes('oferta')) {
            return `Estas son nuestras carreras disponibles:<br><br>${listaCarrerasHTML}<br><br>Podés ver los planes de estudio en <a href="oferta-academica.html">Oferta Académica</a>.`;
        }
        if (q.includes('horario') || q.includes('donde') || q.includes('dónde') || q.includes('sede') || q.includes('direccion')) {
            return `📍 <b>Sede Central:</b> Alvear 1151, San Salvador de Jujuy.<br>🕒 <b>Horario general:</b> Lunes a Viernes de 08:00 a 22:30 hs.<br><br><b>Atención de Alumnos:</b><br>• Mañana: 08:30 a 12:30<br>• Tarde: 13:00 a 18:30<br>• Vespertino: 18:30 a 22:00`;
        }
        if (q.includes('ingreso') || q.includes('requisito') || q.includes('inscripcion') || q.includes('2027')) {
            return `📝 <b>Fechas Ingreso 2027:</b><br>• Preinscripción Online: 01 Nov al 15 Dic<br>• Legajos en Bedelía: 05 al 20 Feb<br>• Cursillo: 01 al 20 Mar<br><br><b>Requisitos:</b> DNI (original y copia), Título Secundario o constancia, 2 fotos 4x4 y Certificado Psicofísico. Más info en <a href="estudiante.html">Estudiante</a>.`;
        }
        return `📞 Podés comunicarte con nosotros al <b>+54 (0388) 6014588</b>, escribir a <b>contacto@ies11jujuy.edu.ar</b> o completar el formulario en <a href="contacto.html">Contacto</a>.`;
    }

    // 7. EVENTOS ABRIR / CERRAR
    launcher.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) chatInput.focus();
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    function agregarMensaje(texto, remitente) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ies-msg ${remitente}`;
        msgDiv.innerHTML = texto;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return msgDiv;
    }

    // 8. CONEXIÓN CON GEMINI CON TIMEOUT DE 10 SEGUNDOS
    async function consultarGemini(preguntaUsuario) {
        const apiKeyLimpia = GEMINI_API_KEY.trim();

        if (!apiKeyLimpia || apiKeyLimpia === 'PEGA_AQUI_TU_CLAVE_COPIADA') {
            return respuestaRespaldoLocal(preguntaUsuario);
        }

        conversationHistory.push({
            role: 'user',
            parts: [{ text: preguntaUsuario }]
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKeyLimpia}`;

        const payload = {
            systemInstruction: {
                parts: [{ text: construirInstruccionesSistema() }]
            },
            contents: conversationHistory,
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 500
            }
        };

        // Controlador para cancelar la petición si tarda más de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || `Error HTTP ${response.status}`);
            }

            const respuestaIA = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!respuestaIA) {
                throw new Error('Respuesta vacía de la API');
            }

            conversationHistory.push({
                role: 'model',
                parts: [{ text: respuestaIA }]
            });

            return respuestaIA;

        } catch (error) {
            clearTimeout(timeoutId);
            console.warn('Usando respaldo local por fallo/timeout de API:', error.message);
            conversationHistory.pop();
            // Devuelve la respuesta exacta desde Supabase/datos locales en lugar de colgarse
            return respuestaRespaldoLocal(preguntaUsuario);
        }
    }

    // 9. MANEJO DEL FORMULARIO Y BOTONES RÁPIDOS
    async function procesarConsulta(texto) {
        const pregunta = texto.trim();
        if (!pregunta) return;

        agregarMensaje(pregunta, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;

        const indicadorCargando = agregarMensaje('Escribiendo...', 'bot');

        try {
            const respuesta = await consultarGemini(pregunta);
            indicadorCargando.innerHTML = respuesta;
        } catch (e) {
            indicadorCargando.innerHTML = respuestaRespaldoLocal(pregunta);
        } finally {
            // El bloque finally garantiza que el input SIEMPRE se reactive
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        procesarConsulta(chatInput.value);
    });

    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            procesarConsulta(chip.getAttribute('data-prompt'));
        });
    });
});