const path = require('path');
const dotenv = require('dotenv');
dotenv.config({path: path.join(__dirname, '../.env')});

//Çıkış yapmış token'ları temizleme işlemleri için gerekli fonksiyon
//Tüm dosya işlemleri FileOperations modülünde gerçekleştiriliyor
const { cleanRevokedTokens } = require('./utils/fileOperations');


const app = require('./app');

// Sunucunun çalışacağı portu belirle (çevresel değişken PORT yoksa 3000 kullan)
const PORT = process.env.PORT || 3000;

// Sunucuyu başlat
const server = app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);

    //Başlangıçta kaldırılmış token'ları temizle 
    cleanRevokedTokens();
    const cleanupInterval = setInterval(cleanRevokedTokens, 60 * 60 * 1000); // Her saat başı kaldırılmış token'ları temizleme işlemi yap
    
    // Üst üste kapatma durumunu önlemek için flag kullan
    let isShuttingDown = false;
    const shutdown = () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        clearInterval(cleanupInterval);
        server.close(() => {
            console.log('Server is shutting down...');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
});
