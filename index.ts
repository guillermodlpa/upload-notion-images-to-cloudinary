import * as dotenv from "dotenv";
dotenv.config();

import { BLOCK_TYPE_IMAGE } from "./constants/blockTypes";
import * as cloudinaryClient from "./lib/cloudinaryClient";
import {
  fetchAllImageBlocks,
  getPagesFromDatabase,
  updateImageBlockExternalUrl,
  updatePageCoverExternalUrl,
} from "./lib/notionClient";
import downloadImageToBase64 from "./utils/downloadFile";
import log from "./utils/log";
import makeFilenameFromCaption from "./utils/makeFilenameFromCaption";
import throwMissingEnvVarError from "./utils/throwMissingEnvVarError";

const notionDatabaseId =
  process.env.NOTION_DATABASE_ID ||
  throwMissingEnvVarError("NOTION_DATABASE_ID");

const cloudinaryUploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "";

log.info(`Fetching pages`);

const pages = await getPagesFromDatabase(notionDatabaseId);

log.appendSentence(`Found ${pages.length}`);

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
    log.appendSentence("Image downloaded");

    const { url: coverExternalUrl } = await cloudinaryClient.uploadImage(
      `data:image/jpeg;base64,${coverImage}`,
      {
        folder: `${cloudinaryUploadFolder}/${page.id}`,
        // @todo: add filename here, pulling from the Notion API page title
      }
    );
    log.appendSentence("Uploaded to Cloudinary");

    await updatePageCoverExternalUrl(page.id, coverExternalUrl);
    log.appendSentence("Updated in Notion ✅");
  }

  log.info(`${page.id}: fetching image blocks...`);
  const imageBlocks = await fetchAllImageBlocks(page.id);
  log.appendSentence(`Found ${imageBlocks.length}`);

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
    log.appendSentence("Image downloaded");

    const { url: imageExternalUrl } = await cloudinaryClient.uploadImage(
      `data:image/jpeg;base64,${blockImage}`,
      {
        folder: `${cloudinaryUploadFolder}/${page.id}`,
        public_id: makeFilenameFromCaption(
          imageBlock[BLOCK_TYPE_IMAGE].caption
        ),
      }
    );
    log.appendSentence("Uploaded to Cloudinary");

    await updateImageBlockExternalUrl(imageBlock.id, imageExternalUrl);
    log.appendSentence("Updated in Notion ✅");
  }
}

log.info("End");
