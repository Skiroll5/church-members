/**
 * hash.js - Row-level change detection using deterministic hashing
 * Avoids false update dates by comparing hashes of editable business content fields.
 */

/**
 * Normalizes member data and produces a deterministic object
 * representing the core data attributes (excluding dynamic age and metadata).
 */
export function getMemberCoreData(member) {
  return {
    name: (member.name || '').trim().toLowerCase(),
    isMarried: Boolean(member.isMarried),
    dob: (member.dob || '').trim(),
    phone: (member.phone || '').trim().replace(/\s+/g, ''),
    fatherPhone: (member.fatherPhone || '').trim().replace(/\s+/g, ''),
    motherPhone: (member.motherPhone || '').trim().replace(/\s+/g, ''),
    education: (member.education || '').trim(),
    gender: (member.gender || '').trim(),
    groups: Array.isArray(member.groups) ? [...member.groups].sort() : [],
    serviceType: (member.serviceType || '').trim(),
    withFamily: typeof member.withFamily === 'boolean' ? member.withFamily : null,
    notes: (member.notes || '').trim()
  };
}

/**
 * Generates a stable hash string for a member's data.
 * Uses Web Crypto API (SHA-256) when available, with a fast 32-bit FNV-1a fallback.
 */
export async function computeMemberHash(member) {
  const core = getMemberCoreData(member);
  const normalizedString = JSON.stringify(core);

  try {
    if (window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(normalizedString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    }
  } catch (e) {
    console.warn('SubtleCrypto not available, using fallback hash', e);
  }

  return fnv1aHash(normalizedString);
}

/**
 * Synchronous hash calculation (used for immediate UI comparisons)
 */
export function computeMemberHashSync(member) {
  const core = getMemberCoreData(member);
  const normalizedString = JSON.stringify(core);
  return fnv1aHash(normalizedString);
}

function fnv1aHash(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Checks whether a member's data has genuinely changed compared to original
 */
export function hasDataChanged(originalMember, updatedMember) {
  const originalCore = JSON.stringify(getMemberCoreData(originalMember));
  const updatedCore = JSON.stringify(getMemberCoreData(updatedMember));
  return originalCore !== updatedCore;
}
