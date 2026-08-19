# 接口需求：邮件工单模块

版本：V1.0  
说明：下列路径为建议规范；现网路径可以保持不变，但入参、出参和业务规则需对齐。

## 1. 通用约定

- 时间统一使用 ISO 8601 UTC，例如 `2026-08-18T09:18:00Z`。
- 列表使用游标分页，默认 `page_size=20`，最大 `100`。
- 邮件发送、访客提交和上传接口必须支持 `Idempotency-Key`。
- HTML 正文必须由服务端再次清洗；附件预览地址必须为短期签名 URL。
- 通用响应：

```json
{
  "code": "OK",
  "message": "",
  "request_id": "req_01J...",
  "data": {}
}
```

### 1.1 核心枚举

| 字段              | 可选值                                           | 规则                                               |
| ----------------- | ------------------------------------------------ | -------------------------------------------------- |
| `source_type`     | `widget`, `email`                                | 工单留言或邮箱来信                                 |
| `source_mailbox`  | 邮箱或 `null`                                    | 邮箱来信取实际收件邮箱；工单留言为 `null`          |
| `read_status`     | `read`, `unread`                                 | 客户新消息进入后为 `unread`                        |
| `reply_status`    | `sent`, `unsent`                                 | 链尾为客服邮件时 `sent`，链尾为客户邮件时 `unsent` |
| `direction`       | `inbound`, `outbound`                            | 客户来信或客服发信                                 |
| `delivery_status` | `queued`, `sent`, `failed`, `bounced`, `unknown` | 客服发信结果                                       |

## 2. 现有 5 个 GET 接口

### E1 按邮箱和时间窗口获取邮件列表

`GET /mail/messages`

请求参数：

| 参数         | 必填 | 类型     | 说明                    |
| ------------ | ---- | -------- | ----------------------- |
| `mailbox`    | 是   | string   | 如 `service@neewer.com` |
| `start_time` | 是   | datetime | 窗口开始，含边界        |
| `end_time`   | 是   | datetime | 窗口结束，含边界        |
| `cursor`     | 否   | string   | 下一页游标              |
| `page_size`  | 否   | integer  | 默认 20，最大 100       |

响应 `data`：

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

请求：`mailbox`、`customer_email` 必填；`start_time`、`end_time`、`cursor`、`page_size` 可选。

响应必须返回 `threads[]`，不可把同一邮箱的不同主题强制合并：

```json
{
  "threads": [
    {
      "thread_id": "th_N210948",
      "subject": "Order #N210948",
      "messages": []
    }
  ],
  "next_cursor": null
}
```

`messages[]` 使用 3.2 标准消息结构。

### E3 按邮箱和时间窗口获取线程起点列表

`GET /mail/thread-starts`

请求参数与 E1 相同。响应 `items[]` 至少包含：`thread_id`、`root_mail_id`、`customer_email`、`mailbox`、`subject`、`started_at`、`last_received_at`、`message_count`。

### E4 根据邮件 ID 获取回复链（包含附件）

`GET /mail/messages/{mail_id}/reply-chain?include_attachments=true`

响应：`thread_id`、`root_mail_id`、`messages[]`。附件按 3.3 标准附件结构返回。

### E5 根据邮件 ID 获取回复链（不含附件）

建议与 E4 合并，仅将 `include_attachments` 设为 `false`，避免维护两个重复接口。响应中的 `attachments` 返回空数组，但保留 `has_attachment`。

## 3. 现有接口必须补充的字段

### 3.1 标准工单列表项

```json
{
  "ticket_id": "TK-MAIL-20260818-0038",
  "thread_id": "th_N210948",
  "latest_mail_id": "mail_23914",
  "source_type": "email",
  "source_mailbox": "service@neewer.com",
  "received_at": "2026-08-18T09:18:00Z",
  "subject": "Re: Order #N210948",
  "buyer_email": "buyer@example.com",
  "read_status": "unread",
  "reply_status": "unsent",
  "issue_type": "order",
  "has_attachment": true
}
```

### 3.2 标准消息结构

```json
{
  "mail_id": "mail_23914",
  "message_id": "<abc@example.com>",
  "direction": "inbound",
  "source_type": "email",
  "source_mailbox": "service@neewer.com",
  "from": "buyer@example.com",
  "to": ["service@neewer.com"],
  "subject": "Re: Order #N210948",
  "body_text": "Thanks. I attached...",
  "body_html": "<p>Thanks. I attached...</p>",
  "sent_at": "2026-08-18T09:18:00Z",
  "delivery_status": null,
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

## 4. 必须新增的接口

### N1 统一工单列表

`GET /support/tickets`

用途：聚合访客留言和 E1/E3 邮箱数据，前端不直接自行归链。

请求参数：

| 参数                     | 必填 | 类型           | 说明                             |
| ------------------------ | ---- | -------------- | -------------------------------- |
| `start_time`, `end_time` | 是   | datetime       | 收件时间范围                     |
| `source`                 | 否   | string         | `widget`、具体邮箱或不传         |
| `issue_type`             | 否   | string         | 问题类型                         |
| `read_status`            | 否   | string         | `read`、`unread`                 |
| `keyword`                | 否   | string         | 邮箱、主题、正文、工单号、订单号 |
| `cursor`, `page_size`    | 否   | string/integer | 游标分页                         |

响应：`items[]` 使用 3.1，另返回 `next_cursor`、`has_more`、`unread_count`。

### N2 访客提交工单

`POST /support/tickets`

```json
{
  "buyer_email": "buyer@example.com",
  "issue_type": "logistics",
  "subject": "订单迟迟未发货",
  "body_text": "订单三天没有更新",
  "order_id": "N210948",
  "attachment_ids": ["att_01J..."]
}
```

成功响应：

```json
{
  "ticket_id": "TK-WEB-20260818-0042",
  "thread_id": "th_widget_0042",
  "mail_id": "mail_widget_0042",
  "read_status": "unread",
  "reply_status": "unsent",
  "created_at": "2026-08-18T09:42:00Z"
}
```

### N3 获取统一工单详情

`GET /support/tickets/{ticket_id}`

响应：3.1 工单字段、完整 `messages[]`、`order_id`。邮箱工单可由 E4 提供底层数据，访客留言由工单库提供，不允许前端按客户邮箱自行合并。

### N4 标记已读/未读

`PATCH /support/tickets/{ticket_id}/read-status`

请求：`{"read_status":"read","last_seen_mail_id":"mail_23914"}`。

响应：`ticket_id`、`read_status`、`updated_at`。若读取期间已有更新邮件，服务端不得把新邮件误标为已读，应返回 `409 MAIL_VERSION_CONFLICT` 和最新邮件 ID。

### N5 上传附件

`POST /support/attachments`

请求：`multipart/form-data`，字段 `file`、`purpose=ticket|reply`。响应使用 3.3，并返回可用于提交或回复的 `attachment_id`。

限制：最多 5 个；单文件与总大小由邮件服务配置返回。病毒扫描未完成时返回 `scan_status=pending`，禁止发送。

### N6 刷新附件预览地址

`POST /support/attachments/{attachment_id}/preview-url`

请求体为空。响应：`preview_url`、`preview_url_expires_at`。无预览权限返回 `403`，文件不存在返回 `404`，扫描失败返回 `422`。

### N7 发送邮件回复

`POST /support/tickets/{ticket_id}/replies`

请求头：`Idempotency-Key` 必填。

```json
{
  "from_mailbox": "service@neewer.com",
  "to": ["buyer@example.com"],
  "subject": "Re: Order #N210948",
  "body_text": "We are checking your order.",
  "body_html": "<p><strong>We are checking your order.</strong></p>",
  "signature_template_id": "neewer-cs-default",
  "attachment_ids": ["att_01J..."],
  "reply_to_mail_id": "mail_23914"
}
```

成功响应：

```json
{
  "send_id": "send_01J...",
  "mail_id": "mail_out_24001",
  "thread_id": "th_N210948",
  "delivery_status": "queued",
  "reply_status": "unsent",
  "created_at": "2026-08-18T09:30:00Z"
}
```

说明：仅当发送服务确认 `sent` 后，工单 `reply_status` 才改为 `sent`。

### N8 查询发送结果

`GET /support/mail-sends/{send_id}`

响应：`send_id`、`mail_id`、`delivery_status`、`failure_code`、`failure_message`、`updated_at`。发送超时后前端必须先查询此接口，不得直接重发。

### N9 客服邮箱配置

`GET /support/mailboxes`

响应：

```json
{
  "items": [
    { "address": "service@neewer.com", "display_name": "service 邮箱", "enabled": true },
    { "address": "support@neewer.com", "display_name": "support 邮箱", "enabled": true }
  ]
}
```

## 5. 推荐新增的实时能力

- `GET /support/tickets/events`：SSE 推送 `ticket.created`、`mail.received`、`mail.sent`、`mail.failed`、`mail.bounced`。
- 若首版不做 SSE，可每 10-30 秒增量调用 N1，使用 `updated_after` 和游标，页面不可见时降低频率。
- 邮件服务向后端提供发送结果/退信回调；该回调属于内部接口，不直接暴露给浏览器。

## 6. 错误码

| HTTP    | `code`                                      | 处理                       |
| ------- | ------------------------------------------- | -------------------------- |
| 400     | `INVALID_ARGUMENT`                          | 提示具体字段               |
| 401/403 | `UNAUTHORIZED` / `FORBIDDEN`                | 重新登录或提示无权限       |
| 404     | `TICKET_NOT_FOUND` / `ATTACHMENT_NOT_FOUND` | 刷新列表                   |
| 409     | `MAIL_VERSION_CONFLICT`                     | 获取最新回复链后再操作     |
| 409     | `IDEMPOTENCY_CONFLICT`                      | 查询原请求结果，不重复发送 |
| 413     | `ATTACHMENT_TOO_LARGE`                      | 保留正文，移除超限附件     |
| 422     | `ATTACHMENT_SCAN_FAILED`                    | 禁止发送并提示附件         |
| 429     | `RATE_LIMITED`                              | 按 `retry_after` 重试      |
| 502/504 | `MAIL_PROVIDER_ERROR` / `SEND_TIMEOUT`      | 保留草稿并查询 N8          |

## 7. 验收要点

- 现有 5 个 GET 能稳定返回邮件唯一 ID、线程 ID、邮件头和标准附件字段。
- 统一列表一次返回页面所需六个字段，不需要前端逐条请求回复链。
- 相同客户邮箱的不同主题不误合并，重复邮件 ID 不重复入库。
- 已读和回复状态按最新邮件版本更新，竞态场景不覆盖客户新邮件。
- 发送接口幂等；失败、超时和退信均不会误显示已发送。
- 预览 URL 过期可刷新，且不暴露永久公开文件地址。
