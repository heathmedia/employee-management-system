const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { requireLogin, requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = 3000;
const DEPARTMENTS = {
    creative: 'Creative',
    finance: 'Finance',
    engineering: 'Engineering',
    hr: 'Human Resources',
    it: 'Information Technology',
    marketing: 'Marketing',
    operations: 'Operations',
};

app.use(express.urlencoded({ extended: true }));
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

// Auto-inject session data into all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.role = req.session.user?.role || null;
    res.locals.DEPARTMENTS = DEPARTMENTS;

    // Read flash then immediately clear it so it only shows once
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    next();
});

// Auth routes
app.get('/login', (req, res) => {
    if (req.session.user) { // already logged in
        return res.redirect('/dashboard');
    }
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        res.locals.flash = { type: "error", message: "Invalid email or password" };
        return res.render('login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.locals.flash = { type: "error", message: "Invalid email or password" }
        return res.render('login');
    }

    // Save only safe fields to session - never the password hash
    req.session.user = { id: user.id, email: user.email, role: user.role };

    // Redirect based on role
    if (user.role === 'admin') {
        return res.redirect('/dashboard'); l
    }
    res.redirect('/directory');
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/signup', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') { // already logged in
        if (req.session.user.role === 'admin') {
            return res.redirect('/dashboard');
        } else {
            return res.redirect('/directory');
        }
    }
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const users = readUsers()

    // check if email is already taken
    if (users.find(user => user.email.toLowerCase() === email.toLowerCase())) {
        res.locals.flash = { type: "error", message: "Email address already taken. Sign in or try a different email." };
        return res.render('signup');
    }

    const employees = readEmployees();
    const employee = employees.find(employee => employee.email.toLowerCase() === email.toLowerCase());

    

    // check if email is a valid employee email
    if (!employee) {
        res.locals.flash = { type: "error", message: "Invalid email. Please try again or contact your administrator." };
        return res.render('signup')
    }

    // save new user
    const user = {
        id: employee.id,
        email: employee.email,
        password: await bcrypt.hash(password, 10),
        role: 'user'
    };

    users.push(user);
    writeUsers(users);
    console.log("NEW USER CREATED", user.email);
    req.session.flash = { type: "success", message: "New account created. Please sign in." }
    res.redirect('login');
    
});

// Protected routes
app.get('/dashboard', requireAdmin, (req, res) => {
    const employees = readEmployees();
    employees.sort((a,b) => new Date(b.joinDate) - new Date(a.joinDate))
    res.render('dashboard', {
        employees: employees,
        recentHires: employees.slice(0,5)
    });
});

app.get('/directory', requireLogin, (req, res) => {
    const employees = readEmployees();
    res.render('directory', {
        employees: employees
    });
});

app.get('profile', requireLogin, (req, res) => {
    res.render('profile');
});

app.get('/', (req, res) => {
    res.redirect('/login')
});

app.get('/addEmployee', requireAdmin, (req, res) => {
    res.render('addEmployee')
});

app.post('/addEmployee', requireAdmin, (req, res) => {
    console.log("POST to /addEmployee...")
    const { fname, lname, role, email, phone, department, joinDate, location } = req.body;
    const employees = readEmployees();
    const users = readUsers();
    
    const newEmployee = {
        id: crypto.randomUUID(),
        fname,
        lname,
        department,
        role,
        email: email.toLowerCase(),
        phone,
        joinDate,
        location
    };

    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const existingEmployee = employees.find(e => e.email.toLowerCase() === email.toLowerCase());

    if (existingUser || existingEmployee) {
        req.session.flash = { type: "error", message: `A account with the email ${email} already exists.`};
        return res.redirect('/addEmployee');
    }

    console.log("NEW EMPLOYEE", newEmployee);

    employees.push(newEmployee);
    writeEmployees(employees);

    req.session.flash = { type: 'success', message: 'Employee added successfully' }
    res.redirect('dashboard');
});

app.get('/editEmployee/:id', requireAdmin, (req, res) => {
    console.log("EDIT EMPLOYEE, ID:", req.params.id);

    const employees = readEmployees();
    const employee = employees.find(employee => employee.id === req.params.id);

    if(!employee) {
        res.locals.flash = { type: 'error', message: "Employee not found." }
        return res.render('editEmployee', { employee: null });
    }

    res.render('editEmployee', { employee: employee });
});

app.post('/editEmployee/:id', requireAdmin, (req, res) => {
    console.log("EDIT EMPLOYEE (PUT)");
    const { fname, lname, role, email, phone, department, joinDate, location } = req.body;
    const employees = readEmployees();
    const filteredEmployees = employees.filter(employee => employee.id !== req.params.id);
    const editedEmployee = {
        id: req.params.id,
        fname,
        lname,
        department,
        role,
        email,
        phone,
        joinDate,
        location
    };
    filteredEmployees.push(editedEmployee);
    writeEmployees(filteredEmployees);
    
    req.session.flash = { type: "success", message: "Employee updated successfully" }; 
    res.redirect('/dashboard');
});

app.post('/deleteEmployee/:id', requireAdmin, (req, res) => {
    console.log("DELETE EMPLOYEE, ID:", req.params.id);

    // Delete employee
    const employees = readEmployees();
    const filteredEmployees = employees.filter(employee => employee.id !== req.params.id);
    writeEmployees(filteredEmployees);

    // Delete associated user account
    const users = readUsers();
    const filteredUsers = users.filter(user => user.id !== req.params.id);
    writeUsers(filteredUsers);

    res.sendStatus(200);
});

// Read / write functions for users and employees
function readUsers() {
    const data = fs.readFileSync('./data/users.json', 'utf-8');
    return JSON.parse(data);
}

function writeUsers(data) {
    try {
        fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 2));
        return true;
    } catch {
        console.log('ERROR: unable to write user to file.');
        return false;
    }
}

function readEmployees() {
    try {
        const data = fs.readFileSync('./data/employees.json', 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeEmployees(data) {
    try {
        fs.writeFileSync('./data/employees.json', JSON.stringify(data, null, 2));
        return true;
    } catch {
        console.log('ERROR: unable to write employee to file.');
        return false;
    }
}

app.listen(PORT, () => console.log('Server running on port', PORT))