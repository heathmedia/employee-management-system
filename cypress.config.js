const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: true,

  e2e: {
    baseUrl: 'http://localhost:3000',
    env: {
      adminEmail: 'admin@co.com',
      adminPassword: 'admin123',
      newEmployee: {
        fname: 'Firstname',
        lname: 'Lastname',
        email: 'firstname@lastname.com',
        phone: '+1 (555) 123-4567',
        department: 'engineering',
        departmentDisplay: 'Engineering',
        role: 'Senior QA Engineer',
        joinDate: '2024-10-06',
        location: 'Detroit, MI'
      }
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
