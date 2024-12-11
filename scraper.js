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
    // Get the main page data
    const url = "http://192.168.250.50/atencion-urgencias-andessalud/urg-caspm/index.php";
    const response = await axios.get(url, { responseEncoding: "latin1" });
    const $ = cheerio.load(response.data, { decodeEntities: false });

    // Get the box map data
    const boxMapUrl = "http://192.168.250.50/atencion-urgencias-andessalud/urg-caspm/mapa_box.php";
    const boxMapResponse = await axios.get(boxMapUrl, { responseEncoding: "latin1" });
    const $boxMap = cheerio.load(boxMapResponse.data, { decodeEntities: false });

    // Create a map of procedures by patient name
    const proceduresMap = new Map();

    $boxMap('.box').each((_i, boxElement) => {
      const name = $boxMap(boxElement).find('p').first().text().replace('Nombre:', '').trim();
      if (name) {
        // Normalize the name to match the format from the main page
        const normalizedName = name
          .replace(/\s+/g, '')  // Remove all spaces
          .toUpperCase();  // Convert to uppercase for case-insensitive matching

        const header = $boxMap(boxElement).find('h3');
        if (header.length) {  // Only process if there's an h3 (active box)
          const headerHtml = header.html() || '';

          // Look for procedure tags in the header HTML
          const procEjeMatch = headerHtml.match(/<span class="procedimiento-tag PROC_EJE">(\d*)<\/span>/);
          const procPenMatch = headerHtml.match(/<span class="procedimiento-tag PROC_PEN">(\d*)<\/span>/);

          const procEjeNum = procEjeMatch ? parseInt(procEjeMatch[1] || '0') : 0;
          const procPenNum = procPenMatch ? parseInt(procPenMatch[1] || '0') : 0;

          if (procEjeNum > 0 || procPenNum > 0) {
            proceduresMap.set(normalizedName, {
              procEje: procEjeNum,
              procPen: procPenNum
            });
          }
        }
      }
    });

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

    // Helper function to add procedures to patient data
    const addProcedures = (patientData) => {
      // Normalize patient name to match the map format
      const normalizedName = patientData.paciente
        .replace(/^\(Mutual\)\s*/, '')  // Remove Mutual prefix
        .replace(/\s+/g, '')  // Remove all spaces
        .toUpperCase();  // Convert to uppercase for case-insensitive matching

      const procedures = proceduresMap.get(normalizedName) || { procEje: 0, procPen: 0 };

      return {
        ...patientData,
        procedimientosEjecutados: procedures.procEje,
        procedimientosPendientes: procedures.procPen
      };
    };

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

    // Process PacientesEnBox with procedures
    $("table")
      .eq(3)
      .find("tr")
      .slice(1)
      .each((_i, row) => {
        const cols = $(row).find("td");
        if (cols.length >= 9) {
          const paciente = decodeAndTrim($(cols[1]).html());
          if (paciente !== "PACIENTE") {
            const patientData = {
              categoria: decodeAndTrim($(cols[0]).html()),
              paciente: paciente,
              edad: processAge(decodeAndTrim($(cols[2]).html())),
              motivoConsulta: decodeAndTrim($(cols[3]).html()),
              box: decodeAndTrim($(cols[4]).html()),
              medico: decodeAndTrim($(cols[5]).html()),
              tiempoPrevio: decodeAndTrim($(cols[6]).html()),
              tiempoAtencionMedica: decodeAndTrim($(cols[7]).html()),
              tiempoAcumulado: decodeAndTrim($(cols[8]).html()),
            };
            data.PacientesEnBox.push(addProcedures(patientData));
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
