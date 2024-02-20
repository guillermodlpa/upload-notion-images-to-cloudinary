import { BLOCK_TYPE_IMAGE } from "./constants/blockTypes";
import * as cloudinaryClient from "./lib/cloudinaryClient";
import NotionClient from "./lib/notionClient";
import downloadImageToBase64 from "./utils/downloadFile";
import Logger from "./utils/Logger";
import makeFilename from "./utils/makeFilename";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";

export default async function uploadNotionImagesToCloudinary({
  notionToken = process.env.NOTION_TOKEN || "",
  notionDatabaseId = process.env.NOTION_DATABASE_ID || undefined,
  notionPageId = undefined,
  cloudinaryUrl = process.env.CLOUDINARY_URL || "",
  cloudinaryUploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "",
  logLevel = process.env.NODE_ENV === "development" ? "debug" : "error",
  uploadExternalsNotOnCloudinary = false,
}: {
  notionToken: string;
  cloudinaryUrl: string;
  cloudinaryUploadFolder?: string;
  logLevel: "none" | "error" | "info" | "debug";
  uploadExternalsNotOnCloudinary?: boolean;
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

  const pages: GetPageResponse[] = notionPageId
    ? [await notionClient.getPage(notionPageId)]
    : notionDatabaseId
    ? await notionClient.getPagesFromDatabase(notionDatabaseId)
    : [];

  for (const page of pages) {
    // find the title of the page in properties where the object.id is of type title
    let title: string | undefined

    if ("properties" in page) {
      Object.entries(page.properties).some(([key, prop]) => {
        if (prop && prop.type === "title") {
          title = prop.title.map((t) => t.plain_text).join("")
          return true
        }
      })
    }

    log.debug(`${page.id}: title: ${title}`)

    ////////////////////
    // cover
    ////////////////////
    let coverUrl =
      "cover" in page && page.cover?.type === "file"
        ? page.cover.file.url
        : undefined;

    // case if external image is not stored on cloudinary
    if (
      uploadExternalsNotOnCloudinary &&
      "cover" in page &&
      page.cover?.type === "external" &&
      !page.cover.external.url.includes("cloudinary")
    ) {
      log.debug(`${page.id}: coverUrl not on cloudinary`, page.cover.external)
      coverUrl = page.cover.external.url
    }

    if (!coverUrl) {
      log.debug(`${page.id}: cover image already not hosted in Notion`);
    } else {
      log.info(`${page.id}: cover image hosted in Notion`);

      const coverImage = await downloadImageToBase64(coverUrl);
      log.debug("Image downloaded");

      const filenameFromTitle = title ? makeFilename(title, 200) : undefined

      const { url: coverExternalUrl } = await cloudinaryClient.uploadImage(
        `data:image/jpeg;base64,${coverImage}`,
        {
          folder: `${cloudinaryUploadFolder}/${page.id}`,
          public_id: filenameFromTitle,
        }
      );
      log.debug("Uploaded to Cloudinary");

      await notionClient.updatePageCoverExternalUrl(page.id, coverExternalUrl);
      log.info(
        `${page.id}: cover image was hosted in Notion. Moved to Cloudinary and asset updated in Notion`
      );
    }

    ////////////////////
    // icon
    ////////////////////
    let iconUrl =
      "icon" in page && page.icon?.type === "file"
        ? page.icon.file.url
        : undefined

    // case if external image is not stored on cloudinary
    if (
      uploadExternalsNotOnCloudinary &&
      "icon" in page &&
      page.icon?.type === "external" &&
      !page.icon.external.url.includes("cloudinary")
    ) {
      log.debug(`${page.id}: iconUrl not on cloudinary`, page.icon.external)
      iconUrl = page.icon.external.url
    }

    if (!iconUrl) {
      log.debug(`${page.id}: icon image already not hosted in Notion`)
    } else {
      log.info(`${page.id}: icon image hosted in Notion`)


      let image

      // check if the icon is a data url
      if (iconUrl.startsWith("data:image")) {
        image = iconUrl
      } else {
        const iconImage = await downloadImageToBase64(iconUrl)
        log.debug("Image downloaded")
        image = `data:image/jpeg;base64,${iconImage}`
      }

      const filenameFromTitle = title ? `${makeFilename(title, 150)}_icon` : undefined

      const { url: iconExternalUrl } = await cloudinaryClient.uploadImage(
        image,
        {
          folder: `${cloudinaryUploadFolder}/${page.id}`,
          public_id: filenameFromTitle,
        }
      )
      log.debug("Uploaded to Cloudinary")

      await notionClient.updatePageIconExternalUrl(page.id, iconExternalUrl)
      log.info(
        `${page.id}: icon image was hosted in Notion. Moved to Cloudinary and asset updated in Notion`
      )
    }

    ////////////////////
    // image blocks
    ////////////////////
    log.debug(`${page.id}: fetching image blocks...`);
    const imageBlocks = await notionClient.fetchAllImageBlocks(page.id);
    log.debug(`Found ${imageBlocks.length}`);

    for (const imageBlock of imageBlocks) {
      if (!(BLOCK_TYPE_IMAGE in imageBlock)) {
        log.error("Unexpected image block without value property");
        continue;
      }
      let imageUrl =
        imageBlock[BLOCK_TYPE_IMAGE].type === "file"
          ? imageBlock[BLOCK_TYPE_IMAGE].file.url
          : null;

      // case if external image is not stored on cloudinary
      if (
        uploadExternalsNotOnCloudinary &&
        imageBlock[BLOCK_TYPE_IMAGE].type === "external" &&
        !imageBlock[BLOCK_TYPE_IMAGE].external.url.includes("cloudinary")
      ) {
        log.debug(`${page.id}: imageBlock not on cloudinary`, imageBlock[BLOCK_TYPE_IMAGE].external)
        imageUrl = imageBlock[BLOCK_TYPE_IMAGE].external.url
      }

      if (!imageUrl) {
        log.debug(`${page.id}: ${imageBlock.id}: already not hosted in Notion`);
        continue;
      }
      log.info(`${page.id}: image hosted in Notion`);

      const blockImage = await downloadImageToBase64(imageUrl);
      log.debug("Image downloaded");

      const filenameFromCaption = makeFilename(
        imageBlock[BLOCK_TYPE_IMAGE].caption,
        100
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
