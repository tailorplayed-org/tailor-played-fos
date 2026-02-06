/// <reference types="vite/client" />

// SCSS module type declarations
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
