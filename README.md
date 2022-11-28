# Upload Notion Images to Cloudinary

[![npm version](https://img.shields.io/npm/v/upload-notion-images-to-cloudinary.svg?style=flat-square)](https://www.npmjs.com/package/upload-notion-images-to-cloudinary)

Script to move images in Notion to Cloudinary, using the [Notion API](https://developers.notion.com/) and the [Cloudinary API](https://cloudinary.com/documentation/node_image_and_video_upload).

**⭐️ Contributions are welcome**. Read Contribute section below.

## Why is this needed?

Because a site using Next.js leveraging Static Site Generation and Image Optimization with Notion as a CMS can't have the images hosted by Notion.

The Notion API returns temporary URLs for images hosted by Notion. The URLs will expire after one hour. This breaks [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization) for Static Site Generated pages because after its internal image cache expires, it can't refetch from the URLs Notion provided at build time.

The solution to use Next.js Image Optimization and Notion as a CMS is to host images in a separate service. However, uploading images to another service and then linking them from Notion is cumbersome.

With this script, you can add images to Notion pages without worrying about where they are hosted, and then before publishing, you can execute this script to move the files to Cloudinary, where they'll have a persistent URL that Next.js can use at any time.

### Example

This technology has been used for my website, build with Next.js and Notion. [https://github.com/guillermodlpa/site](https://github.com/guillermodlpa/site)

## CLI usage

1. Define the following environment variables in your project:

      ```
      NOTION_TOKEN=
      NOTION_DATABASE_ID=
      CLOUDINARY_URL=
      CLOUDINARY_UPLOAD_FOLDER=
      ```

     * **NOTION_TOKEN** is obtained  at https://www.notion.so/my-integrations, creating an integration with "read content" access, "update content" access, and "no user information" capabilities.
     * **NOTION_DATABASE_ID** is the ID of the Notion database that you want to go over. For that, open the database view on the browser, the URL is `https://www.notion.so/<database ID>?v=<view ID>`
     * **CLOUDINARY_URL** can be obtained in the Cludinary UI.
     * **CLOUDINARY_UPLOAD_FOLDER** is optional, defines a path within your Cloudinary account to upload images to.

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
