import { BLOCK_TYPE_IMAGE } from './constants/blockTypes';
import * as cloudinaryClient from './lib/cloudinaryClient';
import NotionClient from './lib/notionClient';
import downloadImageToBase64 from './utils/downloadFile';
import getImageUrlToUploadFromNotionImageDescriptor from './utils/getImageUrlToUploadFromNotionImageDescriptor';
import Logger from './utils/Logger';
import makeFilename from './utils/makeFilename';
import { GetPageResponse } from '@notionhq/client/build/src/api-endpoints';

export default async function uploadNotionImagesToCloudinary({
  notionToken = process.env.NOTION_TOKEN || '',
  notionDatabaseId = process.env.NOTION_DATABASE_ID || undefined,
  notionPageId = undefined,
  cloudinaryUrl = process.env.CLOUDINARY_URL || '',
  cloudinaryUploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || '',
  logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  uploadExternalsNotOnCloudinary = process.env.UPLOAD_EXTERNALS_NOT_ON_CLOUDINARY
    ? process.env.UPLOAD_EXTERNALS_NOT_ON_CLOUDINARY === '1'
    : false,
}: {
  notionToken: string;
  cloudinaryUrl: string;
  cloudinaryUploadFolder?: string;
  logLevel: 'none' | 'error' | 'info' | 'debug';
  uploadExternalsNotOnCloudinary?: boolean;
} & (
  | { notionDatabaseId: string; notionPageId?: undefined }
  | { notionDatabaseId?: undefined; notionPageId: string }
)) {
  if (!notionToken) {
    throw new Error(`Missing argument notionToken. Pass it or set it as the env var NOTION_TOKEN`);
  }
  if (!notionDatabaseId && !notionPageId) {
    throw new Error(
      `Missing both arguments notionDatabaseId and notionPageId. Pass one of them it or set the database ID in an env var NOTION_DATABASE_ID`,
    );
  }

  cloudinaryClient.config({ cloudinaryUrl });

  const log = new Logger(logLevel);

  log.debug(`Params`, { uploadExternalsNotOnCloudinary });

  const notionClient = new NotionClient(notionToken, log);

  log.debug(
    notionPageId
      ? `Fetching page ${notionPageId}`
      : notionDatabaseId
        ? `Fetching pages of database ${notionDatabaseId}`
        : 'Missing page or database ID',
  );

  const pages: GetPageResponse[] = notionPageId
    ? [await notionClient.getPage(notionPageId)]
    : notionDatabaseId
      ? await notionClient.getPagesFromDatabase(notionDatabaseId)
      : [];

  for (const page of pages) {
    // find the title of the page in properties where the object.id is of type title
    let title: string | undefined;

    if ('properties' in page) {
      Object.entries(page.properties).some(([, prop]) => {
        if (prop && prop.type === 'title') {
          title = prop.title.map((t) => t.plain_text).join('');
          return true;
        }
      });
    }

    log.debug(`${page.id}: title: ${title}`);

    ////////////////////
    // cover
    ////////////////////
    const coverUrl = getImageUrlToUploadFromNotionImageDescriptor({
      image: 'cover' in page ? page.cover : undefined,
      uploadExternalsNotOnCloudinary,
    });

    if (!coverUrl) {
      log.debug(`${page.id}: cover image is already good ✔`);
    } else {
      log.info(`${page.id}: uploading cover image to Cloudinary`);

      const coverImage = await downloadImageToBase64(coverUrl);
      log.debug('Image downloaded');

      const filenameFromTitle = title ? makeFilename(title, 200) : undefined;

      const { url: coverExternalUrl } = await cloudinaryClient.uploadImage(
        `data:image/jpeg;base64,${coverImage}`,
        {
          folder: `${cloudinaryUploadFolder}/${page.id}`,
          public_id: filenameFromTitle,
        },
      );
      log.debug('Cover image uploaded to Cloudinary');

      await notionClient.updatePageCoverExternalUrl(page.id, coverExternalUrl);
      log.info(`${page.id}: cover image copied to Cloudinary and asset updated in Notion ✅`);
    }

    ////////////////////
    // icon
    ////////////////////
    const iconUrl = getImageUrlToUploadFromNotionImageDescriptor({
      image: 'icon' in page ? page.icon : undefined,
      uploadExternalsNotOnCloudinary,
    });

    if (!iconUrl) {
      log.debug(`${page.id}: icon image is already good ✔`);
    } else {
      log.info(`${page.id}: uploading icon image to Cloudinary`);

      let image;

      // check if the icon is a data url
      if (iconUrl.startsWith('data:image')) {
        image = iconUrl;
      } else {
        const iconImage = await downloadImageToBase64(iconUrl);
        log.debug('Image downloaded');
        image = `data:image/jpeg;base64,${iconImage}`;
      }

      const filenameFromTitle = title ? `${makeFilename(title, 150)}_icon` : undefined;

      const { url: iconExternalUrl } = await cloudinaryClient.uploadImage(image, {
        folder: `${cloudinaryUploadFolder}/${page.id}`,
        public_id: filenameFromTitle,
      });
      log.debug('Icon image uploaded to Cloudinary');

      await notionClient.updatePageIconExternalUrl(page.id, iconExternalUrl);
      log.info(`${page.id}: icon image copied to Cloudinary and asset updated in Notion ✅`);
    }

    ////////////////////
    // image blocks
    ////////////////////
    log.debug(`${page.id}: fetching image blocks...`);
    const imageBlocks = await notionClient.fetchAllImageBlocks(page.id);
    log.debug(`Found ${imageBlocks.length}`);

    for (const imageBlock of imageBlocks) {
      if (!(BLOCK_TYPE_IMAGE in imageBlock)) {
        log.error('Unexpected image block without value property');
        continue;
      }

      const imageUrl = getImageUrlToUploadFromNotionImageDescriptor({
        image: imageBlock[BLOCK_TYPE_IMAGE],
        uploadExternalsNotOnCloudinary,
      });

      if (!imageUrl) {
        log.debug(`${page.id}: ${imageBlock.id}: block image already good ✔`);
        continue;
      }
      log.info(`${page.id}: uploading block image to Cloudinary`);

      const blockImage = await downloadImageToBase64(imageUrl);
      log.debug('Image downloaded');

      const filenameFromCaption = makeFilename(imageBlock[BLOCK_TYPE_IMAGE].caption, 100);

      const { url: imageExternalUrl } = await cloudinaryClient.uploadImage(
        `data:image/jpeg;base64,${blockImage}`,
        {
          folder: `${cloudinaryUploadFolder}/${page.id}`,
          // Cloudinary will set a filename if undefined (same as cover)
          public_id: filenameFromCaption ? `${filenameFromCaption}_${imageBlock.id}` : undefined,
        },
      );
      log.debug('Block image uploaded to Cloudinary');

      await notionClient.updateImageBlockExternalUrl(imageBlock.id, imageExternalUrl);
      log.info(
        `${page.id}: ${imageBlock.id}: block image copied to Cloudinary and asset updated in Notion ✅`,
      );
    }
  }

  log.debug('End');
}
