import { Redirect, useParams } from 'react-router-dom';
import { buildSalonTabHomePath } from '../lib/salon-tab-route.util.js';

/** Bare `/s/:slug` → home tab. */
export default function SalonRedirectToHome() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Redirect to="/" />;
  return <Redirect to={buildSalonTabHomePath(slug.toLowerCase())} />;
}
