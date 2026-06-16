describe('Admin login', () => {
  it('logs in successfully', () => {
    cy.visit('/');

    cy.get('input[name=email]').type(Cypress.env('adminEmail'));
    cy.get('input[name=password]').type(Cypress.env('adminPassword'));
    cy.get('button[type=submit]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard').should('be.visible')
  })
})