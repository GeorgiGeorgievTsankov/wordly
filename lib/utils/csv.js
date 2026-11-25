/**
 * Pure JavaScript CSV parser & serializer.
 * Supports RFC 4180 rules: quoted fields, escaped quotes, newlines, BOM removal.
 */

export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { headers: [], rows: [] };
  }

  // Remove UTF-8 BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return { headers: [], rows: [] };

  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentVal += '"';
          i++;
        } else {
          // End of quoted string
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\r') {
        // Handle \r\n or standalone \r
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentVal.trim());
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  // Final value and row
  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  // Map header aliases to canonical keys
  const headerMap = {};
  rawHeaders.forEach((h, idx) => {
    if (['headword', 'word', 'term', 'english', 'en'].includes(h)) {
      headerMap['headword'] = idx;
    } else if (['part_of_speech', 'pos', 'type', 'part'].includes(h)) {
      headerMap['part_of_speech'] = idx;
    } else if (['translation', 'bg', 'bulgarian', 'meaning'].includes(h)) {
      headerMap['translation'] = idx;
    } else if (['accepted_translations', 'synonyms', 'alternatives'].includes(h)) {
      headerMap['accepted_translations'] = idx;
    } else if (['definition', 'def'].includes(h)) {
      headerMap['definition'] = idx;
    } else if (['example_en', 'example_sentence', 'example'].includes(h)) {
      headerMap['example_en'] = idx;
    } else if (['example_bg', 'example_translation', 'example_bg_translation'].includes(h)) {
      headerMap['example_bg'] = idx;
    } else if (['difficulty', 'level'].includes(h)) {
      headerMap['difficulty'] = idx;
    } else if (['category', 'topic'].includes(h)) {
      headerMap['category'] = idx;
    } else if (['rank', 'source_rank'].includes(h)) {
      headerMap['source_rank'] = idx;
    } else if (['source'].includes(h)) {
      headerMap['source'] = idx;
    }
  });

  const parsedObjects = dataRows
    .map((row) => {
      const obj = {};
      for (const [key, idx] of Object.entries(headerMap)) {
        if (row[idx] !== undefined) {
          obj[key] = row[idx];
        }
      }
      return obj;
    })
    .filter((obj) => obj.headword && obj.translation);

  return {
    headers: rawHeaders,
    rows: parsedObjects,
    totalParsed: parsedObjects.length,
    rawCount: dataRows.length,
  };
}

export const SAMPLE_CSV_CONTENT = `headword,part_of_speech,translation,accepted_translations,definition,example_en,example_bg,category,difficulty
time,noun,време,,,"I don't have time today.","Днес нямам време.",Nouns,beginner
time,noun,път,пъти,,"This is my third time here.","Това е третият ми път тук.",Nouns,beginner
think,verb,мисля,смятам|размишлявам,,"I think you are right.","Мисля, че си прав.",Verbs,beginner
happy,adjective,щастлив,радостен,,"She looks very happy.","Тя изглежда много щастлива.",Adjectives,beginner
quickly,adverb,бързо,скоро,,"He answered quickly.","Той отговори бързо.",Adverbs,beginner`;

