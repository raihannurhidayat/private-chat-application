import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slug]]/route"; 

const domain = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000';

export const client = treaty<App>(domain);