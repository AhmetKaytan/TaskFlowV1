# TaskFlow V1

TaskFlow V1, görevleri yönetmek için geliştirilmiş bir REST API projesidir. Node.js ve Express kullanır; kullanıcıları ve görevleri JSON dosyalarında saklar. Kullanıcı kimlik doğrulaması JWT ile yapılır. Görev ve rapor rotalarına erişmek için geçerli bir JWT gereklidir.

Bu sürümde JWT kullanıcıyı doğrular; ancak görevler kullanıcı hesaplarına göre ayrılmaz. Tüm giriş yapmış kullanıcılar aynı görev listesini görür.

## Gereksinimler

- Node.js 18 veya üzeri
- npm

## Kurulum

Projeyi klonlayın:

```bash
git clone https://github.com/AhmetKaytan/TaskFlowV1.git
```

Proje klasörüne konumlanın:

```bash
cd taskflow
```

Bağımlılıkları yükleyin:

```bash
npm install
```

`.env.example` dosyasını `.env` adıyla kopyalayın. Ardından `.env` içindeki değerleri yerel ortamınıza göre düzenleyin:

```env
PORT=3000
API_URL=http://localhost:3000
JWT_SECRET=yerel-ortaminizda-uretilmis-guclu-rastgele-deger
JWT_EXPIRES_IN=1h
```

`JWT_SECRET` için uzun ve rastgele bir değer kullanın. Gerçek gizli anahtarınızı paylaşmayın.

`PORT` belirtilmezse sunucu varsayılan olarak `3000` portunu kullanır. `API_URL`, örnek ortam dosyasında yer alsa da mevcut backend kodunda kullanılmamaktadır.

## Başlatma

Sunucuyu başlatmak için:

```bash
npm start
```

Sunucu varsayılan olarak `http://localhost:3000` adresinde çalışır. Farklı bir port belirlediyseniz isteklerde ilgili portu kullanın.

## Kimlik Doğrulama ve JWT

Kayıt ve giriş rotaları JWT gerektirmez.

### Kullanıcı Kaydı

```http
POST /auth/register
Content-Type: application/json

{
  "username": "ornek_kullanici",
  "password": "guclu-bir-parola",
  "email": "ornek@example.com"
}
```

`email` alanı isteğe bağlıdır. Kullanıcı adı 3–30 karakter arasında, parola ise en az 8 karakter olmalıdır.

### Kullanıcı Girişi

```http
POST /auth/login
Content-Type: application/json

{
  "username": "ornek_kullanici",
  "password": "guclu-bir-parola"
}
```

Başarılı giriş yanıtındaki `token` alanı JWT'yi içerir. Sunucu, her girişte oluşturulan JWT'ye benzersiz bir `jti` (JWT ID) ekler.

Korumalı rotalara istek gönderirken token aşağıdaki başlıkta iletilmelidir:

```http
Authorization: Bearer <token>
```

### Çıkış (Logout)

Çıkış yapmak için geçerli oturum token'ını gönderin:

```http
POST /auth/logout
Authorization: Bearer <token>
```

Logout işlemi, mevcut token'ın `jti` ve son kullanma zamanını `src/data/revokedTokens.json` dosyasına kaydeder. İşlem başarılı olduğunda aynı token sonraki korumalı isteklerde `403` yanıtıyla reddedilir.

Logout yalnızca gönderilen token'ı iptal eder. Başka cihazlarda veya oturumlarda alınmış token'ların da iptal edilmesi için ayrı logout istekleri gönderilmelidir.

Sunucu başlarken ve sonrasında saatte bir süresi dolmuş iptal kayıtları temizlenir.

`src/data/revokedTokens.json` dosyası geçerli JSON biçiminde bulunmalıdır. Başlangıç içeriği şu şekildedir:

```json
{
  "revokedTokens": []
}
```

Korumalı rotalarda karşılaşılabilecek bazı HTTP durum kodları:

- `401`: Authorization başlığı gönderilmediğinde.
- `403`: Geçersiz, süresi dolmuş veya iptal edilmiş token gönderildiğinde.
- `500`: İptal edilmiş token listesinin okunamadığı durumlarda.

## API Rotaları

`BASE_URL`, örneğin `http://localhost:3000` anlamına gelir.

| Yöntem   | Rota                        | Açıklama                                                                  | JWT      |
| -------- | --------------------------- | ------------------------------------------------------------------------- | -------- |
| `POST`   | `/auth/register`            | Kullanıcı kaydı                                                           | Gerekmez |
| `POST`   | `/auth/login`               | Giriş yaparak JWT alma                                                    | Gerekmez |
| `POST`   | `/auth/logout`              | Gönderilen JWT'yi iptal etme                                              | Gerekli  |
| `GET`    | `/tasks`                    | Görevleri listeleme; `status`, `priority`, `assignee`, `title` filtreleri | Gerekli  |
| `POST`   | `/tasks`                    | Görev oluşturma                                                           | Gerekli  |
| `GET`    | `/tasks/search?keyword=...` | Başlık, açıklama veya atanan kişiye göre arama                            | Gerekli  |
| `GET`    | `/tasks/assignee/:name`     | Atanan kişiye göre görevleri listeleme                                    | Gerekli  |
| `GET`    | `/tasks/:id`                | Görevi ID ile getirme                                                     | Gerekli  |
| `PUT`    | `/tasks/:id`                | Görevi güncelleme                                                         | Gerekli  |
| `DELETE` | `/tasks/:id`                | Görevi silme                                                              | Gerekli  |
| `GET`    | `/reports/completed`        | Tamamlanan görevleri listeleme                                            | Gerekli  |
| `GET`    | `/reports/pending`          | Bekleyen görevleri listeleme                                              | Gerekli  |
| `GET`    | `/reports/summary`          | Görev istatistiklerini getirme                                            | Gerekli  |

### Görev Filtreleme

`GET /tasks` rotası aşağıdaki sorgu parametrelerini destekler:

- `status`
- `priority`
- `assignee`
- `title`

Birden fazla filtre aynı istekte birlikte kullanılabilir.

Örnek:

```http
GET /tasks?status=pending&priority=high
```

### Görev Oluşturma ve Güncelleme

`POST /tasks` ve `PUT /tasks/:id` isteklerinde aşağıdaki alanların tamamı gönderilmelidir:

```json
{
  "title": "Proje dokümantasyonunu tamamla",
  "description": "Kurulum ve kullanım bilgilerini yaz",
  "assignee": "Örnek Kullanıcı",
  "status": "pending",
  "priority": "medium",
  "dueDate": "2027-06-15"
}
```

Alanlara ilişkin doğrulama kuralları:

- `status`: `pending`, `in_progress` veya `completed` değerlerinden biri olmalıdır.
- `priority`: `low`, `medium` veya `high` değerlerinden biri olmalıdır.
- `dueDate`: `YYYY-MM-DD` biçiminde, takvimde geçerli ve gelecekteki bir tarih olmalıdır.
- `title`: En fazla 100 karakter olabilir.
- `assignee`: En fazla 50 karakter olabilir.
- `description`: En fazla 500 karakter olabilir.
- `id`, `createdAt` ve `updatedAt` alanları sunucu tarafından yönetilir ve istek gövdesine eklenmemelidir.

## JSON Veri Dosyaları

Uygulama verileri aşağıdaki JSON dosyalarında saklanır:

- `src/data/tasks.json`: Görevleri ve sıradaki görev ID'sini (`nextId`) saklar.
- `src/data/users.json`: Kullanıcıları ve sıradaki kullanıcı ID'sini (`nextId`) saklar.
- `src/data/revokedTokens.json`: İptal edilmiş JWT'lerin `jti` ve `expiresAt` bilgilerini saklar.
- `src/data/app.log`: İstek metodu ve rotasına ilişkin günlük kayıtlarını saklar.

JSON dosyası kullanımı V1 için bilinçli olarak tercih edilmiştir. Sunucu yeniden başlatılsa bile dosyalardaki veriler korunur.

Görev listesi tüm giriş yapmış kullanıcılar için ortaktır.

## Testler

Proje, otomatik testler için Jest ve Supertest kullanmaktadır.

Testleri çalıştırmak için:

```bash
npm test
```

**Mevcut test durumu:** 4 test paketi içerisinde toplam 51 test başarılıdır.
