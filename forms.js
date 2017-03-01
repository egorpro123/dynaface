var _ = require('underscore');
var backbone = require('backbone');
var $ = require('jquery');
backbone.$ = $;
var marionette = require('backbone.marionette');
var face_field = require('./face_field');
var values_lib = require('../utils/values');
//var face_utils = require('./utils/face');

var log = require('./web_log')
var cl = require('../utils/console_log').client_log;


//----------------------------------------------------------------------


// описание def - структуры документа:

// def.name - наименование группы полей
// def.fields: [{},...] объект определения полей,
// def.values: {} значения (м.б.указаны здесь, либо в def.fields: [{value:...}...]
// в массиве полей один элемент - объект с полями для создания объектов полей face_field
//  в процессе обработки переносится в поле initial_params

// либо для сложного поля object и object_array объект {
//   type: 'object_array' - тип поля
//   name: '' - наименование группы (англ)
//   fields: [ {name:..., ...}, ...] - объект определения полей группы
//   values: {} - значения для object или [{}...] - для object_array
// }

// либо для сложного поля diff_object объект 
// {
//   type: 'diff_object', // тип поля
//   name: '', //наименование группы (англ)
//   base_field: '', // имя основного поля
//   values: {}
//   fields_groups: [{
//     base_value: '', //значение основного поля
//     fields: [{}, ...] // список полей группы
//   },
//   ...]
// }

// либо для подмассива 'diff_object_array' объект 
// {
//   type: 'diff_object_array' - тип поля
//   name: '', наименование группы (англ)
//   base_field: '' - имя основного поля, д.б. в fields_groups: [{ fields: {} }]
//   values: [{}]
//   fields_groups: [{
//     name: '', 
//     fields: [{}, ...] - список полей группы
//   }, 
//   ...]
// }

var modal_region, content_region


exports.set_app_regions = function(regions){
  content_region = regions.content_region
  modal_region = regions.modal_region
  exports.modal_region = modal_region
  exports.content_region = content_region
}


// добавить закрывающую кнопку в углу
var add_close_corner_button = function (fields) {
  var a = [{
    type: 'decor',
    role: 'corner_top_panel_begin',
    value: 'border'
  }, {
    type: 'button',
    name: 'close_corner_btn',
    role: 'cancel',
    size: 'micro',
    icon: 'delete',
  }, {
    type: 'decor',
    role: 'corner_top_panel_end',
  }]
  for (var i = a.length - 1; i >= 0; i--)
    fields.unshift(a[i])
}


// добавить стандартные кнопки к определению полей (
//   flds: например fields из def.fields
//   [roles]: роли кнопок (строка) или определения кнопок ({}), по умолчанию ['cancel', 'ok']
//   options:
//     no_corner_close_button: true|false(default)
var add_buttons = exports.add_buttons = function(flds, roles, options){
  options || (options = {})
//  if (decor === undefined) decor = true
//  else decor 
//  
//  if (decor)
  if (options.no_corner_close_button === 'undefined')
    options.no_corner_close_button = false
  
  if (!roles) roles = ['cancel', 'ok']
  flds.push({
    type: 'decor',
    role: 'hline'
  }, {
    type: 'decor',
    role: 'align_center_begin'
  })
  
  for (var i in roles) {
    if (_.isString(roles[i]))
      flds.push({
        name: roles[i] + '_button',
        type: 'button',
        role: roles[i]
      })
    else if (values_lib.is_object(roles[i])) 
      flds.push(_.extend(roles[i], {type: 'button'}))
  }
  flds.push({
    type: 'decor',
    role: 'align_center_end'
  })
  
  if (!options.no_corner_close_button) add_close_corner_button(flds)
}



// добавить стандартную реакцию на нажатия события подтверждения и отмены,
// вызывается после создания объекта полей form = forms.create_form(def)
var add_standart_reaction = exports.add_standart_reaction = 
    function (form, callback) {
  form.on('ok', function(data){
    callback(data);
  })
  form.on('cancel', function(){
    callback(null);
  })
}


/**
* Окно с диалогом подтверждения Да, Нет
* 
* @param {string} question Вопрос, на который нужно ответить пользователю
* @param {string} [focus=ok] На какой кнопке будет фокус cancel или ok
* @param {callback} cb Колбэк, вызывается с true или false
*/
var confirm_dialog = exports.confirm_dialog = function(question, focus, cb) {
  if (cb === undefined) {
    cb = focus
    focus = 'ok'
  }
  
  var form, def = {
    modal: true,
    fields: [{
      type: 'decor',
      role: 'text',
      value: question
    }]
  }
  add_buttons(def.fields, [{
    name: 'no_button',
    role: 'cancel',
    caption: 'Нет',
    change_by_lr_key: true,
    focus_on_start: focus === 'cancel'
  }, {
    name: 'yes_button',
    role: 'ok',
    caption: 'Да',
    change_by_lr_key: true,
    focus_on_start: focus === 'ok'
  }])
//  add_buttons(flds)
  form = create_form(def)
  modal_region.show(form.view)
  add_standart_reaction(form, function(data){
    modal_region.empty()
    cb(!!data)
  })
}

/*
 * This callback is displayed as a global member.
 * @callback requestCallback
 * @param {number} responseCode
 * @param {string} responseMessage
 */

var sample_def0 = {
  fields: [{
    name: 'name',
    caption: 'Наименование',
    type: 'string',
    len: 20,
    default: 'Петя'
  }, {
    name: 'name1',
    caption: 'Наименование',
    type: 'string',
    len: 20,
    default: 'Петя'
  }]
}

var data = {
  fio: '',
  adress: '',
  price: 0
}


var sample_def = {
//  values: {name: 'гоша', sex: 'f'},
  values: {name: 'гоша', info: 'гопник', sex: 'm'},
  access: [{
    role: 'all',
    act: 'r'
  }, {
    role: 'unadequate',
    act: 'w',
    prohib: true
  }],
  fields: [{
      name: 'name',
      caption: 'Наименование',
//      caption: 'Наименование Начну с набора определенных сценариев, которые уже неоднократно показали свою эффективность в массовом увеличении трафика и посетителей, а также их дальнейшем превращении в подписчиков и фолловеров во всех сетях.',
      type: 'string',
      len: 20,
      not_null: true,
      default: 'Вася',
      tooltip: 'Проверка всплывающей подсказки'
    }, {
      name: 'info',
      caption: 'Доп.информация',
      type: 'string',
      not_null: true,
      fit_pattern: /\D/,
      len: 120,
//      value: 'ентилихент'
    }, {
      name: 'age',
      caption: 'Возраст',
      type: 'number',
      len: 3,
      check_sync: function(v) {
        if (values_lib.is_empty(v)) v = 0
        if (v < 16) return {ok: false, msg: 'Детям до 16 запрещено'}
        else return {ok: true}
      }
    }, {
      name: 'sex',
      caption: 'Пол',
      type: 'select',
//      value: 'f',
      values: [['m', 'Мужской'], ['f', 'Женский']]
    }, {
      type: 'diff_object',
      name: 'sizes', 
      base_field: 'sex',
//      values: {},
      fields_groups: [{
        base_value: 'm', 
        fields: [{
          name: 'head',
          caption: 'Голова',
          type: 'number',
          len: '3.2',
        }, {  
          name: 'waist',
          caption: 'Талия',
          type: 'number',
          len: '3.2',
        }]
      }, {
        base_value: 'f', 
        fields: [{
          name: 'breast',
          caption: 'Грудь',
          type: 'number',
          len: '3.2',
        }, {  
          name: 'waist',
          caption: 'Талия',
          type: 'number',
          len: '3.2',
        }]
      }]
    }, {
      type: 'object',
      name: 'adres',
      fields: [{
          name: 'city',
          type: 'string',
          caption: 'Населенный пункт',
          placeholder: 'Введите название',
          len: 50
        }, {
          name: 'street',
          type: 'string',
          caption: 'Улица',
          len: 50
        }, {
          name: 'house',
          type: 'number',
          caption: 'Дом',
          len: 5          
        }, {
          name: 'tentura',
          type: 'object',
          caption: 'Код в тентуре',
          fields: [{
            name: 'outer_code',
            caption: 'внешний код',
            type: 'string',
            len: 5
          }, {
            name: 'inner_code',
            caption: 'внутренний код',
            type: 'string',
            len: 5
          }]
        }
      ]
    }, {
      type: 'object_array',
      name: 'users',
      fields: [{
          name: 'name',
          caption: 'Имя',
          type: 'string',
          len: 30
        }, {
          name: 'family_name',
          caption: 'Фамилия',
          type: 'string',
          len: 50
        }, {
          name: 'code',
          caption: 'Код доступа',
          type: 'number',
          len: 5          
        }, {
          type: 'object',
          name: 'cabinet',        
          fields: [{
            name: 'corpus',
            caption: 'Корпус',
            type: 'number',
            len: 5
          }, {
            name: 'office',
            caption: 'Кабинет',
            type: 'number',
            len: 5
          }]
        }
      ],
      values: [{
          name: 'trevor',
          family_name: 'jonse',
          code: 13,
          cabinet: {corpus: 11, office: 221}
        }, {
          name: 'ivan',
          family_name: 'pupkin',
          code: 21,
          cabinet: {corpus: 22, office: 222}
//          windows: '7'
        }
      ]
    }, {
      name: 'info2',
      caption: 'Доп.информация2',
      type: 'string',
      len: 120,
    }
  ]
}
add_buttons(sample_def.fields)


/**
 создать объект полей по описанию, т.н.форму (form). объект полей можно
 отобразить на экране, вызвав region.show(form.view)

 options:
   look (внешний вид формы, можно добавить в def): 
     inline (поля одно за другим, на одной строке)
     plane (поля на отдельных строках, наименование тоже на отдельной строке) 
   for_edit: true/false, true - форма для редактирования
   modal (можно добавить в def): true/false, true - модальная форма 
*/
var create_form = exports.create_form = function (def, options) {
  if (!def) {
    log.error('function create_form - не определен обязательный параметр def');
    return;
  }
  
  if (_.isBoolean(options)) options = {for_edit: options}
  else if (options === undefined) options = {}
  if (!def.type) def.type = 'object'
  
  if (!def.look)
    if (!options.look) def.look = 'inline'
    else def.look = options.look

  if (options.modal === undefined)
    def.modal = false
  else def.modal = options.modal
    
  if (!def.name) def.name = 'main_block'
  
  var flds = face_field.get_field(def, null)
  if (options.for_edit === undefined) options.for_edit = true
  flds.init_show_objs(options.for_edit)
  return flds
}


var show_form = exports.show_form = function (def, for_edit, region) {
  var form = create_form(def, for_edit)
//  var fields = create_form(def)
  region.show(form.view)
  return form
}



exports.show_sample_fields = function(){
//  show_form(sample_def, true, content_region) 
  var form = create_form(sample_def, {
    for_edit: true
  })
//  var form = create_form(sample_def, {
//    modal: true,
//    for_edit: true
//  })
  content_region.show(form.view)
  return form
}


//var loading_view = export.loading_view = marionette.ItemView.extend({
//  template: "#loading-view"
//});
//
//_.extend(loading_view.prototype, {
//
//  serializeData: function(){
//    return {
//      title: marionette.getOption(this, "title"),
//      message: marionette.getOption(this, "message")
//    }
//  },
//
//  onShow: function(){
//    var opts = {
//      lines: 13, // The number of lines to draw
//      length: 20, // The length of each line
//      width: 10, // The line thickness
//      radius: 30, // The radius of the inner circle
//      corners: 1, // Corner roundness (0..1)
//      rotate: 0, // The rotation offset
//      direction: 1, // 1: clockwise, -1: counterclockwise
//      color: "#000", // #rgb or #rrggbb
//      speed: 1, // Rounds per second
//      trail: 60, // Afterglow percentage
//      shadow: false, // Whether to render a shadow
//      hwaccel: false, // Whether to use hardware acceleration
//      className: "spinner", // The CSS class to assign to the spinner
//      zIndex: 2e9, // The z-index (defaults to 2000000000)
//      top: "30px", // Top position relative to parent in px
//      left: "auto" // Left position relative to parent in px
//    };
//    $("#spinner").spin(opts);
//  }
//});


/*
добавить кнопки
добавить получение значений
добавить добавление и удаление в список 
*/


var sample_list = {
  type: 'object_array',
  name: 'users',
  fields: [{
    name: 'name',
    caption: 'Имя',
    type: 'string',
    len: 30
  }, {
    name: 'family_name',
    caption: 'Фамилия',
    type: 'string',
    len: 50
  }, {
    name: 'code',
    caption: 'Код доступа',
    type: 'number',
    len: 5          
  }],
  values: [{
      name: 'trevor',
      family_name: 'jonse',
      code: 13
    }, {
      name: 'ivan',
      family_name: 'pupkin',
      code: 21
//          windows: '7'
    }
  ]
}

exports.show_sample_list = function(){
  var form = show_form(sample_list, true, content_region) 
  
  setTimeout(function() {
    form.set_value([{
      name: 'dimw',
      family_name: 'bobkin',
      code: 14
    }])
//    form.view.render()
    cl('was setting', form.values)
  }, 2000);
}


//var sample_list = {
//  fields: [{
//    type: 'object_array',
//    name: 'users',
//    fields: [{
//      name: 'name',
//      caption: 'Имя',
//      type: 'string',
//      len: 30
//    }, {
//      name: 'family_name',
//      caption: 'Фамилия',
//      type: 'string',
//      len: 50
//    }, {
//      name: 'code',
//      caption: 'Код доступа',
//      type: 'number',
//      len: 5          
//    }],
//    values: [{
//        name: 'trevor',
//        family_name: 'jonse',
//        code: 13
//      }, {
//        name: 'ivan',
//        family_name: 'pupkin',
//        code: 21
//  //          windows: '7'
//      }
//    ]
//  }]
//}

