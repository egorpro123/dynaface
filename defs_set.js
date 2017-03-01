var pagination = require('./pagination')

var cl = require('../utils/console_log').client_log;


exports.show = function(){
  var form = new pagination.form_class({
    tab: 'sys_def',
    list_fields: [{
      name: 'name',
      caption: 'Имя в БД'
    }, {
      name: 'caption',
      caption: 'Наименование'
    }]
  }) 
  form.show()
}


var table_def = {
//  values: {name: 'гоша', info: 'гопник', sex: 'f'},
  fields: [{
    name: 'name',
    caption: 'Имя в БД',
    type: 'string',
    len: 20,
    not_null: true,
  }, {
    name: 'caption',
    caption: 'Наименование',
    type: 'string',
    len: 100,
    not_null: true,
  }, {
    name: 'fields',
    type: 'object_array',
    fields: [{
      name: 'name',
      caption: 'Имя поля',
      type: 'string',
      len: 20
    }, {
      name: 'len',
      caption: 'Длина',
      type: 'number',
      len: 5.2
    }, {
      name: 'type',
      caption: 'Тип',
      type: 'select',
      values: [['string', 'Строка'], ['number', 'Число'], ['datetime', 'Дата и время'], 
               ['boolean', 'Логическое (истина/ложь)'], ['blob', 'Бинарный объект']]
    }, {
      name: 'def',
      caption: 'Значение по умолчанию',
      type: 'string',
      len: 100
    }]    
  }]
}


