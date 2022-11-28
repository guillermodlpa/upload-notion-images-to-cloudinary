/**
 * Turns a caption in a Notion image block into a filename
 * This is done for SEO, so the images can be discoverable more easily
 */
export default function makeFilenameFromCaption(
  caption: string | any[]
): string | undefined {
  const plainText =
    typeof caption === "string"
      ? caption
      : caption.map((content) => content.plain_text).join("");
  const normalizedCaption = plainText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const filename = normalizedCaption
    .replace(/[^0-9a-z_-]/gi, "_")
    .toLowerCase();
  return filename;
}
