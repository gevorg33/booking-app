import {
  buildGoogleMapsDirectionsUrl,
  buildSalonDirectionsLinks,
} from './salon-directions.util.js';

describe('salon-directions.util (ai-cmd-customer-4.3.3)', () => {
  it('builds Google Maps directions URL from address', () => {
    expect(buildGoogleMapsDirectionsUrl('12 Main St, Yerevan')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=12%20Main%20St%2C%20Yerevan',
    );
  });

  it('returns null directions URL when address is missing', () => {
    expect(buildGoogleMapsDirectionsUrl('')).toBeNull();
  });

  it('builds salon directions link bundle', () => {
    const links = buildSalonDirectionsLinks({
      address: '12 Main St',
      mapsEmbedHtml:
        '<iframe src="https://www.google.com/maps/embed?pb=abc"></iframe>',
    });
    expect(links.directionsUrl).toContain('google.com/maps/dir');
    expect(links.mapsUrl).toContain('google.com/maps/embed');
    expect(links.address).toBe('12 Main St');
  });
});
