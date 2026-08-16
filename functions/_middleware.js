// functions/_middleware.js

console.log('🔥 Middleware is executing!');
export async function onRequest(context) {
    // ... 其余代码不变
}

export async function onRequest(context) {
    // 1. 获取请求头中的 Authorization 信息
    const authHeader = context.request.headers.get('Authorization');

    // 2. 如果没有 Authorization 头，要求客户端提供用户名和密码
    if (!authHeader) {
        return new Response('Authentication required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Area"',
            },
        });
    }

    // 3. 解析 Authorization 头，获取编码后的凭证
    const [scheme, encoded] = authHeader.split(' ');

    // 4. 检查是否为 Basic 认证，并且凭证存在
    if (!encoded || scheme !== 'Basic') {
        return new Response('Invalid authentication', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Area"',
            },
        });
    }

    // 5. 解码 Base64 凭证，并分割出用户名和密码
    const decoded = atob(encoded);
    const [username, password] = decoded.split(':');

    // 6. 【重要】在这里设置你的用户名和密码
    const VALID_USERNAME = context.env.AUTH_USERNAME || 'admin';
    const VALID_PASSWORD = context.env.AUTH_PASSWORD;

    // 7. 验证用户名和密码是否匹配
    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
        return new Response('Invalid credentials', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Area"',
            },
        });
    }

    // 8. 验证通过，继续处理请求，访问你的 D1 Manager 页面
    return await context.next();
}