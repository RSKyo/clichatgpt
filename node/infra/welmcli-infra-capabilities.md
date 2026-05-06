# welmcli infra 能力清单（完整版 · v5）

---

# 一、能力总览（文件 / 方法 / 作用）

## protocol.js
- ok(value?, meta?) → 构造成功结果
- fail(error?, meta?) → 构造失败结果（自动标准化 error）
- run(main) → CLI 统一入口（执行、收敛、输出、exitCode）

---

## error.js
- normalizeError(err) → 任意错误转标准结构
- resolveExitCode(error) → error.code → CLI exitCode
- ClientError → 标准错误类

### 工厂方法
- argMissingError → 参数缺失
- argEmptyError → 参数为空
- argInvalidError → 参数非法
- cmdMissingError → 命令缺失
- cmdInvalidError → 命令非法
- targetMissingError → targetId 缺失
- targetNotFoundError → target 不存在

---

## value.js

### 校验
- assert(value, error) → 不合法直接 throw

### 默认
- ensure(value, defaultValue) → 提供默认值

### 解析
- parseNumber → 数字
- parsePositiveNumber → 正数
- parseInt → 整数
- parsePositiveInt → 正整数
- parseBool → 布尔
- parseNonBlank → 非空字符串

### 类型
- isCallable → 函数判断
- isEmitter → 事件对象判断

---

## core.js
- normalizeUrl(url) → URL 标准化
- sleep(ms) → 延迟

---

# 二、参数处理决策体系（详细）

## 完整决策流程

1. 输入是否存在？
   - 否 → assert + argMissingError

2. 输入是否为空字符串？
   - 是 → assert + argEmptyError

3. 是否需要类型解析？
   - 是 → parseXXX

4. parse 结果是否为 null？
   - 是 → fail(argInvalidError)

5. 是否需要默认值？
   - 是 → ensure(value, default)

---

## 标准模式

```js
const value = assert(
  parseNonBlank(input),
  () => argMissingError('field')
);
```

---

# 三、错误处理体系（详细）

## 错误分类路径

1. 参数错误（ARG_*）
2. 命令错误（CMD_*）
3. 资源错误（TARGET_*）
4. 执行错误（RUNTIME_*）
5. 系统错误（INTERNAL_ERROR）

---

## 使用优先级

1. 使用工厂函数（argMissingError 等）
2. 使用 fail('message')
3. 使用 fail(error)

---

## 禁止行为

- throw new Error（业务层）
- 手动调用 normalizeError
- 返回非协议结构

---

# 四、执行逻辑模板（详细）

## exec 模板

```js
try {
  const result = await fn();
  return ok(result);
} catch (err) {
  return fail(err);
}
```

---

## 条件失败

```js
if (!condition) {
  return fail('condition not matched');
}
```

---

## poll 模板

```js
const result = await exec(...);

if (result.ok && match(result.value)) {
  return ok(result.value, {
    ...(result.meta ?? {}),
    timing: {...}
  });
}
```

---

# 五、数据结构规范（严格）

## result

{
  ok: boolean,
  value?: any,
  error?: { code, message, details },
  meta?: object
}

---

## meta

允许字段：
- timing
- debug
- trace

规则：
- 必须可序列化
- 不参与逻辑判断

---

# 六、调用链规范（不可破坏）

command
→ exec / poll
→ ok / fail
→ run
→ stdout(JSON) + exitCode

---

# 七、副作用控制（关键）

禁止：

result.meta = {}

必须：

{ ...(result.meta ?? {}) }

---

# 八、设计原则（完整）

1. 单一协议输出
2. 无副作用
3. 错误可控（不 throw）
4. 结构优先
5. 可组合（小函数组合）

---

# 九、典型场景模式（补充）

## wait 模式

```js
const res = await poll(...);

if (!res.ok) {
  return fail(res.error);
}

return ok(res.value);
```

---

## 包装 exec

```js
const res = await exec(...);

if (!res.ok) {
  return res;
}
```

---

# 十、LLM 使用强约束

1. 必须使用 ok / fail
2. 不得返回裸数据
3. 不得 throw（业务层）
4. 参数必须 parse → ensure → assert
5. error 必须进入 fail
6. 不得修改输入对象

---

# 一句话总结

这是执行协议驱动系统，所有代码必须围绕协议组合，而不是自由实现。
