import { redirect } from 'next/navigation';

// El middleware ya decide: con sesión → /inicio, sin → /signin.
// Esto es solo un fallback seguro.
export default function RootPage() {
  redirect('/signin');
}
