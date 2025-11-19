const DEFAULT_TRIGGER = '!!';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['prompts', 'triggerSymbol'], (result) => {
    const nextPayload: Record<string, unknown> = {};
    if (!Array.isArray(result.prompts)) {
      nextPayload.prompts = [];
    }
    if (typeof result.triggerSymbol !== 'string' || !result.triggerSymbol.trim()) {
      nextPayload.triggerSymbol = DEFAULT_TRIGGER;
    }

    if (Object.keys(nextPayload).length > 0) {
      chrome.storage.sync.set(nextPayload);
    }
  });
});

function openOptionsPage() {
  const optionsUrl = chrome.runtime.getURL('index.html');

  chrome.tabs.query({ url: optionsUrl }, (tabs) => {
    if (tabs.length > 0 && tabs[0].id) {
      chrome.tabs.update(tabs[0].id, { active: true });
      return;
    }

    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: optionsUrl });
    }
  });
}

chrome.action.onClicked.addListener(() => {
  openOptionsPage();
});
