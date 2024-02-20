/**
 * Turns a caption in a Notion image block into a filename
 * This is done for SEO, so the images can be discoverable more easily
 *
 * https://cloudinary.com/documentation/image_upload_api_reference
 * public_id:
 *   Can be up to 255 characters, including non-English characters, periods (.),
 *   forward slashes (/), underscores (_), hyphens (-).
 *   Public ID values cannot begin or end with a space or forward slash (/).
 *   Additionally, they cannot include the following characters: ? & # \ % < > +
 */
export default function makeFilename(
  caption: string | Record<'plain_text', string>[],
  maxLength = 50
): string | undefined {
  maxLength = maxLength > 255 ? 255 : maxLength

  const plainText =
    typeof caption === "string"
      ? caption
      : caption.map((content) => content.plain_text).join("");
  const normalizedCaption = plainText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const filename = normalizedCaption
    .replace(/[^0-9a-z_-]/gi, "_")
    .toLowerCase()
    // max characters
    .substring(0, maxLength)
    // remove trailing underscores
    .replace(/_+$/, "")
    // remove multiple underscores
    .replace(/_{2,}/g, "_");

  return filename
}
