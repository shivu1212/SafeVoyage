const DEFAULT_AVATAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#E2E8F0"/><circle cx="50" cy="36" r="18" fill="#64748B"/><path d="M18 88c3-20 16-30 32-30s29 10 32 30" fill="#64748B"/></svg>';

export const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_AVATAR_SVG)}`;

export function getAvatarSrc(avatar) {
  return typeof avatar === 'string' && avatar.trim() ? avatar : DEFAULT_AVATAR;
}
