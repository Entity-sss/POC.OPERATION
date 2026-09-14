declare module 'cloudflare:workers' {
  export const env: Env;
}

interface Env {
  FIRST_ADMIN_PROVISION_TOKEN?: string;
}

declare namespace App {
  interface Locals {
    auth: import('./lib/auth').AuthContext;
  }
}
