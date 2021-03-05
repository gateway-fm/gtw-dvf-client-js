const DVFError = require('../DVFError')
const _ = require('lodash')

module.exports = (dvf, starkTokenId) => {
  const {tokenRegistry} = dvf.config

  if (!tokenRegistry) {
    throw new DVFError('NO_TOKEN_REGISTRY')
  }
  const tokenInfo = _.find(tokenRegistry, {
    starkTokenId
  })

  if (!tokenInfo) {
    const validTokens = Object.keys(tokenRegistry)
    throw new DVFError('ERR_INVALID_TOKEN', {token, validTokens})
  }

  return tokenInfo
}
