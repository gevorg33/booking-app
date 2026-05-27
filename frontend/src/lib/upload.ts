import api from '@/lib/api';

export async function uploadEmployeeAvatar(businessId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(`/businesses/${businessId}/uploads/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const payload = data.data ?? data;
  return payload.url as string;
}

export async function uploadBusinessLogo(businessId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(`/businesses/${businessId}/uploads/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const payload = data.data ?? data;
  return payload.url as string;
}
