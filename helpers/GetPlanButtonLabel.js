function getPlanButtonLabel(planName, price) {
  if (planName.toLowerCase() === "enterprise") {
    return "Contact Sales";
  }

  if (price === 0) {
    return "Start Free";
  }

  return "Choose Plan";
}
module.exports = getPlanButtonLabel;