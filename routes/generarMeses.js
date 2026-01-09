/**
 * Genera una lista de periodos 'YYYY-MM'
 * a partir de una fecha real (mantiene el día)
 * @param {Date | string} fechaBase
 * @param {number} cantidadMeses
 * @returns {string[]}
 */
export default function generarMesesDesdeFecha(fechaBase, cantidadMeses = 1) {
    const meses = [];
    let fecha = new Date(fechaBase);

    for (let i = 0; i < cantidadMeses; i++) {
        fecha.setMonth(fecha.getMonth() + 1);

        meses.push(
            `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
        );
    }

    return meses;
}

