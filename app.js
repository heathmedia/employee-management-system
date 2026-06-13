const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { requireLogin, requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
    secret: 'replacethiswithalongstring',
    resave: false,                  // don't save session if nothing changed
    saveUninitialized: false,       // don't create session until something is stored
    cookie: {
    httpOnly: true,                 // JS in browser cannot access this cookie
        maxAge: 1000 * 60 * 60 * 2  // 2 hours in milliseconds
    }
}));

// Read users from file
function getUsers() {
    const data = fs.readFileSync('./data/users.json', 'utf-8');
    return JSON.parse(data);
}

// Auth routes
app.get('/login', (req, res) => {
    if (req.session.user) { // already logged in
        return res.redirect('/dashboard'); 
    }
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if(!user) {
        return res.render('login', {
            error: 'Invalid email or password'
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.render('login', {
            error: 'Invalid email or password'
        });
    }

    // Save only safe fields to session - never the password hash
    req.session.user = { id: user.id, email: user.email, role: user.role };

    // Redirect based on rolef
    if (user.role === 'admin') {
        return res.redirect('/dashboard');l
    }
    res.redirect('/my-profile');
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Protected routes
app.get('/dashboard', requireAdmin, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

app.get('my-profile', requireLogin, (req, res) => {
    res.render('profile', { user: req.session.user });
});

// app.get('/', (req, res) => {
//     let msg = "Homepage";
//     res.render('index', { message:  msg });
// });

app.get('/dashboard', requireLogin, (req, res) => {

});

app.listen(PORT, () => console.log('Server running on port', PORT))