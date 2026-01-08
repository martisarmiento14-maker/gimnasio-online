/**
 * Genera una lista de periodos 'YYYY-MM'
 * @param {Date | string} fechaBase
 * @param {number} cantidadMeses
 * @returns {string[]}
 */
export default function generarMeses(fechaBase, cantidadMeses = 1) {
    if (!fechaBase) {
        throw new Error("Fecha base requerida");
    }

    const fecha = new Date(fechaBase);

    if (isNaN(fecha.getTime())) {
        throw new Error("Fecha base inválida");
    }

    // 🔒 Siempre el primer día del mes
    fecha.setDate(1);

    const meses = [];

    for (let i = 0; i < cantidadMeses; i++) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, "0");

        meses.push(`${year}-${month}`);
        fecha.setMonth(fecha.getMonth() + 1);
    }

    return meses;
}
