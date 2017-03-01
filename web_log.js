var log_config = require('../config.json').client.log
//var cl = require('./console_log').client_log;

var cl = require('../utils/console_log').client_log



//console.log('cl',log_config)
//
//console.log('log_config',log_config)
//
//cl('_log_config',log_config)

exports.throw_error = function (str) {
  throw new Error(str)
}


// options:
//   log2console - выводить сообщения на консоль
//   store_messages - хранить сообщения

var logger_class = exports.logger_class = function (options) {
  options || (options = {})
  if (options.log2console) this.log2console = options.log2console
  else if (log_config.console) this.log2console = log_config.console
  else this.log2console = false
  if (options.store_messages) this.store_messages = options.store_messages
  else this.store_messages = false
  this.STORE_LIMIT = 20
  this.init()
}

logger_class.prototype.init = function () {
  this.store = []
}

logger_class.prototype.log = function (level, message) {
  if (this.log2console) console.log(message)
  if (this.store_messages && this.store.length < this.STORE_LIMIT)
    this.store.push({level: level, message: message})
}

logger_class.prototype.error = function (message) {
  this.log('error', message)
}


var logger = exports.logger = new logger_class()


exports.error = function (mess) {
  logger.error(mess)
}

exports.errors = function (messages) {
  for (var i in messages)
    logger.error(mess)
}
