import uploadNotionImagesToCloudinary from "./uploadNotionImagesToCloudinary";

jest.mock("./lib/cloudinaryClient", () => ({
  config: jest.fn(),
  uploadImage: jest.fn().mockImplementation(() => ({ url: "" })),
}));

jest.mock("./lib/notionClient", () => {
  return jest.fn().mockImplementation(() => {
    return {
      getPage: async () => ({
        id: "fake-notion-page-id",
        cover: {
          type: "file",
          file: {
            url: "fake-page-url",
          },
        },
      }),
      updatePageCoverExternalUrl: async () => {},
      fetchAllImageBlocks: async () => {
        return [
          // an image already hosted in notion
          {
            image: {
              type: "file",
              file: {
                url: "fake image url",
              },
            },
          },
          // another image hosted in of notion
          {
            image: {
              type: "file",
              file: {
                url: "fake image url",
              },
            },
          },
          // an image hosted outside of notion
          {
            image: {
              type: "",
            },
          },
        ];
      },
      updateImageBlockExternalUrl: async () => {},
    };
  });
});

jest.mock("./utils/downloadFile", () => jest.fn());
jest.mock("./utils/makeFilenameFromCaption", () => jest.fn());

describe("uploadNotionImagesToCloudinary", () => {
  it("should upload an image to cloudinary for each image that is still hosted in notion", async () => {
    const { uploadImage } = require("./lib/cloudinaryClient");

    // @ts-expect-error - type narrowing isn't correct
    await uploadNotionImagesToCloudinary({
      cloudinaryUrl: "",
      notionToken: "fake-notion-token",
      notionDatabaseId: "fake-notion-db-id",
      notionPageId: "fake-notion-page-id",
    });

    expect(uploadImage).toHaveBeenCalledTimes(3);
  });
});
