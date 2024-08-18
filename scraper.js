const axios = require('axios');
const cheerio = require('cheerio');

function parseAge(ageString) {
    const match = ageString.match(/(\d+)\s*A\.\s*(\d+)\s*M\./);
    if (match) {
        return {
            years: parseInt(match[1]),
            months: parseInt(match[2])
        };
    }
    return null;
}

function formatAge(years, months) {
    if (years >= 5) {
        return `${years}a`;
    } else {
        return `${years}a${months}m`;
    }
}

function processAge(ageString) {
    const age = parseAge(ageString);
    return age ? formatAge(age.years, age.months) : ageString;
}

async function scrapeData() {
    try {
        const url = 'http://192.168.250.50/atencion-urgencias-andessalud/urg-caspm/index.php';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const data = {
            PacientesEnEspera: [],
            PacientesCategorizados: [],
            PacientesEnBox: []
        };

        // Process PacientesEnEspera
        $('table').eq(1).find('tr').slice(1).each((i, row) => {
            const cols = $(row).find('td');
            if (cols.length >= 4) {
                data.PacientesEnEspera.push({
                    paciente: $(cols[0]).text().trim(),
                    edad: processAge($(cols[1]).text().trim()),
                    motivoConsulta: $(cols[2]).text().trim(),
                    tiempoEspera: $(cols[3]).text().trim()
                });
            }
        });

        // Process PacientesCategorizados
        $('table').eq(2).find('tr').slice(1).each((i, row) => {
            const cols = $(row).find('td');
            if (cols.length >= 6) {
                data.PacientesCategorizados.push({
                    categoria: $(cols[0]).text().trim(),
                    paciente: $(cols[1]).text().trim(),
                    edad: processAge($(cols[2]).text().trim()),
                    motivoConsulta: $(cols[3]).text().trim(),
                    tiempoEsperaAtencion: $(cols[4]).text().trim(),
                    tiempoAcumulado: $(cols[5]).text().trim()
                });
            }
        });

        // Process PacientesEnBox
        $('table').eq(3).find('tr').slice(1).each((i, row) => {
            const cols = $(row).find('td');
            if (cols.length >= 9) {
                data.PacientesEnBox.push({
                    categoria: $(cols[0]).text().trim(),
                    paciente: $(cols[1]).text().trim(),
                    edad: processAge($(cols[2]).text().trim()),
                    motivoConsulta: $(cols[3]).text().trim(),
                    box: $(cols[4]).text().trim(),
                    medico: $(cols[5]).text().trim(),
                    tiempoPrevio: $(cols[6]).text().trim(),
                    tiempoAtencionMedica: $(cols[7]).text().trim(),
                    tiempoAcumulado: $(cols[8]).text().trim()
                });
            }
        });

        return data;
    } catch (error) {
        console.error('Scraping error:', error);
        throw error;
    }
}

module.exports = { scrapeData };
