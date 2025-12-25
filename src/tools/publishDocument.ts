import { Platform, PublishOptions, PublishResult } from '../types/index.js';
import { publishToNotion } from '../platforms/notion.js';
import { publishToGitHubWiki } from '../platforms/github-wiki.js';
import { publishToObsidian } from '../platforms/obsidian.js';

export interface PublishDocumentInput {
  document: string;
  title: string;
  platform: Platform;
  options?: Partial<PublishOptions>;
}

export interface PublishDocumentOutput {
  result: PublishResult;
}

export async function publishDocument(input: PublishDocumentInput): Promise<PublishDocumentOutput> {
  const { document, title, platform, options } = input;

  let result: PublishResult;

  try {
    switch (platform) {
      case 'notion':
        result = await publishToNotion(document, title, options);
        break;
      case 'github-wiki':
        result = await publishToGitHubWiki(document, title, options);
        break;
      case 'obsidian':
        result = await publishToObsidian(document, title, options);
        break;
      default:
        result = {
          success: false,
          platform,
          error: `Unsupported platform: ${platform}`
        };
    }
  } catch (error) {
    result = {
      success: false,
      platform,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }

  return { result };
}

export const publishDocumentSchema = {
  name: 'publish_document',
  description: 'Publishes generated documents to external platforms (Notion, GitHub Wiki, or Obsidian).',
  inputSchema: {
    type: 'object',
    properties: {
      document: {
        type: 'string',
        description: 'The document content to publish'
      },
      title: {
        type: 'string',
        description: 'Title of the document'
      },
      platform: {
        type: 'string',
        enum: ['notion', 'github-wiki', 'obsidian'],
        description: 'Target platform for publishing'
      },
      options: {
        type: 'object',
        properties: {
          parentPageId: {
            type: 'string',
            description: 'Parent page ID for Notion'
          },
          wikiPath: {
            type: 'string',
            description: 'Path in the wiki for GitHub Wiki'
          },
          vaultPath: {
            type: 'string',
            description: 'Vault path for Obsidian'
          },
          filename: {
            type: 'string',
            description: 'Custom filename for the document'
          }
        }
      }
    },
    required: ['document', 'title', 'platform']
  }
};
