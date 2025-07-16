/**
 * Trims and lowercases the name
 * Adds the `.vet` postfix if it's not already there
 * @param name
 */
export const normalizeName = (name: string): string => {
  const nameLower = name.trim().toLowerCase()

  return `${nameLower}${nameLower.endsWith(".vet") ? "" : ".vet"}`
}
