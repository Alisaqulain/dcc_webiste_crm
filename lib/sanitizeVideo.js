/** Remove multi-MB base64 blobs from video payloads sent to the browser. */
export function stripVideoHeavyFields(video) {
  if (!video) return video;

  const source = typeof video.toObject === 'function' ? video.toObject() : { ...video };
  const {
    videoData,
    thumbnailData,
    ...rest
  } = source;

  const safe = { ...rest };

  if (videoData) {
    safe.videoData = {
      fileName: videoData.fileName,
      mimeType: videoData.mimeType,
      size: videoData.size,
      isDataUrl: videoData.isDataUrl,
      hasStoredFile: Boolean(videoData.url || videoData.data || rest.videoPath),
    };
  }

  if (thumbnailData) {
    const thumbUrl = thumbnailData.url || rest.thumbnail;
    const isHugeDataUrl =
      typeof thumbUrl === 'string' &&
      thumbUrl.startsWith('data:') &&
      thumbUrl.length > 100_000;

    safe.thumbnailData = {
      fileName: thumbnailData.fileName,
      mimeType: thumbnailData.mimeType,
      size: thumbnailData.size,
      isDataUrl: thumbnailData.isDataUrl,
    };

    safe.thumbnail = isHugeDataUrl ? null : thumbUrl || rest.thumbnail || null;
  }

  return safe;
}

export function stripVideosHeavyFields(videos) {
  if (!Array.isArray(videos)) return [];
  return videos.map(stripVideoHeavyFields);
}
