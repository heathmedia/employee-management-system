describe('Admin add employee', () => {
    
    const employee = Cypress.env('newEmployee');    
    
    beforeEach(() => {
        cy.loginAsAdmin()
        cy.visit('/dashboard');
    });

    it('can add an employee', () => {

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
  })
})