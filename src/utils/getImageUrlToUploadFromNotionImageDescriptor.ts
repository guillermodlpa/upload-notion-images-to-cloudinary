import {
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export default function getImageUrlToUploadFromNotionImageDescriptor({
  image,
  uploadExternalsNotOnCloudinary,
}: {
  image:
    | undefined
    | PageObjectResponse["cover"]
    | PageObjectResponse["icon"]
    | ImageBlockObjectResponse["image"];
  uploadExternalsNotOnCloudinary: boolean;
}) {
  if (!image) {
    return undefined;
  }
  // hosted in Notion, then we want to copy it to Cloudinary
  if (image.type === "file") {
    return image.file.url;
  }
  // Hosted externally, but we still want to upload it to Cloudinary
  if (
    uploadExternalsNotOnCloudinary &&
    image.type === "external" &&
    !image.external.url.includes("cloudinary")
  ) {
    return image.external.url;
  }
  return undefined;
}
