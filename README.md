FB + GPT Commenter
A Chrome extension that lets you right-click any Facebook post and automatically generate a short, witty comment—complete with emoji—using OpenAI’s GPT-4. It even scrapes image alt-text so your reply can reference pictures in the post!

Features
Context-menu trigger: Right-click any Facebook post and choose Reply to this post.

Text & image awareness: Grabs the post’s inner text and all <img> alt-text to provide image context to GPT.

Automatic commenting: Opens Facebook’s comment editor, pastes your AI-generated reply, then “presses” Enter to submit.

Popup dashboard: View all posts you’ve designated, run deeper analyses, and manage your OpenAI API key.

Screenshots


Installation
Clone this repository

bash
Copy
git clone https://github.com/yourusername/fb-gpt-commenter.git
cd fb-gpt-commenter
Load in Chrome

Open chrome://extensions/ in your browser.

Enable Developer mode (top right).

Click Load unpacked, then select the project’s folder.

The “FB + GPT Commenter” extension should now appear in your list.

Allow host permissions
Ensure the extension’s settings include both:

https://www.facebook.com/*

https://api.openai.com/*

Obtaining & Inserting Your OpenAI API Key
Sign up or log in at OpenAI.

Navigate to API Keys under your account.

Click Create new key, name it (e.g. “FB GPT Commenter”), then copy the generated token (starts with sk-…).

Option A: Via the Popup
Click the extension icon (puzzle piece → FB + GPT Commenter).

In the popup, paste your key into the OpenAI API Key field.

Click Save API Key.

Future calls to GPT-4 will use this stored key.

Option B: Hard-code in background.js (Advanced / Dev builds)
Not recommended for production—your key will be visible in plain text.

Open background.js.

Find the chrome.storage.local.set({ openai_api_key: '…' }); line under onInstalled.

Replace the placeholder with your own key string.

Reload the extension in chrome://extensions/.

Usage
Browse Facebook (news feed, profiles, groups).

Right-click on the post you want to reply to.

Select Reply to this post from the context menu.

Watch as the post outline turns orange, then see your AI-generated comment auto-posted moments later.

If the comment editor doesn’t appear, open DevTools → Console to inspect warnings.

Popup Dashboard
Designated Posts: Lists all posts you’ve clicked “Reply to this post” on.

Analyze: Deep-dive into tone, key points, or policy checks via ChatGPT.

API Key: Manage your OpenAI key without editing code.

Troubleshooting
“Failed to read headers” / ISO-8859-1 code point
Ensure you never paste non-ASCII characters into the header strings. Use the popup method to store your key instead of pasting directly into background.js.

“Could not establish connection”
The content script may not have injected yet. Refresh Facebook and try again, or ensure run_at: "document_idle" is in your manifest.

No <img> alt-text captured
Facebook often hides true alt text for privacy; this extension only grabs what’s in the DOM.

Comment editor never appears
Facebook’s DOM can change; you may need to tweak the content script’s selector for the “Comment” button.

Development
Watching changes
After modifying any .js file, click Reload on chrome://extensions/ for “FB + GPT Commenter”.

Logging
Both content and background scripts output detailed logs to their respective DevTools consoles.

Selector tweaks
If FB updates structure, adjust the post.closest(...) and “Comment” trigger regex in content.js.

Contributing
Fork the repo.

Create a feature branch (git checkout -b feature/foo).

Commit your changes (git commit -am "feat: add bar support").

Push to the branch (git push origin feature/foo).

Open a Pull Request—describe your changes and test cases.

License
Wesley Weaver 2025
Feel free to adapt and share back any improvements!
