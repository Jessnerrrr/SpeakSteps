function getRegistrationStatus(
  nodeEnv = process.env.NODE_ENV,
  autoApprove = process.env.AUTO_APPROVE_REGISTRATIONS,
) {
  return nodeEnv !== 'production' && autoApprove === 'true' ? 'verified' : 'pending';
}

module.exports = { getRegistrationStatus };
