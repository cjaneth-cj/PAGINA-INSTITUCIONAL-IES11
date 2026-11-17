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
    const slides = [
        {
            image: "",
            title: "Construí tu Futuro Profesional en Jujuy",
            subtitle: "Formación técnica y docente con excelencia académica, compromiso social y salida laboral orientada al desarrollo productivo y cultural regional."
        },
        {
            image: "",
            title: "Títulos Oficiales con Validez Nacional",
            subtitle: "Tecnicaturas superiores y profesorados pensados para responder a las demandas laborales del NOA."
        },
        {
            image: "",
            title: "Educación Pública, Gratuita y de Calidad",
            subtitle: "Prácticas profesionalizantes, vinculación con el sector productivo y acompañamiento académico durante toda la cursada."
        }
    ];
        // Precarga: evita el parpadeo en blanco al cambiar de slide
    slides.forEach((s) => { const img = new Image(); img.src = s.image; });
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

function initAgendaCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    const monthYearDisplay = document.getElementById("monthYearDisplay");
    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");

    if (!calendarDays || !monthYearDisplay) return;

    let currentDate = new Date();

    // Hitos académicos del calendario (formato YYYY-MM-DD)
    const academicEvents = {
        "2026-03-16": "exam",
        "2026-03-23": "inscrip",
        "2026-03-30": "clases",
        "2026-04-02": "feriado",
        "2026-07-06": "exam",
        "2026-07-13": "feriado" // Receso invernal
    };

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    function renderCalendar(date) {
        calendarDays.innerHTML = "";
        const year = date.getFullYear();
        const month = date.getMonth();

        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();

        // Celdas en blanco previas
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.classList.add("cal-day-cell", "empty");
            calendarDays.appendChild(emptyCell);
        }

        // Celdas de los días del mes
        const today = new Date();
        for (let day = 1; day <= lastDay; day++) {
            const dayCell = document.createElement("div");
            dayCell.classList.add("cal-day-cell");
            dayCell.textContent = day;

            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            if (
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
            ) {
                dayCell.classList.add("today");
            }

            if (academicEvents[formattedDate]) {
                dayCell.classList.add("has-event", `event-${academicEvents[formattedDate]}`);
            }

            calendarDays.appendChild(dayCell);
        }
    }

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
