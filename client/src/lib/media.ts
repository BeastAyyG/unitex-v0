export type MediaType = 'image' | 'video' | 'audio';

// Supabase's free storage plan accepts uploads up to 50 MB per file.
export const MAX_MEDIA_FILE_SIZE = 50 * 1024 * 1024;

export const ACCEPTED_MEDIA_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/3gpp', 'video/x-m4v',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/flac', 'audio/x-m4a',
].join(',');

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'ogv', 'ogg', '3gp', 'm4v']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'm4a', 'wav', 'ogg', 'oga', 'webm', 'aac', 'flac']);

export function getMediaType(file: Pick<File, 'type' | 'name'>): MediaType | null {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && IMAGE_EXTENSIONS.has(extension)) return 'image';
    if (extension && VIDEO_EXTENSIONS.has(extension)) return 'video';
    if (extension && AUDIO_EXTENSIONS.has(extension)) return 'audio';
    return null;
}

export function validateMediaFile(file: File): string | null {
    const type = getMediaType(file);
    if (!type) return 'This file type is not supported. Use an image, video, or audio file.';
    if (file.size > MAX_MEDIA_FILE_SIZE) return 'Media files must be 50 MB or smaller.';
    return null;
}
