describe('User', () => {
  const employee = Cypress.env('newEmployee'); 

  // Ensure the e2e test user is not already saved.
  // An existing user with the test user's email will break the addEmployee test.
  before(() => {
    const emp = Cypress.env('newEmployee');

    cy.request('POST', '/login', {
      email:    Cypress.env('adminEmail'),
      password: Cypress.env('adminPassword')
      }).then(() => {
          cy.request('GET', '/api/employees').then(response => {
              const empExists = response.body.find(e => e.email === employee.email);

              if (empExists) {
                  cy.request('POST', `/deleteEmployee/${empExists.id}`);
              }
          });
      });

      cy.request('GET', '/logout');
  });
  
  it('cannot login as an unregistered user', () => {    
    cy.visit('/');
    cy.get('input[name=email]').type(employee.email);
    cy.get('input[name=password]').type(employee.password);
    cy.get('button[type=submit]').click();

    cy.get('.error-box').
      should('contain.text', `Invalid email or password`);
  });

  it('cannot sign up as a non-employee', () => {
    cy.visit('/signup');
    cy.get('input[name=email]').type(employee.email);
    cy.get('input[name=password]').type(employee.password);
    cy.get('button[type=submit]').click();

    cy.get('.error-box').
      should('contain.text', `Invalid email. Please try again or contact your administrator.`);
  });

  it('can sign up as an employee user', () => {
    cy.request('POST', '/login', {
      email:    Cypress.env('adminEmail'),
      password: Cypress.env('adminPassword')
      }).then(() => {
        cy.request('POST', '/addEmployee', {
          fname:      employee.fname,
          lname:      employee.lname,
          email:      employee.email,
          password:   employee.password,
          phone:      employee.phone,
          joinDate:   employee.joinDate,
          department: employee.department,
          role:       employee.role,
          location:   employee.location

        }).then(response => {
            expect(response.status).to.eq(200);
            cy.request('GET', '/logout');
        });
    });

    cy.visit('/signup');
    cy.get('input[name=email]').type(employee.email);
    cy.get('input[name=password]').type(employee.password);
    cy.get('button[type=submit]').click();

    cy.get('.message-box').
      should('contain.text', `New account created. Please sign in.`);
  });

    it('can log in as a registered user', () => {
      cy.visit('/');

      cy.get('input[name=email]').type(employee.email);
      cy.get('input[name=password]').type(employee.password);
      cy.get('button[type=submit]').click();

      cy.url().should('include', '/directory');
      cy.contains('h1', 'Directory').should('be.visible')
    });
});