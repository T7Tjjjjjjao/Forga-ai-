// ============================================================
// Forga AI - تفاعلات الواجهة
// ============================================================

// ============================================================
// 1. إدارة Like / Dislike
// ============================================================
class FeedbackManager {
    constructor() {
        this.feedback = {};
        this._loadFeedback();
    }

    _loadFeedback() {
        try {
            const saved = localStorage.getItem('forga_feedback');
            if (saved) {
                this.feedback = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('فشل تحميل التقييمات:', e);
        }
    }

    _saveFeedback() {
        try {
            localStorage.setItem('forga_feedback', JSON.stringify(this.feedback));
        } catch (e) {
            console.warn('فشل حفظ التقييمات:', e);
        }
    }

    setLike(messageId) {
        if (this.feedback[messageId] === 'like') {
            delete this.feedback[messageId];
        } else {
            this.feedback[messageId] = 'like';
        }
        this._saveFeedback();
        return this.feedback[messageId] || null;
    }

    setDislike(messageId) {
        if (this.feedback[messageId] === 'dislike') {
            delete this.feedback[messageId];
        } else {
            this.feedback[messageId] = 'dislike';
        }
        this._saveFeedback();
        return this.feedback[messageId] || null;
    }

    getFeedback(messageId) {
        return this.feedback[messageId] || null;
    }
}

const feedbackManager = new FeedbackManager();

// ============================================================
// 2. دوال مساعدة لعناصر الواجهة
// ============================================================
function createMessageElement(content, isUser = false, messageId = null) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    div.dataset.messageId = messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (isUser) {
        const user = auth.getUser();
        if (user?.picture) {
            avatar.innerHTML = `<img src="${user.picture}" alt="User" class="avatar-small">`;
        } else {
            avatar.textContent = (user?.name || 'U')[0].toUpperCase();
            avatar.style.background = '#2d2d2d';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.color = '#888';
            avatar.style.fontWeight = '600';
        }
    } else {
        avatar.innerHTML = `<img src="assets/logo.svg" alt="Forga AI" class="avatar-small">`;
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMessage(content);
    
    // إضافة أزرار التفاعل (لرسائل البوت فقط)
    if (!isUser) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        // زر إعادة المحاولة
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'action-btn';
        regenerateBtn.innerHTML = '<i class="fas fa-redo"></i>';
        regenerateBtn.title = 'إعادة المحاولة';
        regenerateBtn.addEventListener('click', () => {
            // سيتم التعامل معها في app.js
            regenerateBtn.dispatchEvent(new CustomEvent('regenerate', { 
                detail: { messageId: div.dataset.messageId }
            }));
        });
        actions.appendChild(regenerateBtn);
        
        // زر Like
        const likeBtn = document.createElement('button');
        likeBtn.className = `action-btn ${feedbackManager.getFeedback(div.dataset.messageId) === 'like' ? 'liked' : ''}`;
        likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> <span class="count">0</span>';
        likeBtn.title = 'أعجبني';
        likeBtn.addEventListener('click', () => {
            const result = feedbackManager.setLike(div.dataset.messageId);
            likeBtn.classList.toggle('liked', result === 'like');
            const dislikeBtn = actions.querySelector('.action-btn.disliked');
            if (dislikeBtn) dislikeBtn.classList.remove('disliked');
        });
        actions.appendChild(likeBtn);
        
        // زر Dislike
        const dislikeBtn = document.createElement('button');
        dislikeBtn.className = `action-btn ${feedbackManager.getFeedback(div.dataset.messageId) === 'dislike' ? 'disliked' : ''}`;
        dislikeBtn.innerHTML = '<i class="fas fa-thumbs-down"></i> <span class="count">0</span>';
        dislikeBtn.title = 'لم يعجبني';
        dislikeBtn.addEventListener('click', () => {
            const result = feedbackManager.setDislike(div.dataset.messageId);
            dislikeBtn.classList.toggle('disliked', result === 'dislike');
            const likeBtn = actions.querySelector('.action-btn.liked');
            if (likeBtn) likeBtn.classList.remove('liked');
        });
        actions.appendChild(dislikeBtn);
        
        contentDiv.appendChild(actions);
    }
    
    div.appendChild(avatar);
    div.appendChild(contentDiv);
    
    return div;
}

// ============================================================
// 3. مؤشر الكتابة (Typing Indicator)
// ============================================================
function createTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message bot-message typing-message';
    div.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = `<img src="assets/logo.svg" alt="Forga AI" class="avatar-small">`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    
    div.appendChild(avatar);
    div.appendChild(content);
    
    return div;
}

// ============================================================
// 4. تصدير الدوال
// ============================================================
window.createMessageElement = createMessageElement;
window.createTypingIndicator = createTypingIndicator;
window.feedbackManager = feedbackManager;
