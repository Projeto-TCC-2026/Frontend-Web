export const environment = {
  production: true,
// Vazio de propósito: em produção o front e a API ficam no mesmo endereço
// (CloudFront). As chamadas saem como "/api/..." e o CloudFront encaminha
// para a EC2.
apiUrl: '',
};
