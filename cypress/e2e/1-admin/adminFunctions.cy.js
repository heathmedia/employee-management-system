describe('Admin functions', () => {

    const employee = Cypress.env('newEmployee');

    // Ensure the e2e test user is not already saved.
    // An existing user with the test user's email will break the addEmployee test.
    before(() => {
        cy.request('POST', '/login', {
            email:    Cypress.env('adminEmail'),
            password: Cypress.env('adminPassword')
            }).then(() => {
                cy.request('GET', '/api/employees').then(response => {
                    const empExists = response.body.find(e => e.email === employee.email);

                    if (empExists) {
                        cy.request('POST', `/deleteEmployee/${employee.id}`);
                    }
                });
            });
    });

    it('logs in successfully', () => {
        cy.visit('/logout');
        cy.visit('/');

        cy.get('input[name=email]').type(Cypress.env('adminEmail'));
        cy.get('input[name=password]').type(Cypress.env('adminPassword'));
        cy.get('button[type=submit]').click();

        cy.url().should('include', '/dashboard');
        cy.contains('h1', 'Dashboard').should('be.visible');
    });

    it('can add an employee', () => {
        cy.visit('/logout');
        cy.visit('/');

        cy.get('input[name=email]').type(Cypress.env('adminEmail'));
        cy.get('input[name=password]').type(Cypress.env('adminPassword'));
        cy.get('button[type=submit]').click();

        // Click the Add Employee button on Dashboard
        cy.get('#addEmployeeButton').click();

        // Fill out the form with the new employee's details
        cy.get('input[name=fname]').type(employee.fname);
        cy.get('input[name=lname]').type(employee.lname);
        cy.get('select[name=department]').select(employee.department);
        cy.get('input[name=role]').type(employee.role);
        cy.get('input[name=email]').type(employee.email);
        cy.get('input[name=phone]').type(employee.phone);
        cy.get('input[name=joinDate').type(employee.joinDate);
        cy.get('input[name=location]').type(employee.location);
        
        // Save the employee
        cy.get('input[type=submit]').click();

        // Verify employee appears on Dashboard
        cy.get('table#employeeList').within(() => {
            cy.contains('tr', employee.email).within(() => {
                ['firstName', 'lastName', 'email', 'departmentDisplay', 'role', 'location', 'joinDate'].forEach(field => {
                    cy.contains(new RegExp(employee[field], 'i')).should('be.visible');
                });
            });
        });
    });

    it('cannot add an employee with a taken email address', () => {
        
        cy.visit('/logout');
        cy.visit('/');

        cy.get('input[name=email]').type(Cypress.env('adminEmail'));
        cy.get('input[name=password]').type(Cypress.env('adminPassword'));
        cy.get('button[type=submit]').click();

        // Click the Add Employee button on Dashboard
        cy.get('#addEmployeeButton').click();

        // Fill out the form with the new employee's details
        cy.get('input[name=fname]').type(employee.fname);
        cy.get('input[name=lname]').type(employee.lname);
        cy.get('select[name=department]').select(employee.department);
        cy.get('input[name=role]').type(employee.role);
        cy.get('input[name=email]').type(employee.email);
        cy.get('input[name=phone]').type(employee.phone);
        cy.get('input[name=joinDate').type(employee.joinDate);
        cy.get('input[name=location]').type(employee.location);
        
        // Save the employee
        cy.get('input[type=submit]').click();

        // Verify there is an error message that the employee already exists
        cy.get('.error-box').
            should('contain.text', `An account with the email ${employee.email} already exists.`);
    });

    it('can delete an employee', () => {
        cy.visit('/logout');
        cy.visit('/');

        cy.get('input[name=email]').type(Cypress.env('adminEmail'));
        cy.get('input[name=password]').type(Cypress.env('adminPassword'));
        cy.get('button[type=submit]').click();

        // Click the Add Employee button on Dashboard
        cy.visit('/dashboard');

        // Click Delete button on employee row in employee table
        cy.get('table#employeeList').within(() => {
            cy.contains('tr', employee.email).within(() => {
                    cy.get('button.delete-btn').click();
            });
        });

        // Auto-accept dialog on pop-up
        cy.on('window:confirm', () => true);

        // Assert the row is gone in the employee table
        cy.get('table#employeeList').within(() => {
            cy.contains('tr', employee.email).should('not.exist');
        });
    });
});