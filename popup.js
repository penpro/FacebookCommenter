// helper: read & write API key
const keyStorage = {
  get: () => chrome.storage.local.get("apiKey").then(d=>d.apiKey),
  set: k => chrome.storage.local.set({ apiKey: k })
};

// render the list of captured posts
async function renderPosts() {
  const { posts = [] } = await chrome.storage.local.get("posts");
  const ul = document.getElementById("postList");
  ul.innerHTML = "";
  posts.forEach((text, i) => {
    const li = document.createElement("li");
    li.textContent = text.slice(0, 80) + (text.length>80?"…":"");
    const btn = document.createElement("button");
    btn.textContent = "Analyze";
    btn.onclick = () => analyze(text);
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

// Option A: copy to clipboard & open ChatGPT UI for manual paste
async function analyzeClipboard(text) {
  await navigator.clipboard.writeText(text);
  window.open("https://chat.openai.com/", "_blank");
}

// Option B: call the OpenAI API and show the analysis inline
async function analyzeWithAPI(text) {
  const apiKey = await keyStorage.get();
  if (!apiKey) {
    alert("Please save your OpenAI API key first.");
    return;
  }

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "user",
          content: `Please analyze this Facebook post for tone, key points, any hateful or policy-violating content, and summarize it:\n\n${text}`
        }
      ]
    })
  });
  const json = await resp.json();
  const analysis = json.choices?.[0]?.message?.content ||
                   "No response or an error occurred.";
  document.getElementById("analysis").textContent = analysis;
}

// decide which route to use
function analyze(text) {
  // uncomment one:
  // analyzeClipboard(text);
  analyzeWithAPI(text);
}

// wire up saving the API key
document.getElementById("saveKey").onclick = () => {
  const k = document.getElementById("apiKey").value.trim();
  if (k) keyStorage.set(k);
};

renderPosts();
