import { Client, LogLevel } from "@notionhq/client";
import { GetBlockResponse } from "@notionhq/client/build/src/api-endpoints";
import { BLOCK_TYPE_IMAGE } from "../constants/blockTypes";
import Logger from "../utils/Logger";

export default class NotionClient {
  #client: Client;
  log: Logger;

  constructor(auth: string, log: Logger) {
    this.#client = new Client({
      auth,
      logLevel:
        process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.WARN,
    });
    this.log = log;
  }

  async getPagesFromDatabase(notionDatabaseId: string) {
    const result = await this.#client.databases.query({
      database_id: notionDatabaseId,
    });
    // @todo: add pagination to handle databases with many pages

    if (result.results.length > 100) {
      this.log.info('⚠️ More than 100 pages in database, pagination not implemented yet')
    }

    return result.results;
  }

  async getPage(notionPageId: string) {
    const result = await this.#client.pages.retrieve({
      page_id: notionPageId,
    });
    return result;
  }

  async fetchAllBlocks(pageIdOrBlockId: string): Promise<GetBlockResponse[]> {
    const result = await this.#client.blocks.children.list({
      block_id: pageIdOrBlockId,
    });
    // @todo: add pagination to handle pages with many blocks
    const blocks = result.results;

    if (result.results.length > 100) {
      this.log.info('⚠️ More than 100 blocks in page, pagination not implemented yet')
    }

    // Retrieve block children for nested blocks (one level deep), for example toggle blocks
    // https://developers.notion.com/docs/working-with-page-content#reading-nested-blocks
    const childBlocks = await Promise.all(
      blocks
        .filter((block) => "has_children" in block && block.has_children)
        .map(async (block) => {
          const childBlocks = await this.fetchAllBlocks(block.id);
          return childBlocks;
        })
    );

    // We don't care about the order they are. Otherwise, we'd group child blocks with their parents
    return [...blocks, ...childBlocks.flat()];
  }

  async fetchAllImageBlocks(
    pageIdOrBlockId: string
  ): Promise<GetBlockResponse[]> {
    const allBlocks = await this.fetchAllBlocks(pageIdOrBlockId);
    const imageBlocks = allBlocks.filter(
      (block) => "type" in block && block.type === BLOCK_TYPE_IMAGE
    );
    return imageBlocks;
  }

  async updateImageBlockExternalUrl(blockId: string, url: string) {
    return this.#client.blocks.update({
      block_id: blockId,
      image: {
        external: {
          url,
        },
      },
    });
  }

  async updatePageCoverExternalUrl(pageId: string, url: string) {
    return this.#client.pages.update({
      page_id: pageId,
      cover: {
        type: "external",
        external: {
          url,
        },
      },
    });
  }
}
