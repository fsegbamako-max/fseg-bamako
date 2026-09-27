import xlsx from 'xlsx';

const headerAliases = {
  numero_ordre: new Set(['n', 'no', 'nordre', 'numero', 'numeroordre', 'numerodordre', 'ndordre', 'ordre']),
  matricule: new Set(['matricule']),
  prenom: new Set(['prenom']),
  nom: new Set(['nom']),
  cenou: new Set(['cenou', 'numerocenou', 'ncenou']),
  date_naissance: new Set(['datenaissance', 'datedenaissance', 'naissancedate']),
  lieu_naissance: new Set(['lieunaissance', 'lieudenaissance']),
  passage: new Set(['passage']),
  amphi: new Set(['amphi'])
};

function normalizeHeader(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeStudentRow(row) {
  const normalized = {};
  for (const [header, value] of Object.entries(row)) {
    const key = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(headerAliases)) {
      if (aliases.has(key) && normalized[field] === undefined) {
        normalized[field] = value;
        break;
      }
    }
  }
  return normalized;
}

function toIsoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function normalizeStudentDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === 'number' && value >= 20000 && value <= 80000) {
    const parsed = xlsx.SSF.parse_date_code(value);
    return parsed ? toIsoDate(parsed.y, parsed.m, parsed.d) : null;
  }

  const text = String(value ?? '').trim();
  if (!text) return null;

  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const local = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})(?:\D|$)/);
  if (local) {
    let year = Number(local[3]);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    return toIsoDate(year, Number(local[2]), Number(local[1]));
  }

  const serial = Number(text);
  if (Number.isFinite(serial) && serial >= 20000 && serial <= 80000) {
    const parsed = xlsx.SSF.parse_date_code(serial);
    return parsed ? toIsoDate(parsed.y, parsed.m, parsed.d) : null;
  }

  return null;
}