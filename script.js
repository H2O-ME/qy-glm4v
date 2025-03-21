document.addEventListener('DOMContentLoaded', function() {
    // 添加自定义头像样式 - 放在函数最开始部分
    const avatarStyle = document.createElement('style');
    avatarStyle.textContent = `
        /* 替换所有头像为指定图片 */
        .logo-icon {
            background-image: url('http://chat.ccccocccc.cc/favicon.png') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            border-radius: 50% !important;
        }
        
        /* 移除伪元素中的圆圈 */
        .logo-icon::before {
            display: none !important;
        }
        
        /* 用户头像也使用相同图片 */
        .user-avatar .logo-icon {
            background-image: url('http://chat.ccccocccc.cc/favicon.png') !important;
        }
        
        /* 机器人头像也使用相同图片 */
        .bot-avatar .logo-icon {
            background-image: url('http://chat.ccccocccc.cc/favicon.png') !important;
        }
        
        /* 欢迎页机器人图标也替换 */
        .welcome-icon i {
            display: none;
        }
        
        .welcome-icon::before {
            content: "";
            display: block;
            width: 50px;
            height: 50px;
            background-image: url('http://chat.ccccocccc.cc/favicon.png');
            background-size: cover;
            background-position: center;
            border-radius: 50%;
        }
    `;
    document.head.appendChild(avatarStyle);
    
    // 获取DOM元素
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const newChatButton = document.getElementById('new-chat');
    const themeToggle = document.getElementById('theme-toggle');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const closeSidebarButton = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    
    // 上传的图片的base64数据
    let currentImageData = null;
    
    // 全局加载状态
    let isLoading = false;
    
    // 会话历史
    let chatHistory = [];
    
    // API密钥相关变量 - 确保在所有使用之前声明
    let decryptedApiKey = null;
    
    // 初始化页面
    initializePage();
    
    // =================== 页面初始化和基础功能 ===================
    
    function initializePage() {
        // 设置当前日期
        setCurrentDate();
        
        // 检查并应用用户的主题偏好
        applyUserTheme();
        
        // 初始化事件监听器
        initEventListeners();
        
        // 确保语法高亮库已加载
    ensureHighlightJsLoaded();
    
    // 配置marked.js以支持语法高亮
        configureMarked();
        
        // 添加动画效果
        addEntranceAnimations();
    }
    
    function setCurrentDate() {
        const currentDateElem = document.getElementById('current-date');
        if (currentDateElem) {
            const now = new Date();
            currentDateElem.textContent = now.toLocaleDateString('zh-CN');
        }
    }
    
    function initEventListeners() {
        // 发送消息相关事件
        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('keydown', handleInputKeydown);
        userInput.addEventListener('input', adjustTextareaHeight);
        
        // 图片上传相关事件
        imageUpload.addEventListener('change', handleImageUpload);
        
        // 主题切换事件
        themeToggle.addEventListener('click', toggleTheme);
        
        // 清除对话相关事件
        newChatButton.addEventListener('click', createNewChat);
        
        // 移动设备侧边栏交互
        mobileMenuToggle.addEventListener('click', openSidebar);
        closeSidebarButton.addEventListener('click', closeSidebar);
        
        // 添加开始对话按钮事件
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', function() {
                // 聚焦到输入框
                userInput.focus();
                
                // 滚动到输入区域
                const inputArea = document.querySelector('.chat-input-area');
                inputArea.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }
    
    // =================== 核心功能实现 ===================
    
    // 处理发送消息
    async function sendMessage() {
        const message = userInput.value.trim();
        if ((!message && !currentImageData) || isLoading) return;
        
        // 确保已经获取了API密钥
        if (!await getDecryptedApiKey()) {
            return;
        }
        
        setLoadingState(true);
        
        // 添加用户消息到聊天容器
        addUserMessage(message, currentImageData);
        
        // 清空输入框并重置高度
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // 保存当前图片数据并清除上传控件
        const tempImageData = currentImageData;
        clearImageUpload();
        
        // 添加机器人正在输入指示器
        const botMessageElement = addBotTypingIndicator();
        
        try {
            // 调用API获取回复
            await fetchVisionAPIResponse(message, tempImageData, botMessageElement);
        } catch (error) {
            console.error("消息发送错误:", error);
            updateBotMessage(botMessageElement, `抱歉，发生了错误：${error.message}`);
        } finally {
            setLoadingState(false);
        }
    }
    
    // 设置加载状态
    function setLoadingState(loading) {
        isLoading = loading;
        sendButton.disabled = loading;
        
        if (loading) {
            sendButton.innerHTML = '<i class="ri-loader-4-line loading-icon"></i>';
        } else {
            sendButton.innerHTML = '<i class="ri-send-plane-fill"></i>';
        }
    }
    
    // 添加用户消息
    function addUserMessage(message, imageData) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-container', 'user-container');
        
        let messageContent = message;
        
        // 如果有图片，添加带样式的图片内容
        if (imageData) {
            messageContent = `
                <div class="image-content">
                    <div class="image-title">
                        <span>上传的图片</span>
                        <span class="image-info">图像分析</span>
                    </div>
                    <img src="${imageData}" alt="用户上传的图片">
                </div>
                ${message}
            `;
        }
        
        messageElement.innerHTML = `
            <div class="message user-message">
                ${messageContent}
            </div>
            <div class="avatar user-avatar">
                <div class="logo-icon"></div>
            </div>
        `;
        
        // 删除欢迎卡片
        const welcomeCard = document.querySelector('.welcome-card');
        if (welcomeCard) {
            welcomeCard.remove();
        }
        
        chatContainer.appendChild(messageElement);
        scrollToBottom();
        
        // 保存到聊天历史
        chatHistory.push({
            role: 'user',
            content: message,
            image: imageData
        });
    }
    
    // 添加机器人输入指示器
    function addBotTypingIndicator() {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-container', 'bot-container');
        messageElement.innerHTML = `
            <div class="avatar bot-avatar">
                <div class="logo-icon"></div>
            </div>
            <div class="message bot-message">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatContainer.appendChild(messageElement);
        scrollToBottom();
        
        return messageElement.querySelector('.bot-message');
    }
    
    // 更新机器人消息
    function updateBotMessage(element, content) {
        // 检查内容是否为空
        if (!content || content.trim() === '') {
            content = '抱歉，我暂时无法回答这个问题。';
        }
        
        try {
            element.innerHTML = marked.parse(content);
            
            // 应用语法高亮
            if (window.hljs) {
                element.querySelectorAll('pre code').forEach((block) => {
                    try {
                        window.hljs.highlightBlock(block);
                    } catch (e) {
                        console.warn("代码块高亮失败:", e);
                    }
                });
            }
            
            // 为代码块添加复制按钮
            addCopyButtonsToCodeBlocks(element);
        } catch (error) {
            console.error("解析回复内容错误:", error);
            element.textContent = content; // 直接显示文本内容
        }
        
        // 保存到聊天历史
        chatHistory.push({
            role: 'assistant',
            content: content
        });
        
        scrollToBottom();
    }
    
    // 为代码块添加复制按钮
    function addCopyButtonsToCodeBlocks(element) {
        const codeBlocks = element.querySelectorAll('pre code');
        
        codeBlocks.forEach((codeBlock, index) => {
            const pre = codeBlock.parentNode;
            
            // 创建复制按钮
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-button';
            copyButton.innerHTML = '<i class="ri-file-copy-line"></i>';
            copyButton.title = '复制代码';
            copyButton.setAttribute('data-index', index);
            
            // 添加点击事件
            copyButton.addEventListener('click', function() {
                const code = codeBlock.textContent;
                navigator.clipboard.writeText(code).then(
                    function() {
                        // 复制成功
                        copyButton.innerHTML = '<i class="ri-check-line"></i>';
                        setTimeout(() => {
                            copyButton.innerHTML = '<i class="ri-file-copy-line"></i>';
                        }, 2000);
                    },
                    function() {
                        // 复制失败
                        copyButton.innerHTML = '<i class="ri-close-line"></i>';
                        setTimeout(() => {
                            copyButton.innerHTML = '<i class="ri-file-copy-line"></i>';
                        }, 2000);
                    }
                );
            });
            
            // 在代码块前添加按钮
            pre.classList.add('code-block-wrapper');
            pre.insertBefore(copyButton, codeBlock);
        });
    }
    
    // 处理图片上传
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            // 检查文件大小限制
            if (file.size > 10 * 1024 * 1024) {
                alert('图片大小不能超过10MB');
                return;
            }
            
            // 显示上传进度条
            imagePreviewContainer.innerHTML = `
                <div class="image-preview">
                    <div class="upload-progress">
                        <div class="upload-progress-bar" style="width: 10%"></div>
                    </div>
                </div>
            `;
            imagePreviewContainer.classList.add('active');
            
            // 模拟上传进度
            let progress = 10;
            const progressInterval = setInterval(() => {
                progress += 10;
                const progressBar = imagePreviewContainer.querySelector('.upload-progress-bar');
                if (progressBar) {
                    progressBar.style.width = `${Math.min(progress, 90)}%`;
                }
                if (progress >= 90) clearInterval(progressInterval);
            }, 100);
            
            const reader = new FileReader();
            reader.onload = function(event) {
                clearInterval(progressInterval);
                
                const imageData = event.target.result;
                currentImageData = imageData;
                
                // 获取文件大小
                const fileSize = formatFileSize(file.size);
                
                // 更新预览显示 - 使用简化的标记
                imagePreviewContainer.innerHTML = `
                    <div class="image-preview">
                        <div class="image-preview-header">
                            <div class="image-preview-title">预览图片</div>
                        </div>
                        <div class="image-preview-body">
                            <img src="${imageData}" alt="上传的图片">
                            <div class="delete-image" id="delete-image" title="删除图片">×</div>
                        </div>
                        <div class="image-preview-footer">
                            <div class="image-filename">${file.name}</div>
                            <div class="image-size">${fileSize}</div>
                        </div>
                    </div>
                `;
                
                // 删除图片功能
                document.getElementById('delete-image').addEventListener('click', function() {
                    currentImageData = null;
                    imagePreviewContainer.innerHTML = '';
                    imagePreviewContainer.classList.remove('active');
                    imageUpload.value = '';
                });
            };
            
            // 错误处理简化
            reader.onerror = function() {
                clearInterval(progressInterval);
                alert('读取图片时发生错误');
                imageUpload.value = '';
                imagePreviewContainer.innerHTML = '';
                imagePreviewContainer.classList.remove('active');
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    // 格式化文件大小的辅助函数
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    }
    
    // 清除上传的图片
    function clearImageUpload() {
        currentImageData = null;
        imagePreviewContainer.innerHTML = '';
        imagePreviewContainer.classList.remove('active');
        imageUpload.value = '';
    }
    
    // 创建新对话
    function createNewChat() {
        showConfirmation('确定要开始新对话吗？当前对话内容将会清空。', function() {
            chatContainer.innerHTML = `
                <div class="welcome-card">
                    <div class="welcome-icon">
                        <i class="ri-robot-fill"></i>
                    </div>
                    <h2>欢迎使用清言</h2>
                    <p>这是一个基于GLM-4V模型的AI多模态聊天应用，您可以:</p>
                    
                    <div class="features-grid">
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="ri-image-add-line"></i>
                            </div>
                            <div class="feature-text">上传图片并提问</div>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="ri-chat-1-line"></i>
                            </div>
                            <div class="feature-text">文字对话交流</div>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="ri-code-line"></i>
                            </div>
                            <div class="feature-text">代码语法高亮</div>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="ri-moon-line"></i>
                            </div>
                            <div class="feature-text">暗色主题支持</div>
                        </div>
                    </div>
                    
                    <div class="welcome-tips">
                        <i class="ri-lightbulb-flash-line"></i>
                        <span>提示：点击下方图片按钮上传图片，或直接在输入框中提问</span>
                    </div>
                </div>
            `;
            
            // 清除聊天历史
            chatHistory = [];
            
            // 清除当前图片
            clearImageUpload();
            
            // 返回顶部
            chatContainer.scrollTop = 0;
            
            // 关闭移动设备侧边栏
            closeSidebar();
            
            showNotification('已创建新对话', 'success');
        });
    }
    
    // 清空上下文
    function clearContext() {
        showConfirmation('确定要清空当前上下文吗？这将保留对话显示但开始一个新的上下文。', function() {
            // 保留UI但清除历史记录
            chatHistory = [];
            showNotification('上下文已清空', 'success');
        });
    }
    
    // 调整textarea高度
    function adjustTextareaHeight() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    }
    
    // 处理输入框键盘事件
    function handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    // 移动设备侧边栏操作
    function openSidebar() {
        sidebar.classList.add('active');
    }
    
    function closeSidebar() {
        sidebar.classList.remove('active');
    }
    
    // 主题切换
    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        
        // 保存用户主题偏好到本地存储
        const isDarkMode = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        
        const icon = this.querySelector('i');
        if (icon.classList.contains('ri-sun-line')) {
            icon.classList.remove('ri-sun-line');
            icon.classList.add('ri-moon-line');
        } else {
            icon.classList.remove('ri-moon-line');
            icon.classList.add('ri-sun-line');
        }
    }
    
    // 应用保存的主题设置
    function applyUserTheme() {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'enabled') {
            document.body.classList.add('dark-theme');
            const icon = themeToggle.querySelector('i');
            icon.classList.remove('ri-sun-line');
            icon.classList.add('ri-moon-line');
        }
    }
    
    // 滚动到底部
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // =================== 工具函数 ===================
    
    // 确保highlight.js加载
    function ensureHighlightJsLoaded() {
        if (!window.hljs) {
            console.warn("highlight.js 未加载，尝试动态加载...");
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/lib/highlight.min.js";
            document.head.appendChild(script);
            
            return new Promise((resolve) => {
                script.onload = () => {
                    console.log("highlight.js 已成功加载");
                    resolve();
                };
                script.onerror = () => {
                    console.error("highlight.js 加载失败");
                    resolve(); // 即使失败也继续
                };
            });
        }
        return Promise.resolve();
    }
    
    // 配置marked.js
    function configureMarked() {
        marked.setOptions({
            highlight: function(code, lang) {
                try {
                    if (lang && window.hljs && window.hljs.getLanguage(lang)) {
                        return window.hljs.highlight(code, { language: lang }).value;
                    } else if (window.hljs) {
                        return window.hljs.highlightAuto(code).value;
                    }
                } catch (e) {
                    console.error("代码高亮出错:", e);
                }
                return code;
            },
            breaks: true
        });
    }
    
    // 显示通知
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'information-line';
        if (type === 'success') icon = 'check-line';
        if (type === 'error') icon = 'error-warning-line';
        
        notification.innerHTML = `
            <i class="ri-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // 添加显示类
        setTimeout(() => notification.classList.add('show'), 10);
        
        // 自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // 显示确认对话框
    function showConfirmation(message, onConfirm) {
        const confirmationOverlay = document.createElement('div');
        confirmationOverlay.className = 'modal-overlay';
        
        const confirmationModal = document.createElement('div');
        confirmationModal.className = 'modal-container confirmation-modal';
        
        confirmationModal.innerHTML = `
            <div class="modal-header">
                <h3>确认操作</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="cancel-button">取消</button>
                <button class="confirm-button">确认</button>
            </div>
        `;
        
        confirmationOverlay.appendChild(confirmationModal);
        document.body.appendChild(confirmationOverlay);
        
        // 设置按钮事件
        confirmationModal.querySelector('.cancel-button').addEventListener('click', function() {
            document.body.removeChild(confirmationOverlay);
        });
        
        confirmationModal.querySelector('.confirm-button').addEventListener('click', function() {
            onConfirm();
            document.body.removeChild(confirmationOverlay);
        });
    }
    
    // =================== API 请求处理 ===================
    
    // 使用CryptoJS加密API密钥
    function decryptApiKey(encryptedKey, password) {
        try {
            // 使用CryptoJS进行AES解密
            const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            
            // 打印出解密后的部分内容，便于调试
            if (decrypted) {
                console.log("解密成功，API密钥前缀: " + decrypted.substring(0, 3) + "..." + 
                           (decrypted.length > 10 ? decrypted.substring(decrypted.length - 3) : ""));
            } else {
                console.log("解密失败，结果为空");
            }
            
            return decrypted;
        } catch (error) {
            console.error("解密错误:", error);
            return "";
        }
    }
    
    // 获取解密的API密钥
    async function getDecryptedApiKey() {
        // 如果已经解密过，直接返回
        if (decryptedApiKey) {
            return decryptedApiKey;
        }
        
        // 创建密码输入对话框
        return new Promise((resolve) => {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';
            
            const modalContent = `
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>需要访问授权</h3>
                    </div>
                    <div class="modal-body">
                        <p>请输入授权密码以访问清言AI服务</p>
                        <p class="password-hint">提示：请向管理员获取授权密码</p>
                        <input type="password" class="password-input" id="api-password" placeholder="输入授权密码">
                        <div class="auth-toggle">
                            <label>
                                <input type="checkbox" id="manual-api-toggle"> 手动输入API密钥
                            </label>
                        </div>
                        <div id="manual-api-input" style="display:none; margin-top:10px;">
                            <input type="text" class="password-input" id="manual-api-key" placeholder="输入API密钥">
                        </div>
                        <div class="error-message" id="password-error" style="display: none;">
                            <i class="ri-error-warning-line"></i> 
                            <span>密码错误，请重试</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="decrypt-button" id="decrypt-button">确认</button>
                    </div>
                </div>
            `;
            
            modalOverlay.innerHTML = modalContent;
            document.body.appendChild(modalOverlay);
            
            // 确保模态框显示动画
            setTimeout(() => {
                document.getElementById('api-password').focus();
            }, 100);
            
            // 加密的API密钥 - 假设是智谱API密钥格式
            const encryptedApiKey = "U2FsdGVkX1/7gqRQIGh6xSHdPj06YmsJhK9FrfN6hKEGUx1h7B+psBxjbDaZAZxz" +
                                    "2z8CCTdyOufgQ4veDVmQ4SKSFCfa1EeppeNauzeyuMA=";
            
            // 添加解密按钮事件
            document.getElementById('decrypt-button').addEventListener('click', function() {
                attemptDecryption();
            });
            
            // 添加回车键事件
            document.getElementById('api-password').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    attemptDecryption();
                }
            });
            
            // 添加手动输入切换事件
            document.getElementById('manual-api-toggle').addEventListener('change', function() {
                const manualInput = document.getElementById('manual-api-input');
                manualInput.style.display = this.checked ? 'block' : 'none';
            });
            
            function attemptDecryption() {
                // 检查是否手动输入模式
                const manualToggle = document.getElementById('manual-api-toggle');
                
                if (manualToggle.checked) {
                    const apiKey = document.getElementById('manual-api-key').value.trim();
                    if (apiKey) {
                        decryptedApiKey = apiKey;
                        document.body.removeChild(modalOverlay);
                        resolve(apiKey);
                    } else {
                        showPasswordError("请输入API密钥");
                    }
                } else {
                    const passwordInput = document.getElementById('api-password');
                    const password = passwordInput.value.trim();
                    
                    if (!password) {
                        showPasswordError();
                        return;
                    }
                    
                    try {
                        // 尝试解密
                        const result = decryptApiKey(encryptedApiKey, password);
                        
                        // 检查解密结果是否有效 - 智谱API密钥格式通常不是以sk-开头
                        // 只检查长度和非空
                        if (result && result.length > 10) {
                            console.log("解密成功, API密钥格式有效");
                            decryptedApiKey = result;
                            document.body.removeChild(modalOverlay);
                            resolve(result);
                        } else {
                            console.log("解密结果无效, 可能密码错误");
                            showPasswordError("密码错误或解密结果无效");
                        }
                    } catch (error) {
                        console.error("解密过程出错:", error);
                        showPasswordError("解密过程出错，请确认密码正确");
                    }
                }
            }
            
            function showPasswordError(message = "密码错误，请重试") {
                const errorElement = document.getElementById('password-error');
                errorElement.querySelector('span').textContent = message;
                errorElement.style.display = 'flex';
                const passwordInput = document.getElementById('api-password');
                passwordInput.value = '';
                passwordInput.focus();
                
                // 添加抖动动画
                passwordInput.classList.add('shake');
                setTimeout(() => {
                    passwordInput.classList.remove('shake');
                }, 500);
            }
        });
    }
    
    // 调用GLM-4V-Flash API
    async function fetchVisionAPIResponse(prompt, imageData, botMessageElement) {
        try {
            // 确保已获取API密钥
            const apiKey = await getDecryptedApiKey();
            if (!apiKey) {
                throw new Error("未能获取有效的API密钥");
        }
        
        // 构建请求消息
        let messages = [];
        
        // 如果有图片，添加多模态内容
        if (imageData) {
            // 从data URL中提取base64数据
            const base64Data = imageData.split(',')[1];
            
            messages.push({
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt || "请描述这张图片"
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Data}`
                        }
                    }
                ]
            });
        } else {
            // 仅文本消息
            messages.push({
                role: "user",
                content: prompt
            });
        }
        
        // 请求数据结构
        const requestData = {
            messages: messages,
            model: "glm-4v-flash", 
            temperature: 0.7,
            stream: true
        };

            // GLM-4V-Flash API端点
            const apiUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
            
            // 使用fetch API发送请求
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let responseText = "";

            // 接收流式响应
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                
                // 处理SSE格式的响应
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data:') && line.trim() !== 'data:') {
                        try {
                            const jsonStr = line.substring(5).trim();
                            if (jsonStr === '[DONE]') continue;
                            
                            const data = JSON.parse(jsonStr);
                            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                                // 对于GLM-4V，可能返回数组或字符串形式的内容
                                if (typeof data.choices[0].delta.content === 'string') {
                                    responseText += data.choices[0].delta.content;
                                } else if (Array.isArray(data.choices[0].delta.content)) {
                                    // 多模态返回可能是数组形式
                                    for (const item of data.choices[0].delta.content) {
                                        if (item.type === 'text') {
                                            responseText += item.text;
                                        }
                                    }
                                }
                                updateBotMessage(botMessageElement, responseText);
                            }
                        } catch (e) {
                            console.error("解析响应数据错误:", e, line);
                        }
                    }
                }
            }

            // 确保最终更新
            updateBotMessage(botMessageElement, responseText);
            
        } catch (error) {
            console.error("API请求错误:", error);
            updateBotMessage(botMessageElement, `抱歉，请求出错了。错误信息: ${error.message}`);
            showNotification('API请求失败，请检查网络连接', 'error');
        }
    }
    
    // 添加CSS样式用于通知和确认对话框
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: var(--surface-color);
            color: var(--text-primary);
            border-radius: var(--border-radius-sm);
            box-shadow: 0 4px 12px var(--shadow-color);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            transform: translateY(-20px);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification i {
            font-size: 20px;
        }
        
        .notification.success {
            border-left: 4px solid #28a745;
        }
        
        .notification.success i {
            color: #28a745;
        }
        
        .notification.error {
            border-left: 4px solid #dc3545;
        }
        
        .notification.error i {
            color: #dc3545;
        }
        
        .notification.info {
            border-left: 4px solid var(--primary-color);
        }
        
        .notification.info i {
            color: var(--primary-color);
        }
        
        .confirmation-modal .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .confirmation-modal .cancel-button {
            background-color: var(--bg-color);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 8px 16px;
            border-radius: var(--border-radius-sm);
            transition: all var(--transition-fast) ease;
        }
        
        .confirmation-modal .cancel-button:hover {
            background-color: var(--border-color);
        }
        
        .confirmation-modal .confirm-button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: var(--border-radius-sm);
            transition: all var(--transition-fast) ease;
        }
        
        .confirmation-modal .confirm-button:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(78, 84, 200, 0.3);
        }
        
        .copy-code-button {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 30px;
            height: 30px;
            border-radius: 4px;
            background-color: rgba(255, 255, 255, 0.1);
            border: none;
            color: #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0.6;
            transition: all 0.2s ease;
        }
        
        .copy-code-button:hover {
            opacity: 1;
            background-color: rgba(255, 255, 255, 0.2);
        }
        
        .code-block-wrapper {
            position: relative;
        }
    `;
    document.head.appendChild(notificationStyles);
    
    // 添加进入动画效果
    function addEntranceAnimations() {
        const featureItems = document.querySelectorAll('.feature-item');
        
        featureItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100 + index * 150);
        });
    }
}); 