// ============================================================
// Forga AI - التطبيق الرئيسي
// ============================================================

// ============================================================
// 1. تهيئة التطبيق
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // عناصر الواجهة
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const botMode = document.getElementById('botMode');
    const charCount = document.getElementById('charCount');

    // ============================================================
    // 2. معالج إرسال الرسائل
    // ============================================================
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        if (!codeManager.hasValidCode()) {
            document.getElementById('codeOverlay').classList.add('active');
            return;
        }

        // تعطيل الإدخال أثناء المعالجة
        userInput.disabled = true;
        sendBtn.disabled = true;

        // إضافة رسالة المستخدم
        const userMsg = createMessageElement(message, true);
        chatMessages.appendChild(userMsg);
        userInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // إضافة مؤشر الكتابة
        const typingIndicator = createTypingIndicator();
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // إرسال الرسالة إلى API
            const response = await chatManager.sendMessage(message);
            
            // إزالة مؤشر الكتابة
            typingIndicator.remove();

            // إضافة رد البوت
            const botMsg = createMessageElement(response, false);
            chatMessages.appendChild(botMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // تفعيل تمييز الكود
            document.querySelectorAll('.code-block code').forEach((block) => {
                hljs.highlightElement(block);
            });

        } catch (error) {
            typingIndicator.remove();
            
            // عرض رسالة الخطأ
            const errorMsg = createMessageElement(
                `❌ خطأ: ${error.message}`,
                false
            );
            chatMessages.appendChild(errorMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            console.error('خطأ في المحادثة:', error);
        }

        // إعادة تفعيل الإدخال
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }

    // ============================================================
    // 3. أحداث الواجهة
    // ============================================================
    // زر الإرسال
    sendBtn.addEventListener('click', sendMessage);

    // إدخال النص (Ctrl+Enter للإرسال)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            sendMessage();
        }
        // Shift+Enter لإضافة سطر جديد
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const start = userInput.selectionStart;
            const end = userInput.selectionEnd;
            userInput.value = userInput.value.substring(0, start) + '\n' + userInput.value.substring(end);
            userInput.selectionStart = userInput.selectionEnd = start + 1;
            updateCharCount();
        }
    });

    // تغيير وضع البوت
    botMode.addEventListener('change', () => {
        chatManager.setMode(botMode.value);
    });

    // تحديث عدد الأحرف
    function updateCharCount() {
        const count = userInput.value.length;
        charCount.textContent = count > 0 ? `${count}` : '0';
    }
    userInput.addEventListener('input', updateCharCount);

    // ============================================================
    // 4. معالج إعادة المحاولة (Regenerate)
    // ============================================================
    document.addEventListener('regenerate', async (e) => {
        const { messageId } = e.detail;
        // العثور على آخر رسالة للمستخدم
        const messages = chatMessages.querySelectorAll('.message');
        let lastUserMessage = null;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].classList.contains('user-message')) {
                lastUserMessage = messages[i];
                break;
            }
        }

        if (!lastUserMessage) return;

        // حذف جميع رسائل البوت بعد آخر رسالة مستخدم
        const botMessages = chatMessages.querySelectorAll('.bot-message');
        for (const msg of botMessages) {
            if (msg.compareDocumentPosition(lastUserMessage) & Node.DOCUMENT_POSITION_FOLLOWING) {
                msg.remove();
            }
        }

        // إعادة إرسال آخر رسالة
        const userText = lastUserMessage.querySelector('.message-content').textContent;
        userInput.value = userText;
        await sendMessage();
    });

    // ============================================================
    // 5. استعادة تاريخ المحادثة
    // ============================================================
    function loadChatHistory() {
        const history = chatManager.getHistory();
        // عرض آخر 20 رسالة فقط
        const recent = history.slice(-20);
        for (const entry of recent) {
            const isUser = entry.role === 'user';
            const msg = createMessageElement(entry.content, isUser);
            chatMessages.appendChild(msg);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ============================================================
    // 6. تهيئة وضع البوت
    // ============================================================
    const savedMode = localStorage.getItem('forga_bot_mode');
    if (savedMode) {
        botMode.value = savedMode;
        chatManager.setMode(savedMode);
    }
    botMode.addEventListener('change', () => {
        localStorage.setItem('forga_bot_mode', botMode.value);
    });

    // ============================================================
    // 7. بدء التطبيق
    // ============================================================
    loadChatHistory();
    userInput.focus();

    // ============================================================
    // 8. معالج حدث Enter (إرسال بالضغط على Enter فقط)
    // ============================================================
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    console.log('🚀 Forga AI جاهز للعمل!');
});
