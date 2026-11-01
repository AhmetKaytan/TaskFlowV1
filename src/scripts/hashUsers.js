const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');


//Bu script, users.json dosyasındaki kullanıcı şifrelerini bcrypt ile hashler. Gerekli durumda çalıştırılabilir.
async function hashUsers() {
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
    if (!usersData.users || usersData.users.length === 0) {
        return;
    }
    for (const user of usersData.users) {
        if (!user.password.startsWith('$2b$')) {
            user.password = await bcrypt.hash(user.password, 12);
        }
    }
    console.log('Users hashed successfully.');
    fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 4));
    console.log('Users data written to file successfully.');
}

hashUsers();