const mockServices = require('../data/mockServices');

function preparePayment(req, res) {
  const serviceIdValue = req.params.serviceId;
  const serviceId = /^\d+$/.test(serviceIdValue) ? Number(serviceIdValue) : NaN;
  const service = mockServices.find((item) => item.id === serviceId);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  return res.status(200).json({
    serviceId: service.id,
    serviceName: service.name,
    amount: service.price,
    currency: 'sgd',
    status: 'READY_FOR_PAYMENT'
  });
}

module.exports = { preparePayment };
