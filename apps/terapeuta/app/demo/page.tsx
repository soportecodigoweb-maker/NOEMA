import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

/** /demo → elige rol. Si viene con error (demo ocupado), lo muestra el hub. */
export default async function DemoIndex({ searchParams }: PageProps) {
  const { error } = await searchParams;
  redirect(error ? `/demo/psicologo?error=${encodeURIComponent(error)}` : '/demo/psicologo');
}
