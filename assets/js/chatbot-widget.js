/**
 * STEMulus Chatbot Widget v2.0
 * Stateful, flow-based conversation engine with context awareness
 */

const ChatbotWidget = (function() {
    'use strict';

    // ==========================================
    // 🧠 CONVERSATION BRAIN (FLOWS)
    // ==========================================
    const flows = {
        // Entry Point
        initial: {
            message: "Hi there! 👋 I'm the STEMulus Assistant.\n\nI can help you find the perfect coding course for your child. What would you like to do?",
            options: [
                { text: "🚀 Find a Course", next: "ask_age" },
                { text: "💰 See Pricing", next: "pricing_intro" },
                { text: "📍 Location/Online", next: "location_info" },
                { text: "👤 Chat with Human", next: "human_handoff" }
            ]
        },

        // --- Program Finder Flow ---
        ask_age: {
            message: "Awesome! To recommend the best program, I need to know their age. How old is your child?",
            options: [
                { text: "5-9 Years", action: "set_age_young", next: "recommend_young" },
                { text: "10-13 Years", action: "set_age_mid", next: "recommend_mid" },
                { text: "14-17 Years", action: "set_age_teen", next: "recommend_teen" }
            ]
        },

        recommend_young: {
            message: "For ages 5-9, we recommend our **Pathfinders** track! 🌟\n\nThey'll start with **Scratch Block Coding** to build games and animations without typing code. It's super fun!",
            options: [
                { text: "View Details", url: "programs.html#pathfinders" },
                { text: "What's the price?", next: "price_young" },
                { text: "Start Over", next: "initial" }
            ]
        },

        recommend_mid: {
            message: "Perfect age for our **Adventurers** track! 🚀\n\nThey can learn **Python Game Development**, **Web Design**, or **Robotics**. Do they like building things or playing games?",
            options: [
                { text: "Building (Robotics)", next: "info_robotics" },
                { text: "Games (Python)", next: "info_python" },
                { text: "Websites", next: "info_web" }
            ]
        },

        recommend_teen: {
            message: "For teens (14+), we have the **Innovators** track! 💡\n\nThis is pro-level stuff: **Data Science**, **AI**, or **Advanced Web Dev**. Great for university prep!",
            options: [
                { text: "Tell me more about AI", next: "info_ai" },
                { text: "See Pricing", next: "price_teen" },
                { text: "Back to Menu", next: "initial" }
            ]
        },

        // --- Info Snippets ---
        info_robotics: {
            message: " Our **Arduino Robotics** course combines coding with hardware. They'll build real circuits and smart devices! Kits are included. 🤖",
            options: [
                { text: "How much?", next: "price_mid" },
                { text: "Enroll Now", url: "enroll.html?program=robotics" }
            ]
        },
        info_python: {
            message: "🐍 **Python** is a professional language used by Google and NASA! We teach it through building real video games. It's our most popular course.",
            options: [
                { text: "See Pricing", next: "price_mid" },
                { text: "Enroll Now", url: "enroll.html?program=python" }
            ]
        },
        info_web: {
            message: "🌐 They'll learn HTML, CSS, and JavaScript to build real responsive websites. Great for creativity and logic!",
            options: [
                { text: "See Pricing", next: "price_mid" },
                { text: "Enroll Now", url: "enroll.html?program=web" }
            ]
        },
        info_ai: {
            message: "🤖 Our AI course teaches Machine Learning concepts using Python. Students build projects that can recognize images and predict data.",
            options: [
                { text: "See Pricing", next: "price_teen" },
                { text: "Enroll Now", url: "enroll.html?program=ai" }
            ]
        },

        // --- Pricing Flow ---
        pricing_intro: {
            message: "Our pricing depends slightly on the age group/level. Which one are you interested in?",
            options: [
                { text: "Ages 5-9", next: "price_young" },
                { text: "Ages 10-13", next: "price_mid" },
                { text: "Ages 14+", next: "price_teen" }
            ]
        },
        price_young: {
            message: "💰 **Pathfinders (5-9)**: ₦45,000 per month.\n\nIncludes 4 weekends of classes, access to our platform, and a certificate!",
            options: [
                { text: "Do you have discounts?", next: "discounts" },
                { text: "I'm ready to enroll", url: "enroll.html" }
            ]
        },
        price_mid: {
            message: "💰 **Adventurers (10-13)**: ₦55,000 per month.\n\nIncludes project reviews, mentorship, and all software tools.",
            options: [
                { text: "Any discounts?", next: "discounts" },
                { text: "Enroll Now", url: "enroll.html" }
            ]
        },
        price_teen: {
            message: "💰 **Innovators (14+)**: ₦65,000 per month.\n\nAdvanced curriculum with professional portfolio building.",
            options: [
                { text: "Any discounts?", next: "discounts" },
                { text: "Enroll Now", url: "enroll.html" }
            ]
        },
        discounts: {
            message: "🎁 **Yes!**\n• **Sibling Discount**: 15% off for the second child.\n• **Term Payment**: Pay for 3 months at once and save 10%!",
            options: [
                { text: "That sounds great!", next: "initial" },
                { text: "Enroll Now", url: "enroll.html" }
            ]
        },

        // --- Logistics ---
        location_info: {
            message: "💻 currently, all our classes are **100% Online via Zoom**.\n\nWe use screen sharing and remote control to help kids exactly as if we were there!",
            options: [
                { text: "Do they need a laptop?", next: "equipment" },
                { text: "Back to Menu", next: "initial" }
            ]
        },
        equipment: {
            message: "Yes, they'll need:\n1. A Laptop/Desktop (Windows or Mac)\n2. Stable Internet\n3. A Mouse (easier for coding)",
            options: [
                { text: "Got it, thanks!", next: "initial" }
            ]
        },
        
        // --- Handoff ---
        human_handoff: {
            message: "I'll connect you with our team on WhatsApp! Click below to chat with a real human. 👇",
            options: [
                { text: "💬 Open WhatsApp", url: "https://wa.me/2347052466716?text=Hi%20STEMulus!%20I%20have%20a%20question..." },
                { text: "Nevermind", next: "initial" }
            ]
        },

        // --- Fallback ---
        fallback: {
            message: "I'm not sure I understood that. 😅\n\nI'm best at answering questions with the buttons below, but you can also Ask for a Human.",
            options: [
                { text: "Back to Start", next: "initial" },
                { text: "Chat with Human", next: "human_handoff" }
            ]
        }
    };

    // ==========================================
    // ⚙️ ENGINE & STATE
    // ==========================================
    let state = {
        currentNode: 'initial',
        history: [],
        userData: {}
    };

    let isOpen = false;

    // Inject CSS
    const chatStyles = `
        .chatbot-widget {
            position: fixed; bottom: 104px; right: 24px; z-index: 9997;
            font-family: 'Inter', sans-serif;
            display: flex; flex-direction: column; align-items: flex-end;
            pointer-events: none; /* Let clicks pass through when closed */
        }
        .chatbot-widget > * { pointer-events: auto; }

        .chatbot-trigger {
            width: 60px; height: 60px; border-radius: 50%;
            background: linear-gradient(135deg, #1A237E 0%, #4F46E5 100%);
            border: none; cursor: pointer;
            box-shadow: 0 8px 24px rgba(26, 35, 126, 0.3);
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease;
            color: white;
            transform: scale(1) rotate(0deg) !important; /* Force reset */
            z-index: 10000; /* Ensure on top */
        }
        .chatbot-trigger:hover { 
            transform: scale(1.1) rotate(-5deg) !important; 
        }
        .chatbot-trigger:active { 
            transform: scale(0.95) rotate(-5deg) !important; 
        }
        
        .chatbot-trigger .close-icon { display: none; }
        
        /* Open State */
        .chatbot-widget.open .chatbot-trigger { 
            transform: scale(1) rotate(90deg) !important; 
            background: #374151; 
        }
        .chatbot-widget.open .chatbot-trigger:hover { 
            transform: scale(1.1) rotate(85deg) !important; /* Slight wiggle on open hover */ 
        }
        .chatbot-widget.open .chatbot-trigger:active { 
            transform: scale(0.95) rotate(90deg) !important; 
        }

        .chatbot-widget.open .chatbot-trigger .chat-icon { display: none; }
        .chatbot-widget.open .chatbot-trigger .close-icon { display: block; }

        .chatbot-window {
            position: absolute; bottom: 80px; right: 0;
            width: 350px; height: 500px;
            background: white; border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
            display: flex; flex-direction: column; overflow: hidden;
            transform-origin: bottom right;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            opacity: 0; transform: scale(0.9) translateY(20px);
            visibility: hidden;
        }
        .chatbot-widget.open .chatbot-window {
            opacity: 1; transform: scale(1) translateY(0); visibility: visible;
        }
        .dark .chatbot-window { background: #1f2937; border: 1px solid #374151; }

        .chatbot-header {
            background: linear-gradient(135deg, #1A237E 0%, #4F46E5 100%);
            padding: 20px; color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .chatbot-messages {
            flex: 1; overflow-y: auto; padding: 20px;
            display: flex; flex-direction: column; gap: 16px;
            scroll-behavior: smooth;
        }
        
        .chat-message {
            max-width: 85%; padding: 12px 16px; border-radius: 18px;
            font-size: 14px; line-height: 1.5;
            position: relative; animation: msg-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes msg-pop { from { opacity: 0; transform: translateY(10px) scale(0.95); } }

        .chat-message.bot {
             background: #f3f4f6; color: #1f2937; border-bottom-left-radius: 4px;
             margin-right: auto;
        }
        .dark .chat-message.bot { background: #374151; color: #f3f4f6; }

        .chat-message.user {
            background: linear-gradient(135deg, #FF6D00 0%, #FF8F00 100%);
            color: white; border-bottom-right-radius: 4px;
            margin-left: auto; text-align: right;
        }

        /* Option Chips */
        .chat-options {
            display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
        }
        .chat-option-btn {
            background: white; border: 1px solid #e5e7eb;
            color: #4b5563; padding: 8px 14px;
            border-radius: 20px; font-size: 13px; font-weight: 500;
            cursor: pointer; transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            text-decoration: none; display: inline-block;
        }
        .chat-option-btn:hover {
            background: #FF6D00; color: white; border-color: #FF6D00;
            transform: translateY(-1px); box-shadow: 0 4px 8px rgba(255,109,0,0.2);
        }
        .dark .chat-option-btn {
            background: #374151; border-color: #4b5563; color: #e5e7eb;
        }
        .dark .chat-option-btn:hover { background: #FF6D00; border-color: #FF6D00; color: white; }

        /* Input Area */
        .chatbot-input {
            padding: 16px; border-top: 1px solid #f3f4f6;
            display: flex; gap: 10px; background: white;
        }
        .dark .chatbot-input { background: #1f2937; border-top: 1px solid #374151; }

        .chatbot-input input {
            flex: 1; padding: 10px 16px; border-radius: 20px;
            border: 1px solid #e5e7eb; outline: none; transition: 0.2s;
            font-size: 14px;
        }
        .dark .chatbot-input input { background: #111827; border-color: #374151; color: white; }
        .chatbot-input input:focus { border-color: #4F46E5; }

        .chatbot-send-btn {
            width: 40px; height: 40px; border-radius: 50%;
            background: #f3f4f6; border: none; color: #6b7280;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: 0.2s;
        }
        .chatbot-send-btn:hover { background: #4F46E5; color: white; }
        .chatbot-send-btn svg { width: 18px; height: 18px; }

        /* Typing Dot Animation */
        .typing { display: inline-flex; gap: 4px; padding: 12px 16px; background: #f3f4f6; border-radius: 18px; border-bottom-left-radius: 4px; margin-bottom: 10px; }
        .typing span { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; animation: type 1.4s infinite ease-in-out both; }
        .typing span:nth-child(1) { animation-delay: -0.32s; }
        .typing span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes type { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        
        @media (max-width: 480px) {
            .chatbot-widget { bottom: 0; right: 0; width: 100%; height: 0; z-index: 10000; }
            .chatbot-window { width: 100%; height: 80vh; bottom: 0; border-radius: 24px 24px 0 0; }
            .chatbot-trigger { position: fixed; bottom: 90px; right: 20px; }
        }
    `;

    function injectStyles() {
        if (!document.getElementById('bot-css')) {
            const s = document.createElement('style');
            s.id = 'bot-css';
            s.textContent = chatStyles;
            document.head.appendChild(s);
        }
    }

    // ==========================================
    // 🛠️ RENDER & LOGIC
    // ==========================================
    function createWidgetHTML() {
        // Prevent duplicate creation
        if (document.querySelector('.chatbot-widget')) return;

        const div = document.createElement('div');
        div.className = 'chatbot-widget';
        div.innerHTML = `
            <div class="chatbot-window">
                <div class="chatbot-header">
                    <h3 style="margin:0; font-size:1.1rem">🤖 STEMulus Assistant</h3>
                    <p style="margin:4px 0 0; opacity:0.9; font-size:0.85rem">Online • Usually replies instantly</p>
                </div>
                <div class="chatbot-messages" id="bot-messages"></div>
                <div class="chatbot-input">
                    <input type="text" id="bot-input" placeholder="Type a message..." aria-label="Message">
                    <button class="chatbot-send-btn" id="bot-send">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
            <button class="chatbot-trigger">
                <svg class="chat-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <svg class="close-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        document.body.appendChild(div);

        // Bind Events
        const trigger = div.querySelector('.chatbot-trigger');
        trigger.addEventListener('click', toggleChat);
        
        const input = div.querySelector('#bot-input');
        const sendBtn = div.querySelector('#bot-send');

        function send() {
            const val = input.value.trim();
            if (val) handleInput(val);
            input.value = '';
        }
        
        sendBtn.addEventListener('click', send);
        input.addEventListener('keypress', e => e.key === 'Enter' && send());
    }

    function toggleChat() {
        const widget = document.querySelector('.chatbot-widget');
        isOpen = !isOpen;
        widget.classList.toggle('open', isOpen);
        
        // Start conversation if empty
        const msgs = document.getElementById('bot-messages');
        if (isOpen && msgs.children.length === 0) {
            goToNode('initial');
        }
    }

    // Logic: Process Node
    function goToNode(nodeName) {
        state.currentNode = nodeName;
        const node = flows[nodeName] || flows.fallback;
        
        showTyping();
        
        // Simulate reading time (min 600ms, max 2s)
        const delay = Math.min(Math.max(node.message.length * 20, 600), 2000);
        
        setTimeout(() => {
            removeTyping();
            addBotMessage(node);
        }, delay);
    }

    // Logic: Handle User Input (Click or Text)
    function handleInput(text) {
        addUserMessage(text);
        
        // Basic NLP / Keyword matching helper
        const lower = text.toLowerCase();
        
        // 1. Check for specific commands
        if (lower.includes('price') || lower.includes('cost')) return goToNode('pricing_intro');
        if (lower.includes('enroll') || lower.includes('join')) return goToNode('recommend_young'); // fallback entry
        if (lower.includes('human') || lower.includes('agent')) return goToNode('human_handoff');
        
        // 2. Default fallback
        goToNode('fallback');
    }

    // Logic: Handle Button Click
    window.handleBotAction = function(next, action, url) {
        if (url) {
            window.location.href = url;
            return;
        }
        
        if (action) {
            // Execute state side-effects
            if (action === 'set_age_young') state.userData.ageGroup = '5-9';
            if (action === 'set_age_mid') state.userData.ageGroup = '10-13';
            if (action === 'set_age_teen') state.userData.ageGroup = '14+';
        }
        
        if (next) {
            goToNode(next);
        }
    };

    // UI: Add Bot Message
    function addBotMessage(node) {
        const container = document.getElementById('bot-messages');
        const div = document.createElement('div');
        div.className = 'chat-message bot';
        
        // Convert \n to <br> and bold markdown to <b>
        let html = node.message
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        div.innerHTML = `<div>${html}</div>`;
        
        // Add Options
        if (node.options) {
            const optsDiv = document.createElement('div');
            optsDiv.className = 'chat-options';
            node.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'chat-option-btn';
                btn.textContent = opt.text;
                btn.onclick = () => {
                    addUserMessage(opt.text); // Visually echo the choice
                    window.handleBotAction(opt.next, opt.action, opt.url);
                };
                optsDiv.appendChild(btn);
            });
            div.appendChild(optsDiv);
        }

        container.appendChild(div);
        scrollToBottom();
    }

    // UI: Add User Message
    function addUserMessage(text) {
        const container = document.getElementById('bot-messages');
        const div = document.createElement('div');
        div.className = 'chat-message user';
        div.textContent = text;
        container.appendChild(div);
        scrollToBottom();
    }

    // UI: Typing Indicators
    function showTyping() {
        const container = document.getElementById('bot-messages');
        if (document.getElementById('bot-typing')) return;
        
        const div = document.createElement('div');
        div.id = 'bot-typing';
        div.className = 'typing';
        div.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(div);
        scrollToBottom();
    }

    function removeTyping() {
        const el = document.getElementById('bot-typing');
        if (el) el.remove();
    }

    function scrollToBottom() {
        const container = document.getElementById('bot-messages');
        container.scrollTop = container.scrollHeight;
    }

    // Init
    function init() {
        injectStyles();
        createWidgetHTML();
    }

    return { init };
})();

// Auto-Launch
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ChatbotWidget.init);
} else {
    ChatbotWidget.init();
}
