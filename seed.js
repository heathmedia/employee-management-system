const bcrypt = require('bcryptjs');
const fs = require('fs');

async function seed() {
    const users = [
        {
            id: '1',
            email: 'admin@company.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin'
        }
    ];
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
    console.log('users.json seeded!');
}

seed();