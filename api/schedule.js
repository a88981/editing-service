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

    // 找「目前檔期狀態」區塊後面的內容
    let schedule = { main: '', urgent: '', vacation: '' };
    let inSchedule = false;

    for (const block of blocks) {
      const text = block[block.type]?.rich_text?.map(t => t.plain_text).join('') || '';

      if (text.includes('目前檔期狀態')) { inSchedule = true; continue; }
      if (text.includes('修改範例')) { inSchedule = false; break; }
      if (!inSchedule) continue;

      if (block.type === 'paragraph' && text) {
        if (!schedule.main) schedule.main = text;
        else if (!schedule.urgent) schedule.urgent = text;
        else if (!schedule.vacation) schedule.vacation = text;
      }
    }

    res.status(200).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
