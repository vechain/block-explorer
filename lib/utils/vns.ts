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
 * Removes redundant VNS suffixes for display purposes
 * Removes `.veworld.vet` and `.vet` suffixes
 * @param vnsName - The full VNS name
 * @returns The VNS name without suffix
 */
export const stripVnsSuffix = (vnsName: string): string => {
  if (vnsName.endsWith('.veworld.vet')) {
    return vnsName.slice(0, -12) // Remove '.veworld.vet' (12 characters)
  }
  if (vnsName.endsWith('.vet')) {
    return vnsName.slice(0, -4) // Remove '.vet' (4 characters)
  }
  return vnsName
}
