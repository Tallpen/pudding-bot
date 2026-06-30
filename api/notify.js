export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // LINE webhook events (for getting group ID)
  if (req.method === 'POST' && req.body?.events) {
    const token = process.env.LINE_CHANNEL_TOKEN;
    const events = req.body.events;

    for (const event of events) {
      // When bot joins a group, log the group ID
      if (event.type === 'join' && event.source?.type === 'group') {
        const groupId = event.source.groupId;
        // Send the group ID back to the group as a message
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: groupId,
            messages: [{ type: 'text', text: `✅ 吉的寶 Bot 已加入！\n群組 ID：${groupId}\n請複製這串 ID 填入設定。` }],
          }),
        });
      }
    }

    return res.status(200).end();
  }

  // Coupon redeem notification
  if (req.method === 'POST') {
    const { ticketNum, remaining, note } = req.body || {};
    const token = process.env.LINE_CHANNEL_TOKEN;
    const groupId = process.env.LINE_GROUP_ID;

    if (!token || !groupId || groupId === 'placeholder') {
      return res.status(500).json({ error: 'LINE_GROUP_ID not set' });
    }

    const message = `🍮 吉的寶手作布丁\n\n黃🐷本次兌換 ${ticketNum} 份\n特殊需求：${note}\n請耐心等候製作。\n\n共剩餘 ${remaining} 張兌換券。`;

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: groupId,
        messages: [{ type: 'text', text: message }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data });
    return res.status(200).json({ success: true });
  }

  return res.status(200).end();
}
