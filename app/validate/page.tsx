import type { Metadata } from 'next';
import ProfileValidator from './profile-validator';
export const metadata: Metadata = { title: 'Profile validator' };
export const dynamic = 'force-static';
export default function ValidatePage() {
  return <ProfileValidator />;
}
