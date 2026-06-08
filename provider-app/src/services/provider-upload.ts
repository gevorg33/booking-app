import api, { unwrap } from './api';

export async function uploadProviderAvatar(
  businessId: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data: res } = await api.post(
    `/businesses/${businessId}/uploads/avatar`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const payload = unwrap<{ url: string }>(res);
  return payload.url;
}
