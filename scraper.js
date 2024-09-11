const axios = require("axios");
const cheerio = require("cheerio");

function parseAge(ageString) {
  const match = ageString.match(/(\d+)\s*A\.\s*(\d+)\s*M\./);
  if (match) {
    return {
      years: parseInt(match[1]),
      months: parseInt(match[2]),
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
    const url =
      "http://192.168.250.50/atencion-urgencias-andessalud/urg-caspm/index.php";
    const response = await axios.get(url, { responseEncoding: "latin1" });
    const $ = cheerio.load(response.data, { decodeEntities: false });

    const data = {
      PacientesEnEspera: [],
      PacientesCategorizados: [],
      PacientesEnBox: [],
      FirstRowText: "",
    };

    spanText = $("span").first().text().trim();
    // Extract N° Altas using regex
    const altasRegex = /N° Altas: (\d+)/;
    const altasMatch = spanText.match(altasRegex);
    const numeroAltas = altasMatch ? parseInt(altasMatch[1]) : null;

    data.FirstRowText = numeroAltas;

    // Helper function to decode HTML entities and trim
    const decodeAndTrim = (text) => $("<div>").html(text).text().trim();

    // Process PacientesEnEspera
    $("table")
      .eq(1)
      .find("tr")
      .slice(1)
      .each((_i, row) => {
        const cols = $(row).find("td");
        if (cols.length >= 4) {
          const paciente = decodeAndTrim($(cols[0]).html());
          if (paciente !== "PACIENTE") {
            data.PacientesEnEspera.push({
              paciente: paciente,
              edad: processAge(decodeAndTrim($(cols[1]).html())),
              motivoConsulta: decodeAndTrim($(cols[2]).html()),
              tiempoEspera: decodeAndTrim($(cols[3]).html()),
            });
          }
        }
      });

    // Process PacientesCategorizados
    $("table")
      .eq(2)
      .find("tr")
      .slice(1)
      .each((_i, row) => {
        const cols = $(row).find("td");
        if (cols.length >= 6) {
          const paciente = decodeAndTrim($(cols[1]).html());
          if (paciente !== "PACIENTE") {
            data.PacientesCategorizados.push({
              categoria: decodeAndTrim($(cols[0]).html()),
              paciente: paciente,
              edad: processAge(decodeAndTrim($(cols[2]).html())),
              motivoConsulta: decodeAndTrim($(cols[3]).html()),
              tiempoEsperaAtencion: decodeAndTrim($(cols[4]).html()),
              tiempoAcumulado: decodeAndTrim($(cols[5]).html()),
            });
          }
        }
      });

    // Process PacientesEnBox
    $("table")
      .eq(3)
      .find("tr")
      .slice(1)
      .each((_i, row) => {
        const cols = $(row).find("td");
        if (cols.length >= 9) {
          const paciente = decodeAndTrim($(cols[1]).html());
          if (paciente !== "PACIENTE") {
            data.PacientesEnBox.push({
              categoria: decodeAndTrim($(cols[0]).html()),
              paciente: paciente,
              edad: processAge(decodeAndTrim($(cols[2]).html())),
              motivoConsulta: decodeAndTrim($(cols[3]).html()),
              box: decodeAndTrim($(cols[4]).html()),
              medico: decodeAndTrim($(cols[5]).html()),
              tiempoPrevio: decodeAndTrim($(cols[6]).html()),
              tiempoAtencionMedica: decodeAndTrim($(cols[7]).html()),
              tiempoAcumulado: decodeAndTrim($(cols[8]).html()),
            });
          }
        }
      });
    return data;
  } catch (error) {
    console.error("Scraping error:", error);
    throw error;
  }
}

module.exports = { scrapeData };
