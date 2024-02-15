import { BLOCK_TYPE_IMAGE } from "./constants/blockTypes";
import * as cloudinaryClient from "./lib/cloudinaryClient";
import NotionClient from "./lib/notionClient";
import downloadImageToBase64 from "./utils/downloadFile";
import Logger from "./utils/Logger";
import makeFilenameFromCaption from "./utils/makeFilenameFromCaption";

export default async function uploadNotionImagesToCloudinary({
  notionToken = process.env.NOTION_TOKEN || "",
  notionDatabaseId = process.env.NOTION_DATABASE_ID || undefined,
  notionPageId = undefined,
  cloudinaryUrl = process.env.CLOUDINARY_URL || "",
  cloudinaryUploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "",
  logLevel = process.env.NODE_ENV === "development" ? "debug" : "error",
}: {
  notionToken: string;

  cloudinaryUrl: string;
  cloudinaryUploadFolder?: string;
  logLevel: "none" | "error" | "info" | "debug";
} & (
  | { notionDatabaseId: string; notionPageId?: undefined }
  | { notionDatabaseId?: undefined; notionPageId: string }
)) {
  if (!notionToken) {
    throw new Error(
      `Missing argument notionToken. Pass it or set it as the env var NOTION_TOKEN`
    );
  }
  if (!notionDatabaseId && !notionPageId) {
    throw new Error(
      `Missing both arguments notionDatabaseId and notionPageId. Pass one of them it or set the database ID in an env var NOTION_DATABASE_ID`
    );
  }
  cloudinaryClient.config({ cloudinaryUrl });

  const log = new Logger(logLevel);

  const notionClient = new NotionClient(notionToken, log);

  log.debug(
    notionPageId
      ? `Fetching page ${notionPageId}`
      : notionDatabaseId
      ? `Fetching pages of database ${notionDatabaseId}`
      : "Missing page or database ID"
  );

  const pages = notionPageId
    ? [await notionClient.getPage(notionPageId)]
    : notionDatabaseId
    ? await notionClient.getPagesFromDatabase(notionDatabaseId)
    : [];

  for (const page of pages) {
    const coverUrl =
      "cover" in page && page.cover?.type === "file"
        ? page.cover.file.url
        : undefined;

    if (!coverUrl) {
      log.debug(`${page.id}: cover image already not hosted in Notion`);
    } else {
      log.info(`${page.id}: cover image hosted in Notion`);

      const coverImage = await downloadImageToBase64(coverUrl);
      log.debug("Image downloaded");

      const { url: coverExternalUrl } = await cloudinaryClient.uploadImage(
        `data:image/jpeg;base64,${coverImage}`,
        {
          folder: `${cloudinaryUploadFolder}/${page.id}`,
          // @todo: add filename here, pulling from the Notion API page title
        }
      );
      log.debug("Uploaded to Cloudinary");

      await notionClient.updatePageCoverExternalUrl(page.id, coverExternalUrl);
      log.info(
        `${page.id}: cover image was hosted in Notion. Moved to Cloudinary and asset updated in Notion`
      );
    }

    log.debug(`${page.id}: fetching image blocks...`);
    const imageBlocks = await notionClient.fetchAllImageBlocks(page.id);
    log.debug(`Found ${imageBlocks.length}`);

    for (const imageBlock of imageBlocks) {
      if (!(BLOCK_TYPE_IMAGE in imageBlock)) {
        log.error("Unexpected image block without value property");
        continue;
      }
      const imageUrl =
        imageBlock[BLOCK_TYPE_IMAGE].type === "file"
          ? imageBlock[BLOCK_TYPE_IMAGE].file.url
          : null;
      if (!imageUrl) {
        log.debug(`${page.id}: ${imageBlock.id}: already not hosted in Notion`);
        continue;
      }
      log.info(`${page.id}: image hosted in Notion`);

      const blockImage = await downloadImageToBase64(imageUrl);
      log.debug("Image downloaded");

      const filenameFromCaption = makeFilenameFromCaption(
        imageBlock[BLOCK_TYPE_IMAGE].caption
      )

      const { url: imageExternalUrl } = await cloudinaryClient.uploadImage(
        `data:image/jpeg;base64,${blockImage}`,
        {
          folder: `${cloudinaryUploadFolder}/${page.id}`,
          // Cloudinary will set a filename if undefined (same as cover)
          public_id: filenameFromCaption ? `${filenameFromCaption}_${imageBlock.id}` : undefined,
        }
      );
      log.debug("Uploaded to Cloudinary");

      await notionClient.updateImageBlockExternalUrl(
        imageBlock.id,
        imageExternalUrl
      );
      log.info(
        `${page.id}: ${imageBlock.id}: block image was hosted in Notion. Moved to Cloudinary and asset updated in Notion`
      );
    }
  }

  log.debug("End");
}
