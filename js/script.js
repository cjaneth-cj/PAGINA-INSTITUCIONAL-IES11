/**
 * ==========================================================================
 * ARCHIVO PRINCIPAL DE JAVASCRIPT - IES N° 11
 * Organizado por secciones lógicas para trabajo en equipo.
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar todas las funciones del sitio
    initHeaderScroll();
    initHeroCarousel();
    initComboActions();
    initMetrics();
    initAnioActual();
    initIconosDecorativos();
    initSolicitudTramites();
});


/**
 * ==========================================================================
 * INI-05 / INI-06: AÑO CALENDARIO DINÁMICO
 * Actualiza cualquier elemento con [data-anio-actual] para no tener que
 * editar el HTML cada 1 de enero (ciclo lectivo y copyright).
 * ==========================================================================
 */
function initAnioActual() {
    const anio = new Date().getFullYear();
    document.querySelectorAll("[data-anio-actual]").forEach((el) => {
        el.textContent = anio;
    });
}


/**
 * ==========================================================================
 * 01. SECCIÓN: HEADER INTERACTIVO
 * Efectos de scroll y navegación fija.
 * ==========================================================================
 */
function initHeaderScroll() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    window.addEventListener("scroll", () => {
        if (window.scrollY > 30) {
            header.style.boxShadow = "0 4px 20px rgba(6,16,33,0.1)";
        } else {
            header.style.boxShadow = "0 1px 8px rgba(0,0,0,0.04)";
        }
    });
}


/**
 * ==========================================================================
 * 02. SECCIÓN: INDEX / HERO CARRUSEL
 * Lógica de interacción para transiciones de banner principal.
 * ==========================================================================
 */
function initHeroCarousel() {
    const heroSection = document.getElementById("hero-carousel");
    if (!heroSection) return;

    const bgImage = document.getElementById("carousel-bg");
    const titleElement = heroSection.querySelector(".hero-main-title");
    const subtitleElement = heroSection.querySelector(".hero-subtitle");
    const counterElement = document.getElementById("slide-counter");
    const dots = heroSection.querySelectorAll(".dots-group .dot");
    const prevBtn = heroSection.querySelector(".arrow-btn[aria-label='Anterior']");
    const nextBtn = heroSection.querySelector(".arrow-btn[aria-label='Siguiente']");
    const autoplayBtn = heroSection.querySelector(".carousel-autoplay-toggle");
    const textBox = heroSection.querySelector(".hero-text-box");

    // Datos de cada slide
    // Sin imagen: el hero usa el fondo diseñado por CSS (.hero-bg-rings).
    // Para volver a fotos, poner la ruta en "image" (ej. "assets/images/hero-1.jpg")
    // y quitar la clase .hero-bg-rings del div #carousel-bg en index.html.
// Rutas .webp ubicadas en assets/images/ (ajustables según el orden deseado)
    const slides = [
        {
            image: "assets/images/edificio.webp",
            title: "Construí tu Futuro Profesional en Jujuy",
            subtitle: "Formación técnica y docente con excelencia académica, compromiso social y salida laboral orientada al desarrollo productivo y cultural regional."
        },
        {
            image: "assets/images/enfermeria.webp",
            title: "Títulos Oficiales con Validez Nacional",
            subtitle: "Tecnicaturas superiores y profesorados pensados para responder a las demandas laborales del NOA."
        },
        {
            image: "assets/images/acto-colacion-2.webp",
            title: "Educación Pública, Gratuita y de Calidad",
            subtitle: "Prácticas profesionalizantes, vinculación con el sector productivo y acompañamiento académico durante toda la cursada."
        }
    ];

    // Precarga solo de slides que tengan ruta de imagen definida
    slides.forEach((s) => {
        if (s.image) {
            const img = new Image();
            img.src = s.image;
        }
    });
    let currentIndex = 0;
    let autoPlayTimer = null;
    let autoPlayPaused = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function showSlide(index) {
        if (index < 0) {
            currentIndex = slides.length - 1;
        } else if (index >= slides.length) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }

        const currentSlide = slides[currentIndex];

        // Efecto visual suave de transición
        // Fundido completo + reinicio del zoom Ken Burns
        if (bgImage && currentSlide.image) {
            bgImage.classList.remove("hero-bg-rings");
            bgImage.style.opacity = "0";
            bgImage.classList.remove("kenburns");
            setTimeout(() => {
                bgImage.style.backgroundImage = `url('${currentSlide.image}')`;
                bgImage.style.opacity = "1";
                if (!reducedMotion.matches) {
                    void bgImage.offsetWidth;   // fuerza el reinicio de la animación
                    bgImage.classList.add("kenburns");
                }
            }, 450);
        }

        if (textBox && !reducedMotion.matches) {
            textBox.classList.remove("slide-in");
            void textBox.offsetWidth;
            textBox.classList.add("slide-in");
        }

        if (titleElement) titleElement.textContent = currentSlide.title;
        if (subtitleElement) subtitleElement.textContent = currentSlide.subtitle;
        if (counterElement) counterElement.textContent = `0${currentIndex + 1} / 0${slides.length}`;

        // Actualizar dots
        dots.forEach((dot, i) => {
            dot.setAttribute("aria-pressed", String(i === currentIndex));
            if (i === currentIndex) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }

    function startAutoPlay(force = false) {
        stopAutoPlay();
        const userIsInteracting = heroSection.matches(":hover") || heroSection.contains(document.activeElement);
        if (reducedMotion.matches || document.hidden || autoPlayPaused || (userIsInteracting && !force)) return;
        autoPlayTimer = setInterval(() => {
            showSlide(currentIndex + 1);
        }, 6000);
        heroSection.classList.remove("autoplay-paused");
    }

    function stopAutoPlay() {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
        autoPlayTimer = null;
        heroSection.classList.add("autoplay-paused");
    }

    // Eventos en botones flecha
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            showSlide(currentIndex + 1);
            startAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            showSlide(currentIndex - 1);
            startAutoPlay();
        });
    }

    if (autoplayBtn) {
        autoplayBtn.addEventListener("click", () => {
            autoPlayPaused = !autoPlayPaused;
            autoplayBtn.setAttribute("aria-pressed", String(autoPlayPaused));
            autoplayBtn.setAttribute("aria-label", autoPlayPaused ? "Reanudar reproducción automática" : "Pausar reproducción automática");
            const icon = autoplayBtn.querySelector(".material-symbols-outlined");
            if (icon) icon.textContent = autoPlayPaused ? "play_arrow" : "pause";
            if (autoPlayPaused) stopAutoPlay();
            else startAutoPlay(true);
        });
    }

    // Eventos en los dots
    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
            showSlide(i);
            startAutoPlay();
        });
    });

    // Pausar autoplay al pasar el mouse por encima
    heroSection.addEventListener("mouseenter", stopAutoPlay);
    heroSection.addEventListener("mouseleave", startAutoPlay);
    heroSection.addEventListener("focusin", stopAutoPlay);
    heroSection.addEventListener("focusout", (event) => {
        if (!heroSection.contains(event.relatedTarget)) startAutoPlay();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopAutoPlay();
        else startAutoPlay();
    });
    reducedMotion.addEventListener?.("change", () => {
        if (reducedMotion.matches) stopAutoPlay();
        else startAutoPlay();
    });

    // Inicializar slide inicial
    showSlide(0);
    startAutoPlay();
}

/**
 * ==========================================================================
 * 03. SECCIÓN: OFERTA ACADÉMICA / TARJETAS DE CARRERAS
 * Manejo de eventos de clic y solicitudes de planes de estudio.
 * ==========================================================================
 */
function initComboActions() {
    const careerButtons = document.querySelectorAll(".btn-combo01");
    
    careerButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const careerName = button.closest(".card-combo01").querySelector("h3").innerText;
            console.log(`Solicitando información para la carrera: ${careerName}`);
            alert(`Pronto descargaremos el plan de estudio oficial para: ${careerName}`);
        });
    });
}
/**
 * ==========================================================================
 * MÉTRICAS: contador animado + entrada escalonada
 * ==========================================================================
 */
function initMetrics() {
    const seccion = document.querySelector(".metrics-overlap-section");
    if (!seccion) return;

    const tarjetas = seccion.querySelectorAll(".metric-card");
    const numeros  = seccion.querySelectorAll(".metric-number");
    if (!tarjetas.length) return;

    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sinMovimiento || !("IntersectionObserver" in window)) return;

    seccion.classList.add("metrics-animated");
    tarjetas.forEach((t, i) => t.style.setProperty("--orden", i));

    function contar(el) {
        const textoOriginal = el.textContent.trim();
        const m = textoOriginal.match(/^(\D*)([\d.,]+)(\D*)$/);
        if (!m) return;

        const [, prefijo, crudo, sufijo] = m;
        const objetivo = parseInt(crudo.replace(/[.,]/g, ""), 10);
        if (!Number.isFinite(objetivo) || objetivo <= 0) return;

        const duracion = 1400;
        const inicio = performance.now();

        function paso(ahora) {
            const t = Math.min((ahora - inicio) / duracion, 1);
            const suave = 1 - Math.pow(1 - t, 3);   // easeOutCubic
            el.textContent = prefijo + Math.round(objetivo * suave).toLocaleString("es-AR") + sufijo;
            if (t < 1) requestAnimationFrame(paso);
            else el.textContent = textoOriginal;    // restituye el formato exacto
        }

        requestAnimationFrame(paso);
    }

    const obs = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
            if (!e.isIntersecting) return;
            seccion.classList.add("is-visible");
            numeros.forEach(contar);
            obs.disconnect();   // se anima una sola vez
        });
    }, { threshold: 0.35 });

    obs.observe(seccion);
}

/**
 * ==========================================================================
 * MÓDULO: ESPACIO ESTUDIANTIL (Pestañas y Checklist)
 * ==========================================================================
 */

function switchTab(targetId) {
    const tabs = ['ingreso', 'tramites', 'ram', 'calendario'];
    
    tabs.forEach(tab => {
        const btn = document.getElementById('tabBtn-' + tab);
        if (!btn) return;
        if (tab === targetId) {
            btn.classList.add('active', 'bg-primary-container');
            btn.style.backgroundColor = '#1b2537';
            btn.style.color = '#ffffff';
        } else {
            btn.classList.remove('active');
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'inherit';
        }
    });

    const element = document.getElementById('section-' + targetId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function toggleCheck(item) {
    const icon = item.querySelector('.material-symbols-outlined');
    if (!icon) return;
    
    if (icon.innerText === 'check_box') {
        icon.innerText = 'check_box_outline_blank';
        item.style.opacity = '0.6';
    } else {
        icon.innerText = 'check_box';
        item.style.opacity = '1';
    }
}

/**
 * ==========================================================================
 * MÓDULO: FILTRADO DE CARRERAS (Oferta Académica)
 * ==========================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    initCareerFilters();
});

function initCareerFilters() {
    const filterButtons = document.querySelectorAll("#category-filter-group .filter-btn");
    const searchInput = document.getElementById("keyword-filter");
    const careerCards = document.querySelectorAll(".career-card");

    if (!filterButtons.length || !careerCards.length) return;

    let selectedCategory = "all";
    let searchQuery = "";

    function filterCareers() {
        careerCards.forEach(card => {
            const category = card.getAttribute("data-category");
            const keywords = card.getAttribute("data-keywords").toLowerCase();
            const title = card.querySelector("h3").innerText.toLowerCase();

            const matchesCategory = (selectedCategory === "all" || category === selectedCategory);
            const matchesSearch = (searchQuery === "" || keywords.includes(searchQuery) || title.includes(searchQuery));

            if (matchesCategory && matchesSearch) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedCategory = btn.getAttribute("data-filter");
            filterCareers();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterCareers();
        });
    }

}
/**
 * ==========================================================================
 * MÓDULO: AGENDA Y CALENDARIO ACADÉMICO
 * ==========================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    initAgendaCalendar();
});
/**
 * ==========================================================================
 * MÓDULO: SOLICITUD DE TRÁMITES ESTUDIANTILES (EST-01)
 * Cada trámite pide datos distintos. Acá se define qué campos muestra cada
 * uno, qué documentación adjunta y qué se valida antes de enviar. Los datos
 * van a `solicitudes_tramites` y los archivos al bucket privado `tramites`.
 * ==========================================================================
 */
function initSolicitudTramites() {
    const panel = document.getElementById("tramiteFormBox");
    const form = document.getElementById("tramiteForm");
    if (!panel || !form) return;

    const MAX_BYTES = 5 * 1024 * 1024;
    const TIPOS_OK = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    const TRAMITES = {
        "Constancia de Alumno Regular": {
            icono: "badge",
            campos: ["nombre_completo", "dni", "email", "telefono", "carrera", "anio_cursada", "motivo", "observaciones"],
            obligatorios: ["nombre_completo", "dni", "email", "carrera"],
            aviso: "Sale sellada y firmada. Si es para BEGU o BEGUP, revisá que el organismo no te pida también el analítico."
        },
        "Certificado Analítico Parcial": {
            icono: "description",
            campos: ["nombre_completo", "dni", "email", "telefono", "carrera", "turno", "destinatario", "observaciones"],
            obligatorios: ["nombre_completo", "dni", "email", "telefono", "carrera", "turno"],
            aviso: "Se retira los lunes o martes, en el mismo turno en el que cursás."
        },
        "Inicio de Trámite de Título": {
            icono: "school",
            campos: ["nombre_completo", "dni", "email", "telefono", "carrera", "observaciones"],
            obligatorios: ["nombre_completo", "dni", "email", "telefono", "carrera"],
            etiquetaTelefono: "Celular",
            documentos: ["Partida de nacimiento", "Título secundario autenticado", "Fotocopia de DNI"],
            aviso: "Subí los tres documentos. Secretaría revisa cada uno y te avisa si alguno hay que mandarlo de nuevo."
        },
        "Equivalencias y Pases": {
            icono: "swap_horiz",
            campos: ["nombre_completo", "dni", "email", "telefono", "carrera", "carrera_destino", "cohorte", "anio_cursada", "observaciones"],
            obligatorios: ["nombre_completo", "dni", "email", "telefono", "carrera", "carrera_destino"],
            etiquetaCarrera: "Carrera que cursás actualmente",
            documentos: ["Certificado Analítico Actualizado", "Fotocopia de DNI"],
            nota: true,
            aviso: "Con tus datos armamos la nota de solicitud de vacante: descargala, firmala y presentala con el analítico y la fotocopia del DNI."
        }
    };

    const INPUTS = {
        nombre_completo: "tr-nombre", dni: "tr-dni", email: "tr-email", telefono: "tr-telefono",
        carrera: "tr-carrera", carrera_destino: "tr-carrera-destino", cohorte: "tr-cohorte",
        anio_cursada: "tr-anio", turno: "tr-turno", motivo: "tr-motivo",
        destinatario: "tr-destinatario", observaciones: "tr-observaciones"
    };

    const ETIQUETAS = {
        nombre_completo: "tu nombre y apellido", dni: "tu DNI", email: "tu correo",
        telefono: "tu teléfono", carrera: "la carrera", carrera_destino: "la carrera de destino",
        turno: "el turno", destinatario: "a quién va dirigido"
    };

    const titulo = document.getElementById("tramiteFormTitulo");
    const icono = document.getElementById("tramiteFormIcono");
    const aviso = document.getElementById("tramiteAviso");
    const campoTipo = document.getElementById("tr-tipo");
    const alertaOk = document.getElementById("tramiteOk");
    const alertaOkTexto = document.getElementById("tramiteOkTexto");
    const alertaError = document.getElementById("tramiteError");
    const errorTitulo = document.getElementById("tramiteErrorTitulo");
    const errorTexto = document.getElementById("tramiteErrorTexto");
    const boton = document.getElementById("tramiteSubmit");
    const botonNota = document.getElementById("tramiteNota");
    const fsDocs = document.getElementById("tramiteDocs");
    const listaDocs = document.getElementById("tramiteDocsLista");
    const tarjetas = document.querySelectorAll(".tramite-card");

    let actual = null;

    const valor = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    function limpiarMarcas() {
        form.querySelectorAll(".tr-campo.is-mal").forEach((c) => c.classList.remove("is-mal"));
    }

    function ocultarAvisos() {
        alertaOk.hidden = true;
        alertaError.hidden = true;
    }

    function mostrarError(tit, txt, campos) {
        errorTitulo.textContent = tit;
        errorTexto.textContent = txt;
        alertaError.hidden = false;
        limpiarMarcas();
        (campos || []).forEach((c) => {
            const g = form.querySelector('[data-campo="' + c + '"]');
            if (g) g.classList.add("is-mal");
        });
        alertaError.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function pesoLegible(bytes) {
        return bytes < 1024 * 1024
            ? Math.round(bytes / 1024) + " KB"
            : (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
    }

    /* --- Zona de subida de un documento --------------------------------- */
    function crearZonaDoc(nombreDoc, indice) {
        const zona = document.createElement("label");
        zona.className = "tr-doc";
        zona.setAttribute("for", "tr-doc-" + indice);

        const ico = document.createElement("span");
        ico.className = "material-symbols-outlined tr-doc-ico";
        ico.textContent = "upload_file";

        const txt = document.createElement("span");
        txt.className = "tr-doc-txt";
        const nom = document.createElement("span");
        nom.className = "tr-doc-nombre";
        nom.textContent = nombreDoc;
        const est = document.createElement("span");
        est.className = "tr-doc-estado";
        est.textContent = "Tocá para elegir el archivo";
        txt.append(nom, est);

        const input = document.createElement("input");
        input.type = "file";
        input.id = "tr-doc-" + indice;
        input.dataset.documento = nombreDoc;
        input.accept = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "tr-doc-quitar";
        quitar.hidden = true;
        quitar.setAttribute("aria-label", "Quitar " + nombreDoc);
        const icoQ = document.createElement("span");
        icoQ.className = "material-symbols-outlined";
        icoQ.textContent = "close";
        quitar.appendChild(icoQ);

        function reiniciar() {
            input.value = "";
            zona.classList.remove("is-cargado");
            ico.textContent = "upload_file";
            est.textContent = "Tocá para elegir el archivo";
            quitar.hidden = true;
        }

        input.addEventListener("change", () => {
            const f = input.files && input.files[0];
            if (!f) return reiniciar();
            if (TIPOS_OK.indexOf(f.type) === -1) {
                mostrarError("Formato no aceptado.",
                    "«" + f.name + "» no es PDF, JPG, PNG ni WEBP.");
                return reiniciar();
            }
            if (f.size > MAX_BYTES) {
                mostrarError("Archivo demasiado grande.",
                    "«" + f.name + "» pesa " + pesoLegible(f.size) + " y el máximo es 5 MB.");
                return reiniciar();
            }
            zona.classList.add("is-cargado");
            ico.textContent = "task";
            est.textContent = f.name + " · " + pesoLegible(f.size);
            quitar.hidden = false;
            ocultarAvisos();
        });

        quitar.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            reiniciar();
        });

        zona.append(ico, txt, input, quitar);
        return zona;
    }

    /* --- Configurar el formulario para un trámite ------------------------ */
    function configurar(nombreTramite) {
        const cfg = TRAMITES[nombreTramite];
        if (!cfg) return;
        actual = { nombre: nombreTramite, cfg: cfg };

        campoTipo.value = nombreTramite;
        titulo.textContent = nombreTramite;
        icono.textContent = cfg.icono;
        aviso.textContent = cfg.aviso || "";

        tarjetas.forEach((t) => {
            t.setAttribute("aria-pressed", String(t.dataset.tramite === nombreTramite));
        });

        form.querySelectorAll("[data-campo]").forEach((grupo) => {
            const nombre = grupo.dataset.campo;
            const visible = cfg.campos.indexOf(nombre) !== -1;
            grupo.hidden = !visible;

            const input = document.getElementById(INPUTS[nombre]);
            const label = grupo.querySelector("label");
            if (!input || !label) return;

            const req = cfg.obligatorios.indexOf(nombre) !== -1;
            input.required = visible && req;

            // Reconstruir la etiqueta con su marca de obligatorio
            let base = label.dataset.base;
            if (!base) {
                base = label.textContent.trim();
                label.dataset.base = base;
            }
            if (nombre === "carrera" && cfg.etiquetaCarrera) base = cfg.etiquetaCarrera;
            if (nombre === "carrera" && !cfg.etiquetaCarrera) base = "Carrera";
            if (nombre === "telefono") base = cfg.etiquetaTelefono || "Teléfono";

            label.textContent = base;
            if (req) {
                const ast = document.createElement("span");
                ast.className = "req";
                ast.textContent = "*";
                ast.setAttribute("aria-hidden", "true");
                label.appendChild(ast);
                input.setAttribute("aria-required", "true");
            } else {
                // Los opcionales no llevan marca: la ausencia del asterisco alcanza.
                input.removeAttribute("aria-required");
            }
        });

        listaDocs.textContent = "";
        if (cfg.documentos && cfg.documentos.length) {
            cfg.documentos.forEach((d, i) => listaDocs.appendChild(crearZonaDoc(d, i)));
            fsDocs.hidden = false;
        } else {
            fsDocs.hidden = true;
        }

        botonNota.hidden = !cfg.nota;
        limpiarMarcas();
        ocultarAvisos();
    }

    tarjetas.forEach((t) => {
        t.addEventListener("click", () => {
            configurar(t.dataset.tramite || "");
            panel.hidden = false;
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
            setTimeout(() => {
                const p = document.getElementById("tr-nombre");
                if (p) p.focus({ preventScroll: true });
            }, 420);
        });
    });

    const cerrar = document.getElementById("tramiteFormCerrar");
    if (cerrar) {
        cerrar.addEventListener("click", () => {
            panel.hidden = true;
            ocultarAvisos();
            tarjetas.forEach((t) => t.setAttribute("aria-pressed", "false"));
        });
    }

    /* --- Sugerencias de carrera ------------------------------------------ */
    (async function cargarCarreras() {
        const lista = document.getElementById("listaCarreras");
        if (!lista || typeof supabaseClient === "undefined" || !supabaseClient) return;
        try {
            const { data, error } = await supabaseClient.from("carreras").select("nombre").order("nombre");
            if (error || !Array.isArray(data)) return;
            data.forEach((c) => {
                if (!c || !c.nombre) return;
                const op = document.createElement("option");
                op.value = c.nombre;
                lista.appendChild(op);
            });
        } catch (e) {
            // Sin sugerencias sigue siendo texto libre. No se bloquea nada.
        }
    })();

    /* --- Nota de solicitud de vacante ------------------------------------ */
    function generarNota() {
        const hoy = new Date();
        const meses = ["enero","febrero","marzo","abril","mayo","junio","julio",
                       "agosto","septiembre","octubre","noviembre","diciembre"];
        const d = {
            nombre: valor("tr-nombre") || "…………………………………",
            dni: valor("tr-dni") || "…………………",
            carrera: valor("tr-carrera") || "…………………………………",
            cohorte: valor("tr-cohorte") || "………",
            anio: valor("tr-anio") || "………",
            destino: valor("tr-carrera-destino") || "…………………………………",
            tel: valor("tr-telefono") || "………………………"
        };

        const win = window.open("", "_blank");
        if (!win) {
            mostrarError("No pudimos abrir la nota.",
                "El navegador bloqueó la ventana emergente. Permitila para este sitio y volvé a intentar.");
            return;
        }

        const doc = win.document;
        doc.title = "Solicitud de vacante para pase - IES N° 11";
        const estilo = doc.createElement("style");
        estilo.textContent = "body{font-family:Georgia,'Times New Roman',serif;max-width:19cm;margin:2cm auto;"
            + "line-height:1.9;color:#000;font-size:12pt}h1{font-size:13pt;text-align:center;margin-bottom:2.5em;"
            + "text-transform:uppercase;letter-spacing:.5px}.fecha{text-align:right;margin-bottom:2.5em}"
            + ".dest{margin-bottom:2.5em}.cuerpo{text-align:justify;margin-bottom:2em}"
            + "ul{margin:1em 0 2.5em 1.5em}.firma{margin-top:4em}.firma p{margin:.3em 0}"
            + "@media print{body{margin:1.5cm}}";
        doc.head.appendChild(estilo);

        const p = (t, c) => {
            const el = doc.createElement("p");
            if (c) el.className = c;
            el.textContent = t;
            return el;
        };

        const h = doc.createElement("h1");
        h.textContent = "Solicitud de vacante para pase";
        doc.body.appendChild(h);

        doc.body.appendChild(p("San Salvador de Jujuy, " + hoy.getDate() + " de "
            + meses[hoy.getMonth()] + " de " + hoy.getFullYear() + ".", "fecha"));

        const dest = doc.createElement("div");
        dest.className = "dest";
        ["A la", "Señora Rectora", "del IES N° 11", "Prof. Silvia Roxana Adaro", "Su Despacho"]
            .forEach((l) => dest.appendChild(p(l)));
        doc.body.appendChild(dest);

        doc.body.appendChild(p("Quien suscribe, " + d.nombre + ", DNI " + d.dni
            + ", estudiante de la Carrera de " + d.carrera + ", de la Cohorte " + d.cohorte
            + ", cursando el " + d.anio + " año, solicito AUTORICE una CONSTANCIA DE VACANTE para la Carrera de "
            + d.destino + " que se dicta en Vuestra Institución, para así poder tramitar el pase a la misma.",
            "cuerpo"));

        doc.body.appendChild(p("Adjunto:"));
        const ul = doc.createElement("ul");
        ["Certificado Analítico Actualizado (origen)", "Fotocopia de DNI"].forEach((t) => {
            const li = doc.createElement("li");
            li.textContent = t;
            ul.appendChild(li);
        });
        doc.body.appendChild(ul);
        doc.body.appendChild(p("Sin otro particular, saludo a Ud. atentamente."));

        const firma = doc.createElement("div");
        firma.className = "firma";
        firma.appendChild(p("Firma: …………………………………………………"));
        firma.appendChild(p("Aclaración: " + d.nombre));
        firma.appendChild(p("Teléfono: " + d.tel));
        doc.body.appendChild(firma);

        setTimeout(() => win.print(), 500);
    }

    botonNota.addEventListener("click", generarNota);

    /* --- Envío ------------------------------------------------------------ */
    form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        ocultarAvisos();
        limpiarMarcas();
        if (!actual) return;

        const cfg = actual.cfg;
        const datos = { tipo_tramite: actual.nombre };
        cfg.campos.forEach((c) => {
            let v = valor(INPUTS[c]);
            if (c === "dni") v = v.replace(/[.\s-]/g, "");
            datos[c] = v || null;
        });

        const faltan = [];
        const malos = [];
        cfg.obligatorios.forEach((c) => {
            if (!datos[c]) { faltan.push(ETIQUETAS[c] || c); malos.push(c); }
        });
        if (datos.dni && datos.dni.length < 6) { faltan.push("un DNI válido"); malos.push("dni"); }
        if (datos.email && datos.email.indexOf("@") < 1) { faltan.push("un correo válido"); malos.push("email"); }

        if (faltan.length) {
            mostrarError("Faltan datos", "Completá " + faltan.join(", ") + ".", malos);
            return;
        }

        const archivos = [];
        listaDocs.querySelectorAll("input[type=file]").forEach((inp) => {
            const f = inp.files && inp.files[0];
            if (f) archivos.push({ documento: inp.dataset.documento, file: f });
        });

        if (cfg.documentos && archivos.length === 0) {
            mostrarError("Falta la documentación",
                "Subí al menos uno de los documentos para que Secretaría pueda empezar el trámite.");
            return;
        }

        if (typeof supabaseClient === "undefined" || !supabaseClient) {
            mostrarError("No pudimos conectar con el sistema",
                "Escribinos a contacto@ies11jujuy.edu.ar y lo gestionamos por correo.");
            return;
        }

        boton.disabled = true;
        const etiqueta = boton.querySelector("span:last-child");
        const textoOriginal = etiqueta ? etiqueta.textContent : "";
        if (etiqueta) etiqueta.textContent = "Enviando...";

        const carpeta = (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : String(Date.now()) + "-" + Math.random().toString(16).slice(2);

        try {
            datos.carpeta = carpeta;
            const { error: errSol } = await supabaseClient.from("solicitudes_tramites").insert(datos);
            if (errSol) throw errSol;

            const fallados = [];
            for (let i = 0; i < archivos.length; i++) {
                const a = archivos[i];
                const ext = (a.file.name.split(".").pop() || "dat").toLowerCase().slice(0, 5);
                const slug = a.documento.toLowerCase()
                    .normalize("NFD").replace(/[̀-ͯ]/g, "")
                    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                const ruta = "solicitudes/" + carpeta + "/" + slug + "-" + Date.now() + "." + ext;

                const { error: errUp } = await supabaseClient.storage
                    .from("tramites").upload(ruta, a.file, { contentType: a.file.type, upsert: false });
                if (errUp) { fallados.push(a.documento); continue; }

                const { error: errReg } = await supabaseClient.from("solicitudes_archivos").insert({
                    carpeta: carpeta,
                    tipo_documento: a.documento,
                    storage_path: ruta,
                    nombre_original: a.file.name.slice(0, 180),
                    mime_type: a.file.type,
                    tamano_bytes: a.file.size
                });
                if (errReg) fallados.push(a.documento);
            }

            form.reset();
            listaDocs.querySelectorAll(".tr-doc").forEach((z) => {
                z.classList.remove("is-cargado");
                const i = z.querySelector(".tr-doc-ico");
                const e = z.querySelector(".tr-doc-estado");
                const q = z.querySelector(".tr-doc-quitar");
                if (i) i.textContent = "upload_file";
                if (e) e.textContent = "Tocá para elegir el archivo";
                if (q) q.hidden = true;
            });

            if (fallados.length) {
                alertaOkTexto.textContent = "Secretaría recibió tu solicitud, pero no pudimos subir: "
                    + fallados.join(", ") + ". Te van a escribir para que los envíes por otro medio.";
            } else if (archivos.length) {
                alertaOkTexto.textContent = "Secretaría recibió tu solicitud y " + archivos.length
                    + (archivos.length === 1 ? " documento" : " documentos")
                    + ". Te escribimos al correo cuando esté lista.";
            } else {
                alertaOkTexto.textContent = "Secretaría la recibió. Te escribimos al correo cuando esté lista.";
            }
            alertaOk.hidden = false;
            alertaOk.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (err) {
            mostrarError("No pudimos enviar la solicitud",
                "Revisá tu conexión y volvé a intentar. Si el problema sigue, escribinos a contacto@ies11jujuy.edu.ar.");
        } finally {
            boton.disabled = false;
            if (etiqueta) etiqueta.textContent = textoOriginal;
        }
    });
}
function initAgendaCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    const monthYearDisplay = document.getElementById("monthYearDisplay");
    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");
    const timeline = document.getElementById("eventsTimeline");
    const panelTitle = document.getElementById("panelMesTitulo");
    const panelBadge = document.getElementById("panelMesBadge");

    if (!calendarDays || !monthYearDisplay) return;

    /* ----------------------------------------------------------------
     * FUENTE ÚNICA DE DATOS
     * Cada hito se escribe UNA sola vez acá. El calendario lo pinta y el
     * panel de la derecha lo lista. Si una fecha cambia, se cambia acá.
     *
     *   desde / hasta : "AAAA-MM-DD". "hasta" es opcional (evento de un día).
     *   tipo          : exam | inscrip | clases | feriado  (define el color)
     *
     * PENDIENTE DE CONFIRMACIÓN: las fechas académicas deben validarse
     * contra la resolución del calendario oficial del IES N° 11.
     * ---------------------------------------------------------------- */
    const EVENTOS = [
        /* --- Asuetos y feriados: noviembre y diciembre 2026 --- */
        {
            desde: "2026-11-02",
            tipo: "feriado",
            etiqueta: "Asueto Provincial",
            titulo: "Día de los Fieles Difuntos",
            detalle: "Asueto administrativo y escolar en la provincia de Jujuy."
        },
        {
            desde: "2026-11-09",
            tipo: "feriado",
            etiqueta: "Feriado Nacional",
            titulo: "Visita del papa León XIV",
            detalle: "Feriado nacional excepcional (Decreto 1103/2026)."
        },
        {
            desde: "2026-11-18",
            tipo: "feriado",
            etiqueta: "No Laborable Provincial",
            titulo: "Día de la Autonomía Política de Jujuy",
            detalle: "Conmemora la separación política de Salta en 1834. Jornada no laborable en el ámbito provincial."
        },
        {
            desde: "2026-11-23",
            tipo: "feriado",
            etiqueta: "Feriado Nacional",
            titulo: "Día de la Soberanía Nacional",
            detalle: "Trasladado desde el viernes 20 (Ley 27.399). Sin actividades académicas ni administrativas."
        },
        {
            desde: "2026-12-08",
            tipo: "feriado",
            etiqueta: "Feriado Nacional",
            titulo: "Inmaculada Concepción de María",
            detalle: "Sin actividades académicas ni administrativas en la sede."
        },
        {
            desde: "2026-12-25",
            tipo: "feriado",
            etiqueta: "Feriado Nacional",
            titulo: "Navidad",
            detalle: "Sin actividades académicas ni administrativas en la sede."
        },

        /* --- Hitos académicos --- */
                {
            desde: "2026-12-01",
            hasta: "2026-12-02",
            tipo: "inscrip",
            etiqueta: "Permisos de Examen",
            titulo: "Permisos de examen (inscripción a mesas finales)",
            detalle: "Registro por sistema para rendir finales del último turno del ciclo."
        },
        {
            desde: "2026-12-09",
            hasta: "2026-12-23",
            tipo: "exam",
            etiqueta: "Mesas de Examen",
            titulo: "Período de mesas de examen (Turno Nov - Dic)",
            detalle: "Último llamado del ciclo lectivo. Consultá el detalle por carrera en Estudiante."
        }
    ];

    const MESES = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const MESES_CORTOS = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    // "2026-11-02" -> Date local (sin corrimiento por zona horaria)
    function aFecha(iso) {
        const [a, m, d] = iso.split("-").map(Number);
        return new Date(a, m - 1, d);
    }

    function aClave(fecha) {
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    }

    // Normaliza: todo evento pasa a tener inicio y fin como objetos Date
    const eventos = EVENTOS.map((ev) => ({
        ...ev,
        inicio: aFecha(ev.desde),
        fin: aFecha(ev.hasta || ev.desde)
    })).sort((a, b) => a.inicio - b.inicio);

    // Qué tipo de evento le toca a un día concreto.
    // Un evento de un solo día (ej. un feriado) gana sobre un período largo
    // que lo contenga (ej. el feriado dentro del período de exámenes).
    function tipoDelDia(fecha) {
        // Sábado y domingo no se marcan: no hay clases ni actividad institucional,
        // aunque la fecha caiga dentro de un período largo.
        const diaSemana = fecha.getDay();
        if (diaSemana === 0 || diaSemana === 6) return null;

        const cubren = eventos.filter((e) => fecha >= e.inicio && fecha <= e.fin);
        if (!cubren.length) return null;
        const puntual = cubren.find((e) => e.inicio.getTime() === e.fin.getTime());
        return (puntual || cubren[0]).tipo;
    }

    // Eventos que tocan el mes mostrado (aunque empiecen o terminen fuera)
    function eventosDelMes(anio, mes) {
        const primero = new Date(anio, mes, 1);
        const ultimo = new Date(anio, mes + 1, 0);
        return eventos.filter((e) => e.inicio <= ultimo && e.fin >= primero);
    }

    function textoRango(ev) {
        const d1 = ev.inicio.getDate();
        const d2 = ev.fin.getDate();
        const m1 = MESES[ev.inicio.getMonth()].toLowerCase();
        const m2 = MESES[ev.fin.getMonth()].toLowerCase();
        if (ev.inicio.getTime() === ev.fin.getTime()) return "";
        return m1 === m2
            ? `Del ${d1} al ${d2} de ${m1}.`
            : `Del ${d1} de ${m1} al ${d2} de ${m2}.`;
    }

    /* ------------------------- Grilla del mes ------------------------- */
    function renderCalendar(date) {
        calendarDays.textContent = "";
        const anio = date.getFullYear();
        const mes = date.getMonth();

        monthYearDisplay.textContent = `${MESES[mes]} ${anio}`;

        const primerDiaSemana = new Date(anio, mes, 1).getDay();
        const ultimoDia = new Date(anio, mes + 1, 0).getDate();
        const hoy = new Date();
        const claveHoy = aClave(hoy);

        for (let i = 0; i < primerDiaSemana; i++) {
            const vacia = document.createElement("div");
            vacia.classList.add("cal-day-cell", "empty");
            calendarDays.appendChild(vacia);
        }

        for (let dia = 1; dia <= ultimoDia; dia++) {
            const fecha = new Date(anio, mes, dia);
            const celda = document.createElement("div");
            celda.classList.add("cal-day-cell");
            celda.textContent = dia;

            if (aClave(fecha) === claveHoy) {
                celda.classList.add("today");
            }

            const tipo = tipoDelDia(fecha);
            if (tipo) {
                celda.classList.add("has-event", `event-${tipo}`);
            }

            calendarDays.appendChild(celda);
        }

        renderTimeline(anio, mes);
    }

    /* --------------------- Panel de la derecha ------------------------ */
    function renderTimeline(anio, mes) {
        if (!timeline) return;

        const lista = eventosDelMes(anio, mes);
        timeline.textContent = "";

        if (panelTitle) {
            panelTitle.textContent = `Fechas Clave de ${MESES[mes]} ${anio}`;
        }

        if (!lista.length) {
            const vacio = document.createElement("p");
            vacio.className = "timeline-empty";
            vacio.textContent = `No hay hitos cargados para ${MESES[mes].toLowerCase()} de ${anio}. Usá las flechas para ver otro mes.`;
            timeline.appendChild(vacio);
            if (panelBadge) {
                panelBadge.textContent = "Sin actividad";
                panelBadge.className = "badge-status closed";
            }
            return;
        }

        if (panelBadge) {
            panelBadge.textContent = `${lista.length} ${lista.length === 1 ? "hito" : "hitos"}`;
            panelBadge.className = "badge-status open";
        }

        lista.forEach((ev) => {
            const art = document.createElement("article");
            art.className = `timeline-event ${ev.tipo}`;

            const caja = document.createElement("div");
            caja.className = "timeline-date-box";
            const dia = document.createElement("span");
            dia.className = "t-day";
            dia.textContent = String(ev.inicio.getDate()).padStart(2, "0");
            const mesTxt = document.createElement("span");
            mesTxt.className = "t-month";
            mesTxt.textContent = MESES_CORTOS[ev.inicio.getMonth()];
            caja.append(dia, mesTxt);

            const cuerpo = document.createElement("div");
            cuerpo.className = "timeline-body";

            const tag = document.createElement("span");
            tag.className = `event-tag ${ev.tipo}`;
            tag.textContent = ev.etiqueta;

            const titulo = document.createElement("h4");
            titulo.textContent = ev.titulo;

            const parrafo = document.createElement("p");
            const rango = textoRango(ev);
            if (rango) {
                const fuerte = document.createElement("strong");
                fuerte.textContent = rango + " ";
                parrafo.appendChild(fuerte);
            }
            parrafo.appendChild(document.createTextNode(ev.detalle));

            cuerpo.append(tag, titulo, parrafo);
            art.append(caja, cuerpo);
            timeline.appendChild(art);
        });
    }

    /* ----------------------------- Navegación ------------------------- */
    const hoy = new Date();
    let currentDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });

        nextBtn.addEventListener("click", () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }

    renderCalendar(currentDate);
}
/**
 * ==========================================================================
 * MÓDULO: MENÚ HAMBURGUESA RESPONSIVE
 * ==========================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
});

function initMobileMenu() {
    const menuBtn = document.getElementById("menuToggle");
    const menuIcon = document.getElementById("menuIcon");
    const navBar = document.querySelector(".header-nav-bar");
    const overlay = document.getElementById("navOverlay");
    const navLinks = document.querySelectorAll(".header-nav-bar .nav-link");

    if (!menuBtn || !navBar) return;

    function toggleMenu() {
        const isOpen = navBar.classList.toggle("menu-open");
        
        if (overlay) overlay.classList.toggle("active", isOpen);

        if (menuIcon) {
            menuIcon.textContent = isOpen ? "close" : "menu";
        }
        menuBtn.setAttribute("aria-expanded", String(isOpen));

        // Bloquear el scroll de la página si el menú está abierto
        document.body.style.overflow = isOpen ? "hidden" : "";
    }

    function closeMenu() {
        navBar.classList.remove("menu-open");
        if (overlay) overlay.classList.remove("active");
        if (menuIcon) menuIcon.textContent = "menu";
        menuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    }

    menuBtn.addEventListener("click", toggleMenu);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navBar.classList.contains("menu-open")) {
            closeMenu();
            menuBtn.focus();
        }
    });

    if (overlay) {
        overlay.addEventListener("click", closeMenu);
    }

    // Cerrar el menú automáticamente al tocar cualquier enlace
    navLinks.forEach(link => {
        link.addEventListener("click", closeMenu);
    });
}
/**
 * ==========================================================================
 * MÓDULO: FORMULARIO DE CONTACTO
 * ==========================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    initContactForm();
});

function initContactForm() {
    const contactForm = document.getElementById("contactForm");
    const successMsg = document.getElementById("contactSuccessMsg");
    const submitBtn = document.getElementById("btnSubmitContact");

    if (!contactForm || !successMsg) return;

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Efecto visual de envío
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Enviando...';
        }

        successMsg.style.display = "none";
        const originalButtonContent = '<span class="material-symbols-outlined">send</span> Enviar Consulta';

        try {
            if (typeof supabaseClient === "undefined" || !supabaseClient) {
                throw new Error("El servicio de consultas no está disponible en este momento.");
            }

            const formData = new FormData(contactForm);
            const { error } = await supabaseClient.from("mensajes_contacto").insert({
                nombre: String(formData.get("nombre") || "").trim(),
                email: String(formData.get("email") || "").trim(),
                asunto: String(formData.get("asunto") || "").trim(),
                mensaje: String(formData.get("mensaje") || "").trim(),
                leido: false
            });
            if (error) throw error;

            successMsg.style.removeProperty("background-color");
            successMsg.style.removeProperty("color");
            successMsg.innerHTML = '<span class="material-symbols-outlined">check_circle</span><div><strong>¡Consulta enviada con éxito!</strong><p>Nos pondremos en contacto dentro de las 24 a 48 hs hábiles.</p></div>';
            contactForm.reset();
        } catch (error) {
            console.error("Error al enviar la consulta:", error);
            successMsg.innerHTML = '<span class="material-symbols-outlined">error</span><div><strong>No pudimos enviar tu consulta.</strong><p>Probá nuevamente más tarde o escribinos a contacto@ies11jujuy.edu.ar.</p></div>';
            successMsg.style.backgroundColor = "#fef2f2";
            successMsg.style.color = "#b91c1c";
        } finally {
            successMsg.style.display = "flex";
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalButtonContent || '<span class="material-symbols-outlined">send</span> Enviar Consulta';
            }
        }
    });
}
/**
 * ==========================================================================
 * ICONOS DECORATIVOS
 * Material Symbols dibuja los íconos con ligaduras: el texto del elemento es
 * literalmente "search" o "arrow_forward". Sin aria-hidden, un lector de
 * pantalla los lee en voz alta como palabras sueltas intercaladas en el
 * contenido. translate="no" evita que Google Translate los traduzca y rompa
 * la ligadura (un problema conocido de esta familia tipográfica).
 * El observador cubre los íconos que el JS inserta después (carreras, agenda).
 * ==========================================================================
 */
function initIconosDecorativos() {
    const marcar = (raiz) => {
        const iconos = raiz.querySelectorAll ? raiz.querySelectorAll(".material-symbols-outlined") : [];
        iconos.forEach((el) => {
            el.setAttribute("aria-hidden", "true");
            el.setAttribute("translate", "no");
        });
    };

    marcar(document);

    if (!("MutationObserver" in window)) return;
    new MutationObserver((mutaciones) => {
        mutaciones.forEach((m) => {
            m.addedNodes.forEach((n) => {
                if (n.nodeType !== 1) return;
                if (n.classList && n.classList.contains("material-symbols-outlined")) {
                    n.setAttribute("aria-hidden", "true");
                    n.setAttribute("translate", "no");
                }
                marcar(n);
            });
        });
    }).observe(document.body, { childList: true, subtree: true });
}

/**
 * ==========================================================================
 * MÓDULO: AUTORIDADES Y CUERPO DOCENTE (VISTA PÚBLICA)
 * ==========================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    initAutoridadesPublicas();
});

async function initAutoridadesPublicas() {
    const boardGrid = document.querySelector(".board-grid");
    const coordGrid = document.querySelector(".coord-grid");

    if (!boardGrid && !coordGrid) return;
    if (typeof supabaseClient === "undefined" || !supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from("autoridades")
            .select("*");

        if (error || !Array.isArray(data) || data.length === 0) {
            return;
        }

        const directivos = data
            .filter((item) => item.tipo === "directivo")
            .sort((a, b) => prioridadDirectivo(a) - prioridadDirectivo(b));

        const coordinadores = data.filter((item) => item.tipo !== "directivo");

        if (boardGrid && directivos.length > 0) {
            boardGrid.innerHTML = "";
            directivos.forEach((item) => {
                boardGrid.insertAdjacentHTML("beforeend", crearTarjetaDirectivo(item));
            });
        }

        if (coordGrid && coordinadores.length > 0) {
            coordGrid.innerHTML = "";
            coordinadores.forEach((item) => {
                coordGrid.insertAdjacentHTML("beforeend", crearTarjetaCoordinador(item));
            });
        }
    } catch (err) {
        console.warn("No se pudieron cargar las autoridades desde Supabase:", err);
    }
}

function prioridadDirectivo(item) {
    const texto = `${obtenerCampo(item, ["cargo", "carga"], "")} ${obtenerCampo(item, ["nombre"], "")}`.toLowerCase();
    // Rector / Rectora primero (izquierda)
    if (texto.includes("rector") && !texto.includes("vice")) return 1;
    // Vicerrector / Vicerrectora segundo (derecha)
    if (texto.includes("vice")) return 2;
    return 3;
}

function escaparTexto(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function obtenerCampo(item, claves, respaldo = "") {
    for (const clave of claves) {
        const val = item[clave];
        if (val !== undefined && val !== null && typeof val !== "object") {
            const limpio = String(val).trim();
            if (limpio !== "" && limpio !== "{}") {
                return limpio;
            }
        }
    }
    return respaldo;
}

function crearTarjetaDirectivo(item) {
    const nombre = escaparTexto(obtenerCampo(item, ["nombre"], "Autoridad Institucional"));
    const cargo = escaparTexto(obtenerCampo(item, ["cargo", "carga"], "Cuerpo Directivo"));
    const resolucion = escaparTexto(obtenerCampo(item, ["area_o_resolucion", "área_o_resolución"], ""));
    const descripcion = escaparTexto(obtenerCampo(item, ["descripcion", "descripción"], ""));
    const email = obtenerCampo(item, ["email", "correo_electronico", "correo electrónico"], "");
    const foto = obtenerCampo(item, ["foto_url", "foto url"], "assets/images/rectora.webp");

    return `
        <article class="board-card">
            <div class="board-img-wrapper">
                <img src="${escaparTexto(foto)}" alt="${nombre}" class="board-img">
                <span class="board-tag">${cargo}</span>
            </div>
            <div class="board-info">
                ${resolucion ? `<span class="board-resolution">${resolucion}</span>` : ""}
                <h3>${nombre}</h3>
                ${descripcion ? `<p class="board-desc">${descripcion}</p>` : ""}
                ${email ? `
                    <div class="board-contact">
                        <a href="mailto:${escaparTexto(email)}">${escaparTexto(email)}</a>
                    </div>
                ` : ""}
            </div>
        </article>
    `;
}

function crearTarjetaCoordinador(item) {
    const nombre = escaparTexto(obtenerCampo(item, ["nombre"], "Coordinador/a"));
    const cargo = escaparTexto(obtenerCampo(item, ["cargo", "carga"], "Coordinador de Departamento"));
    const area = escaparTexto(obtenerCampo(item, ["area_o_resolucion", "área_o_resolución"], "Área Académica"));
    const turno = escaparTexto(obtenerCampo(item, ["turno"], ""));
    const ubicacion = escaparTexto(obtenerCampo(item, ["ubicacion", "ubicación"], ""));
    const descripcion = escaparTexto(obtenerCampo(item, ["descripcion", "descripción"], ""));
    const email = obtenerCampo(item, ["email", "correo_electronico", "correo electrónico"], "");
    const foto = obtenerCampo(item, ["foto_url", "foto url"], "assets/images/rectora.webp");
    const carrerasRaw = obtenerCampo(item, ["carreras"], "");

    const pillsCarreras = carrerasRaw
        ? carrerasRaw
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => `<span class="career-pill">${escaparTexto(c)}</span>`)
            .join("")
        : "";

    return `
        <article class="coord-card">
            <div class="coord-header">
                <span class="coord-badge">${area}</span>
                ${turno ? `
                    <span class="coord-shift">
                        <span class="material-symbols-outlined">schedule</span> ${turno}
                    </span>
                ` : ""}
            </div>
            <div class="coord-profile">
                <img src="${escaparTexto(foto)}" alt="${nombre}" class="coord-img">
                <div class="coord-titles">
                    <h3>${nombre}</h3>
                    <p class="coord-role">${cargo}</p>
                </div>
            </div>
            ${pillsCarreras ? `<div class="coord-careers">${pillsCarreras}</div>` : ""}
            ${descripcion ? `<p class="board-desc" style="margin: 10px 0;">${descripcion}</p>` : ""}
            <div class="coord-details">
                ${ubicacion ? `
                    <div class="detail-item">
                        <span class="material-symbols-outlined">location_on</span>
                        <span>${ubicacion}</span>
                    </div>
                ` : ""}
                ${email ? `
                    <div class="detail-item">
                        <span class="material-symbols-outlined">mail</span>
                        <a href="mailto:${escaparTexto(email)}">${escaparTexto(email)}</a>
                    </div>
                ` : ""}
            </div>
            ${email ? `
                <a href="mailto:${escaparTexto(email)}" class="btn-coord-contact">
                    <span>Enviar Consulta</span>
                    <span class="material-symbols-outlined">send</span>
                </a>
            ` : ""}
        </article>
    `;
}