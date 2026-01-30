# 📔 Nhật Ký Công Nghệ Pixel AI Editor

Chào bro! Đây là nơi ghi lại toàn bộ những "bí kíp" võ công mà chúng ta đã cùng nhau xây dựng cho Pixel AI Editor. Mỗi chức năng không chỉ là code, mà là những giải pháp kỹ thuật tối ưu để tạo ra một ứng dụng chuyên nghiệp.

---

## 1. 🚀 Engine Đồ Họa & Canvas (PixiJS)

**Trạng thái:** Hoàn thành (Cơ bản)

### ⚙️ Cơ chế hoạt động:

- **PixiJS Power**: Thay vì dùng Canvas API thuần của trình duyệt (vốn chậm khi xử lý nhiều layer), chúng ta dùng **PixiJS** — một Engine chạy trên **WebGL**. Nó tận dụng sức mạnh của Card đồ họa (GPU) để vẽ hàng nghìn pixel cùng lúc mà không lag.
- **Nearest Neighbor Scaling**: Trong Pixel Art, cái chúng ta cần là sự sắc nét của từng ô vuông. Tôi đã cấu hình Engine sử dụng `scaleMode: 'nearest'`. Điều này ngăn trình duyệt làm mờ (anti-aliasing) các pixel khi bạn phóng to (Zoom in).
- **Checkerboard Background**: Được vẽ bằng thuật toán vòng lặp, tạo ra các ô vuông 2x2 đan xen màu xám. Nó giúp bạn phân biệt vùng có màu và vùng trong suốt (Alpha channel).

---

## 2. 🎨 Hệ Thống Màu Sắc & Tối Ưu Bộ Nhớ

**Trạng thái:** Hoàn thành

### ⚙️ Cơ chế hoạt động:

- **Dữ liệu 32-bit (Uint32)**: Thông thường, người ta lưu màu là chuỗi chữ `"#FF0000"`. Nhưng trong Engine này, tôi lưu mỗi pixel là **một con số 32-bit nguyên (Integer)** theo định dạng `0xAABBGGRR`.
  - _Tại sao?_ Vì máy tính xử lý số nhanh hơn chữ gấp hàng nghìn lần. Việc ghi và đọc pixel diễn ra với tốc độ ánh sáng.
- **HSV Dynamic Picker**: Chế độ chọn màu dựa trên **Hue (Sắc độ)**, **Saturation (Độ tươi)**, và **Value (Độ sáng)**.
  - Khi bạn kéo chuột, toán tử toán học sẽ tính toán lại giá trị RGB ngay thời gian thực để chuyển đổi thành con số 32-bit siêu gọn nhẹ.

---

## 3. 🛠️ Bộ Công Cụ (Tools)

**Trạng thái:** Đã xong Bút (Pencil), Tẩy (Eraser), Đổ màu (Fill)

### ⚙️ Cơ chế hoạt động:

- **Pencil (Bresenham's Algorithm)**: Khi bạn di chuột cực nhanh, trình duyệt không thể bắt kịp mọi điểm. Nếu chỉ vẽ tại vị trí chuột, nét vẽ sẽ bị đứt quãng. Tôi đã áp dụng thuật toán **Bresenham** để tự động nối các điểm rời rạc thành một đường thẳng mượt mà.
- **Fill Bucket (Flood Fill - Stack Based)**: Sử dụng thuật toán **Tìm kiếm theo chiều rộng (BFS)**. Khi bạn click, nó sẽ tìm tất cả các pixel "hàng xóm" cùng màu và đổi màu chúng. Tôi dùng cấu trúc dữ liệu **Stack** thay vì đệ quy để tránh lỗi "Tràn bộ nhớ" (Stack Overflow) khi đổ màu vùng lớn.

* **Eyedropper (Color Picker)**: Cho phép bạn "hút" màu trực tiếp từ một pixel đã vẽ trên Canvas.
  - _Cơ chế_: Khi bạn click, Engine sẽ truy cập vào mảng dữ liệu `Uint32Array` của layer đó tại đúng vị trí tọa độ `(x, y)` để lấy ra con số màu sắc chính xác tuyệt đối, sau đó nạp ngược lại vào cọ vẽ của bạn.
* **Rectangle Tool (Hình chữ nhật)**: Công cụ vẽ hình khối nhanh chóng.
  - _Preview Layer_: Khi bạn nhấn giữ và kéo, tôi không vẽ trực tiếp lên Pixel Data ngay. Thay vào đó, tôi tạo một đối tượng `PIXI.Graphics` nằm trên cùng để làm "bản xem trước" (Preview). Chỉ khi bạn buông chuột (onUp), thuật toán mới tính toán các điểm biên và ghi vĩnh viễn vào Layer chính. Việc này giúp giảm tải cho CPU vì không phải cập nhật texture liên tục khi đang kéo chuột.

## 5. 🎯 Hệ Thống Chọn Vùng (Marquee Selection)

**Trạng thái:** Hoàn thành (Cơ bản)

### ⚙️ Cơ chế hoạt động:

- **Marquee Tool**: Khi bạn dùng công cụ này, một khung nét đứt sẽ hiện ra để xác định vùng làm việc.
- **Bí thuật "Cắt & Dán" (Cut & Paste)**:
  - Khi bạn kéo một vùng đã chọn, Engine sẽ thực hiện hành động **"Cut"**: Copy các pixel trong vùng đó vào một bộ nhớ tạm (Floating Pixels) và xóa chúng khỏi Layer gốc.
  - Khi bạn di chuyển chuột, khung chọn sẽ chạy theo. Khi bạn buông chuột hoặc chọn sang công cụ khác, Engine sẽ **"Paste"** những pixel đó xuống vị trí mới.

* **Xóa vùng chọn (Delete)**: Bạn chỉ cần nhấn phím **Delete** (hoặc biểu tượng thùng rác), Engine sẽ lặp qua toàn bộ tọa độ trong khung chọn và thiết lập màu về 0 (Trong suốt).
* **Copy & Paste (Ctrl+C / Ctrl+V)**:
  - **Ctrl+C**: Engine sẽ chụp lại mảng màu "Uint32" trong vùng chọn và lưu vào một biến Clipboard riêng.
  - **Ctrl+V**: Engine lấy dữ liệu từ Clipboard, tạo ra một mảng "Floating Pixels" lơ lửng. Bạn có thể di chuyển mảng vừa dán này đến bất cứ đâu trước khi chốt hạ.
* **Biến hình (Transform)**:
  - **Rotate 90°**: Xoay vùng chọn theo chiều kim đồng hồ. Engine sẽ tự động tính toán lại kích thước khung hình nếu vùng chọn không phải hình vuông.
  - **Flip Horizontal/Vertical**: Lật ngược vùng chọn theo trục ngang hoặc dọc.
* **Move Cursor (Biến hình chuột)**: Thay vì dùng nút bấm, khi đưa chuột vào vùng chọn, con trỏ sẽ biến thành mũi tên 4 hướng để báo hiệu có thể kéo thả.

---

## 4. ⏪ Hệ Thống Hoàn Tác (History System - Undo/Redo)

**Trạng thái:** Hoàn thành

### ⚙️ Cơ chế hoạt động "Dưới nắp capo":

- **RAM Snapshot**: Toàn bộ lịch sử được lưu trực tiếp vào RAM.
- **Bit-by-Bit Copy**: Mỗi khi bạn vẽ xong một nét (buông chuột), tôi dùng lệnh `new Uint32Array(layer.data)` để copy thô toàn bộ dữ liệu pixel.
- **Dữ liệu siêu nhẹ**: Mỗi pixel là số 32-bit, nên canvas 128x128 chỉ tốn **64KB** cho mỗi bước lưu. 50 bước Undo chỉ tốn khoảng **3MB RAM** — cực kỳ nhẹ.
- **Cấu trúc Ngăn xếp (Stack)**: Sử dụng `undoStack` và `redoStack`. Khi nhấn `Ctrl + Z`, dữ liệu cũ sẽ được nạp lại vào bộ đệm của GPU (PixiJS) để hiển thị lại ngay lập tức.

---

## 🎯 Sắp tới chúng ta sẽ làm gì?

- **Layer Management**: Quản lý nhiều lớp vẽ đè lên nhau.
- **Animation Timeline**: Tạo chuyển động cho nhân vật.
- **AI Generate**: Dùng AI để gợi ý hoặc tự vẽ pixel art từ mô tả của bạn.

---

_Ghi chú: File này sẽ được cập nhật liên tục mỗi khi có tính năng mới. Chúc bro học tập vui vẻ!_
