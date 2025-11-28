# Railway Veritabanı Bağlantı Hatası Çözümü

## 🔴 Hata

```
ConnectionRefusedError [SequelizeConnectionRefusedError]
ECONNREFUSED
```

Bu hata, environment variable'ların web servisine eklenmediğini gösteriyor.

## ✅ Çözüm Adımları

### 1. Railway Dashboard'da Web Servisinize Gidin

1. Railway.app dashboard'a gidin
2. **Web servisinize tıklayın** (Node.js uygulamanız, "mudeir-stok" veya benzer isim)

### 2. Variables Sekmesine Gidin

1. Sol menüden veya üst sekmeden **"Variables"** sekmesine tıklayın
2. Şu anda muhtemelen boş veya sadece `PORT` var

### 3. Environment Variables Ekleyin

**"+ New Variable"** butonuna tıklayın ve şunları ekleyin:

#### Yöntem A: Reference Variable (Önerilen)

1. **"+ New Variable"** → **"Reference"** sekmesine geçin
2. MySQL servisinizi seçin (dropdown'dan)
3. Aşağıdaki eşlemeleri yapın:

   | Railway Değişkeni | Alias (Buraya Yazın) |
   |-------------------|---------------------|
   | `MYSQLDATABASE` | `DB_NAME` |
   | `MYSQLUSER` | `DB_USER` |
   | `MYSQLPASSWORD` | `DB_PASSWORD` |
   | `MYSQLHOST` | `DB_HOST` |
   | `MYSQLPORT` | `DB_PORT` |

4. Her birini **"Add"** ile ekleyin

#### Yöntem B: Manuel Değerler (Eğer Reference çalışmazsa)

Aşağıdaki değerleri tek tek ekleyin:

```
DB_NAME=railway
DB_USER=root
DB_PASSWORD=xFjQAcmSipWeeJXtwOzjFsPwGRRnPgXj
DB_HOST=mysql.railway.internal
DB_PORT=3306
NODE_ENV=production
```

**ÖNEMLİ:** 
- `DB_HOST` değeri **mutlaka** `mysql.railway.internal` olmalı (internal connection)
- `DB_PORT` = `3306`
- `DB_NAME` = `railway`

### 4. Variables Listesini Kontrol Edin

Web servisinizde şu değişkenlerin olduğundan emin olun:

```
✅ PORT (otomatik eklenir)
✅ DB_NAME
✅ DB_USER
✅ DB_PASSWORD
✅ DB_HOST
✅ DB_PORT
✅ NODE_ENV=production (isteğe bağlı ama önerilir)
```

### 5. Redeploy Yapın

Environment variable'ları ekledikten sonra:

1. **"Deployments"** sekmesine gidin
2. En üstteki deployment'ın yanındaki **"⋯"** (üç nokta) menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin

Veya:
- Railway otomatik olarak yeniden deploy edebilir
- Birkaç saniye bekleyin

### 6. Logları Kontrol Edin

Redeploy tamamlandıktan sonra:

1. **"Logs"** sekmesine gidin
2. Şu mesajları görmelisiniz:

```
✅ Veritabanı bağlantısı başarılı.
✅ Tablolar senkronize edildi.
```

## 🔍 Kontrol Listesi

- [ ] Web servisinde "Variables" sekmesinde `DB_NAME` var mı?
- [ ] `DB_HOST=mysql.railway.internal` olduğundan emin misiniz?
- [ ] `DB_PORT=3306` olduğundan emin misiniz?
- [ ] Tüm değişkenler eklendikten sonra redeploy yaptınız mı?
- [ ] MySQL servisi "Active" durumunda mı?

## 🆘 Hala Çalışmıyorsa

1. **MySQL servisinin durumunu kontrol edin:**
   - MySQL servisine tıklayın
   - "Active" durumunda olduğundan emin olun

2. **Logları tekrar kontrol edin:**
   - Web servisinizde "Logs" sekmesi
   - Yeni hata mesajları var mı bakın

3. **Variables'ları tekrar kontrol edin:**
   - Her bir değerin doğru olduğundan emin olun
   - Özellikle `DB_HOST` ve `DB_PASSWORD`

## 📝 Notlar

- Railway'de internal connection kullanılıyor: `mysql.railway.internal`
- External connection (`centerbeam.proxy.rlwy.net`) kullanmayın, yavaş olur
- Environment variable'lar eklendikten sonra mutlaka redeploy yapın

