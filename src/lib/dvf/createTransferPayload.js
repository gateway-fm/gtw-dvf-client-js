// TODO: remove code dup between this and createFastWithdrawalPayload
const {
  Joi,
  toQuantizedAmountBN
} = require('dvf-utils')
const validateWithJoi = require('../validators/validateWithJoi')

const createSignedTransferPayload = require('./createSignedTransferPayload')
const DVFError = require('./DVFError')

const getValidTokenInfo = dvf => token => {
  const tokenInfo = dvf.token.getTokenInfoOrThrow(token)

  if (!tokenInfo.starkVaultId) {
    throw new DVFError(
      'NO_STARK_VAULT_ID_FOR_TOKEN',
      { token, context: 'createTransferPayload' }
    )
  }

  return tokenInfo
}

// TODO: move to dvf-utils
const prefixedHexString = Joi.string()
  .pattern(/^0x[a-f0-9]+$/i)
  .message('"value" must be composed of hexadecimal characters prefixed with: "0x"')
  .description('hexadecimal string prefixed with: "0x"')

const schema = Joi.object({
  amount: Joi.amount(),
  // NOTE: we are not specifying allowed tokens here since these can change
  // dynamically. However a call to `getTokenInfoOrThrow` will ensure that
  // the token in valid.
  token: Joi.string(),
  recipientPublicKey: prefixedHexString,
  recipientVaultId: Joi.number().integer()
  // TODO: provide a way of converting recipientEthAddress into above 2 props.
  // This would require making both recipientPublicKey and recipientVaultId
  // publicly available (or at least available to users who have been granted
  // access by the owner of recipientEthAddress).
  // recipientEthAddress: Joi.ethAddress()
})

const errorProps = { context: 'transfer' }
const validateArg0 = validateWithJoi(schema)('INVALID_METHOD_ARGUMENT')({
  ...errorProps, argIdx: 0
})

module.exports = async (dvf, transferData) => {
  const {
    amount,
    token,
    recipientPublicKey,
    recipientVaultId
  } = validateArg0(transferData)

  const tokenInfo = getValidTokenInfo(dvf)(token)

  const quantisedAmount = toQuantizedAmountBN(tokenInfo, amount)

  const tx = {
    amount: quantisedAmount.toString(),
    receiverPublicKey: recipientPublicKey,
    receiverVaultId: recipientVaultId,
    senderVaultId: tokenInfo.starkVaultId,
    token: tokenInfo.starkTokenId,
    type: 'TransferRequest'
  }

  return createSignedTransferPayload(dvf)(tx)
}
