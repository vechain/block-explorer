export const truncateString = (str: string, maxLength: number = 20, endLength: number = 6): string => {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - endLength - 3)}...${str.slice(-endLength)}`
}
