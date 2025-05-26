// background.js

// 1️⃣ On install, stash your key and create the context-menu
chrome.runtime.onInstalled.addListener(() => {
  // ⚠️ Only do this once by reloading your extension—then remove or comment out!
  chrome.storage.local.set({
    openai_api_key: 'sk-proj-'
  });

  chrome.contextMenus.create({
    id: 'designatePost',
    title: 'Reply to this post',
    contexts: ['all']
  });
});

// 2️⃣ Relay context-menu clicks to content.js
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'designatePost' && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'designatePost' });
  }
});

// 3️⃣ Helper to read the key out of storage
function getKey() {
  return new Promise(resolve =>
    chrome.storage.local.get('openai_api_key', data =>
      resolve(data.openai_api_key)
    )
  );
}

// 4️⃣ Handle “processPost” from content.js
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.action !== 'processPost') return;

  const OPENAI_KEY = await getKey();
  if (!OPENAI_KEY) {
    console.error('[BG] No API key set!');
    return;
  }

  const { content, imgAlts = [] } = msg;

  // —— DEBUG LOG so you can inspect in SW console ——
  console.log('[BG] processPost received:');
  console.log('    content:', content);
  console.log('    imgAlts:', imgAlts);

  // Build image description snippet
  const imgsDesc = imgAlts.length
    ? `\n\nThe post contains these images: ${imgAlts.map(a => `"${a}"`).join(', ')}.`
    : '';

  const system = `
You are a slightly bored, but mostly up-beat person trying to engage meaningfully but with few words on Facebook comments. Sprinkle in an emoji or two.
`.trim();

  const userPrompt = `
Here’s a Facebook post:

"${content}"${imgsDesc}

Write a short, witty comment that shows you considered both the text and the images.
`.trim();

  console.log('[BG] Sending to OpenAI with prompt:\n', userPrompt);

  // Use a Headers object rather than a literal to avoid ISO-8859-1 fetch errors
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${OPENAI_KEY}`);
  headers.set('Content-Type', 'application/json');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,           // ← this Headers instance
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: 150
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAI ${res.status}: ${txt}`);
    }

    const { choices } = await res.json();
    const comment = (choices?.[0]?.message?.content || '').trim();
    console.log('[BG] OpenAI replied with comment:', comment);

    // Forward back to content.js (if the tab is still there)
    if (sender.tab && sender.tab.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'postComment',
        comment
      });
    }
  } catch (err) {
    console.error('[BG] OpenAI error', err);
  }
});
