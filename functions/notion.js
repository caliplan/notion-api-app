const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const pageId = process.env.NOTION_PAGE_ID;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { action, content } = JSON.parse(event.body);

  try {
    switch (action) {
      case 'add':
        await addContent(content);
        return { statusCode: 200, body: JSON.stringify({ message: 'Content added successfully' }) };
      case 'update':
        await updateContent(content);
        return { statusCode: 200, body: JSON.stringify({ message: 'Content updated successfully' }) };
      case 'get':
        const pageContent = await getContent();
        return { statusCode: 200, body: JSON.stringify({ content: pageContent }) };
      default:
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

async function addContent(content) {
  await notion.blocks.children.append({
    block_id: pageId,
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }],
        },
      },
    ],
  });
}

async function updateContent(content) {
  const blocks = await notion.blocks.children.list({ block_id: pageId });
  for (const block of blocks.results) {
    await notion.blocks.delete({ block_id: block.id });
  }
  await addContent(content);
}

async function getContent() {
  const response = await notion.blocks.children.list({ block_id: pageId });
  return response.results
    .filter(block => block.type === 'paragraph')
    .map(block => block.paragraph.rich_text[0]?.plain_text || '')
    .join('\n');
}