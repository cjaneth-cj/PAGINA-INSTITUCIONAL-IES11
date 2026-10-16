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
});


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

    // Datos de cada slide
    const slides = [
        {
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBq83VI5Oy4eKxIVLx_sP3XFxT7dV07-Xh7oQFw56ItZrYhtvMrrIOcAvSmAJIawjr7pWO8vPYKwAzqQBI-yDHrq60_U21UCjGxcthfAtFXucec5QtqSltZflCJY9gDhLZueI3qJDUDW2KNMjlyjGVFb9IYmG41FSCVodYxsXzDigCWVxoRcFuh0Ggr042qBLSR8cgmilcXL8gvRhDYxh4iDrWB8WPtkN0MXHxc2cQjXvzuQ4LgKd6_Ig",
            title: "Construí tu Futuro Profesional en Jujuy",
            subtitle: "Formación técnica y docente con excelencia académica, compromiso social y salida laboral orientada al desarrollo productivo y cultural regional."
        },
        {
            image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1400",
            title: "Títulos Oficiales con Validez Nacional",
            subtitle: "Más de 15 tecnicaturas superiores y profesorados pensados para responder a las demandas laborales del NOA."
        },
        {
            image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1400",
            title: "Educación Pública, Gratuita y de Calidad",
            subtitle: "Prácticas profesionalizantes en laboratorios propios, convenios hospitalarios y vinculación directa con el sector productivo."
        }
    ];

    let currentIndex = 0;
    let autoPlayTimer = null;

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
        if (bgImage) {
            bgImage.style.opacity = "0.4";
            setTimeout(() => {
                bgImage.style.backgroundImage = `url('${currentSlide.image}')`;
                bgImage.style.opacity = "1";
            }, 200);
        }

        if (titleElement) titleElement.textContent = currentSlide.title;
        if (subtitleElement) subtitleElement.textContent = currentSlide.subtitle;
        if (counterElement) counterElement.textContent = `0${currentIndex + 1} / 0${slides.length}`;

        // Actualizar dots
        dots.forEach((dot, i) => {
            if (i === currentIndex) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }

    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(() => {
            showSlide(currentIndex + 1);
        }, 6000);
    }

    function stopAutoPlay() {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
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

        // Bloquear el scroll de la página si el menú está abierto
        document.body.style.overflow = isOpen ? "hidden" : "";
    }

    function closeMenu() {
        navBar.classList.remove("menu-open");
        if (overlay) overlay.classList.remove("active");
        if (menuIcon) menuIcon.textContent = "menu";
        document.body.style.overflow = "";
    }

    menuBtn.addEventListener("click", toggleMenu);

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

    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Efecto visual de envío
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Enviando...';
        }

        setTimeout(() => {
            // Mostrar mensaje de éxito y resetear formulario
            successMsg.style.display = "flex";
            contactForm.reset();

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="material-symbols-outlined">send</span> Enviar Consulta';
            }

            // Ocultar mensaje automáticamente a los 6 segundos
            setTimeout(() => {
                successMsg.style.display = "none";
            }, 6000);
        }, 600);
    });
}