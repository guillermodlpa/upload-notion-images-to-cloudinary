# Upload Notion Images to Cloudinary

[![npm version](https://img.shields.io/npm/v/upload-notion-images-to-cloudinary.svg?style=flat-square)](https://www.npmjs.com/package/upload-notion-images-to-cloudinary)

Script to move images hosted in Notion to Cloudinary, using the [Notion API](https://developers.notion.com/) and the [Cloudinary API.](https://cloudinary.com/documentation/node_image_and_video_upload)

**⭐️ Contributions are welcome**. Read Contribute section below.

## Why is this needed?

Because a site using Next.js leveraging Static Site Generation and Image Optimization with Notion as a CMS can't have the images hosted by Notion.

The Notion API returns temporary URLs for images hosted by Notion. The URLs will expire after one hour. This breaks [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization) for Static Site Generated pages because after its internal image cache expires, it can't refetch from the URLs Notion provided at build time.

A solution to apply image optimization is to host images in a separate service. However, manually doing it is a lot of effort.

By hooking up this script to the page revalidation and deployment of the application, content creators can add images to Notion pages without worrying about where they are hosted.

### Example

This technology has been used for my website, build with Next.js and Notion. [https://github.com/guillermodlpa/site](https://github.com/guillermodlpa/site)

## Usage as a module

Simply import it and call the function passing a Notion database ID:

```typescript
import uploadNotionImagesToCloudinary from 'upload-notion-images-to-cloudinary';

await uploadNotionImagesToCloudinary({
  notionToken: process.env.NOTION_TOKEN,
  notionDatabaseId: process.env.NOTION_BLOG_DATABASE_ID,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
  cloudinaryUploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER,
  logLevel: "debug",
});
```

Or pass a Notion page ID to only apply it to that page:

```typescript
import uploadNotionImagesToCloudinary from 'upload-notion-images-to-cloudinary';

await uploadNotionImagesToCloudinary({
  notionToken: process.env.NOTION_TOKEN,
  notionPageId: id,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
  cloudinaryUploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER,
  logLevel: "debug",
});
```

Also upload external images that are not hosted on Cloudinary yet.\
e.g. when you enter a URL directly in Notion from another webpage, and you want to persist it on your side.

Pass parameter `uploadExternalsNotOnCloudinary: true` to enable it:

```typescript
import uploadNotionImagesToCloudinary from 'upload-notion-images-to-cloudinary';

await uploadNotionImagesToCloudinary({
  notionToken: process.env.NOTION_TOKEN,
  notionDatabaseId: process.env.NOTION_BLOG_DATABASE_ID,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
  cloudinaryUploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER,
  logLevel: "debug",
  uploadExternalsNotOnCloudinary: true,
});
```

## CLI usage

1. Define the following environment variables in your project:

      ```
      NOTION_TOKEN=
      NOTION_DATABASE_ID=
      CLOUDINARY_URL=
      CLOUDINARY_UPLOAD_FOLDER=
      UPLOAD_EXTERNALS_NOT_ON_CLOUDINARY=
      ```

     * **NOTION_TOKEN** is obtained  at https://www.notion.so/my-integrations, creating an integration with "read content" access, "update content" access, and "no user information" capabilities.
     * **NOTION_DATABASE_ID** is the ID of the Notion database that you want to go over. For that, open the database view on the browser, the URL is `https://www.notion.so/<database ID>?v=<view ID>`
     * **CLOUDINARY_URL** can be obtained in the Cludinary UI.
     * **CLOUDINARY_UPLOAD_FOLDER** is optional, defines a path within your Cloudinary account to upload images to.
     * **UPLOAD_EXTERNALS_NOT_ON_CLOUDINARY** is optional. Set it to `1` to also copy to Cloudinary any other external images.

2. In Notion, enable the integration to manipulate the database, by clicking Share on its page and entering your integration name.
3. Install the package:
    ```console
    $ npm install upload-notion-images-to-cloudinary
    ```
4. Add it to the prebuild step in your repository or in the deployment platform of your choice.
   ```json
    // package.json
    {
      "scripts": {
        "postbuild": "upload-notion-images-to-cloudinary"
      },
    }
    ```

### Example output

```
[upload-notion-images-to-cloudinary][INFO] Fetching pages.... Found 1
[upload-notion-images-to-cloudinary][DEBUG] 61b7aeb3-ea97-4ec6-b8c1-a762e8f0b711: cover image not hosted in Notion
[upload-notion-images-to-cloudinary][INFO] 61b7aeb3-ea97-4ec6-b8c1-a762e8f0b711: fetching image blocks.... Found 2
[upload-notion-images-to-cloudinary][INFO] 61b7aeb3-ea97-4ec6-b8c1-a762e8f0b711: image hosted in Notion. Image downloaded. Uploaded to Cloudinary. Updated in Notion ✅
[upload-notion-images-to-cloudinary][DEBUG] 61b7aeb3-ea97-4ec6-b8c1-a762e8f0b711: db95193f-44a4-4a66-97b8-6d2850d499ab: not hosted in Notion
[upload-notion-images-to-cloudinary][DEBUG] 61b7aeb3-ea97-4ec6-b8c1-a762e8f0b711: 3f0104fb-e8aa-488f-a3b6-9ae8c2b7622b: not hosted in Notion
[upload-notion-images-to-cloudinary][INFO] End.
```

## Contribute

⭐️ Contributions are welcome. If this code can be useful to you, consider improving it and opening a pull request. There are things to be done, like:
* Handling errors more gracefully
* Supporting paginated results for large databases and pages
* Using the page title for the cover image filename
* Adding CI
* Writing tests
