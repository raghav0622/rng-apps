export const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const isValidAvatarType = (type: string) => AVATAR_ALLOWED_TYPES.includes(type);
export const isValidAvatarSize = (size: number) => size <= AVATAR_MAX_SIZE;
