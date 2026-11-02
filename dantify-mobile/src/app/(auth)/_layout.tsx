// mobile-app/src/app/(auth)/_layout.tsx
import { useAuth } from '@/contexts/auth-context';
import { Slot } from 'expo-router';
import Loading from './loading';

export default function RootLayout() {
  const { isLoading } = useAuth();
  if (isLoading) return <Loading />;
  return <Slot />;
}