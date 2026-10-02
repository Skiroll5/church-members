const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const csvPath = path.join(__dirname, '..', 'كشف الخدمة 01-01-2023.csv');
const raw = fs.readFileSync(csvPath, 'utf8');

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  for (let line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let insideQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }
  return result;
}

function calculateHash(data) {
  const core = {
    name: (data.name || '').trim().toLowerCase(),
    isMarried: Boolean(data.isMarried),
    dob: (data.dob || '').trim(),
    phone: (data.phone || '').trim().replace(/\s+/g, ''),
    fatherPhone: (data.fatherPhone || '').trim().replace(/\s+/g, ''),
    motherPhone: (data.motherPhone || '').trim().replace(/\s+/g, ''),
    education: (data.education || '').trim(),
    gender: (data.gender || '').trim(),
    groups: Array.isArray(data.groups) ? [...data.groups].sort() : [],
    serviceType: (data.serviceType || '').trim(),
    withFamily: typeof data.withFamily === 'boolean' ? data.withFamily : null,
    notes: (data.notes || '').trim()
  };
  return crypto.createHash('sha256').update(JSON.stringify(core)).digest('hex').substring(0, 16);
}

const rows = parseCSV(raw);
let currentGroup = '';
const parsedEntries = [];

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const col0 = row[0] || '';
  const col1 = row[1] || '';

  if (col0 && !col1 && isNaN(col0) && !col0.startsWith('كشف') && !col0.startsWith('Total') && !col0.startsWith('(')) {
    currentGroup = col0;
    continue;
  }
  if (!currentGroup || col0 === 'N.' || col1 === 'Nome' || col0 === 'Total' || col0.startsWith('(') || col0.startsWith('كشف')) {
    continue;
  }

  let name = '';
  let dob = '';
  let phone = '';
  let education = '';
  let gender = '';
  let extraCol = '';

  if (!isNaN(col0) && col0 !== '') {
    name = col1;
    dob = row[2] || '';
    phone = row[4] || '';
    education = row[5] || '';
    gender = row[6] || '';
    extraCol = row[7] || '';
  } else {
    if (col1) {
      name = col1;
      dob = row[2] || '';
      phone = row[4] || '';
      education = row[5] || '';
      gender = row[6] || '';
      extraCol = row[7] || '';
    } else if (col0) {
      name = col0;
      dob = row[1] || '';
      phone = row[3] || '';
      education = row[4] || '';
      gender = row[5] || '';
      extraCol = row[6] || '';
    }
  }

  if (!name || name.startsWith('كشف')) continue;

  parsedEntries.push({
    rawGroup: currentGroup,
    rawName: name,
    dob,
    phone,
    education,
    gender,
    extraCol
  });
}

console.log(`Parsed valid entries: ${parsedEntries.length}`);

// Clean individual records
const cleanedList = [];

for (const entry of parsedEntries) {
  let isMarried = entry.rawName.includes('*');
  let cleanName = entry.rawName.replace(/\*/g, '').trim();
  let notes = [];

  const parenMatch = cleanName.match(/\(([^)]+)\)/);
  if (parenMatch) {
    notes.push(parenMatch[1].trim());
    cleanName = cleanName.replace(/\([^)]+\)/, '').trim();
  }

  let personalPhone = '';
  let fatherPhone = '';
  let motherPhone = '';

  let rawPhone = entry.phone.trim();
  if (rawPhone.includes('ماما')) {
    motherPhone = rawPhone.replace('ماما', '').trim();
  } else if (rawPhone.includes('بابا')) {
    fatherPhone = rawPhone.replace('بابا', '').trim();
  } else if (rawPhone.toLowerCase().includes('papà') || rawPhone.toLowerCase().includes('papa')) {
    fatherPhone = rawPhone.replace(/papà|papa/gi, '').trim();
  } else {
    personalPhone = rawPhone;
  }

  let serviceType = '';
  let withFamily = null;

  if (entry.rawGroup === 'الخدام') {
    serviceType = entry.extraCol;
  } else if (entry.rawGroup === 'إعداد خدام' || entry.rawGroup.startsWith('شباب (')) {
    if (entry.extraCol === 'Sì') withFamily = true;
    else if (entry.extraCol === 'No') withFamily = false;
  }

  if (entry.education.includes('ذوي إحتياجات')) {
    notes.push('ذوي إحتياجات خاصة');
  }

  cleanedList.push({
    group: entry.rawGroup,
    name: cleanName,
    isMarried,
    dob: entry.dob,
    phone: personalPhone,
    fatherPhone: fatherPhone,
    motherPhone: motherPhone,
    education: entry.education,
    gender: entry.gender || (entry.rawGroup === 'شباب لجوء' ? 'Male' : ''),
    serviceType,
    withFamily,
    notes: notes.join(', ')
  });
}

// Merge members that are the exact same person across groups
const mergedMembers = [];
const processedIndices = new Set();

for (let i = 0; i < cleanedList.length; i++) {
  if (processedIndices.has(i)) continue;
  const a = cleanedList[i];
  const groups = [a.group];

  let merged = {
    id: 'mem_' + (i + 1).toString().padStart(4, '0'),
    name: a.name,
    isMarried: a.isMarried,
    dob: a.dob,
    phone: a.phone,
    fatherPhone: a.fatherPhone,
    motherPhone: a.motherPhone,
    education: a.education,
    gender: a.gender,
    groups: groups,
    serviceType: a.serviceType,
    withFamily: a.withFamily,
    notes: a.notes,
    createdAt: '2023-01-01T00:00:00.000Z',
    lastUpdated: '2023-01-01T00:00:00.000Z',
    dataHash: ''
  };

  for (let j = i + 1; j < cleanedList.length; j++) {
    if (processedIndices.has(j)) continue;
    const b = cleanedList[j];

    const sameName = a.name.toLowerCase() === b.name.toLowerCase();
    if (!sameName) continue;

    let isSamePerson = false;
    if (a.phone && b.phone && a.phone === b.phone) isSamePerson = true;
    else if (a.dob && b.dob && a.dob === b.dob) isSamePerson = true;
    else if (
      (a.group === 'الخدام' && b.group === 'إعداد خدام') ||
      (a.group === 'إعداد خدام' && b.group === 'الخدام')
    ) isSamePerson = true;
    else if (a.name === 'Riccardo Maikel' && b.name === 'Riccardo Maikel' && a.group === b.group) isSamePerson = true;

    if (isSamePerson) {
      processedIndices.add(j);
      if (!merged.groups.includes(b.group) && merged.groups.length < 2) {
        merged.groups.push(b.group);
      }
      if (!merged.dob && b.dob) merged.dob = b.dob;
      if (!merged.phone && b.phone) merged.phone = b.phone;
      if (!merged.fatherPhone && b.fatherPhone) merged.fatherPhone = b.fatherPhone;
      if (!merged.motherPhone && b.motherPhone) merged.motherPhone = b.motherPhone;
      if (!merged.education && b.education) merged.education = b.education;
      if (!merged.gender && b.gender) merged.gender = b.gender;
      if (!merged.serviceType && b.serviceType) merged.serviceType = b.serviceType;
      if (merged.withFamily === null && b.withFamily !== null) merged.withFamily = b.withFamily;
      if (b.isMarried) merged.isMarried = true;
      if (b.notes) merged.notes = merged.notes ? merged.notes + ', ' + b.notes : b.notes;
    }
  }

  merged.dataHash = calculateHash(merged);
  mergedMembers.push(merged);
  processedIndices.add(i);
}

console.log(`Final count of members: ${mergedMembers.length}`);
const outPath = path.join(__dirname, '..', 'church_members.json');
fs.writeFileSync(outPath, JSON.stringify(mergedMembers, null, 2), 'utf8');
console.log(`Saved updated clean JSON to ${outPath}`);
