/**
 * ==========================================================================
 * EST-03: CALENDARIO DE TURNOS Y MESAS DE EXÁMENES FINALES
 * Los estados ya no están fijos en el HTML: se calculan a partir de las
 * fechas de inscripción y del período de exámenes de cada turno.
 *
 * IMPORTANTE (datos institucionales):
 *   Las fechas de abajo son las publicadas en la tabla original. Deben
 *   confirmarse cada año con el cronograma académico oficial del IES N° 11.
 *   Formato: "MM-DD"; el año se toma automáticamente del calendario actual.
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("tablaTurnosExamen");
    if (!tbody) return;

    const ANIO = new Date().getFullYear();

    const TURNOS = [
        {
            nombre: "Turno Febrero - Marzo",
            periodoInicio: "02-15",
            periodoFin: "03-08",
            inscripcionInicio: "02-01",
            inscripcionFin: "02-13"
        },
        {
            nombre: "Turno Julio - Agosto",
            periodoInicio: "07-07",
            periodoFin: "07-28",
            inscripcionInicio: "06-22",
            inscripcionFin: "07-05"
        },
        {
            nombre: "Turno Noviembre - Diciembre",
            periodoInicio: "11-20",
            periodoFin: "12-18",
            inscripcionInicio: "11-02",
            inscripcionFin: "11-18"
        }
    ];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    function aFecha(mesDia) {
        return new Date(`${ANIO}-${mesDia}T00:00:00`);
    }

    const MESES_CORTOS = [
        "ene", "feb", "mar", "abr", "may", "jun",
        "jul", "ago", "sep", "oct", "nov", "dic"
    ];

    function formatear(fecha, incluirAnio = false) {
        const dia = String(fecha.getDate()).padStart(2, "0");
        const mes = MESES_CORTOS[fecha.getMonth()];
        const texto = `${dia} ${mes}`;
        return incluirAnio ? `${texto} ${fecha.getFullYear()}` : texto;
    }

    function calcularEstado(turno) {
        const periodoFin = aFecha(turno.periodoFin);
        const inscripcionInicio = aFecha(turno.inscripcionInicio);
        const inscripcionFin = aFecha(turno.inscripcionFin);

        if (hoy > periodoFin) {
            return { texto: "Concluido", clase: "closed" };
        }
        if (hoy > inscripcionFin) {
            return { texto: "Inscripciones cerradas", clase: "closed" };
        }
        if (hoy >= inscripcionInicio) {
            return { texto: "Inscripciones abiertas", clase: "open" };
        }
        return { texto: "Próximamente", clase: "scheduled" };
    }

    tbody.textContent = "";

    TURNOS.forEach((turno) => {
        const periodoInicio = aFecha(turno.periodoInicio);
        const periodoFin = aFecha(turno.periodoFin);
        const inscripcionFin = aFecha(turno.inscripcionFin);
        const estado = calcularEstado(turno);

        const fila = document.createElement("tr");

        const celdaTurno = document.createElement("td");
        const fuerte = document.createElement("strong");
        fuerte.textContent = turno.nombre;
        celdaTurno.appendChild(fuerte);

        const celdaPeriodo = document.createElement("td");
        celdaPeriodo.textContent =
            `${formatear(periodoInicio)} - ${formatear(periodoFin, true)}`;

        const celdaCierre = document.createElement("td");
        celdaCierre.textContent = formatear(inscripcionFin, true);

        const celdaEstado = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `badge-status ${estado.clase}`;
        badge.textContent = estado.texto;
        celdaEstado.appendChild(badge);

        fila.append(celdaTurno, celdaPeriodo, celdaCierre, celdaEstado);
        tbody.appendChild(fila);
    });

    // Nota de transparencia para el usuario
    const nota = document.getElementById("notaEstadoExamenes");
    if (nota) {
        nota.textContent =
            "Los estados se actualizan automáticamente según las fechas de inscripción y el período de exámenes de cada turno.";
    }
});
