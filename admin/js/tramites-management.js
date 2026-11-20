/* ==========================================================================
 * EST-01 — Gestión de solicitudes de trámites (panel de administración)
 * --------------------------------------------------------------------------
 * Lista las solicitudes que los alumnos envían desde la sección Estudiante,
 * permite ver la documentación adjunta, aceptarla o rechazarla documento por
 * documento, y llevar la solicitud por sus cinco estados.
 *
 * Todo el contenido se pinta con textContent y createElement, nunca con
 * innerHTML: los campos vienen de un formulario público y el hallazgo SEC-02
 * del informe de seguridad es exactamente eso.
 *
 * El bucket `tramites` es privado: los documentos se abren con enlaces
 * firmados de corta duración, no con URL públicas.
 * ========================================================================== */

const ESTADOS = ["Nueva", "En proceso", "Lista para retirar", "Entregada", "Rechazada"];
const ESTADOS_ACTIVOS = ["Nueva", "En proceso", "Lista para retirar"];

const CLASE_ESTADO = {
    "Nueva": "badge-nueva",
    "En proceso": "badge-proceso",
    "Lista para retirar": "badge-lista",
    "Entregada": "badge-entregada",
    "Rechazada": "badge-rechazada"
};

const CLASE_DOC = {
    "Pendiente": "doc-pendiente",
    "Aceptado": "doc-aceptado",
    "Rechazado": "doc-rechazado"
};

let solicitudes = [];
let archivosPorCarpeta = {};
let abierta = null;
let emailAdmin = "";

/* --------------------------------------------------------------- Utilidades */

function $(id) { return document.getElementById(id); }

function texto(tag, contenido, clase) {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    el.textContent = contenido == null ? "" : String(contenido);
    return el;
}

function fechaCorta(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fechaLarga(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
        + " a las " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function peso(bytes) {
    if (!bytes) return "";
    return bytes < 1024 * 1024
        ? Math.round(bytes / 1024) + " KB"
        : (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
}

function avisar(mensaje) {
    const caja = $("avisoTabla");
    if (!caja) return;
    caja.textContent = mensaje;
    caja.hidden = false;
}

/* ------------------------------------------------------------------ Carga */

async function cargar() {
    const tbody = $("tablaSolicitudes");
    tbody.textContent = "";
    const fila = document.createElement("tr");
    const celda = texto("td", "Cargando solicitudes...");
    celda.colSpan = 8;
    celda.style.textAlign = "center";
    celda.style.color = "var(--text-muted)";
    fila.appendChild(celda);
    tbody.appendChild(fila);

    if (typeof supabaseClient === "undefined" || !supabaseClient) {
        avisar("No se pudo conectar con la base de datos. Revisá la conexión y recargá la página.");
        tbody.textContent = "";
        return;
    }

    const { data, error } = await supabaseClient
        .from("solicitudes_tramites")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        avisar("No se pudieron leer las solicitudes. Si la tabla todavía no existe, "
            + "ejecutá qa/sql/est-01-solicitudes-tramites.sql en Supabase. Detalle: " + error.message);
        tbody.textContent = "";
        return;
    }

    solicitudes = Array.isArray(data) ? data : [];

    const { data: arch } = await supabaseClient
        .from("solicitudes_archivos")
        .select("*")
        .order("id", { ascending: true });

    archivosPorCarpeta = {};
    (arch || []).forEach((a) => {
        if (!archivosPorCarpeta[a.carpeta]) archivosPorCarpeta[a.carpeta] = [];
        archivosPorCarpeta[a.carpeta].push(a);
    });

    $("avisoTabla").hidden = true;
    pintarMetricas(arch || []);
    pintarTabla();
}

function pintarMetricas(todosLosArchivos) {
    const cuenta = (e) => solicitudes.filter((s) => s.estado === e).length;
    $("cantTotal").textContent = solicitudes.length;
    $("cantNuevas").textContent = cuenta("Nueva");
    $("cantProceso").textContent = cuenta("En proceso");
    $("cantListas").textContent = cuenta("Lista para retirar");
    $("cantDocs").textContent = todosLosArchivos.filter((a) => a.estado_revision === "Pendiente").length;
}

/* ------------------------------------------------------------------ Tabla */

function pintarTabla() {
    const tbody = $("tablaSolicitudes");
    const fEstado = $("filtroEstado").value;
    const fTipo = $("filtroTipo").value;

    let lista = solicitudes.slice();
    if (fTipo) lista = lista.filter((s) => s.tipo_tramite === fTipo);
    if (fEstado === "Activas") lista = lista.filter((s) => ESTADOS_ACTIVOS.indexOf(s.estado) !== -1);
    else if (fEstado) lista = lista.filter((s) => s.estado === fEstado);

    tbody.textContent = "";

    if (!lista.length) {
        const tr = document.createElement("tr");
        const td = texto("td", "No hay solicitudes que coincidan con el filtro.");
        td.colSpan = 8;
        td.style.textAlign = "center";
        td.style.color = "var(--text-muted)";
        td.style.padding = "28px 0";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    lista.forEach((s) => {
        const tr = document.createElement("tr");

        const tdEstado = document.createElement("td");
        tdEstado.appendChild(texto("span", s.estado, "badge-status " + (CLASE_ESTADO[s.estado] || "")));
        tr.appendChild(tdEstado);

        tr.appendChild(texto("td", fechaCorta(s.created_at)));
        tr.appendChild(texto("td", s.nombre_completo));
        tr.appendChild(texto("td", s.dni));
        tr.appendChild(texto("td", s.tipo_tramite));

        const docs = archivosPorCarpeta[s.carpeta] || [];
        const pend = docs.filter((d) => d.estado_revision === "Pendiente").length;
        const tdDocs = document.createElement("td");
        if (!docs.length) {
            tdDocs.appendChild(texto("span", "—"));
        } else {
            tdDocs.appendChild(texto("span", docs.length + (pend ? " (" + pend + " sin revisar)" : "")));
            if (pend) tdDocs.style.color = "#b45309";
        }
        tr.appendChild(tdDocs);

        tr.appendChild(texto("td", s.responsable || "—"));

        const tdAcc = document.createElement("td");
        tdAcc.style.textAlign = "right";
        const btn = texto("button", "Ver", "btn-action");
        btn.type = "button";
        btn.addEventListener("click", () => abrir(s));
        tdAcc.appendChild(btn);
        tr.appendChild(tdAcc);

        tbody.appendChild(tr);
    });
}

/* ------------------------------------------------------------------ Modal */

const CAMPOS_DETALLE = [
    ["nombre_completo", "Alumno", true],
    ["dni", "DNI", false],
    ["carrera", "Carrera", false],
    ["carrera_destino", "Carrera de destino", false],
    ["anio_cursada", "Año", false],
    ["cohorte", "Cohorte", false],
    ["turno", "Turno", false],
    ["motivo", "Para qué la necesita", false],
    ["destinatario", "Dirigido a", false],
    ["email", "Correo", false],
    ["telefono", "Teléfono", false],
    ["observaciones", "Observaciones del alumno", true]
];

function abrir(s) {
    abierta = s;

    $("modalTitulo").textContent = s.tipo_tramite;

    const grid = $("modalDatos");
    grid.textContent = "";

    const fecha = document.createElement("div");
    fecha.className = "dato-item is-ancho";
    fecha.appendChild(texto("span", "Recibida", "dato-rotulo"));
    fecha.appendChild(texto("span", fechaLarga(s.created_at), "dato-valor"));
    grid.appendChild(fecha);

    CAMPOS_DETALLE.forEach(([campo, rotulo, ancho]) => {
        const v = s[campo];
        if (v == null || v === "") return;
        const item = document.createElement("div");
        item.className = "dato-item" + (ancho ? " is-ancho" : "");
        item.appendChild(texto("span", rotulo, "dato-rotulo"));
        item.appendChild(texto("span", v, "dato-valor"));
        grid.appendChild(item);
    });

    pintarDocumentos(s);

    const sel = $("modalEstado");
    sel.textContent = "";
    ESTADOS.forEach((e) => {
        const op = document.createElement("option");
        op.value = e;
        op.textContent = e;
        if (e === s.estado) op.selected = true;
        sel.appendChild(op);
    });

    $("modalResponsable").textContent = s.responsable
        ? "Tomada por " + s.responsable + (s.respondido_at ? " el " + fechaCorta(s.respondido_at) : "")
        : "Sin responsable asignado";

    $("modalRespuesta").value = s.respuesta || "";

    const asunto = "IES N° 11 - " + s.tipo_tramite;
    const cuerpo = "Hola " + (s.nombre_completo || "") + ",\n\n"
        + "Te escribimos por tu solicitud de " + s.tipo_tramite + " enviada el "
        + fechaCorta(s.created_at) + ".\n\n\n\nSaludos,\nSecretaría - IES N° 11";
    $("btnAbrirCorreo").href = "mailto:" + encodeURIComponent(s.email || "")
        + "?subject=" + encodeURIComponent(asunto)
        + "&body=" + encodeURIComponent(cuerpo);

    $("modalSolicitud").style.display = "flex";
}

function pintarDocumentos(s) {
    const bloque = $("modalDocsBloque");
    const cont = $("modalDocs");
    cont.textContent = "";

    const docs = archivosPorCarpeta[s.carpeta] || [];
    if (!docs.length) {
        bloque.hidden = true;
        return;
    }
    bloque.hidden = false;

    docs.forEach((d) => cont.appendChild(filaDocumento(d)));
}

function filaDocumento(d) {
    const item = document.createElement("div");
    item.className = "doc-item";

    const fila = document.createElement("div");
    fila.className = "doc-fila";

    const nom = document.createElement("span");
    nom.className = "doc-nombre";
    nom.textContent = d.tipo_documento;
    nom.appendChild(texto("span", d.nombre_original + " · " + peso(d.tamano_bytes), "doc-meta"));
    fila.appendChild(nom);

    fila.appendChild(texto("span", d.estado_revision,
        "badge-doc " + (CLASE_DOC[d.estado_revision] || "")));

    const ver = texto("button", "Ver", "doc-btn doc-ver");
    ver.type = "button";
    ver.addEventListener("click", () => verDocumento(d, ver));
    fila.appendChild(ver);

    const aceptar = texto("button", "Aceptar", "doc-btn doc-aceptar");
    aceptar.type = "button";
    aceptar.disabled = d.estado_revision === "Aceptado";
    aceptar.addEventListener("click", () => revisarDocumento(d, "Aceptado", null));
    fila.appendChild(aceptar);

    const rechazar = texto("button", "Rechazar", "doc-btn doc-rechazar");
    rechazar.type = "button";
    fila.appendChild(rechazar);

    item.appendChild(fila);

    if (d.observacion_revision) {
        item.appendChild(texto("div", "Motivo: " + d.observacion_revision, "doc-obs"));
    }

    const caja = document.createElement("div");
    caja.className = "doc-rechazo";
    caja.hidden = true;
    const motivo = document.createElement("input");
    motivo.type = "text";
    motivo.maxLength = 300;
    motivo.placeholder = "Por qué se rechaza (lo ve Secretaría, no el alumno)";
    const confirmar = texto("button", "Confirmar rechazo", "doc-btn doc-rechazar");
    confirmar.type = "button";
    confirmar.addEventListener("click", () => {
        if (!motivo.value.trim()) { motivo.focus(); return; }
        revisarDocumento(d, "Rechazado", motivo.value.trim());
    });
    caja.append(motivo, confirmar);
    item.appendChild(caja);

    rechazar.addEventListener("click", () => {
        caja.hidden = !caja.hidden;
        if (!caja.hidden) motivo.focus();
    });

    return item;
}

async function verDocumento(d, boton) {
    const original = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Abriendo...";
    try {
        const { data, error } = await supabaseClient.storage
            .from("tramites")
            .createSignedUrl(d.storage_path, 300);
        if (error || !data || !data.signedUrl) throw error || new Error("sin url");
        window.open(data.signedUrl, "_blank", "noopener");
    } catch (e) {
        avisar("No se pudo abrir «" + d.nombre_original + "». "
            + "Revisá que el bucket `tramites` exista y que tengas sesión iniciada.");
    } finally {
        boton.disabled = false;
        boton.textContent = original;
    }
}

async function revisarDocumento(d, estado, observacion) {
    const { error } = await supabaseClient
        .from("solicitudes_archivos")
        .update({
            estado_revision: estado,
            observacion_revision: observacion,
            revisado_por: emailAdmin || null,
            revisado_at: new Date().toISOString()
        })
        .eq("id", d.id);

    if (error) {
        avisar("No se pudo guardar la revisión del documento: " + error.message);
        return;
    }

    d.estado_revision = estado;
    d.observacion_revision = observacion;
    d.revisado_por = emailAdmin || null;
    if (abierta) pintarDocumentos(abierta);
    pintarTabla();
    const todos = Object.keys(archivosPorCarpeta).reduce((acc, k) => acc.concat(archivosPorCarpeta[k]), []);
    pintarMetricas(todos);
}

async function guardar(estadoForzado) {
    if (!abierta) return;
    const btnG = $("btnGuardar");
    const btnE = $("btnEntregada");
    btnG.disabled = true;
    btnE.disabled = true;

    const nuevoEstado = estadoForzado || $("modalEstado").value;
    const cambios = {
        estado: nuevoEstado,
        respuesta: $("modalRespuesta").value.trim() || null,
        responsable: abierta.responsable || emailAdmin || null
    };
    if (nuevoEstado !== "Nueva") cambios.respondido_at = new Date().toISOString();

    const { error } = await supabaseClient
        .from("solicitudes_tramites")
        .update(cambios)
        .eq("id", abierta.id);

    btnG.disabled = false;
    btnE.disabled = false;

    if (error) {
        avisar("No se pudieron guardar los cambios: " + error.message);
        return;
    }

    Object.assign(abierta, cambios);
    cerrar();
    pintarTabla();
    pintarMetricas(Object.keys(archivosPorCarpeta).reduce((a, k) => a.concat(archivosPorCarpeta[k]), []));
}

function cerrar() {
    $("modalSolicitud").style.display = "none";
    abierta = null;
}

/* ------------------------------------------------------------------ Inicio */

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof supabaseClient !== "undefined" && supabaseClient) {
        try {
            const { data } = await supabaseClient.auth.getSession();
            emailAdmin = (data && data.session && data.session.user && data.session.user.email) || "";
        } catch (e) {
            emailAdmin = "";
        }
    }

    $("btnActualizar").addEventListener("click", cargar);
    $("filtroEstado").addEventListener("change", pintarTabla);
    $("filtroTipo").addEventListener("change", pintarTabla);
    $("btnCerrarModal").addEventListener("click", cerrar);
    $("btnGuardar").addEventListener("click", () => guardar(null));
    $("btnEntregada").addEventListener("click", () => guardar("Entregada"));

    $("modalSolicitud").addEventListener("click", (ev) => {
        if (ev.target === $("modalSolicitud")) cerrar();
    });
    document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && $("modalSolicitud").style.display === "flex") cerrar();
    });

    cargar();
});