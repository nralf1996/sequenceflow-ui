export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 200
) {
  const chunks: string[] = [];
  const step = Math.max(1, chunkSize - overlap);
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += step;
  }

  return chunks;
}
