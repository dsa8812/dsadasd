const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json()); // 解析JSON请求体
app.use(express.static(path.join(__dirname, 'public'))); // 托管前端静态文件

// 1. 获取所有留言接口
app.get('/api/messages', (req, res) => {
  const sql = 'SELECT * FROM messages ORDER BY create_time DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, message: '获取留言失败' });
      return;
    }
    res.json({ success: true, data: rows });
  });
});

// 2. 提交留言接口
app.post('/api/messages', (req, res) => {
  const { nickname, content } = req.body;
  // 后端二次校验（防止绕过前端校验）
  if (!nickname || !content || nickname.trim() === '' || content.trim() === '') {
    return res.json({ success: false, message: '昵称和留言内容不能为空！' });
  }
  const sql = 'INSERT INTO messages (nickname, content) VALUES (?, ?)';
  db.run(sql, [nickname.trim(), content.trim()], function (err) {
    if (err) {
      res.json({ success: false, message: '提交失败，请重试' });
      return;
    }
    res.json({
      success: true,
      message: '留言提交成功！',
      data: { id: this.lastID, nickname, content }
    });
  });
});

// 3. 点赞接口
app.post('/api/like', (req, res) => {
  const { messageId } = req.body;
  if (!messageId) {
    return res.json({ success: false, message: '参数错误' });
  }
  // 先更新点赞数，再查询最新值
  const updateSql = 'UPDATE messages SET like_count = like_count + 1 WHERE id = ?';
  db.run(updateSql, [messageId], function (err) {
    if (err) {
      return res.json({ success: false, message: '点赞失败' });
    }
    // 查询更新后的点赞数
    const selectSql = 'SELECT like_count FROM messages WHERE id = ?';
    db.get(selectSql, [messageId], (err, row) => {
      if (err || !row) {
        return res.json({ success: false, message: '获取点赞数失败' });
      }
      res.json({ success: true, newLikeCount: row.like_count });
    });
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`服务器运行在：http://localhost:${PORT}`);
});