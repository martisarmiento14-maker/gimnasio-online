/**
 * Genera una lista de periodos 'YYYY-MM'
 * @param {Date | string} fechaBase
 * @param {number} cantidadMeses
 * @returns {string[]}
 */
export default function generarMeses(baseYYYYMM, cantidadMeses = 1) {
    const [y, m] = baseYYYYMM.split("-").map(Number);

    let year = y;
    let month = m;

    const meses = [];

    for (let i = 0; i < cantidadMeses; i++) {
        month++;

        if (month > 12) {
            month = 1;
            year++;
        }

        meses.push(`${year}-${String(month).padStart(2, "0")}`);
    }

    return meses;
}

