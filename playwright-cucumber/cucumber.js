module.exports = {
  default: {
    require: [
      "features/step-definitions/*.ts",
      "support/*.ts"
    ],
    format: ["progress"],
    requireModule: ["ts-node/register"]
  }
};