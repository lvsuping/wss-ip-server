// server.js
const WebSocket = require('ws');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ noServer: true });

// 获取客户端真实 IP
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    null
  );
}

// 处理 WebSocket 连接
wss.on('connection', (ws, req) => {
  const clientIP = getClientIP(req);
  console.log('客户端连接:', clientIP);

  // 立即发送欢迎消息（可选）
  ws.send(JSON.stringify({
    system: "WSS IP Server",
    message: "Connected. Send any message to get your IP.",
    clientIP: clientIP
  }));

  // 监听客户端消息
  ws.on('message', (data) => {
    try {
      const text = data.toString();
      console.log(`收到消息 (${clientIP}): ${text}`);

      // 回复客户端 IP
      ws.send(JSON.stringify({
        clientIP: clientIP,
        message: "Your public IP address",
        echo: text // 可选回显
      }));
    } catch (err) {
      console.error("消息处理失败:", err);
    }
  });

  ws.on('close', () => {
    console.log('客户端断开:', clientIP);
  });

  ws.on('error', (err) => {
    console.error('WebSocket 错误:', err);
  });
});

// 升级 HTTP 请求到 WebSocket
app.get('/', (req, res) => {
  res.send(`
    <h1>WSS IP Server Running</h1>
    <p>Connect via:</p>
    <pre>wss://your-domain.onrender.com</pre>
  `);
});

const server = app.listen(port, () => {
  console.log(`HTTP 服务器运行在端口 ${port}`);
});

// 将 WebSocket 绑定到 HTTP 服务器
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
