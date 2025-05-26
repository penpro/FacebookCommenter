// content.js

// 1) Track the most recent context-menu coordinates
let lastCtx = { x: 0, y: 0 };
document.addEventListener('contextmenu', e => {
  lastCtx = { x: e.clientX, y: e.clientY };
});

// 2) Keep a global ref to the post you just “designated”
let lastPostElement = null;

// 3) “Designate Post” handler
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action !== 'designatePost') return;

  // 3a) Grab the element under the cursor
  const el = document.elementFromPoint(lastCtx.x, lastCtx.y);
  if (!el) return console.warn('No element at point');
  console.log('clicked element:', el);

  // 3b) Dump ancestors for selector-tweaking (optional)
  let node = el;
  while (node && node !== document.documentElement) {
    const attrs = Array.from(node.attributes||[])
                       .map(a=>`${a.name}="${a.value}"`)
                       .join(' ');
    console.log(`ancestor → <${node.tagName.toLowerCase()} ${attrs}>`);
    node = node.parentElement;
  }

  // 3c) Find the FB post wrapper
  const post = el.closest(
    'div[role="article"], div[aria-posinset], div[data-pagelet^="FeedUnit_"]'
  );
  console.log('matched post wrapper:', post);
  if (!post) {
    console.warn('Not inside a FB post—adjust your selector!');
    return;
  }

  // 3d) Extract text, highlight & stash
  const content = post.innerText.trim();
  // 3d-2) Grab any image alt-text inside this post
    const imgAlts = Array.from(post.querySelectorAll('img'))
      .map(img => img.alt && img.alt.trim())
      .filter(Boolean);
  post.style.outline = '3px solid orange';
  lastPostElement = post;

  chrome.storage.local.get({ posts: [] }, data => {
    data.posts.push(content);
    chrome.storage.local.set({ posts: data.posts }, () => {
      console.log('Post saved:', content.slice(0,60) + '…');
    });
  });

  // 3e) Kick off GPT processing
  chrome.runtime.sendMessage({
    action: 'processPost',
    content
  });
  chrome.runtime.sendMessage({
      action: 'processPost',
      content,
      imgAlts     // <-- send array of alt-texts
    });
});

// 4) “Post the Comment” handler
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action !== 'postComment' || !lastPostElement) return;

  // 4a) Click the “Comment” trigger to open the editor
  const trigger = Array.from(
    lastPostElement.querySelectorAll('a, button, [role="button"]')
  ).find(el => /comment/i.test(el.innerText));
  if (trigger) trigger.click();

  // 4b) Poll for the editor until it appears (timeout after 2s)
  const start = Date.now();
  const tryInsert = () => {
    if (Date.now() - start > 2000) {
      console.warn('Comment editor never appeared');
      return;
    }

    // a) First, check if activeElement is our editor
    let editor = document.activeElement;
    if (!(editor && editor.getAttribute('contenteditable') === 'true')) {
      // b) Fallback to global query
      editor = document.querySelector(
        'div[contenteditable="true"][role="textbox"]'
      );
    }
    if (!editor) {
      return setTimeout(tryInsert, 100);
    }

    // 4c) Insert the comment text
    editor.focus();
    document.execCommand('insertText', false, msg.comment);
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));

    // 4d) Instead of finding the Post button, simulate pressing Enter
    // on the comment textbox (Facebook submits comment on Enter)
    // wait 300ms, then “press” Enter:
    setTimeout(() => {
      editor.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
        bubbles: true
      }));
      editor.dispatchEvent(new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
        bubbles: true
      }));
    }, 300);
  };

  tryInsert();
});
