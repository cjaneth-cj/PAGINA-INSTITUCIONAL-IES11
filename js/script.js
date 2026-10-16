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