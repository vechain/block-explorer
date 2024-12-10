// test/setup.ts
const originalError = console.error

console.error = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("Could not parse CSS stylesheet")) {
    return
  }
  originalError.call(console, ...args)
}
