// DOM元素获取
const nicknameInput = document.getElementById('nickname');
const contentInput = document.getElementById('content');
const submitBtn = document.getElementById('submit-btn');
const errorTip = document.getElementById('error-tip');
const messagesList = document.getElementById('messages-list');

// 页面加载时获取所有留言
window.onload = () => {
  fetchMessages();
};

// 1. 获取所有留言并渲染
async function fetchMessages() {
  try {
    const response = await fetch('/api/messages');
    const res = await response.json();
    if (res.success && res.data.length > 0) {
      // 清空空提示，渲染留言列表
      messagesList.innerHTML = '';
      res.data.forEach(message => {
        renderMessageCard(message);
      });
    } else {
      // 显示空提示
      messagesList.innerHTML = '<div class="empty-tip">暂无留言，快来成为第一个倾诉的人吧～</div>';
    }
  } catch (error) {
    console.error('获取留言失败：', error);
    errorTip.textContent = '加载留言失败，请刷新页面重试～';
  }
}

// 2. 渲染单条留言卡片
function renderMessageCard(message) {
  const card = document.createElement('div');
  card.className = 'message-card';
  card.dataset.id = message.id;

  // 格式化时间（YYYY-MM-DD HH:MM）
  const createTime = new Date(message.create_time);
  const formattedTime = `${createTime.getFullYear()}-${String(createTime.getMonth() + 1).padStart(2, '0')}-${String(createTime.getDate()).padStart(2, '0')} ${String(createTime.getHours()).padStart(2, '0')}:${String(createTime.getMinutes()).padStart(2, '0')}`;

  card.innerHTML = `
    <div class="message-header">
      <span class="nickname">${escapeHtml(message.nickname)}</span>
      <span class="create-time">${formattedTime}</span>
    </div>
    <div class="message-content">${escapeHtml(message.content)}</div>
    <div class="like-container">
      <button class="like-btn" data-message-id="${message.id}">👍</button>
      <span class="like-count">${message.like_count || 0}</span>
    </div>
  `;

  // 添加点赞事件监听
  card.querySelector('.like-btn').addEventListener('click', handleLike);

  messagesList.appendChild(card);
}

// 3. 提交留言处理
submitBtn.addEventListener('click', async () => {
  // 前端输入校验
  const nickname = nicknameInput.value.trim();
  const content = contentInput.value.trim();

  // 清空之前的错误提示
  errorTip.textContent = '';

  // 校验规则
  if (!nickname) {
    errorTip.textContent = '请输入你的昵称～';
    return;
  }
  if (!content) {
    errorTip.textContent = '留言内容不能为空哦～';
    return;
  }

  // 禁用提交按钮，防止重复提交
  submitBtn.disabled = true;
  submitBtn.textContent = '提交中...';

  try {
    // 发送提交请求
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nickname, content }),
    });

    const res = await response.json();
    if (res.success) {
      // 提交成功：清空输入框，刷新留言列表
      nicknameInput.value = '';
      contentInput.value = '';
      errorTip.textContent = '';
      errorTip.style.color = '#48bb78';
      errorTip.textContent = '留言提交成功啦～';
      // 3秒后清空成功提示
      setTimeout(() => {
        errorTip.textContent = '';
        errorTip.style.color = '#e53e3e';
      }, 3000);
      // 重新获取留言列表
      fetchMessages();
    } else {
      errorTip.textContent = res.message || '提交失败，请重试～';
    }
  } catch (error) {
    console.error('提交留言失败：', error);
    errorTip.textContent = '网络异常，提交失败，请重试～';
  } finally {
    // 恢复提交按钮
    submitBtn.disabled = false;
    submitBtn.textContent = '提交留言';
  }
});

// 4. 点赞功能处理
async function handleLike(e) {
  const btn = e.target;
  const messageId = btn.dataset.messageId;
  const likeCountEl = btn.nextElementSibling;

  // 禁用点赞按钮，防止重复点击
  btn.disabled = true;

  try {
    const response = await fetch('/api/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId }),
    });

    const res = await response.json();
    if (res.success) {
      // 更新点赞数
      likeCountEl.textContent = res.newLikeCount;
    } else {
      alert('点赞失败，请重试～');
    }
  } catch (error) {
    console.error('点赞失败：', error);
    alert('网络异常，点赞失败～');
  } finally {
    // 1秒后恢复点赞按钮（防止短时间重复点击）
    setTimeout(() => {
      btn.disabled = false;
    }, 1000);
  }
}

// 辅助函数：HTML转义（防止XSS攻击）
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}