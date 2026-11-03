const API = "https://promptpilot-ai-psi.vercel.app/api/smart";
const $ = (id) => document.getElementById(id);

// Prefill with the user's selection on the current tab (activeTab only, on click).
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.id) return;
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => String(window.getSelection() || "") })
    .then(([r]) => { if (r?.result && !$("in").value) $("in").value = r.result; })
    .catch(() => {});
});

$("go").onclick = async () => {
  const input = $("in").value.trim();
  if (!input) return;
  $("go").disabled = true; $("note").textContent = "Improving…";
  try {
    const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input }) });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error?.message || "Request failed");
    $("out").value = j.text;
    $("note").textContent = j.source === "ai" ? "Improved with free Smart mode." : (j.note || "Built-in improvement (Smart mode busy).");
  } catch (e) { $("note").textContent = "Error: " + e.message; }
  finally { $("go").disabled = false; }
};
$("copy").onclick = () => navigator.clipboard.writeText($("out").value);
