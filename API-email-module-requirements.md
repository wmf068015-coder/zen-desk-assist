# 接口需求：客服邮件模块

版本：V1.1

范围：仅定义邮件读取、回复、附件、状态和邮箱配置，不包含工单创建、工单详情或访客表单接口。

下列路径为建议规范。现网路径可以保持不变，但字段、状态和业务规则需对齐。

## 1. 通用约定

- 时间统一使用 ISO 8601 UTC，例如 `2026-08-18T09:18:00Z`。
- 列表使用游标分页，默认 `page_size=20`，最大 `100`。
- 邮件发送和附件上传必须支持 `Idempotency-Key`。
- HTML 正文由服务端清洗；附件预览使用短期签名 URL。
- 相同 `message_id` 只保存一次；邮件线程优先按 `thread_id`、`In-Reply-To` 和 `References` 归并。
- 同一客户邮箱可有多个线程，不得仅按邮箱强制合并。

通用响应：

```json
{
  "code": "OK",
  "message": "",
  "request_id": "req_01J...",
  "data": {}
}
```

### 1.1 核心枚举

| 字段              | 可选值                                           | 说明                                               |
| ----------------- | ------------------------------------------------ | -------------------------------------------------- |
| `direction`       | `inbound`, `outbound`                            | 客户来信或客服发信                                 |
| `read_status`     | `read`, `unread`                                 | 线程已读状态                                       |
| `reply_status`    | `sent`, `unsent`                                 | 链尾为客服邮件时 `sent`，链尾为客户邮件时 `unsent` |
| `delivery_status` | `queued`, `sent`, `failed`, `bounced`, `unknown` | 客服发信结果                                       |

## 2. 现有 5 个 GET 接口

### E1 按邮箱和时间窗口获取邮件列表

`GET /mail/messages`

请求参数：

| 参数         | 必填 | 类型     | 说明                    |
| ------------ | ---- | -------- | ----------------------- |
| `mailbox`    | 是   | string   | 如 `service@neewer.com` |
| `start_time` | 是   | datetime | 开始时间，含边界        |
| `end_time`   | 是   | datetime | 结束时间，含边界        |
| `cursor`     | 否   | string   | 下一页游标              |
| `page_size`  | 否   | integer  | 默认 20，最大 100       |

响应：

```json
{
  "items": [
    {
      "mail_id": "mail_23914",
      "thread_id": "th_N210948",
      "message_id": "<abc@example.com>",
      "in_reply_to": "<parent@example.com>",
      "references": ["<root@example.com>", "<parent@example.com>"],
      "direction": "inbound",
      "mailbox": "service@neewer.com",
      "from": "buyer@example.com",
      "to": ["service@neewer.com"],
      "subject": "Re: Order #N210948",
      "body_preview": "Thanks. I attached...",
      "received_at": "2026-08-18T09:18:00Z",
      "has_attachment": true
    }
  ],
  "next_cursor": null,
  "has_more": false
}
```

### E2 根据客户邮箱获取邮件回复链（包含附件）

`GET /mail/reply-chains/by-customer-email`

请求参数：

| 参数                     | 必填 | 类型           | 说明         |
| ------------------------ | ---- | -------------- | ------------ |
| `mailbox`                | 是   | string         | 客服邮箱     |
| `customer_email`         | 是   | string         | 客户邮箱     |
| `start_time`, `end_time` | 否   | datetime       | 可选时间范围 |
| `cursor`, `page_size`    | 否   | string/integer | 游标分页     |

响应必须返回 `threads[]`；一个邮箱可返回多个线程：

```json
{
  "threads": [
    {
      "thread_id": "th_N210948",
      "root_mail_id": "mail_23901",
      "subject": "Order #N210948",
      "messages": []
    }
  ],
  "next_cursor": null
}
```

`messages[]` 使用 3.2 标准邮件结构。

### E3 按邮箱和时间窗口获取线程起点列表

`GET /mail/thread-starts`

请求参数与 E1 相同。

响应 `items[]`：

```json
{
  "items": [
    {
      "thread_id": "th_N210948",
      "root_mail_id": "mail_23901",
      "latest_mail_id": "mail_23914",
      "mailbox": "service@neewer.com",
      "customer_email": "buyer@example.com",
      "subject": "Re: Order #N210948",
      "latest_received_at": "2026-08-18T09:18:00Z",
      "message_count": 3,
      "read_status": "unread",
      "reply_status": "unsent",
      "has_attachment": true
    }
  ],
  "next_cursor": null,
  "has_more": false
}
```

### E4 根据邮件 ID 获取回复链（包含附件）

`GET /mail/messages/{mail_id}/reply-chain?include_attachments=true`

响应包含 `thread_id`、`root_mail_id` 和完整 `messages[]`。附件使用 3.3 标准附件结构。

### E5 根据邮件 ID 获取回复链（不含附件）

建议与 E4 合并，仅将 `include_attachments` 设为 `false`。响应中的 `attachments` 返回空数组，但保留 `has_attachment`，避免维护两个重复接口。

## 3. 标准响应结构

### 3.1 邮件线程摘要

```json
{
  "thread_id": "th_N210948",
  "root_mail_id": "mail_23901",
  "latest_mail_id": "mail_23914",
  "mailbox": "service@neewer.com",
  "customer_email": "buyer@example.com",
  "subject": "Re: Order #N210948",
  "latest_received_at": "2026-08-18T09:18:00Z",
  "read_status": "unread",
  "reply_status": "unsent",
  "has_attachment": true
}
```

### 3.2 标准邮件结构

```json
{
  "mail_id": "mail_23914",
  "thread_id": "th_N210948",
  "message_id": "<abc@example.com>",
  "in_reply_to": "<parent@example.com>",
  "references": ["<root@example.com>", "<parent@example.com>"],
  "direction": "inbound",
  "mailbox": "service@neewer.com",
  "from": "buyer@example.com",
  "to": ["service@neewer.com"],
  "cc": [],
  "subject": "Re: Order #N210948",
  "body_text": "Thanks. I attached...",
  "body_html": "<p>Thanks. I attached...</p>",
  "sent_at": "2026-08-18T09:18:00Z",
  "delivery_status": null,
  "has_attachment": true,
  "attachments": []
}
```

### 3.3 标准附件结构

```json
{
  "attachment_id": "att_01J...",
  "file_name": "verification-document.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 1887436,
  "preview_url": "https://cdn.example.com/signed/...",
  "preview_url_expires_at": "2026-08-18T10:18:00Z",
  "download_url": "https://cdn.example.com/signed/..."
}
```

## 4. 仍需新增的邮件接口

### N1 更新线程已读状态

`PATCH /mail/threads/{thread_id}/read-status`

请求：

```json
{
  "read_status": "read",
  "last_seen_mail_id": "mail_23914"
}
```

响应：`thread_id`、`read_status`、`last_seen_mail_id`、`updated_at`。

若标记期间已有客户新邮件，返回 `409 MAIL_VERSION_CONFLICT` 和最新邮件 ID，不得把新邮件误标为已读。

### N2 上传邮件附件

`POST /mail/attachments`

请求：`multipart/form-data`，字段为 `file`。请求头 `Idempotency-Key` 必填。

响应使用 3.3，并增加：

```json
{
  "scan_status": "pending",
  "expires_at": "2026-08-19T09:18:00Z"
}
```

限制：最多 5 个附件；单文件及总大小由邮件服务配置。病毒扫描未通过时禁止发送。

### N3 刷新附件预览地址

`POST /mail/attachments/{attachment_id}/preview-url`

请求体为空。响应：`preview_url`、`preview_url_expires_at`。

无权限返回 `403`，文件不存在返回 `404`，扫描失败返回 `422`。

### N4 发送邮件

`POST /mail/messages`

请求头：`Idempotency-Key` 必填。

```json
{
  "from_mailbox": "service@neewer.com",
  "to": ["buyer@example.com"],
  "cc": [],
  "subject": "Re: Order #N210948",
  "body_text": "We are checking your order.",
  "body_html": "<p><strong>We are checking your order.</strong></p>",
  "signature_template_id": "neewer-cs-default",
  "attachment_ids": ["att_01J..."],
  "thread_id": "th_N210948",
  "reply_to_mail_id": "mail_23914"
}
```

`thread_id` 和 `reply_to_mail_id` 在回复邮件时必填；发送新邮件时可为空。

成功响应：

```json
{
  "send_id": "send_01J...",
  "mail_id": "mail_out_24001",
  "thread_id": "th_N210948",
  "delivery_status": "queued",
  "created_at": "2026-08-18T09:30:00Z"
}
```

只有邮件服务确认 `sent` 后，线程 `reply_status` 才能改为 `sent`。

### N5 查询邮件发送结果

`GET /mail/sends/{send_id}`

响应：

```json
{
  "send_id": "send_01J...",
  "mail_id": "mail_out_24001",
  "thread_id": "th_N210948",
  "delivery_status": "sent",
  "failure_code": null,
  "failure_message": null,
  "updated_at": "2026-08-18T09:30:05Z"
}
```

发送超时后必须先查询此接口，不得直接重复发送。

### N6 获取客服邮箱配置

`GET /mail/mailboxes`

响应：

```json
{
  "items": [
    {
      "address": "service@neewer.com",
      "display_name": "service 邮箱",
      "enabled": true,
      "can_send": true,
      "can_receive": true
    },
    {
      "address": "support@neewer.com",
      "display_name": "support 邮箱",
      "enabled": true,
      "can_send": true,
      "can_receive": true
    }
  ]
}
```

### N7 邮件事件推送（推荐）

`GET /mail/events`

使用 SSE 推送：`mail.received`、`mail.sent`、`mail.failed`、`mail.bounced`、`thread.read_status_changed`。

若首版不做 SSE，可每 10-30 秒增量调用 E1/E3，并增加 `updated_after` 参数。页面不可见时应降低轮询频率。

## 5. 邮件服务内部回调

邮件供应商向服务端回调发送成功、失败和退信结果。该接口不直接暴露给浏览器。

建议：`POST /internal/mail/delivery-events`

必须校验供应商签名，并使用供应商事件 ID 去重。事件至少包含：`provider_event_id`、`send_id`、`message_id`、`delivery_status`、`failure_code`、`occurred_at`。

## 6. 错误码

| HTTP    | `code`                                    | 前端处理                   |
| ------- | ----------------------------------------- | -------------------------- |
| 400     | `INVALID_ARGUMENT`                        | 提示具体字段               |
| 401/403 | `UNAUTHORIZED` / `FORBIDDEN`              | 重新登录或提示无权限       |
| 404     | `MAIL_NOT_FOUND` / `ATTACHMENT_NOT_FOUND` | 刷新邮件列表               |
| 409     | `MAIL_VERSION_CONFLICT`                   | 获取最新回复链后重试       |
| 409     | `IDEMPOTENCY_CONFLICT`                    | 查询原发送结果，不重复发送 |
| 413     | `ATTACHMENT_TOO_LARGE`                    | 保留正文并移除超限附件     |
| 422     | `ATTACHMENT_SCAN_FAILED`                  | 禁止发送并提示附件         |
| 429     | `RATE_LIMITED`                            | 按 `retry_after` 重试      |
| 502/504 | `MAIL_PROVIDER_ERROR` / `SEND_TIMEOUT`    | 保留草稿并查询 N5          |

## 7. 验收标准

- 现有 5 个 GET 稳定返回邮件唯一 ID、线程 ID、邮件头和标准附件字段。
- 同一客户邮箱的不同主题不误合并，重复 `message_id` 不重复保存。
- E3 一次返回列表所需的邮箱、日期、主题、客户邮箱、已读状态和回复状态。
- 已读状态更新不会覆盖并发到达的客户新邮件。
- 发送接口幂等；失败、超时和退信不会误显示为已发送。
- 图片、视频和 PDF 可通过短期签名 URL 预览，过期后可刷新。
- 本文所有公开接口均只处理邮件域数据，不创建或修改工单。
