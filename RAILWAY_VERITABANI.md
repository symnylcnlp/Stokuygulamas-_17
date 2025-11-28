# Railway.app MySQL Veritabanı Kurulum Rehberi

## Adım 1: MySQL Veritabanı Ekleme

Railway.app'de projenizin dashboard'una gidin:

1. **Projenizin sayfasına gidin** (deploy edilen web servisiniz)
2. **"+ New"** butonuna tıklayın
3. **"Database"** seçeneğini seçin
4. **"Add MySQL"** butonuna tıklayın

Alternatif olarak:
- Sol menüden **"+ New"** → **"Database"** → **"Add MySQL"**

## Adım 2: Veritabanı Ayarları

Railway otomatik olarak MySQL veritabanınızı oluşturacak:
- Veritabanı adı, kullanıcı adı, şifre otomatik oluşturulur
- İlk birkaç saniye içinde hazır olur

## Adım 3: Environment Variables Bağlama

Railway'de en güzel özellik: **Otomatik bağlantı!**

1. **MySQL veritabanı servisine tıklayın**
2. **"Variables"** sekmesine gidin
3. Burada göreceksiniz:
   - `MYSQLDATABASE` - Veritabanı adı
   - `MYSQLUSER` - Kullanıcı adı
   - `MYSQLPASSWORD` - Şifre
   - `MYSQLHOST` - Host adresi
   - `MYSQLPORT` - Port (genelde 3306)
   - `MYSQL_URL` - Connection string (isteğe bağlı)

## Adım 4: Web Servisine Bağlama

Şimdi bu değişkenleri web servisinize bağlamalısınız:

### Yöntem 1: Railway'in Otomatik Bağlantısı (Kolay)

1. **Web servisinize tıklayın** (Node.js uygulamanız)
2. **"Variables"** sekmesine gidin
3. Sağ üstte **"Reference Variable"** butonuna tıklayın
4. MySQL veritabanı servisinizi seçin
5. Şu değişkenleri seçin ve ekleyin:
   - `MYSQLDATABASE` → `DB_NAME`
   - `MYSQLUSER` → `DB_USER`
   - `MYSQLPASSWORD` → `DB_PASSWORD`
   - `MYSQLHOST` → `DB_HOST`
   - `MYSQLPORT` → `DB_PORT`

### Yöntem 2: Manuel Environment Variables

Eğer otomatik bağlantı çalışmazsa, manuel olarak ekleyin:

1. **Web servisinize tıklayın**
2. **"Variables"** sekmesine gidin
3. **"New Variable"** butonuna tıklayın
4. Şu değişkenleri ekleyin (MySQL servisinden kopyalayarak):

```
DB_NAME=<MYSQLDATABASE değerini buraya>
DB_USER=<MYSQLUSER değerini buraya>
DB_PASSWORD=<MYSQLPASSWORD değerini buraya>
DB_HOST=<MYSQLHOST değerini buraya>
DB_PORT=<MYSQLPORT değerini buraya>
NODE_ENV=production
```

## Adım 5: Deploy Yeniden Başlatma

Environment variable'ları ekledikten sonra:

1. **Web servisinize gidin**
2. Sağ üstte **"Deployments"** sekmesine tıklayın
3. **"Redeploy"** butonuna tıklayın

Veya:
- Railway otomatik olarak yeniden deploy edecektir (bazen)
- Beklemek istemiyorsanız manuel redeploy yapın

## Adım 6: Tablolar Otomatik Oluşturulacak

Uygulamanız başladığında:
- Veritabanına bağlanacak
- `sequelize.sync({ alter: true })` sayesinde tüm tablolar otomatik oluşturulacak
- Logları kontrol ederek "Veritabanı bağlantısı başarılı" mesajını görmelisiniz

## Önemli Notlar

✅ **Railway'de otomatik bağlantı var** - MySQL ve Web servisi aynı projede olduğunda otomatik bağlanır
✅ **Free tier**: Railway $5 kredi/ay verir, küçük projeler için yeterli
✅ **Tablolar otomatik**: Kodunuzdaki `sequelize.sync` sayesinde tablolar kendiliğinden oluşur
✅ **Port otomatik**: Railway PORT environment variable'ını otomatik set eder

## Sorun Giderme

### Veritabanı bağlanamıyorsa:
1. Environment variable'ların doğru eklendiğini kontrol edin
2. MySQL servisinin "Active" durumunda olduğunu kontrol edin
3. Logları kontrol edin: Web servisiniz → "Logs" sekmesi

### Tablolar oluşmuyorsa:
1. Logları kontrol edin - hata mesajları olabilir
2. Veritabanı bağlantısının başarılı olduğundan emin olun
3. Birkaç saniye bekleyin - sync işlemi zaman alabilir

## Railway Dashboard'da Kontrol

- ✅ Web servisi: "Active" durumunda olmalı
- ✅ MySQL servisi: "Active" durumunda olmalı
- ✅ Deployments: Son deploy "Succeeded" olmalı
- ✅ Logs: Herhangi bir hata mesajı olmamalı

Railway'de her şey hazır! 🚀

