/* ================================================================
   E-Bazar Client-Side App JS
   Handles: Dark Mode, Toast Notifications, Dropdowns, 
            Mobile Menu, Chatbot Widget, Voice Search
   ================================================================ */

'use strict';

// ─── DARK MODE ──────────────────────────────────────────────────
const html = document.documentElement;

const applyDark = (on) => {
  html.classList.toggle('dark', on);
  localStorage.setItem('ebazar-dark', on ? '1' : '0');
};

// On load: honour saved preference → OS preference
const savedDark = localStorage.getItem('ebazar-dark');
if (savedDark !== null) {
  applyDark(savedDark === '1');
} else {
  applyDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
}

document.addEventListener('DOMContentLoaded', () => {

  // Dark mode toggle button
  const darkToggle = document.getElementById('dark-mode-toggle');
  if (darkToggle) {
    darkToggle.addEventListener('click', () => applyDark(!html.classList.contains('dark')));
  }

  // ─── MOBILE MENU ──────────────────────────────────────────────
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu    = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', !open);
    });
  }

  // ─── ACCOUNT DROPDOWN ─────────────────────────────────────────
  const accountBtn  = document.getElementById('account-btn');
  const accountMenu = document.getElementById('account-menu');
  if (accountBtn && accountMenu) {
    accountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !accountMenu.classList.contains('hidden');
      accountMenu.classList.toggle('hidden', isOpen);
      accountBtn.setAttribute('aria-expanded', !isOpen);
    });
    document.addEventListener('click', () => {
      accountMenu.classList.add('hidden');
      accountBtn.setAttribute('aria-expanded', 'false');
    });
  }

  // ─── TOAST NOTIFICATIONS ──────────────────────────────────────
  window.showToast = (message, type = 'info', duration = 4000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: 'bg-teal-600 text-white',
      error:   'bg-rose-600 text-white',
      warning: 'bg-amber-500 text-white',
      info:    'bg-primary text-white',
    };
    const icons = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      info:    'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 ${colors[type] || colors.info} px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm translate-x-full transition-transform duration-300`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="text-base leading-none">${icons[type] || icons.info}</span>
      <span class="flex-1">${message}</span>
      <button type="button" class="opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss">✕</button>
    `;

    container.appendChild(toast);
    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.replace('translate-x-full', 'translate-x-0'));
    });

    const dismiss = () => {
      toast.classList.replace('translate-x-0', 'translate-x-full');
      toast.addEventListener('transitionend', () => toast.remove());
    };

    toast.querySelector('button').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  };

  // ─── CHATBOT WIDGET ───────────────────────────────────────────
  const chatFab      = document.getElementById('chatbot-fab');
  const chatPanel    = document.getElementById('chatbot-panel');
  const chatIconOpen = document.getElementById('chatbot-icon-open');
  const chatIconClose= document.getElementById('chatbot-icon-close');
  const chatMin      = document.getElementById('chatbot-minimize');
  const chatInput    = document.getElementById('chatbot-input');
  const chatSend     = document.getElementById('chatbot-send');
  const chatMessages = document.getElementById('chatbot-messages');

  let chatOpen = false;

  const toggleChat = (open) => {
    chatOpen = open;
    chatPanel.classList.toggle('scale-0', !open);
    chatPanel.classList.toggle('opacity-0', !open);
    chatPanel.classList.toggle('pointer-events-none', !open);
    chatIconOpen.classList.toggle('hidden', open);
    chatIconClose.classList.toggle('hidden', !open);
    chatFab.setAttribute('aria-expanded', open);
    if (open && chatInput) chatInput.focus();
  };

  if (chatFab) chatFab.addEventListener('click', () => toggleChat(!chatOpen));
  if (chatMin) chatMin.addEventListener('click', () => toggleChat(false));

  // Quick reply chips
  document.querySelectorAll('.chatbot-quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      if (chatInput) chatInput.value = btn.textContent.trim();
      sendChatMessage();
    });
  });

  const appendMessage = (text, role) => {
    const wrap = document.createElement('div');
    wrap.className = `flex items-start gap-2 ${role === 'user' ? 'flex-row-reverse' : ''}`;

    const bubble = document.createElement('div');
    bubble.className = role === 'user'
      ? 'bg-primary text-white text-sm px-3 py-2 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed'
      : 'bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 text-sm px-3 py-2 rounded-2xl rounded-tl-sm max-w-[80%] leading-relaxed';
    bubble.textContent = text;

    if (role === 'assistant') {
      const avatar = document.createElement('div');
      avatar.className = 'w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-sm shrink-0';
      avatar.textContent = '🤖';
      wrap.appendChild(avatar);
    }
    wrap.appendChild(bubble);
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const sendChatMessage = async () => {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';

    appendMessage(text, 'user');

    // Show typing indicator
    const typing = document.createElement('div');
    typing.id = 'chat-typing';
    typing.className = 'flex items-center gap-2';
    typing.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-sm shrink-0">🤖</div>
      <div class="bg-neutral-100 dark:bg-neutral-700/80 px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1 items-center">
        <span class="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
        <span class="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
        <span class="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
      </div>`;
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await fetch('/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      typing.remove();
      appendMessage(data.reply || 'Sorry, I encountered an error. Please try again.', 'assistant');
    } catch {
      typing.remove();
      appendMessage('I\'m having trouble connecting. Please try again later.', 'assistant');
    }
  };

  if (chatSend) chatSend.addEventListener('click', sendChatMessage);
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 96) + 'px';
    });
  }

  // ─── VOICE SEARCH ─────────────────────────────────────────────
  const voiceBtn   = document.getElementById('voice-search-btn');
  const searchInput= document.getElementById('search-input');

  if (voiceBtn && 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.lang = 'en-IN';
    recog.interimResults = false;

    voiceBtn.addEventListener('click', () => {
      voiceBtn.classList.add('text-rose-500', 'animate-pulse');
      showToast('Listening... Speak now.', 'info', 3000);
      recog.start();
    });

    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (searchInput) searchInput.value = transcript;
      voiceBtn.classList.remove('text-rose-500', 'animate-pulse');
      searchInput.closest('form').submit();
    };

    recog.onerror = () => {
      voiceBtn.classList.remove('text-rose-500', 'animate-pulse');
      showToast('Voice search failed. Please try again.', 'error');
    };
  }

  // ─── IMAGE SEARCH ─────────────────────────────────────────────
  const imageSearchBtn = document.getElementById('image-search-btn');
  if (imageSearchBtn) {
    const imgInput = document.createElement('input');
    imgInput.type = 'file';
    imgInput.accept = 'image/*';
    imgInput.style.display = 'none';
    document.body.appendChild(imgInput);

    imageSearchBtn.addEventListener('click', () => imgInput.click());

    imgInput.addEventListener('change', async () => {
      if (!imgInput.files[0]) return;
      showToast('Searching by image...', 'info', 3000);
      const formData = new FormData();
      formData.append('image', imgInput.files[0]);
      try {
        const res  = await fetch('/api/v1/products/search/image', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          window.location.href = `/products?imageSearch=1&ids=${data.ids.join(',')}`;
        } else {
          showToast('No similar products found.', 'warning');
        }
      } catch {
        showToast('Image search failed. Please try again.', 'error');
      }
      imgInput.value = '';
    });
  }

}); // end DOMContentLoaded
