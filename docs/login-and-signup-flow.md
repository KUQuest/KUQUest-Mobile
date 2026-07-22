# Branch Documentation & API Integration Guide (Branch: `develop`)

เอกสารฉบับนี้รวบรวมรายละเอียดของหน้าจอ ส่วนประกอบ (UI Components) และจุดรับ-ส่งข้อมูลที่ยัง **ไม่ได้เชื่อมต่อกับ Backend API** ภายในสาขา `develop` เพื่อให้ทีมพัฒนาสามารถนำไปรับช่วงต่อในการต่อ API ได้อย่างสะดวกรวดเร็ว

---

## 📱 สรุปรายการหน้าจอ (Screens Overview)

1. **หน้าเข้าสู่ระบบ (`src/app/login.tsx`)**
2. **หน้าสมัครสมาชิก (`src/app/signup.tsx`)**
3. **ขั้นตอนลงทะเบียน 1: ข้อมูลส่วนตัว (`src/app/step1.tsx`)**
4. **ขั้นตอนลงทะเบียน 2: โปรไฟล์และรายละเอียดแนะนำตัว (`src/app/step2.tsx`)**
5. **ขั้นตอนลงทะเบียน 3: ใบรับรอง ประวัติการทำงาน และผลงาน (`src/app/step3.tsx`)**

---

## 🔗 จุดที่ยังไม่ได้เชื่อมต่อ API (Pending API Integrations)

### 1. หน้า Login (`src/app/login.tsx`)
- **การทำงานปัจจุบัน**: 
  - กดปุ่ม **"Sign in with Google"** จะพาไปยังหน้า `step1` (Mock Navigation)
- **สิ่งที่ต้องทำเพื่อเชื่อม API**:
  - **Google OAuth / Firebase Auth**: เรียก Google Sign-In SDK หรือ Firebase Auth เพื่อขอ `idToken` / `accessToken` จากนิสิต มก. (`@ku.th`)
  - **Backend Endpoint**: ส่ง Token ไปยัง API เช่น `POST /api/v1/auth/google-login`
  - **Response Payload**: รับ JWT Token (Access/Refresh Token) และสถานะการลงทะเบียน (`isRegistered`)
  - **Navigation Control**: หากเป็นผู้ใช้ใหม่ -> ไปยัง `/step1`, หากเป็นผู้ใช้เดิม -> ไปยัง `/home` (หรือ Dashboard)

---

### 2. หน้า Signup (`src/app/signup.tsx`)
- **การทำงานปัจจุบัน**: 
  - กดปุ่ม **"Sign up with Google"** พาไปยังหน้า `step1`
- **สิ่งที่ต้องทำเพื่อเชื่อม API**:
  - **Google OAuth Register**: ดำเนินการยืนยันตัวตนด้วย Google Account (`@ku.th`)
  - **Backend Endpoint**: `POST /api/v1/auth/google-signup`
  - **Validation**: ตรวจสอบ Domain อีเมลต้องเป็น `@ku.th` เท่านั้น

---

### 3. ขั้นตอนลงทะเบียน 1: ข้อมูลส่วนตัว (`src/app/step1.tsx`)
- **การทำงานปัจจุบัน**:
  - อัปโหลดรูปโปรไฟล์ (UI Only)
  - ฟอร์มกรอกข้อมูล: Name-Surname, Telephone, Student ID, Bank Account, Faculty (Dropdown Mockup)
- **สิ่งที่ต้องทำเพื่อเชื่อม API**:
  - **Faculty List API**: ดึงรายชื่อคณะ/ภาควิชาผ่าน `GET /api/v1/faculties` เพื่อนำมาแสดงใน Dropdown
  - **Profile Image Upload**: เมื่อเลือกรูปแล้ว อัปโหลดไฟล์ไปยัง Storage (S3 / Cloud Storage / Firebase Storage) ผ่าน `POST /api/v1/upload/avatar` เพื่อรับ Image URL
  - **Draft Save / State Management**: บันทึกข้อมูลลง React Context / Redux / Zustand เพื่อเตรียมส่งสมบูรณ์ใน Step 3 หรือส่ง `POST /api/v1/user/registration/step1`

---

### 4. ขั้นตอนลงทะเบียน 2: ข้อมูลส่วนตัวและทักษะ (`src/app/step2.tsx`)
- **การทำงานปัจจุบัน**:
  - กล่องข้อความ `TextArea` สำหรับพิมพ์แนะนำตัว / ทักษะ (จำกัด 500 ตัวอักษร)
- **สิ่งที่ต้องทำเพื่อเชื่อม API**:
  - **Form Validation**: ตรวจสอบจำนวนตัวอักษรและห้ามเป็นค่าว่าง
  - **Save State / API Call**: ส่งข้อมูล Bio/Description ไปบันทึกชั่วคราว หรือเตรียมส่งใน payload รวม final submission `POST /api/v1/user/registration/step2`

---

### 5. ขั้นตอนลงทะเบียน 3: เอกสารรับรอง & ประวัติผลงาน (`src/app/step3.tsx`)
- **การทำงานปัจจุบัน**:
  - **Certificates**: ปุ่มอัปโหลดไฟล์ใบรับรอง (PDF, JPG, PNG) และช่องกรอกรายละเอียด
  - **Experience**: กรอกตำแหน่ง (Job Title), วันที่เริ่มต้น/สิ้นสุด, รายละเอียดงาน และปุ่มกดเพิ่มประสบการณ์ (+ Add more experience)
  - **My Works**: ปุ่มอัปโหลดรูปผลงาน (+ Add Image) และกรอกชื่อผลงาน/ลิงก์
- **สิ่งที่ต้องทำเพื่อเชื่อม API**:
  - **File Upload Service**:
    - อัปโหลดไฟล์ Certificate (`POST /api/v1/upload/certificate`)
    - อัปโหลดรูปภาพผลงาน My Works (`POST /api/v1/upload/work-image`)
  - **Final Form Submission**:
    - เมื่อผู้ใช้กดปุ่ม **"Complete"** จะต้องรวบรวมข้อมูลทั้งหมดตั้งแต่ Step 1 - Step 3 ส่งไปยัง Endpoint:
      - `POST /api/v1/user/profile/complete-registration`
    - **Example Request Payload**:
      ```json
      {
        "fullName": "John Doe",
        "phone": "0812345678",
        "studentId": "6712345678",
        "bankAccount": "1234567890",
        "facultyId": "ENG",
        "avatarUrl": "https://...",
        "bio": "Developer and Designer...",
        "certificates": [
          { "fileUrl": "https://...", "description": "Academic Excellence Award" }
        ],
        "experiences": [
          {
            "jobTitle": "Frontend Developer Intern",
            "startDate": "2025-06-01",
            "endDate": "2025-08-31",
            "description": "Built React Native screens..."
          }
        ],
        "works": [
          { "imageUrl": "https://...", "title": "Portfolio Web", "link": "https://..." }
        ]
      }
      ```
  - **Navigation Control**: เมื่อสมัครเสร็จสมบูรณ์ Redirect ไปยังหน้าหลัก (`/home` หรือ `/explore`)

---

## 🛠️ สรุป Reusable Components ที่สร้างเพิ่มขึ้นใน Branch นี้

1. **`GoogleIcon` (`src/components/GoogleIcon.tsx`)**
   - SVG Icon สำหรับปุ่ม Sign in / Sign up with Google
2. **`TopNav` (`src/components/TopNav.tsx`)**
   - แถบ Header โลโก้ KUQUEST ด้านบนหน้าลงทะเบียน Step 1 - Step 3

---

## 📌 คำแนะนำเพิ่มเติมสำหรับการพัฒนาต่อ (Next Steps)

1. **State Management**: ควรพิจารณาใช้ `Zustand` หรือ `React Context` สำหรับเก็บข้อมูลผู้ใช้ระหว่างเปลี่ยนหน้า Step 1 -> Step 2 -> Step 3 ก่อนส่งให้ API ในขั้นตอนสุดท้าย
2. **Image Picker Integrations**: ติดตั้ง `expo-image-picker` และ `expo-document-picker` สำหรับเลือกรูปและไฟล์เอกสารจากเครื่องผู้ใช้งานจริง
