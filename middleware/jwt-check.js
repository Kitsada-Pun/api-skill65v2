const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(/\s+/)[1]
    if (!token) {
      throw new Error('No token')
    }
    let data = jwt.verify(token, req.config.jwt.secret, req.config.jwt.options)
    req.token = data
    next()
  } catch (e) {
    res.send({
      ok: 0,
      error: 'Invalid token',
    })
  }
}
