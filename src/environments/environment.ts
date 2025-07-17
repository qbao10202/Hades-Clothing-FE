export const environment = {
  production: false,
  apiUrl: '/api',
  // apiUrl: 'https://hades-clothing-be-production.up.railway.app/api',
  stripePublicKey: 'pk_test_your-stripe-public-key',
  paypalClientId: 'your-paypal-client-id',
  appName: 'Sales Application',
  version: '1.0.0',
  features: {
    analytics: true,
    notifications: true,
    payments: true,
    inventory: true,
    reporting: true
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100]
  },
  cache: {
    ttl: 300000 // 5 minutes
  },
  // NOTE: For production, apiUrl should be set to the deployed backend URL in environment.prod.ts
}; 