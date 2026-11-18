/**
 * ==========================================================================
 * OFE-03: NORMALIZACIÓN DE DENOMINACIONES ACADÉMICAS
 * --------------------------------------------------------------------------
 * Unifica cómo se muestran y se guardan los nombres de carreras y los
 * títulos otorgados, sin importar cómo los haya escrito cada persona.
 *
 * Reglas:
 *   1. Se recortan y colapsan los espacios.
 *   2. Se corrigen errores de tipeo y tildes faltantes conocidos.
 *   3. Se aplica capitalización tipo título: primera letra en mayúscula,
 *      conectores (de, del, la, en, y, e, ...) en minúscula.
 *   4. Las siglas habituales se mantienen en mayúsculas.
 *
 * IMPORTANTE:
 *   - Esto NO cambia la denominación académica: solo su escritura.
 *   - Las correcciones puntuales deben mantenerse sincronizadas con
 *     qa/sql/ofe-03-titulos.sql (función public.normalizar_denominacion).
 *   - Si la institución confirma otra denominación oficial, se cambia el
 *     dato en la base, no esta función.
 * ==========================================================================
 */

(function (global) {
    "use strict";

    // Palabras que van en minúscula cuando no son la primera del texto.
    const CONECTORES = new Set([
        "de", "del", "la", "las", "los", "el",
        "y", "e", "en", "con", "para", "por",
        "a", "al", "o", "u",
        "un", "una", "unos", "unas"
    ]);

    // Siglas que deben conservarse en mayúsculas.
    const SIGLAS = new Set(["ia", "tic", "tics", "ong", "pyme", "pymes"]);

    /**
     * Correcciones de escritura detectadas en los registros actuales.
     * Las claves van sin tildes y en minúscula para que coincidan tanto con
     * "TECNICO" como con "Técnico".
     * No se agregan denominaciones nuevas: solo se corrige la escritura.
     */
    const CORRECCIONES = Object.freeze({
        // Errores de tipeo
        adminitracion: "administración",
        desarrolo: "desarrollo",
        superios: "superior",
        gerentologia: "gerontología",
        regionales: "regional",

        // Palabras que suelen cargarse sin tilde
        administracion: "administración",
        tecnico: "técnico",
        tecnica: "técnica",
        gestion: "gestión",
        energia: "energía",
        energias: "energías",
        hoteleria: "hotelería",
        enfermeria: "enfermería",
        diseno: "diseño",
        gerontologia: "gerontología",
        electronica: "electrónica",
        mecanica: "mecánica",
        quimica: "química",
        fisica: "física",
        matematicas: "matemáticas",
        robotica: "robótica",
        analisis: "análisis",
        practica: "práctica",
        practicas: "prácticas",
        programacion: "programación",
        automatizacion: "automatización"
    });

    function quitarTildes(texto) {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    /**
     * Devuelve la denominación con escritura uniforme.
     * @param {*} valor Texto original (puede venir null o undefined).
     * @returns {string}
     */
    function normalizarDenominacion(valor) {
        if (valor === null || valor === undefined) return "";

        const limpio = String(valor).replace(/\s+/g, " ").trim();
        if (!limpio) return "";

        return limpio
            .split(" ")
            .map((palabra, indice) => {
                const clave = quitarTildes(palabra.toLowerCase());
                const corregida = CORRECCIONES[clave] || palabra;

                if (indice > 0 && CONECTORES.has(clave)) {
                    return corregida.toLowerCase();
                }
                if (SIGLAS.has(clave)) {
                    return corregida.toUpperCase();
                }

                const minuscula = corregida.toLowerCase();
                return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
            })
            .join(" ");
    }

    global.normalizarDenominacion = normalizarDenominacion;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            normalizarDenominacion,
            CORRECCIONES,
            CONECTORES,
            SIGLAS
        };
    }
})(typeof window !== "undefined" ? window : globalThis);
