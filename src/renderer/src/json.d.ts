// Allow `import data from './foo.json'` from TS source.
// Vite handles the actual JSON parsing at build time.
declare module '*.json' {
  const value: unknown;
  export default value;
}
