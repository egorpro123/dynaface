/**
 * Сетевые запросы от клиента
 *
 * @module client/web_net
 */

var $ = require('jquery')
var log = require('./web_log')

var cl = require('../utils/console_log').client_log



/**
 * Делает запрос к серверу методом POST
 *
 * @param {string} url
 * @param {object} json шаблон
 * @param {function} callback колбэк в который передаются данные или null
 * @return {boolean}
 */
var post_json = exports.post_json = function(url, obj, callback) {
  $.ajax({
    method: 'POST', 
    url: url, 
    contentType: 'application/json; charset=utf-8',
//    params.data = JSON.stringify(options.attrs || model.toJSON(options));
    processData: false,
    data: JSON.stringify(obj),
//    data: json,
    dataType: 'json',
    success: function(data, status, xhr){
//cl('xhr.statusCode()', xhr.statusCode())
//cl('success: function(data, status, xhr)', data, status)
      if (status === 'success') {
        callback(data)
      }
      else {
        log.error('Какие-то проблемы при запросе post_json() на ' + url + ', ' + 
               JSON.stringify(obj) +
               ': вернулся status - ' + status + ', данные ' + data)
        callback(null)
      }
    },
    error: function(xhr, status, error){
      log.error('Ошибка при запросе post_json() на ' + url + ', ' + JSON.stringify(obj) +
               ': ' + status + ', ' + error)
      callback(null)
    }
  })
}

//    if (data !== null) {
//      $.post('/login', data, function(data, textStatus, jqXHR) {
//        console.log( 'Post response:' );
//        console.dir( data );
//        console.log( textStatus );
//        console.dir( jqXHR );
//      }, 'json');
//    }
