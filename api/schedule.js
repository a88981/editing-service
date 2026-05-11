export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const response = await fetch('https://api.notion.com/v1/blocks/35d0c47d-6782-81dc-8370-c8f439f4a583/children', {
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      }
    });

    const data = await response.json();
    const blocks = data.results || [];

    let schedule = { main: '', urgent: '', vacation: '' };
    let inSchedule = false;
    let count = 0;

    for (const block of blocks) {
      const richText = block[block.type]?.rich_text || [];
      const text = richText.map(t => t.plain_text).join('');
      const isBold = richText.length > 0 && richText[0]?.annotations?.bold;

      if (text.includes('目前檔期狀態')) { inSchedule = true; count = 0; continue; }
      if (text.includes('修改範例')) { inSchedule = false; break; }
      if (!inSchedule || !text) continue;

      // 跳過粗體標題（主要檔期、急案、休假）
      if (isBold) continue;

      if (count === 0) schedule.main = text;
      else if (count === 1) schedule.urgent = text;
      else if (count === 2) schedule.vacation = text;
      count++;
    }

    res.status(200).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
