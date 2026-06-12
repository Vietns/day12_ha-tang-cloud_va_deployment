# Moni Budget Copilot - Codebase README

Prototype cải tiến MoMo Moni cho track Personal Finance. Moni giúp user theo dõi ngân sách tháng, thống kê chi tiêu, cảnh báo nguy cơ vượt ngân sách và tư vấn trước khi mua thêm một khoản mới.

## Cách chạy prototype

Yêu cầu:

- Node.js 18+.
- Không cần `npm install` vì code hiện dùng Node.js built-in modules, chưa có `package.json`.

Chạy từ thư mục gốc repo nhóm:

```powershell
cd codebase
node server.js
```

Mở trình duyệt:

```text
http://localhost:5173
```

Nếu port `5173` đang bận:

```powershell
$env:PORT=5174
node server.js
```

Sau đó mở:

```text
http://localhost:5174
```

## Biến môi trường

Tạo file `.env` ở thư mục gốc repo nhóm `Day06-E403-NhomB3/`, không đặt trong `codebase/`.

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Không commit `.env` hoặc API key thật.

Nếu không có `OPENAI_API_KEY`, server tự dùng mock routing để prototype vẫn chạy được. Khi demo yêu cầu AI thật, cần có API key hợp lệ để kiểm tra flow tool-calling.

## Công cụ và API đã dùng

- Frontend: HTML, CSS, JavaScript vanilla.
- Backend: Node.js built-in `http` server.
- AI API: OpenAI Responses API.
- Model mặc định: `gpt-4.1-mini`.
- Tool-calling / prompt files:
  - `server/openaiClient.js`: gọi OpenAI để chọn tool và sinh final response.
  - `server/prompts.js`: system prompt cho tool selection và final answer.
  - `server/toolSchemas.js`: schema các tool Moni có thể gọi.
  - `server/http.js`: helper đọc JSON, trả JSON, serve static files.
  - `server/env.js`: helper đọc `.env`.
  - `server.js`: mock data, business logic demo, tool execution, API `/api/moni/chat`.

## Flow AI chính

```text
User chat với Moni
-> AI đọc intent
-> AI chọn tool phù hợp
-> Server chạy tool trên dữ liệu ngân sách/chi tiêu
-> AI nhận tool result
-> AI trả lời user bằng số liệu cụ thể
```

Flow này thể hiện AI trong ít nhất một luồng end-to-end, không chỉ là mockup tĩnh.

## Test manual

Test qua UI:

1. Chạy `node server.js`.
2. Mở `http://localhost:5173`.
3. Nhập một trong các câu:

```text
Cho tôi biết tháng 6 tôi còn bao nhiêu tiền sau khi trừ chi tiêu đã nhập?
```

```text
Tôi định mua tai nghe 1.5 triệu, ngân sách còn đủ không và nếu mua thì tôi nên trả góp hay trả ngay?
```

```text
So sánh mua ngay với trả góp 3 tháng cho khoản chi 2 triệu, dựa vào ngân sách tháng này của tôi.
```

Test API bằng PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5173/api/moni/chat -ContentType "application/json" -Body '{"message":"Tôi có nên mua tai nghe 1.5 triệu không?","userId":"demo_user","month":"2026-06"}'
```

Kiểm tra response có:

- `assistantMessage`
- `cards`
- `llmTrace`

Trong `llmTrace`, kiểm tra AI chọn tool nào, arguments là gì, tool result ra sao và final assistant response.

## Demo scenarios chính

1. **Kiểm tra ngân sách tháng**
   - Input: "Cho tôi biết tháng 6 tôi còn bao nhiêu tiền sau khi trừ chi tiêu đã nhập?"
   - Expected: Moni tính tổng chi tiêu, so sánh với ngân sách tháng, nói còn bao nhiêu tiền và cảnh báo nếu gần vượt.

2. **Tư vấn mua sắm**
   - Input: "Tôi định mua tai nghe 1.5 triệu, ngân sách còn đủ không và nếu mua thì tôi nên trả góp hay trả ngay?"
   - Expected: Moni kiểm tra ngân sách, phân tích mua ngay/trả góp và đề xuất phương án ít rủi ro hơn.

3. **So sánh hai phương án**
   - Input: "So sánh mua ngay với trả góp 3 tháng cho khoản chi 2 triệu, dựa vào ngân sách tháng này của tôi."
   - Expected: Moni nêu tổng chi phí, ảnh hưởng đến ngân sách tháng hiện tại và recommendation cụ thể.

4. **Low-confidence / correction path**
   - Input: "Tôi có một khoản học phí 3 triệu, khoản này có nên tính vào chi tiêu thường xuyên không?"
   - Expected: Moni không tự chốt đây là chi thường xuyên, giải thích đây có thể là khoản bất thường và đề xuất đánh dấu ngoại lệ để dự báo không bị sai.

## Phân công nhóm

| Thành viên | Mã học viên | Phụ trách | File chính |
|---|---|---|---|
| Trần Quang Huy | 2A202601010 | Backend chính, tool-calling flow, OpenAI client, prompt, tool schema, API contract | `server.js`, `server/*`, `moni-chat-backend.example.js` |
| Trương Hải Quân | 2A202600898 | Frontend app logic, chat actions, sync state, render cards, trace/log UI | `index.html`, phần JavaScript UI |
| Bùi Minh Hiếu | 2A202600876 | Giao diện, responsive layout, dashboard visual polish, assistant Markdown style | `index.html`, `styles.css` |
| Nguyễn Sĩ Việt | 2A202600658 | Demo scenarios, hướng dẫn chạy, test manual flow ngân sách và purchase advisor | `README.md`, `README-demo.md`, test cases |

## Checklist trước khi nộp

- [ ] Chạy được `node server.js`.
- [ ] Mở được `http://localhost:5173`.
- [ ] README có cách chạy prototype.
- [ ] README có công cụ/API/model đã dùng.
- [ ] README có phân công ai làm gì.
- [ ] Không commit `.env` hoặc API key thật.
- [ ] Có ít nhất một flow AI thật nếu có `OPENAI_API_KEY`.
- [ ] Nếu không có API key, demo nói rõ phần mock fallback chỉ để prototype không chết.
