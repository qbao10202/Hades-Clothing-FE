export const environment = {
  production: true,
  apiUrl: 'https://hades-clothing-be-production.up.railway.app/api',
  stripePublicKey: 'pk_live_your-stripe-public-key',
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
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100]
  },
  cache: {
    ttl: 600000 // 10 minutes
  }
}; 