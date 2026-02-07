# 🚀 Render.com Deployment Guide

## Addım 1: Render.com Dashboard

1. https://dashboard.render.com/ - daxil ol
2. **New +** düyməsinə bas
3. **Web Service** seç

## Addım 2: GitHub Repository Bağla

1. **Connect a repository** seç
2. `gupi9163-lab/bdu` repo-nu tap və seç
3. **Connect** düyməsinə bas

## Addım 3: Konfiqurasiya

### Əsas Parametrlər:
- **Name**: `bdu-chat` (və ya istədiyiniz ad)
- **Region**: `Oregon (US West)` (database ilə eyni region)
- **Branch**: `main`
- **Root Directory**: (boş buraxın)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Instance Type:
- **Free** seç (başlanğıc üçün kifayətdir)

## Addım 4: Environment Variables

**Environment Variables** bölməsinə bu 3 dəyişəni əlavə edin:

```
DATABASE_URL=postgresql://bdus_1be8_user:Ap7bFxafa9S0gpFm0H1C9qB8mmrf4c@dpg-d831174e80s73becsig-a.oregon-postgres.render.com/bdus_1be8

SESSION_SECRET=bdu-chat-secret-key-2024-super-secure

NODE_ENV=production
```

### Necə əlavə etmək:
1. **Add Environment Variable** düyməsinə bas
2. **Key**: `DATABASE_URL`
3. **Value**: (yuxarıdakı URL-i kopyala)
4. Digər 2 dəyişəni də eyni qaydada əlavə et

## Addım 5: Deploy Başlat

1. **Create Web Service** düyməsinə bas
2. Deploy başlayacaq (2-3 dəqiqə çəkə bilər)
3. Logs-da bu mesajları gözləyin:
   ```
   ✅ Database bağlantısı uğurlu
   🚀 Server 10000 portunda işləyir
   ```

## Addım 6: Database Migration (ÖNƏMLİ!)

⚠️ **Bu addım MÜTLƏQ icra edilməlidir, əks halda sayt işləməyəcək!**

1. Deploy tamamlandıqdan sonra, servis səhifəsində **Shell** tab-a keç
2. Aşağıdakı komandanı daxil edin:
   ```bash
   node migrate.js
   ```
3. Bu mesajları görməlisiniz:
   ```
   ✅ Bağlantı uğurlu
   ✅ Migration uğurla tamamlandı!
   🎉 Artıq serveri başlada bilərsiniz
   ```

## Addım 7: Servisi Restart Et

1. Sağ yuxarı küncdə **Manual Deploy** dropdown-dan
2. **Restart service** seç
3. Restart tamamlanana qədər gözləyin

## Addım 8: Saytı Test Et

1. Servis səhifəsində yuxarıda görünən URL-i açın
   - Məsələn: `https://bdu-chat.onrender.com`

2. Ana səhifə açılmalıdır:
   - ✅ Login/Register formlar
   - ✅ Admin panel düyməsi

3. **Admin ilə test edin**:
   - Admin tab-a keç
   - İstifadəçi adı: `618ursamajor618major`
   - Şifrə: `majorursa618`
   - Giriş edin və admin panel açılmalıdır

4. **Qeydiyyat test edin**:
   - Register tab-a keç
   - Test məlumatları ilə qeydiyyatdan keçin
   - Email: `test@bsu.edu.az`
   - Telefon: `+994501234567`
   - Doğrulama suallarından 2-ni doğru cavablandırın

## Addım 9: URL-i Yaddaşda Saxla

Saytınızın URL-i:
```
https://[your-service-name].onrender.com
```

Bu URL-i dostlarınızla paylaşa bilərsiniz!

---

## ⚠️ Problemlər və Həllər

### Problem: "admin_settings does not exist"
**Həll**: Shell-dən `node migrate.js` icra etməyiniz lazımdır (Addım 6)

### Problem: Login işləmir
**Həll**: 
1. Environment variables düzgün daxil edildiyini yoxlayın
2. Servisi restart edin
3. Browser cache-ni təmizləyin

### Problem: Database connection error
**Həll**:
1. DATABASE_URL düzgün kopyalandığını yoxlayın
2. Oregon region seçdiyinizi təsdiqləyin
3. Render.com database-in aktiv olduğunu yoxlayın

---

## 📞 Dəstək

Hər hansı problem olarsa:
1. Render.com Logs tab-ını yoxlayın
2. Browser Console-u yoxlayın (F12)
3. GitHub Issues-a yazın

## 🎉 Uğurlar!

Saytınız artıq işləkdir! Tələbələr qeydiyyatdan keçib chat etməyə başlaya bilər.
