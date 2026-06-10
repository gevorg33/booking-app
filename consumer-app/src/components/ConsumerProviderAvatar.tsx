type Props = {
  name: string;
  avatarUrl?: string | null;
  primaryColor: string;
  size?: number;
};

export function ConsumerProviderAvatar({
  name,
  avatarUrl,
  primaryColor,
  size = 40,
}: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
  } as const;

  if (avatarUrl?.trim()) {
    return (
      <img
        src={avatarUrl}
        alt=""
        style={{ ...style, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      style={{
        ...style,
        background: primaryColor,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: Math.max(12, Math.round(size * 0.38)),
      }}
    >
      {initial}
    </div>
  );
}
