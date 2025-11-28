# Railway.app MySQL Bağlantı Rehberi

## Railway'den Gelen Değişkenler

Railway MySQL servisinizden şu değişkenler var:

- `MYSQLDATABASE` = `railway`
- `MYSQLUSER` = `root`
- `MYSQLPASSWORD` = `xFjQAcmSipWeeJXtwOzjFsPwGRRnPgXj`
- `MYSQLHOST` = `mysql.railway.internal`
- `MYSQLPORT` = `3306`

## Web Servisine Bağlama (2 Yöntem)

### Yöntem 1: Railway'in Otomatik Bağlantısı (ÖNERİLEN)

1. Railway dashboard'da **Web servisinize** (Node.js uygulamanız) tıklayın
2. **"Variables"** sekmesine gidin
3. Sağ üstte **"+ New Variable"** butonuna tıklayın
4. **"Reference"** sekmesine geçin
5. MySQL servisinizi seçin
6. Şu eşlemeleri yapın (her biri için ayrı ayrı ekleyin):

   - **Variable**: `MYSQLDATABASE` → **Alias**: `DB_NAME`
   - **Variable**: `MYSQLUSER` → **Alias**: `DB_USER`
   - **Variable**: `MYSQLPASSWORD` → **Alias**: `DB_PASSWORD`
   - **Variable**: `MYSQLHOST` → **Alias**: `DB_HOST`
   - **Variable**: `MYSQLPORT` → **Alias**: `DB_PORT`

7. Her birini **"Add"** butonuyla ekleyin

### Yöntem 2: Manuel Environment Variables (Alternatif)

Eğer otomatik bağlantı çalışmazsa, manuel olarak ekleyin:

1. Web servisinizde **"Variables"** sekmesine gidin
2. **"+ New Variable"** butonuna tıklayın
3. Aşağıdaki değişkenleri tek tek ekleyin:

```
DB_NAME=railway
DB_USER=root
DB_PASSWORD=xFjQAcmSipWeeJXtwOzjFsPwGRRnPgXj
DB_HOST=mysql.railway.internal
DB_PORT=3306
NODE_ENV=production
```

## Önemli: Veritabanı Adı

Railway'de veritabanı adı `railway` olarak oluşturulmuş. Kodunuzda varsayılan olarak `mudeir_stok` bekliyor ama `DB_NAME` environment variable'ı set edildiğinde `railway` kullanılacak.

**İsteğe bağlı:** Eğer veritabanı adını `mudeir_stok` yapmak isterseniz:

- MySQL servisinde `MYSQLDATABASE` değerini `mudeir_stok` olarak değiştirin
- Veya kodunuzda `DB_NAME=railway` olarak bırakın (hiçbir sorun olmaz)

## Deploy Yeniden Başlatma

Environment variable'ları ekledikten sonra:

1. Web servisinizde **"Deployments"** sekmesine gidin
2. En üstteki deployment'ın yanındaki **"⋯"** (üç nokta) menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin

Veya:

- Railway otomatik olarak yeniden deploy edebilir
- Biraz bekleyin ve logları kontrol edin

## Kontrol

Deploy tamamlandıktan sonra:

1. **"Logs"** sekmesine gidin
2. Şu mesajları görmelisiniz:
   - ✅ `Veritabanı bağlantısı başarılı.` (veya `MySQL bağlantısı başarılı.`)
   - ✅ `Tablolar senkronize edildi.`

Eğer hata görürseniz, logları paylaşın.

## Sorun Giderme

### "Access denied" hatası:

- `DB_PASSWORD` doğru kopyalandığından emin olun
- Boşluk veya özel karakter olmamalı

### "Unknown database" hatası:

- `DB_NAME=railway` olduğundan emin olun
- Veritabanı adının doğru olduğunu kontrol edin

### "Host not found" hatası:

- `DB_HOST=mysql.railway.internal` olduğundan emin olun
- İç bağlantı kullanıyoruz (internal), bu normal

## Tamamlandı! 🎉

Environment variable'ları ekledikten ve redeploy ettikten sonra uygulamanız çalışacak!
