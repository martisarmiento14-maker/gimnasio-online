/**
 * Genera una lista de periodos 'YYYY-MM'
 * @param {Date | string} fechaBase
 * @param {number} cantidadMeses (1 o 2)
 * @returns {string[]}
 */
export default function generarMeses(fechaBase, cantidadMeses) {
    const meses = [];
    const fecha = new Date(fechaBase);

    if (isNaN(fecha.getTime())) {
        throw new Error("Fecha base inválida");
    }

    for (let i = 0; i < cantidadMeses; i++) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, "0");

        meses.push(`${year}-${month}`);
        fecha.setMonth(fecha.getMonth() + 1);
    }

    return meses;
}
