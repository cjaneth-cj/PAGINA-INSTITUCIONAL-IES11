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
    // Espacio reservado para conectar los botones de desplazamiento del banner principal
    const heroSection = document.getElementById("inicio01");
    if (!heroSection) return;

    // Ejemplo de registro de eventos para futuros controles de carrusel
    console.log("Módulo Hero Carousel inicializado correctamente.");
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