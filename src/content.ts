const DEFAULT_TRIGGER = '!!';
const SUGGESTION_BOX_ID = 'chatgpt-prompt-helper';
const STYLE_ID = 'chatgpt-prompt-helper-style';

let triggerSymbol = DEFAULT_TRIGGER;
let prompts: string[] = [];
let inputDiv: HTMLElement | null = null;
let suggestionBox: HTMLDivElement | null = null;
let selectedIndex = -1;

const suggestionStyles = `
  .relative.z-1.flex.max-w-full.flex-1.flex-col.h-full,
  .flex.w-full.flex-col {
    position: relative;
  }

  #${SUGGESTION_BOX_ID} {
    position: absolute;
    width: 600px;
    max-width: 800px;
    min-width: 280px;
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-height: 220px;
    overflow-y: auto;
    padding: 8px 0;
  }

  #${SUGGESTION_BOX_ID}.hidden {
    display: none;
  }

  #${SUGGESTION_BOX_ID} .suggestion-item {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #${SUGGESTION_BOX_ID} .suggestion-item:hover,
  #${SUGGESTION_BOX_ID} .suggestion-item.selected {
    background-color: #e9f2ff;
  }

  #${SUGGESTION_BOX_ID} .tab-hint {
    color: #6f6f6f;
    font-size: 12px;
    margin-left: 16px;
  }

  @media (prefers-color-scheme: dark) {
    #${SUGGESTION_BOX_ID} {
      background-color: #2c2c2c;
      border-color: #5a5a5a;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.45);
    }

    #${SUGGESTION_BOX_ID} .suggestion-item {
      color: #f4f4f4;
    }

    #${SUGGESTION_BOX_ID} .suggestion-item:hover,
    #${SUGGESTION_BOX_ID} .suggestion-item.selected {
      background-color: #363636;
    }

    #${SUGGESTION_BOX_ID} .tab-hint {
      color: #cfcfcf;
    }
  }
`;

function ensureStylesInjected() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = suggestionStyles;
  document.head.appendChild(style);
}

function loadFromStorage(callback?: () => void) {
  chrome.storage.sync.get(['prompts', 'triggerSymbol'], (result) => {
    prompts = Array.isArray(result.prompts) ? result.prompts : [];
    triggerSymbol =
      typeof result.triggerSymbol === 'string' && result.triggerSymbol.trim()
        ? result.triggerSymbol
        : DEFAULT_TRIGGER;
    callback?.();
  });
}

function bindInput(newInputDiv: HTMLElement) {
  if (inputDiv === newInputDiv) return;

  if (inputDiv) {
    inputDiv.removeEventListener('input', handleInput);
    inputDiv.removeEventListener('keydown', handleKeyDown);
    if (suggestionBox) {
      suggestionBox.remove();
      suggestionBox = null;
    }
  }

  inputDiv = newInputDiv;

  inputDiv.addEventListener('input', handleInput);
  inputDiv.addEventListener('keydown', handleKeyDown);
}

function observePromptField() {
  const observer = new MutationObserver(() => {
    // ChatGPT
    const chatgptInput = document.getElementById('prompt-textarea');
    if (chatgptInput instanceof HTMLElement) {
      bindInput(chatgptInput);
      return;
    }

    // Generic / Gemini
    const genericInput = document.querySelector('div[contenteditable="true"], textarea');
    if (genericInput instanceof HTMLElement) {
      bindInput(genericInput);
      return;
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial check
  const chatgptInput = document.getElementById('prompt-textarea');
  if (chatgptInput instanceof HTMLElement) {
    bindInput(chatgptInput);
  } else {
    const genericInput = document.querySelector('div[contenteditable="true"], textarea');
    if (genericInput instanceof HTMLElement) {
      bindInput(genericInput);
    }
  }
}

function handleInput() {
  if (!inputDiv) return;

  let value = '';
  const paragraph = inputDiv.querySelector('p');
  if (paragraph) {
    value = paragraph.innerText;
  } else if (inputDiv instanceof HTMLTextAreaElement) {
    value = inputDiv.value;
  } else {
    value = inputDiv.innerText || inputDiv.textContent || '';
  }

  if (triggerSymbol && value.trim().endsWith(triggerSymbol)) {
    showSuggestions();
  } else if (suggestionBox) {
    hideSuggestions();
  }
}

function showSuggestions() {
  if (!prompts.length || !inputDiv) {
    hideSuggestions();
    return;
  }

  if (!suggestionBox) {
    suggestionBox = document.createElement('div');
    suggestionBox.id = SUGGESTION_BOX_ID;
    suggestionBox.className = 'hidden';
    document.body.appendChild(suggestionBox);
  }

  suggestionBox.innerHTML = '';
  suggestionBox.classList.remove('hidden');
  selectedIndex = -1;

  // Calculate position
  const rect = inputDiv.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  // Default to showing above the input
  suggestionBox.style.left = `${rect.left + scrollX}px`;
  suggestionBox.style.top = 'auto';
  suggestionBox.style.bottom = 'auto'; // Reset

  prompts.forEach((prompt, index) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.dataset.index = index.toString();
    item.textContent = prompt;

    item.addEventListener('click', () => {
      insertPrompt(prompt);
      hideSuggestions();
    });

    suggestionBox?.appendChild(item);
  });

  // Now calculate position
  const boxHeight = suggestionBox.offsetHeight;
  const spaceAbove = rect.top;

  if (spaceAbove > boxHeight + 10) {
    // Show above
    suggestionBox.style.top = `${rect.top + scrollY - boxHeight - 10}px`;
  } else {
    // Show below
    suggestionBox.style.top = `${rect.bottom + scrollY + 10}px`;
  }
}

function insertPrompt(prompt: string, addNewLine = false) {
  if (!inputDiv) return;

  // ChatGPT specific
  const paragraphs = inputDiv.querySelectorAll<HTMLParagraphElement>('p');
  if (paragraphs.length > 0) {
    const paragraph = paragraphs[paragraphs.length - 1];
    const currentText = paragraph.innerText.replace(new RegExp(`${escapeRegex(triggerSymbol)}$`), '');
    paragraph.innerText = `${currentText}${prompt}`;

    if (addNewLine) {
      appendNewLineAfter(paragraph);
    } else {
      placeCaretAtEnd(paragraph);
    }
  } else if (inputDiv instanceof HTMLTextAreaElement) {
    const currentText = inputDiv.value.replace(new RegExp(`${escapeRegex(triggerSymbol)}$`), '');
    inputDiv.value = `${currentText}${prompt}${addNewLine ? '\n' : ''}`;
    inputDiv.focus();
  } else {
    // Generic contenteditable
    const currentText = (inputDiv.innerText || inputDiv.textContent || '').replace(new RegExp(`${escapeRegex(triggerSymbol)}$`), '');
    inputDiv.innerText = `${currentText}${prompt}`;
    if (addNewLine) {
      // Try to insert a newline
      inputDiv.innerText += '\n';
    }
    placeCaretAtEnd(inputDiv);
  }

  inputDiv.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

function placeCaretAtEnd(element: HTMLElement) {
  element.focus();
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function appendNewLineAfter(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) {
    placeCaretAtEnd(element);
    return;
  }

  const newParagraph = document.createElement('p');
  const br = document.createElement('br');
  newParagraph.appendChild(br);
  parent.insertBefore(newParagraph, element.nextSibling);
  placeCaretAtStart(newParagraph);
}

function placeCaretAtStart(element: HTMLElement) {
  element.focus();
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function hideSuggestions() {
  if (suggestionBox) {
    suggestionBox.classList.add('hidden');
  }
  selectedIndex = -1;
}

function handleKeyDown(event: KeyboardEvent) {
  if (!suggestionBox || suggestionBox.classList.contains('hidden')) return;
  const items = suggestionBox.querySelectorAll<HTMLDivElement>('.suggestion-item');
  if (!items.length) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    selectedIndex = (selectedIndex + 1) % items.length;
    updateSelection(items);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    updateSelection(items);
  } else if ((event.key === 'Enter' || event.key === 'Tab') && selectedIndex >= 0) {
    event.preventDefault();
    const prompt = prompts[selectedIndex];
    insertPrompt(prompt, event.key === 'Tab');
    hideSuggestions();
  } else if (event.key === 'Escape') {
    hideSuggestions();
  }
}

function updateSelection(items: NodeListOf<HTMLDivElement>) {
  items.forEach((item, index) => {
    item.classList.toggle('selected', index === selectedIndex);
    const hint = item.querySelector('.tab-hint');
    if (hint) {
      hint.remove();
    }

    if (index === selectedIndex) {
      const hintSpan = document.createElement('span');
      hintSpan.className = 'tab-hint';
      hintSpan.textContent = 'Tab 選取提示';
      item.appendChild(hintSpan);
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;
  if (changes.prompts) {
    prompts = Array.isArray(changes.prompts.newValue) ? changes.prompts.newValue : [];
  }
  if (changes.triggerSymbol) {
    const nextValue = changes.triggerSymbol.newValue;
    triggerSymbol =
      typeof nextValue === 'string' && nextValue.trim()
        ? nextValue
        : DEFAULT_TRIGGER;
  }
  if (!prompts.length) {
    hideSuggestions();
  }
});

document.addEventListener('click', (event) => {
  if (!suggestionBox || suggestionBox.classList.contains('hidden')) return;
  if (!suggestionBox.contains(event.target as Node) && event.target !== inputDiv) {
    hideSuggestions();
  }
});

// Handle window resize to hide/reposition (simplest is to hide)
window.addEventListener('resize', () => {
  if (suggestionBox && !suggestionBox.classList.contains('hidden')) {
    hideSuggestions();
  }
});

// Handle scroll to hide/reposition
window.addEventListener('scroll', () => {
  if (suggestionBox && !suggestionBox.classList.contains('hidden')) {
    hideSuggestions();
  }
}, true); // Capture phase to detect scrolling in any container

ensureStylesInjected();
loadFromStorage(() => {
  observePromptField();
});
