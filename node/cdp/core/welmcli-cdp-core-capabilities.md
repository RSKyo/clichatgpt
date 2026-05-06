# welmcli cdp/core 能力清单（完整版 · v1）

---

# 一、能力总览（文件 / 方法 / 作用）

## client.js
- getClient(targetId) → 获取 CDP client（自动复用）
- closeClient(targetId) → 关闭指定 client
- closeAllClients() → 关闭所有 client

内部能力：
- createClient(targetId) → 创建连接
- isTargetNotFoundError(error) → 判断 target 不存在

👉 特点：
- Promise 缓存（避免重复创建）
- 自动清理（disconnect）

---

## executor.js
- exec(targetId, expression) → 执行 JS 表达式（Runtime.evaluate）
- poll(targetId, expression, options) → 轮询执行直到命中

内部能力：
- isPollMatched(value) → 判断轮询是否命中

---

## config.js
- HOST → CDP 地址 fileciteturn11file1
- PORT → CDP 端口 fileciteturn11file1
- DEFAULT_TIMEOUT → 默认超时 fileciteturn11file1
- DEFAULT_INTERVAL → 默认间隔 fileciteturn11file1

---

# 二、client 使用规则（核心）

## 获取 client（唯一入口）

```js
const client = await getClient(targetId);
```

规则：

1. 不直接调用 CDP()
2. 必须通过 getClient
3. 自动复用连接
4. 自动处理 target 不存在

---

## 连接生命周期

创建：
getClient → createClient

释放：
- closeClient(targetId)
- closeAllClients()

自动清理：
- disconnect 事件

---

## 错误处理

- target 不存在 → targetNotFoundError
- 其他错误 → ClientError 包装

---

# 三、exec 执行规则（核心）

## 标准调用

```js
const result = await exec(targetId, expression);
```

返回结构：

```js
{ ok: true, value, meta }
{ ok: false, error }
```

---

## 行为规则

1. 永不 throw（必须返回 fail）
2. 自动捕获 Runtime.evaluate 异常
3. exceptionDetails → fail(message)
4. result 不存在 → fail

---

## 返回策略

优先：

```js
ok(result.value)
```

fallback：

```js
ok(result.description)
```

---

# 四、poll 轮询规则（核心模式）

## 标准调用

```js
const result = await poll(targetId, expression, options);
```

---

## 参数处理

```js
timeout = ensure(parsePositiveInt(options.timeout), DEFAULT_TIMEOUT)
interval = ensure(parsePositiveInt(options.interval), DEFAULT_INTERVAL)
```

---

## 命中逻辑

```js
if (result.ok && isPollMatched(result.value))
```

---

## isPollMatched 规则

- null / undefined → false
- boolean → 原值
- string → 非空
- 其他 → true

---

## 成功返回

```js
ok(value, {
  ...(result.meta ?? {}),
  timing: { timeout, interval, elapsed }
})
```

---

## 失败返回

```js
fail(error, {
  timing: { timeout, interval, elapsed }
})
```

---

# 五、执行模型（必须遵守）

```text
command
   ↓
exec / poll
   ↓
ok / fail
   ↓
run
```

---

# 六、典型使用模板

## exec 使用

```js
const res = await exec(targetId, expression);

if (!res.ok) {
  return res;
}

return ok(res.value);
```

---

## poll 使用

```js
const res = await poll(targetId, expression);

if (!res.ok) {
  return res;
}

return ok(res.value);
```

---

# 七、错误与协议结合

规则：

1. exec/poll 不 throw
2. 所有错误通过 fail
3. command 层不处理 CDP 原始错误
4. error 统一走 infra/error

---

# 八、设计原则

1. 单 client（复用连接）
2. 无重复连接（Promise 缓存）
3. 无副作用（不修改 result）
4. 执行安全（不 throw）
5. 结构优先（统一协议）

---

# 九、LLM 使用约束

1. 必须使用 getClient / exec / poll
2. 不直接使用 CDP()
3. 不处理 exceptionDetails（交给 exec）
4. 不修改 result.meta
5. 所有返回必须 ok / fail

---

# 一句话总结

cdp/core 是“执行能力层”，负责调用浏览器并返回统一协议结果。
