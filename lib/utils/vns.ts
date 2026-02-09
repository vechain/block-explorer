/**
 * Trims and lowercases the name
 * Adds the `.vet` postfix if it's not already there
 * @param name
 */
export const normalizeName = (name: string): string => {
  const nameLower = name.trim().toLowerCase()

  return `${nameLower}${nameLower.endsWith('.vet') ? '' : '.vet'}`
}

/**
 * Returns the `.veworld.vet` form of a name for fallback VNS resolution.
 * Trims and lowercases, strips `.vet` if present, then appends `.veworld.vet`.
 */
export const nameToVeworldVet = (name: string): string => {
  const nameLower = name.trim().toLowerCase()
  const base = nameLower.endsWith('.vet') ? nameLower.slice(0, -4) : nameLower
  return `${base}.veworld.vet`
}
