import { Client, LogLevel } from "@notionhq/client";
import { GetBlockResponse } from "@notionhq/client/build/src/api-endpoints";
import { BLOCK_TYPE_IMAGE } from "../constants/blockTypes";
import throwMissingEnvVarError from "../utils/throwMissingEnvVarError";

const notionToken =
  process.env.NOTION_TOKEN || throwMissingEnvVarError("NOTION_TOKEN");

const notion = new Client({
  auth: notionToken,
  logLevel:
    process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.WARN,
});

export async function getPagesFromDatabase(notionDatabaseId: string) {
  const result = await notion.databases.query({
    database_id: notionDatabaseId,
  });
  // @todo: add pagination to handle databases with many pages
  return result.results;
}

async function fetchAllBlocks(
  pageIdOrBlockId: string
): Promise<GetBlockResponse[]> {
  const result = await notion.blocks.children.list({
    block_id: pageIdOrBlockId,
  });
  // @todo: add pagination to handle pages with many blocks
  const blocks = result.results;

  // Retrieve block children for nested blocks (one level deep), for example toggle blocks
  // inspired by https://developers.notion.com/docs/working-with-page-content#reading-nested-blocks
  const childBlocks = await Promise.all(
    blocks
      .filter((block) => "has_children" in block && block.has_children)
      .map(async (block) => {
        const childBlocks = await fetchAllBlocks(block.id);
        return childBlocks;
      })
  );

  // We don't care about the order they are. Otherwise, we'd group child blocks with their parents
  return [...blocks, ...childBlocks.flat()];
}

export async function fetchAllImageBlocks(
  pageIdOrBlockId: string
): Promise<GetBlockResponse[]> {
  const allBlocks = await fetchAllBlocks(pageIdOrBlockId);
  const imageBlocks = allBlocks.filter(
    (block) => "type" in block && block.type === BLOCK_TYPE_IMAGE
  );
  return imageBlocks;
}

export async function updateImageBlockExternalUrl(
  blockId: string,
  url: string
) {
  return notion.blocks.update({
    block_id: blockId,
    image: {
      external: {
        url,
      },
    },
  });
}

export async function updatePageCoverExternalUrl(pageId: string, url: string) {
  return notion.pages.update({
    page_id: pageId,
    cover: {
      type: "external",
      external: {
        url,
      },
    },
  });
}
