# BDU Chat - Bakı Dövlət Universiteti Tələbə Platforması

## Layihə Haqqında
**BDU Chat** Bakı Dövlət Universiteti tələbələri üçün real-time chat platformasıdır. 16 fakültə üçün ayrı-ayrı chat otaqları və şəxsi mesajlaşma imkanı təqdim edir.

## Əsas Xüsusiyyətlər

### ✅ Tamamlanmış Funksiyalar
- ✅ Qeydiyyat sistemi (email: @bsu.edu.az, telefon: +994)
- ✅ Doğrulama sualları (minimum 2/3 doğru cavab)
- ✅ 16 fakültə üçün ayrı chat otaqları
- ✅ Real-time mesajlaşma (Socket.IO)
- ✅ Şəxsi mesajlaşma
- ✅ Əngəlləmə funksiyası
- ✅ Şikayət sistemi
- ✅ Profil redaktəsi (ad, fakültə, dərəcə, kurs, avatar)
- ✅ Admin paneli
  - İstifadəçi idarəetməsi (aktiv/deaktiv)
  - Şübhəli hesablar (8+ şikayət)
  - Qaydalar və Haqqında bölmələri
  - Günün mövzusu
  - Söz filtri
  - Mesaj silmə vaxtı (qrup və şəxsi)
  - Alt admin yaratma
- ✅ PostgreSQL database (Render.com)
- ✅ Bakı saatına uyğun tarix/saat
- ✅ Modern və responsive dizayn

## Texnologiyalar
- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML, CSS (Tailwind), Vanilla JavaScript
- **Database**: PostgreSQL (Render.com)
- **Authentication**: bcryptjs, express-session
- **Real-time**: Socket.IO

## Database Strukturu

### Tables
1. **users** - İstifadəçi məlumatları
2. **faculties** - 16 fakültə məlumatları
3. **chat_rooms** - Chat otaqları
4. **messages** - Qrup mesajları
5. **private_messages** - Şəxsi mesajlar
6. **blocks** - Əngəlləmələr
7. **reports** - Şikayətlər
8. **admin_settings** - Admin parametrləri
9. **admins** - Admin istifadəçiləri
10. **session** - Session məlumatları

## Quraşdırma

### 1. Database Migrasiyanı İcra Et
```bash
# Render.com PostgreSQL console-dan
psql postgresql://bdus_1be8_user:Ap7bFxafa9S0gpFm0H1C9qB8mmrf4c@dpg-d831174e80s73becsig-a.oregon-postgres.render.com/bdus_1be8

# Migration faylını icra et
\i /path/to/migrations/001_initial_schema.sql
```

### 2. Environment Variables
`.env` faylında:
```
DB_HOST=dpg-d831174e80s73becsig-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=bdus_1be8
DB_USER=bdus_1be8_user
DB_PASSWORD=Ap7bFxafa9S0gpFm0H1C9qB8mmrf4c
SESSION_SECRET=bdu-chat-secret-key-2024-super-secure
NODE_ENV=production
PORT=3000
```

### 3. Lokal İşlətmə
```bash
npm install
npm start
```

### 4. Render.com Deploy
1. GitHub-a push et
2. Render.com-da yeni Web Service yarat
3. GitHub repo-nu bağla
4. Environment variables əlavə et
5. Deploy et

## API Endpoints

### Authentication
- `POST /api/register` - Qeydiyyat
- `POST /api/login` - Giriş
- `POST /api/logout` - Çıxış
- `GET /api/me` - Cari istifadəçi

### Chat
- `GET /api/faculties` - Fakültələr
- `GET /api/messages/:faculty` - Qrup mesajları
- `GET /api/private-messages/:userId` - Şəxsi mesajlar
- `POST /api/block/:userId` - Əngəllə
- `POST /api/report/:userId` - Şikayət et

### Profile
- `PUT /api/profile` - Profili yenilə
- `GET /api/rules` - Qaydalar
- `GET /api/about` - Haqqında
- `GET /api/topic-of-day` - Günün mövzusu

### Admin
- `POST /api/admin/login` - Admin girişi
- `GET /api/admin/users` - İstifadəçilər
- `GET /api/admin/suspicious` - Şübhəli hesablar
- `GET /api/admin/settings` - Parametrlər
- `PUT /api/admin/settings` - Parametrləri yenilə
- `PUT /api/admin/users/:userId/toggle` - Aktiv/Deaktiv
- `POST /api/admin/create-sub-admin` - Alt admin yarat

## Socket.IO Events

### Client → Server
- `join-faculty` - Fakültə otağına qoşul
- `send-message` - Qrup mesajı göndər
- `join-private` - Şəxsi otağa qoşul
- `send-private-message` - Şəxsi mesaj göndər

### Server → Client
- `new-message` - Yeni qrup mesajı
- `new-private-message` - Yeni şəxsi mesaj

## Admin Girişi
- **İstifadəçi adı**: 618ursamajor618major
- **Şifrə**: majorursa618

## Fakültələr və Korpuslar
1. Mexanika-riyaziyyat fakültəsi - **3**
2. Tətbiqi riyaziyyat və kibernetika fakültəsi - **3**
3. Fizika fakültəsi - **əsas**
4. Kimya fakültəsi - **əsas**
5. Biologiya fakültəsi - **əsas**
6. Ekologiya və torpaqşünaslıq fakültəsi - **əsas**
7. Coğrafiya fakültəsi - **əsas**
8. Geologiya fakültəsi - **əsas**
9. Filologiya fakültəsi - **1**
10. Tarix fakültəsi - **3**
11. Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi - **1**
12. Hüquq fakültəsi - **1**
13. Jurnalistika fakültəsi - **2**
14. İnformasiya və sənəd menecmenti fakültəsi - **2**
15. Şərqşünaslıq fakültəsi - **2**
16. Sosial elmlər və psixologiya fakültəsi - **2**

## Yol Xəritəsi

### Növbəti Addımlar
1. ✅ Render.com deployment
2. 🔄 SSL sertifikatı
3. 🔄 Custom domain
4. 🔄 Push notifications
5. 🔄 File sharing

## Deployment Status
- **Platform**: Render.com
- **Status**: 🔄 Hazırlanır
- **Database**: PostgreSQL (Render.com)
- **Last Updated**: 2026-02-07

## Müəllif
Bakı Dövlət Universiteti tələbələri üçün
