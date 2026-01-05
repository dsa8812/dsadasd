const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接SQLite数据库（文件型，存储在项目根目录）
const db = new sqlite3.Database(path.join(__dirname, 'treehole.db'), (err) => {
  if (err) {
    console.error('数据库连接失败：', err.message);
  } else {
    console.log('数据库连接成功！');
    // 初始化messages表（含点赞数字段）
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      content TEXT NOT NULL,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      like_count INTEGER DEFAULT 0
    )`, (err) => {
      if (err) {
        console.error('表创建失败：', err.message);
      } else {
        console.log('messages表初始化完成');
      }
    });
  }
});

module.exports = db;