/**
 * ============================================================================
 * OFE-05: prueba de regresión de denominaciones académicas
 * ----------------------------------------------------------------------------
 * Verifica que todos los nombres y títulos cargados hoy en Supabase queden
 * con escritura correcta y uniforme, y que la función sea idempotente.
 *
 * Uso:  node qa/pruebas-titulos.js
 * Requiere Node 14 o superior. No necesita dependencias ni conexión.
 * ============================================================================
 */

const { normalizarDenominacion } = require("../js/titulos.js");

// Pares [valor actual en la base, valor esperado en pantalla].
// Los valores de la izquierda son los 13 registros reales de `carreras`
// al 18/11/2026. Si la institución confirma otra denominación oficial,
// se actualiza el dato en la base y este listado.
const CASOS = [
  // id 1
  ["TECNICATURA SUPERIOR EN TURISMO", "Tecnicatura Superior en Turismo"],
  ["Técnico Superior en Turismo", "Técnico Superior en Turismo"],
  // id 2
  ["ENFERMERIA", "Enfermería"],
  ["Enfermero/a", "Enfermero/a"],
  // id 3
  ["CIENCIA DE DATOS E INTELIGENCIA ARTIFICIAL", "Ciencia de Datos e Inteligencia Artificial"],
  ["Técnico Superior en Ciencia de Datos e Inteligencia Artificial", "Técnico Superior en Ciencia de Datos e Inteligencia Artificial"],
  // id 4
  ["LABORATORIO", "Laboratorio"],
  ["LABORATORIO", "Laboratorio"],
  // id 5
  ["HOTELERIA", "Hotelería"],
  ["Hoteleria", "Hotelería"],
  // id 6
  ["HIGIENE Y SEGURIDAD", "Higiene y Seguridad"],
  ["Tecnico superior en Higiene y seguridad", "Técnico Superior en Higiene y Seguridad"],
  // id 7
  ["GESTION DE ENERGIA RENOVABLES", "Gestión de Energías Renovables"],
  ["Tecnico superior en gestion de energia renovables", "Técnico Superior en Gestión de Energías Renovables"],
  // id 8
  ["GERONTOLOGIA", "Gerontología"],
  ["Tecnico Superios en Gerentologia", "Técnico Superior en Gerontología"],
  // id 9
  ["DISEÑO DE INDUMENTARIA", "Diseño de Indumentaria"],
  ["TECNICO SUPERIOR EN DISEÑO DE INDUMENTARIA", "Técnico Superior en Diseño de Indumentaria"],
  // id 10
  ["DESARROLO DE SOFTWARE", "Desarrollo de Software"],
  ["TECNICO SUPERIOR EN DESARROLLO DE SOFTWARE", "Técnico Superior en Desarrollo de Software"],
  // id 11
  ["COCINA REGIONALES", "Cocina Regional"],
  ["COCINERO", "Cocinero"],
  // id 12
  ["AGENTE SANITARIO", "Agente Sanitario"],
  ["AGENTE SANITARIO", "Agente Sanitario"],
  // id 13
  ["ADMINISTRACION DE LA SALUD", "Administración de la Salud"],
  ["ADMINITRACION DE LA SALUD", "Administración de la Salud"],

  // Casos borde
  [null, ""],
  [undefined, ""],
  ["   ", ""],
  ["  tecnico   superior  en   desarrollo  ", "Técnico Superior en Desarrollo"],
  ["ciencia de datos e inteligencia artificial", "Ciencia de Datos e Inteligencia Artificial"],
  ["TIC e IA", "TIC e IA"],
  ["gestion de energias renovables", "Gestión de Energías Renovables"]
];

const TEXTO_PROHIBIDO = [
  "adminitracion",
  "desarrolo",
  "superios",
  "gerentologia",
  "hoteleria",
  "enfermeria",
  "diseno",
  "energia renovables"
];

let fallos = 0;

const fallar = (mensaje) => {
  fallos++;
  console.log(`FALLA: ${mensaje}`);
};

for (const [entrada, esperado] of CASOS) {
  const obtenido = normalizarDenominacion(entrada);

  if (obtenido !== esperado) {
    fallar(
      `${JSON.stringify(entrada)}\n  esperado: ${JSON.stringify(esperado)}\n  obtenido: ${JSON.stringify(obtenido)}`
    );
    continue;
  }

  if (!obtenido) continue;

  // Formato: sin espacios dobles ni extremos.
  if (obtenido !== obtenido.replace(/\s+/g, " ").trim()) {
    fallar(`espacios inconsistentes en ${JSON.stringify(obtenido)}`);
  }

  // No debe quedar todo en mayúsculas (salvo siglas sueltas).
  if (obtenido.length > 4 && obtenido === obtenido.toUpperCase()) {
    fallar(`quedó todo en mayúsculas: ${JSON.stringify(obtenido)}`);
  }

  // No deben sobrevivir los errores conocidos.
  // Se compara sobre el texto tal cual: "Hotelería" contiene "hotelería",
  // no "hoteleria", así que las tildes correctas no generan falsos positivos.
  const plano = obtenido.toLowerCase();
  for (const prohibido of TEXTO_PROHIBIDO) {
    if (plano.includes(prohibido)) {
      fallar(`quedó "${prohibido}" en ${JSON.stringify(obtenido)}`);
    }
  }
}

// Idempotencia: normalizar dos veces da el mismo resultado.
for (const [entrada] of CASOS) {
  const una = normalizarDenominacion(entrada);
  const dos = normalizarDenominacion(una);
  if (una !== dos) {
    fallar(`no idempotente: ${JSON.stringify(entrada)} -> ${JSON.stringify(una)} -> ${JSON.stringify(dos)}`);
  }
}

console.log(
  fallos === 0
    ? `OK: ${CASOS.length} casos, ${CASOS.length} pruebas de idempotencia`
    : `FALLOS: ${fallos}`
);

process.exit(fallos === 0 ? 0 : 1);
