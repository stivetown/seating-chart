import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login or tenant selection
  redirect('/login');
}

