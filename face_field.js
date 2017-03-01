var _ = require('underscore');
var values_lib = require('../utils/values');
var web_log = require('./web_log');
var backbone = require('backbone');
var $ = require('jquery');
backbone.$ = $;
var marionette = require('backbone.marionette');
var security = require('./web_sec')

var cl = require('../utils/console_log').client_log;


exports.SUPPORTED_TYPES = ['string'];

exports.FUTURE_SUPPORTED_TYPES = ['string', 'datetime', 'number',
                                  'logical', 'inc_number', 'select', 'multiselect'];

exports.field_classes = {};


var no_data_view = marionette.ItemView.extend({
  //  template: _.template("Нет данных")
  //  template: _.template('<span class="label label-default">Нет данных</span>')
  template: _.template('<div class="help-block">Нет данных</div>')
});


var get_field = exports.get_field = function (options, parent) {
  options.parent = parent
  if (create_classes[options.type])
    return new create_classes[options.type](options)
  else return new string_class(options)
    //    client_log.throw_error('function get_field - неизвестный тип поля ' + options.type)
}

//var get_field = exports.get_field = function (options, parent) {
//  options.parent = parent
//  if (options.type === 'string') return new string_class(options)
//  else if (options.type === 'number') return new number_class(options)
//  else if (options.type === 'select') return new select_class(options)
//  else if (options.type === 'password') return new password_class(options)
//  else if (options.type === 'button') return new button_class(options)
//  else if (options.type === 'object') return new object_class(options)
//  else if (options.type === 'decor') return new decor_class(options)
//  else if (options.type === 'diff_object') return new diff_object_class(options)
//  else if (options.type === 'object_array') 
//    return new object_array_class(options)
//  else return new string_class(options)
////    client_log.throw_error('function get_field - неизвестный тип поля ' + options.type)
//}

var error_log_class = function () {}

// -----------------------------------------------------------------------


var field_kinds = {
  plane: 1,
  complex: 2,
  decor: 3,
  control: 4
}


// options:
//   focus_on_start - установить на данное поле фокус ввода при запуске

var elem_dummy_class = function (options) {
  var log_opts = {}
  options || (options = {})
  this.field_kind = field_kinds.plane
  this.name = options.name
  //  this.wasError = ''
  //  this.error_counter = 0
  if (options.parent && options.parent.logger)
    this.logger = options.parent.logger
  else {
    if (options.store_errors) log_opts.store_messages = options.store_errors
    this.logger = new web_log.logger_class(log_opts)
  }
  _.extend(this, _.pick(options, 'focus_on_start'))
}

elem_dummy_class.prototype.get_html = function (for_edit) {
  //  if (this.new_line) return '<br>'
  //  else return ''
  this.logError('Вызвана не реализованная функция get_html()')
}

elem_dummy_class.prototype.get_template = function (for_edit) {
  this.logError('Вызвана не реализованная функция get_template()')
}

elem_dummy_class.prototype.logError = function (str) {
  this.logger.error('Поле ' + this.name + ' (' + this.type + '): ' + str)
  //  if (this.error_counter < 11) {
  //    this.error_counter++
  //    this.wasError = this.wasError + str + '\\n'
  //  }
  //  console.log(str)
}

elem_dummy_class.prototype.get_value = function () {
  this.logError('Вызвана не реализованная функция get_value()')
}

// -----------------------------------------------------------------------


//role: hline / br / align_right_begin / align_right_end /
//  align_center_begin / align_center_end /
//  align_left_begin / align_left_end /
//  row_begin / row_end
//  col_begin (д.б.передано value) / col_end
//  corner_top_panel_begin (д.б.передано value: [right|left][,border]) /
//    corner_top_panel_end

var decor_class = function (options) {
  options || (options = {})
  elem_dummy_class.call(this, options)
  this.field_kind = field_kinds.decor

  if (!options.role)
    this.logError('Не указан обязательный параметр role (роль): ',
      JSON.stringify(options))
  else this.role = options.role
  _.extend(this, _.pick(options, 'value'))
  if (this.role === 'corner_top_panel_begin') {
    if (!this.value) this.value = 'right'
    if (!values_lib.in_comma_str(this.value, 'right') &&
      !values_lib.in_comma_str(this.value, 'left'))
      this.value += ',right'
  }
}

values_lib.inherit(decor_class, elem_dummy_class);

decor_class.prototype.type = 'decor';

decor_class.prototype.logError = function (str) {
  this.logger.error('Элемент оформления ' + this.role + ': ' + str)
}

decor_class.prototype.html_code = {
  //  hline: '<hr>',
  text: function () {
    return '<div class="ist-decor-text">' + this.value + '</div>'
  },
  hline: '<div class="ist-horizontal-line"></div>',
  br: 'br',
  align_right_begin: '<div class="row"><div class="col-xs-12"><div class="pull-right">',
  align_right_end: '</div></div></div>',
  align_center_begin: '<div class="ist-centered"><div>',
  //  align_center_begin: '<div class="row centered"><div>',
  align_center_end: '</div></div>',
  align_left_begin: '<div class="row"><div class="col-xs-12"><div class="pull-left">',
  align_left_end: '</div></div></div>',
  row_begin: '<div class="row">',
  row_end: '</div>',
  col_begin: function () {
    return '<div class="' + this.value + '">'
  },
  col_end: '</div>',
  corner_top_panel_begin: function () {
    var s = (values_lib.in_comma_str(this.value, 'right') ? 'right' : 'left') +
      (values_lib.in_comma_str(this.value, 'border') ? '-border' : '')
    return '<div class="ist-top-' + s + '-corner">'
  },
  corner_top_panel_end: '</div>'
  //  align_center_begin: '<div class="row"><div class="col-xs-12"><div class=center-block">',
  //  align_center_end: '</div></div></div>'
}

decor_class.prototype.get_html = function () {
  var s = this.html_code[this.role]
  if (s === undefined) return
  else if (_.isFunction(s)) return s.call(this)
  else return s
    //  if (this.role === 'hline') return '<hr>'
    //  else if (this.role === 'br') return '<br>'
    //  else if (this.role === 'pull-right-begin') 
    //    return '<div class="row"><div class="col-xs-12"><div class="pull-right">'
    //  else if (this.role === 'pull-right-end') 
    //    return '</div></div></div>'
    ////    return '<div class="row">'
    //  else return  ''
}

decor_class.prototype.get_template = function () {
  return this.get_html()
}



// -----------------------------------------------------------------------

// основной класс, вызывайте этот метод в начале инициализации потомков 
// init_value вызывайте самостоятельно в конце инициализации

// --- опции ----
// options.name (ОБЯЗ.поле)  - имя поля на англ.
// options.id - уникальный id поля, если не указано будет формироваться из имени родителя
//              parent.name и имени данного поля
// options.id_postfix - добавление к id для уникальности
// options.default - значение по умолчанию
// options.store_errors - накапливать ошибки
// options.using_template - true/false - объект в режиме использования backbone и шаблонов 
//          (по умолчанию true)
// options.access - доступы в виде [{
//   role: 'наименование_роли', 
//   field: 'наименование_поля', // если не установлено, применяется к корневому полю
//      // подполе отделяется . в виде f.sub1.sub2
//   act: 'crudw', // где access: c-создание, r-чтение, u-изменение, d-удаление,
//                    // w-запись в общем (включает в себя c,u,d)
//   prohib: true/false // true - доступ запрещен, по умочанию false
//   off: true/false // true - доступ отключен, по умочанию false
//   till: datetime // дата до которой роль дейтвительна или до которой отключена
// },...]

// --- проверка значения ----
// options.fit_pattern - значение должно соответствовать рег.выражению
// options.not_null - должно быть обязательно заполнено
// options.min_len - минимальная длина
// options.check_sync - синхронная функция проверки, в полож.случае должна вернуть 
//   {ok: true, msg: ''}, иначе {ok: false, msg: 'текст сообщения'}

// --- свойства объекта ----
// root_field = true - корневой объект

// -- не исп --
// options.id_prefix - дополнение для формирования уникального id
// full_name - формируется из имени родителя parent и имени данного поля

var field_class = function (options) {
  options || (options = {})
  elem_dummy_class.call(this, options)

  if (!options.name)
    this.logError('Не указан обязательный параметр options.name (имя поля)')
  this.name = options.name
  this.parent = options.parent
  if (!options.parent) {
    this.root_field = true
    this.collect_access(options)
    this.root_parent = this
  }
  else if (options.parent.root_field) this.root_parent = options.parent
  else if (options.parent.root_parent) this.root_parent = options.parent.root_parent
  if (options.id) this.id = options.id
  else if (options.parent) this.id = options.parent.id + '_' + this.name
  else this.id = this.name
  if (options.id_postfix)
    this.id = this.id + '_' + options.id_postfix
    //  else if (options.id_prefix) this.id = this.id_prefix + '_' + this.name
    //  else this.id = this.full_name
  if (options.using_template === undefined) this.using_template = true
  else this.using_template = options.using_template
  if (options.default) this.default = options.default
  _.extend(this, _.pick(options, 'not_null', 'fit_pattern', 'check_sync', 'min_len'))
}

values_lib.inherit(field_class, elem_dummy_class);



// собирает и рассчитывает доступы по текущему пользователю
field_class.prototype.collect_access = function(options) {
  var accesses = []
  
  function collect_one(a, fld, fld_prefix){
    var o, f
    
    function add(obj) {
      o = _.clone(obj)
      if (fld_prefix !== '') o.field = fld_prefix
//        if (fld_prefix !== '') o.field = fld_prefix + '.' + fld.name
//        else f.field = fld.name
      a.push(o)
    }
    
    if (fld.access)
      if (_.isArray(fld.access)) 
        for (var i in fld.access) add(fld.access[i])
      else a.push(fld.access)
    if (fld.fields)
      for (var i in fld.fields) {
        f = fld.fields[i]
        if (f.access)
//cl(fld.fields[i])
          collect_one(a, f, fld_prefix === '' ? f.name : fld_prefix + '.' + f.name)
      }
  }
  collect_one(accesses, options, '')
  this.access = security.resolve_access(accesses)
}

/**
Проверка доступа, подготовленного функцией collect_access 
@function
@param {string} act доступ в виде одного символа c r u d w
*/
field_class.prototype.has_access = function (act) {
//cl(this.access, this.root_parent.access, act, !!this.root_parent.access.granted[act])
  if (this.access) {
    return !!this.access.granted && !!this.access.granted[act]
  }
  else return !!this.root_parent && !!this.root_parent.access &&  
    !!this.root_parent.access.granted[act]
}

// первоначальная установка значения
field_class.prototype.init_value = function (value) {
  this.original_value = value
  if (value !== undefined) this.value = value
    //  else if (this.default) this.value = this.default
}

field_class.prototype.set_value = function (value) {
  this.value = value
}

field_class.prototype.ui_selector = function () {
  if (this.id) return '#' + this.id
}

field_class.prototype.set_prepared_access = function (access) {
  this.access = access
}


// -----------------------------------------------------------------------

// ? options.db_name - имя в БД

// options.value - текущее значение
// options.len - максимальная длина

// options.caption - название поле, отображаемое для пользователя
// options.placeholder - краткая подсказка в строке ввода
// options.info - расширенная информация о поле

// - системные параметры (назначаются автоматически программой) -
// options.parent - родительское поле

var string_class = function (options) {
  //  this.html_attr = {}
  field_class.call(this, options)
  _.extend(this, _.pick(options, 'len', 'caption', 'default',
    'placeholder', 'info', 'tooltip'))
  this.init_value(options.value)
}

exports.field_classes.string_class = string_class;

values_lib.inherit(string_class, field_class);


string_class.prototype.type = 'string';

string_class.prototype.input_type = 'text';


string_class.prototype.get_input_field_html = function (add_close_bracket,
  for_template) {
  if (add_close_bracket === undefined) {
    add_close_bracket = true;
  }
  if (for_template === undefined) for_template = false;
  var s = '<input class="form-control"';
  s = s + ' type="' + this.input_type + '"';
  s = s + ' name="' + this.id + '" id="' + this.id + '"';
  if (this.len) s = s + ' maxlength=' + this.len;
  if (for_template) s = s + ' value= "{{- ' + this.name + ' }}"';
  else if (this.value) s = s + ' value="' + this.value + '"';
  //  else if (this.default ) s = s + ' value="' + this.default  + '"';
  if (this.placeholder) s = s + ' placeholder="' + this.placeholder + '"';
  if (this.tooltip) s += 'data-toggle="tooltip" data-placement="top" ' +
    'title="' + this.tooltip + '"'
  if (add_close_bracket) s = s + ' >';
  return s;
}


string_class.prototype.get_edit_group_html = function (for_template) {
  var s = '<div class="form-group ist-plane-field">';

  if (this.caption) {
    s = s + ' <label';
    if (this.id) s = s + ' for="' + this.id + '" ';
    s = s + '>' + this.caption + '</label>';
    //    s = s + '>' + this.caption + '-' + this.value  + '</label>';
  }
  return s + ' ' + this.get_input_field_html(true, for_template) + ' </div>';
}


string_class.prototype.get_show_group_html = function (for_template) {
  return [
    '<div class="row">',
      '<div class="col-xs-3">',
        this.caption,
      '</div>',
      '<div class="col-xs-9">',
        for_template ? '{{- ' + this.name + '}}' : this.value,
 //        '{{- value}}',
      '</div>',
    '</div>'
  ].join("")
}

string_class.prototype.get_html = function (for_edit) {
  return for_edit ? this.get_edit_group_html() :
    this.get_show_group_html()
}

string_class.prototype.get_template = function (for_edit) {
  return for_edit ? this.get_edit_group_html(true) :
    this.get_show_group_html(true)
}



var password_class = function (options) {
  //  this.html_attr = {}
  string_class.call(this, options)
  if (!this.len || this.len < 10) this.len = 20
  this.default = undefined
  //  _.extend(this, _.pick(options, 'len', 'caption', 'default', 
  //                        'placeholder', 'info'))
  //  this.init_value(options.value)
}

exports.field_classes.password_class = password_class;

values_lib.inherit(password_class, string_class);


password_class.prototype.type = 'password';

password_class.prototype.input_type = 'password';




//--------------------------------------------------------------------------------

// options.value - текущее значение
// options.values = [
//   ['value', 'caption'], ...
// ]

var select_class = function (options) {
  //  this.html_attr = {}
  string_class.call(this, options)
  _.extend(this, _.pick(options, 'values'))
  //  this.init_value(options.value)
}

exports.field_classes.select_class = select_class;

values_lib.inherit(select_class, string_class);

select_class.prototype.type = 'select';

select_class.prototype.get_input_field_html = function (add_close_bracket,
  for_template) {
  if (add_close_bracket === undefined) {
    add_close_bracket = true;
  }
  if (for_template === undefined) for_template = false;
  var s = '<select class="form-control" name="' + this.id + '" id="' + this.id + '">'
  if (for_template) {
    s = s + ' {{ _.each(' + this.name + '_items(), function(item){ }}'
    s = s + ' <option value="{{- item[0] }}" {{= ' +
      this.name + '_selected(item[0])}}>{{- item[1] }}</option>'
    s = s + ' {{ }); }}'
    //    s = s + ' {{ _.each(items, function(item){ }}'
    //    s = s +   ' {{ var selected = item[0].toUpperCase() === ' +
    //      '.toUpperCase() ? "selected" : ""; }}'
    //    s = s +   ' <option value="{{- item[0] }} {{=selected}}">{{- item[1] }}</option>'
    //    s = s + ' {{ }); }}'
  } else {
    for (var i in this.values) {
      s = s + '<option value="' + this.values[i][0] + '"'
      if (this.value && this.values[i][0].toUpperCase() === this.value.toUpperCase())
        s = s + ' selected '
      s = s + '>' + this.values[i][1] + '</option>'
    }
  }
  s = s + '</select'
  if (add_close_bracket) s = s + ' >';
  return s;
}

select_class.prototype.template_helpers = function () {
  var o = {}
  var self = this
  o[this.name + '_items'] = function () {
    return self.values
  }
  o[this.name + '_selected'] = function (val) {
    return val.toUpperCase() === this[self.name].toUpperCase() ? "selected" : ""
  }
  return o
}

//--------------------------------------------------------------------------------

// не забыть добавить событие на ввод для коррекции числовой строки
var number_class = function (options) {
  string_class.call(this, options);
  if (!this.len) this.len = '101.50';
}

values_lib.inherit(number_class, string_class);

exports.field_classes.number_class = number_class;

number_class.prototype.type = 'number';

/*
number_class.prototype.get_edit_html = function(add_close_tag){
  if (!add_close_tag) {   
    add_close_tag = true; 
  }
  var s = string_class.prototype.get_edit_html.call(this, false);  
  
  if (this.len) s = s + ' oninput="this.value=correct_num_str(this.value,' + 
     + ')"'
  
  if (add_close_tag) s = s + ' >'
  return s;
}
*/

//--------------------------------------------------------------------------------

/**
 Поле - кнопка

 @ class
 options: 
  role: 'verification' / 'save' / 'ok' / 'cancel' / 'close' / 'restore' / 
       action (произвольное действие) / delete / edit / show / new
  look: 'default' / 'primary' / 'success' / 'info' / 'warning' / 'danger'
  size (string): large / normal (default) / small / micro 
  icon (string): edit / new / delete / show
  change_by_lr_key: true/false(default) смена кнопок по клавишам влево вправо

 события:
 
 на корневом объекте возбуждаются события: 
   fields:confirm для role: save,ok; 
   fields:cancel для role: cancel,close  
 на родительском view - коллекции возбуждаются события fields:имя_роли
 для ролей delete, edit, show, new
   
   
*/


var button_class = function (options) {
  field_class.call(this, options);
  this.field_kind = field_kinds.control
  if (!options.role) this.role = 'cancel'
  else this.role = options.role
  if (!options.look) {
    if (this.role === 'save' || this.role === 'ok') this.look = 'primary'
    else if (this.role === 'restore') this.look = 'warning'
    else this.look = 'default'
  } else this.look = options.look
  if (!options.caption && !options.icon) {
    this.caption = ({
      verification: 'Проверить',
      save: 'Сохранить',
      ok: 'Ок',
      cancel: 'Отказ',
      close: 'Закрыть',
      restore: 'Восстановить'
    })[this.role]
  } else this.caption = options.caption

  if (options.size) this.size = options.size

  if (this.parent && !this.parent.root_field &&
    this.root_field_roles(this.role))
    this.logError('кнопки с ролью ' + this.role +
      ' допустимы только для верхнего уровня полей')

  //cl(this, this.parent)
  //  if (this.parent && this.parent.parent &&   
  //        this.parent.parent.type !== 'object_array' &&
  //      this.array_field_roles(this.role)) {
  //    this.logError('кнопки с ролью ' + this.role + 
  //                   ' допустимы только для поля-коллекции object_array')
  //  }
  //cl(this, this.parent)
  //  if (this.parent && this.parent.parent &&   
  //        this.parent.parent.type !== 'object_array' &&
  //      this.array_field_roles(this.role)) {
  //    this.logError('кнопки с ролью ' + this.role + 
  //                   ' допустимы только для поля-коллекции object_array')
  //  }
  _.extend(this, _.pick(options, 'icon', 'change_by_lr_key'))
}

values_lib.inherit(button_class, field_class);

exports.field_classes.button_class = button_class;

button_class.prototype.type = 'button';

button_class.prototype.get_html = function () {
  //<hr>  return field_class.prototype.get_html.call(this) + 
  var sz = ''

  if (this.size)
    if (this.size === 'large') sz = ' btn-lg'
    else if (this.size === 'small') sz = ' btn-sm'
  else if (this.size === 'micro') sz = ' btn-xs'

  var s = ''
  if (this.icon) {
    s += '<span class="glyphicon glyphicon-'
    if (this.icon === 'edit') s += 'pencil'
    else if (this.icon === 'new') s += 'plus'
    else if (this.icon === 'delete') s += 'remove' // sign circle
    else if (this.icon === 'show') s += 'eye-open'
    s += '" aria-hidden="true"></span>'
  }


  if (this.caption) s += this.caption
  return '<button type="button" class="btn btn-' + this.look + sz +
    '" name="' + this.id + '" id="' + this.id + '">' + s + '</button>'
    //  return '<p class="text-right"><button type="button" class="btn btn-' + this.look +
    //    '" name="' + this.id + '" id="' + this.id + '">' + 
    //    this.caption + '</button></p>'

  //<div class="row">
  //  <div class="col-sm-4 col-sm-offset-4">
  //        This content and its sibling..
  //  </div>
  //  <div class="col-sm-4">
  //        are right aligned as a whole thanks to the offset on the first column and the sum of the columns used is the total available (12).
  //  </div>
  //</div>
}

button_class.prototype.get_template = function () {
  return this.get_html()
}

button_class.prototype.root_field_roles = function (role) {
  return ['verification', 'save', 'ok', 'cancel', 'close', 'restore'].
  indexOf(role) >= 0
}

button_class.prototype.array_field_roles = function (role) {
  return ['delete', 'edit', 'show', 'new'].indexOf(role) >= 0
}

// options: 
//   role: verification / save / ok / cancel / close / restore / 
//       action (произвольное действие) / delete / edit / show
button_class.prototype.dom_events = function () {
  var o = {}
  var self = this
  var func, event_name

  // fire events - fields:x, где x - confirm cancel verification restore
  if (this.parent.root_field && this.root_field_roles(this.role)) {
    if (this.role === 'save' || this.role === 'ok') event_name = 'confirm'
    else if (this.role === 'cancel' || this.role === 'close') event_name = 'cancel'
    else event_name = this.role
    func = function () {
      self.parent.trigger('fields:' + event_name)
    }
  } else if (this.array_field_roles(this.role)) {
    //    this.parent && this.parent.view && 
    //             this.parent.parent.type === 'object_array' &&
    func = function () {
      //      self.parent.view.trigger('fields:' + self.role, 'self.model')
      //      self.parent.view.trigger('fields:' + self.role)
      this.trigger('fields:' + self.role)
    }
  }
  //cl(this.role,this.parent, this.parent.view)
  //cl('this.parent', this.parent, 'this.parent.parent', this.parent.parent)

  if (func)
    o['click #' + this.id] = function (e) {
      e.preventDefault()
      func.call(this)
    }

  if (this.change_by_lr_key) {
    o['keyup #' + this.id] = function (e) {
      //      e.preventDefault()
      //cl('event keyup', e.keyCode, e)
      if (e.keyCode === 37) {
        self.parent.trigger('button:previous')
        //        cl('trigger button:change2left')
      } else if (e.keyCode === 39)
        self.parent.trigger('button:next')
    }
  }

  if (!values_lib.is_empty(o)) return o
}


//--------------------------------------------------------------------------------

var is_complex_field = exports.is_complex_field = function (field) {
  return ['object', 'diff_object', 'object_array',
          'diff_object_array'].indexOf(field.type) >= 0
}

var is_plane_field = exports.is_plane_field = function (field) {
  return ['object', 'decor', 'diff_object', 'object_array',
          'diff_object_array', 'decor'].indexOf(field.type) < 0
}


//--------------------------------------------------------------------------------
// options:  
//   look (string) - inline (default) поле следует за полем на одной строке
//      plane - поля и наименования на отдельных строках
//   width (string) - размер bootstrap  например "col-sm-4"
//   modal (boolean) - модальная форма (применима только для root_field)
//--------------------------------------------------------------------------------

/**
 * Набор полей
 * @class
 */
var object_class = function (options) {
  var fld, i, decor_counter = 0

  field_class.call(this, options)
  this.field_kind = field_kinds.complex
  _.extend(this, _.pick(options, 'look', 'width', 'modal'))
  //  this.decor_counter = 0
  this.fields = {}
  this.exist_complex_fields = false
  this.complex_fields = []
  if (!options.fields || !_.isArray(options.fields))
    this.logError('Должен быть задан обязательный параметр fields, ' +
      'содержащий массив полей')
  else {
    for (i in options.fields) {
      fld = options.fields[i]
      if (is_complex_field(fld)) {
        this.exist_complex_fields = true
        this.complex_fields.push(fld.name)
      } else if (fld.type && fld.type === 'decor' && !fld.name)
        fld.name = fld.role + ++decor_counter
        //      fld.parent_name = this.id
      this.fields[fld.name] = get_field(fld, this)
    }
  }
  this.initial_values = {}
  //  this.values = {}
  if (options.values) this.init_value(options.values)
  if (this.root_field) this.make_event_handling()
  if (this.access) this.set_prepared_access(this.access)
}

exports.field_classes.object_class = object_class;

values_lib.inherit(object_class, field_class);


object_class.prototype.type = 'object';


//object_class.prototype.get_fields_html_or_tpl = 
//    function (fields, for_edit, is_template) {
//  var s = ''
//  
//  if (fields) {
//    for (var i in fields) {
//      s = s + is_template ? fields[i].get_html(for_edit) :
//        fields[i].get_template(for_edit)+ '\n'
//    }
//  }
//  return '<div class = "row"> ' + s + ' </div>\n'  
//}
//  
//
//object_class.prototype.get_html = function (for_edit) {
//  return this.get_fields_html_or_tpl(this.fields, for_edit, false)
//}
//

//object_class.prototype.get_full_template = function (for_edit) {
//  return this.get_fields_html_or_tpl(this.fields, for_edit, true)
//}



//object_class.prototype.make_template = function (for_edit) {
//  this.template = _.template(this.get_template(this.fields, for_edit))
//}


object_class.prototype.clear_value = function () {
  for (var i in fields[i]) fields[i].value = null;
}


object_class.prototype.get_focused_field = function () {
  if (this.view) {
    var el = this.view.$el.find(':focus')
    if (el.length > 0 && el[0].id)
      for (var i in this.fields)
        if (this.fields[i].id === el[0].id) return this.fields[i]
  }
}

/**
 * переместить focus на следующее поле
 * @memberof object_class.prototype
 * @param {Object} match_field объект с параметрами для отбора определенных полей
 * @param {Object} [to_right=true] - true переходить вправо по списку, иначе влево
 */
object_class.prototype.focus_to_next_field = function (match_field, to_right) {
  var start_field = this.get_focused_field()
  var a = _.keys(this.fields)
  if (!to_right) a = a.reverse()
  var start_pos = a.indexOf(start_field.name)
  var pos = start_pos,
    stop = false
  while (!stop) {
    if (pos >= a.length - 1) pos = 0
    else pos++
      if (pos === start_pos) stop = true
      else if (values_lib.match_object(this.fields[a[pos]], match_field)) {
      if (this.view)
        this.view.$el.find(this.fields[a[pos]].ui_selector()).focus()
      stop = true
    }
  }
}


object_class.prototype.make_event_handling = function () {
  //  var self = this

  _.extend(this, backbone.Events)

  this.once('fields:confirm', function () {
    //    cl('once fields:confirm')
    if (this.verify()) this.trigger('ok', this.get_values())
  }, this)

  this.once('fields:cancel', function () {
    //    cl('once fields:cancel')
    this.trigger('cancel')
  })

  this.on('fields:verification', function () {
    this.verify()
  })

  this.on('fields:restore', function () {
    this.logError('Обработка события fields:restore не реализована')
  })

  this.on('button:previous', function () {
    this.focus_to_next_field({
      type: 'button',
      change_by_lr_key: true
    }, false)
  })

  this.on('button:next', function () {
    this.focus_to_next_field({
      type: 'button',
      change_by_lr_key: true
    })
  })

  this.on('ok', function (flds) {
    cl('on ok', flds)
  })

}


//var clearFormErrors = function () {
//  var $form = $view.find("form");
//  $form.find(".help-inline.error").each(function () {
//    $(this).remove();
//  });
//  $form.find(".control-group.error").each(function () {
//    $(this).removeClass("error");
//  });
//}
//var markErrors = function (value, key) {
//  var $controlGroup = $view.find("#contact-" + key).parent();
//  var $errorEl = $("<span>", {
//    class: "help-inline error",
//    text: value
//  });
//  $controlGroup.append($errorEl).addClass("error");
//}


object_class.prototype.add_validation_error = function (field, msg) {
  if (this.view) {
    var group = this.view.$el.find('#' + field.id).parent();
    var hb = group.find('#validation_' + field.id)
      //    var hb = group.find('.help-block')
      //    var hb = group.find('span')
      //    var hb = group.find('*')
    if (hb.length) {
      if (hb.text() !== msg) hb.text(msg)
    } else
      group.append($('<span>', {
        id: 'validation_' + field.id,
        class: 'help-block',
        //      class: 'help-inline has-error',
        text: msg
      }))
    group.addClass('has-error');
  }
  field.validation_error = true
}


object_class.prototype.remove_validation_error = function (field) {
  if (this.view) {
    var group = this.view.$el.find('#' + field.id).parent();
    group.find('#validation_' + field.id).remove();
    group.removeClass('has-error');
  }

  field.validation_error = false
}



object_class.prototype.verify = function (show_errors) {
  var fld, ok = true,
    v, error_str

  if (show_errors === undefined) show_errors = true
    //  var vals = this.get_values()

  for (var i in this.fields) {
    fld = this.fields[i]
    if (fld.field_kind === field_kinds.plane) {
      error_str = ''
      if (fld.not_null || fld.min_len || fld.fit_pattern || fld.check_sync) {
        v = this.get_value(fld.name)
        if (fld.not_null && values_lib.is_empty(v))
          error_str = 'Поле должно быть заполнено'
        else if (fld.min_len != undefined &&
          (s = values_lib.to_type(v, 'string')) &&
          s.length !== undefined && s.length < fld.min_len)
          error_str = 'Минимальная длина ' + fld.min_len + ' символов'
        if (fld.fit_pattern && error_str === '' && !values_lib.is_empty(v) &&
          !fld.fit_pattern.test(v))
          error_str = 'Значение не отвечает требованиям'
        if (error_str === '' && fld.check_sync) {
          var r
          if (fld.check_sync.length == 1) r = fld.check_sync(v)
          else r = fld.check_sync(v, this.get_values())
          if (!r.ok)
            if (r.msg !== '') error_str = r.msg
            else error_str = 'Ошибка при проверке'
        }
      }
      if (error_str !== '') {
        if (show_errors) this.add_validation_error(fld, error_str)
        ok = false
      } else if (show_errors && fld.validation_error)
        this.remove_validation_error(fld)
    } else if (fld.field_kind === field_kinds.complex)
      if (!fld.verify(show_errors)) ok = false
  }
  return ok
}



object_class.prototype.init_or_set_value = function (how, value) {
  var i, f
  if (!values_lib.is_object(value)) {
    this.logError('function init_or_set_value(' + how + '): при присвоении значения ' +
      'полю ' + this.id + ' (тип object) параметр value не {} - ' +
      JSON.stringify(value))
    return
  }
  for (i in value)
    f = this.fields[i]
  if (f === undefined) {
    if (!this.not_check_fields_existency)
      this.logError('function init_or_set_value(' + how + '): при присвоении ' +
        'значения ' + value[i] + ' полю ' + this.id +
        ' (тип object) не найдено внутр.поле - ' + i)
  } else
  if (!this.using_template && (f.type !== 'decor'))
    if (how === 'set') f.set_value(value[i])
    else f.init_value(value[i])
  if (this.using_template) {
    if (!this.values) this.values = {}
    if (this.exist_complex_fields) {
      self = this
      _.each(this.complex_fields, function (v) {
        if (value[v] && self.fields[v] && self.fields[v].init_or_set_value)
          self.fields[v].init_or_set_value(how, value[v])
        delete value[v]
      })
    }
    if (how === 'init') _.extend(this.initial_values, value)
    _.extend(this.values, value)
  }
}


object_class.prototype.init_value = function (value) {
  this.init_or_set_value('init', value)
}

//---

object_class.prototype.set_value = function (value) {
  this.init_or_set_value('set', value)
}

// options.access - доступы в виде [{
//   role: 'наименование_роли', 
//   field: 'наименование_поля', // если не установлено, применяется к корневому полю
//   access: 'crudw', // где access: c-создание, r-чтение, u-изменение, d-удаление,
//                    // w-запись в общем (включает в себя c,u,d)
//   prohib: true/false // true - доступ запрещен, по умочанию false
// }]
//object_class.prototype.set_one_access = function (access) {
//  if (!values_lib.is_object(access)) {
//    this.error_log('set_one_access(), неверный параметр - доступ: ' +
//                   JSON.stringify(access))
//    return
//  }
//  if (!access.field) this.access.push(access)
//  else if (!_.isString(access.field))
//      this.error_log('set_one_access(), значение имя поля (field) д.б.строкой: ' +
//          access)
//  else {    
//    var a = access.field.split('.')
//    if (!this.fields[a[0]])
//      this.error_log('set_one_access(), не найдено поле a[0] при установке доступа: ' +
//          access)
//    else
//  }
//}


object_class.prototype.set_prepared_access = function (access) {
  var i
  this.access = access
  if (access.fields)
    for (i in access.fields) {
      if (this.fields[i])
        this.fields[i].set_prepared_access(access.fields[i])
      else this.logError('set_prepared_access(), не найдено поле ' + i)
    }
}


object_class.prototype.get_fields_default_values = function (fields) {
  var o = {},
    f
  for (var i in fields) {
    f = fields[i]
    //    if f.type
    if (is_plane_field(f.type) && f.default) o[f.name] = f.default
  }
  return o
}

//---

object_class.prototype._get_fields_values = function (fields) {
  var o = {},
    f
  for (var i in fields) {
    f = fields[i]
    if (f.field_kind === field_kinds.complex) {
      o[f.name] = f.get_values()
    } else if (this.view && f.field_kind === field_kinds.plane)
      o[f.name] = this.view.$el.find(f.ui_selector()).val()
      //    if (is_complex_field(f.type)) o[f.name] = f.get_values()
      //    else if (this.view && is_plane_field(f.type)) 
      //      o[f.name] = this.view.$(f.ui_selector()).val()
  }
  return o
}


object_class.prototype.get_values = function () {
  return this._get_fields_values(this.fields)
}


object_class.prototype.get_value = function (fld_name) {
  var fld = this.fields[fld_name]
  if (!fld || (fld.field_kind !== field_kinds.plane &&
    fld.field_kind !== field_kinds.complex)) return
  else {
    //    if (is_complex_field(fld.type)) return fld.get_values()
    if (fld.field_kind === field_kinds.complex) return fld.get_values()
    else {
      var sel = fld.ui_selector(),
        elem
      if (this.view && (elem = this.view.$(sel)).length)
        return elem.val()
          //        return this.view.$(sel).val()
      else {
        if (this.values) return this.values[fld_name]
        else return this.fields[fld_name].value
      }
    }
  }
}

object_class.prototype.repaint_complex_field = function (fld_name) {
  if (!this.fields[fld_name]) return
  this.view['region_' + fld_name].show(this.fields[fld_name].view)
}

//---

object_class.prototype.get_fields_lib_aux_datas = function (fields, values, for_edit) {
  var fld, s = '',
    defs = {},
    vals = {},
    emptys = {},
    regions = {},
    helpers = {},
    events = {}
  for (var i in fields) {
    fld = fields[i]
    //log(fld.name, fld.type, fld.dom_events)
    if (fld.template_helpers) _.extend(helpers, _.result(fld, 'template_helpers'))
    if (fld.dom_events)
      _.extend(events, _.result(fld, 'dom_events'))
      //    if (is_complex_field(fld)) {
    if (fld.field_kind === field_kinds.complex) {
      s = s + '<div id="' + fld.id + '" class="ist-complex-field"></div>\n'
      regions['region_' + fld.name] = '#' + fld.id
      //      fld.make_template(templates, for_edit)
    } else {
      if (fld.field_kind === field_kinds.plane) {
        if (fld.default) defs[fld.name] = fld.default
        else emptys[fld.name] = ''
        if (!values && fld.value) vals[fld.name] = fld.value
      }
      s = s + fld.get_template(for_edit)
    }
  }
  if (values) vals = _.extend(emptys, values)
  else vals = _.extend(emptys, vals)

  var tpl
  if (this.root_field) {
    tpl = '<form class="ist-data-block'
    if (this.look === 'inline') tpl += ' form-inline'
    tpl += '">' + s + '</form>'
  } else tpl = '<div class="ist-data-block">' + s + '</div>'

  return {
    defs: defs,
    vals: vals,
    regions: regions,
    helpers: helpers,
    dom_events: events,
    //    tpl: '<div class = "container-fluid row"> ' + s + ' </div>\n'
    //    tpl: '<div class = "highlight"> ' + s + ' </div>\n'
    tpl: tpl
    //    tpl: for_edit ? '<form class = "form-inline ist-data-block"> ' + s + ' </form>\n' : 
    //     '<div class = "ist-data-block">' + s + '/div'
  }
}


// options:
//   not_make_view: true,
//   view_initialize: function(){}

object_class.prototype.init_show_objs = function (for_edit, options) {
  options || (options = {})

  var data = this.get_fields_lib_aux_datas(this.fields, this.values, for_edit)

  var model_class = backbone.Model.extend({
      defaults: data.defs
    })
    //  this.model = new this.model_class({name: '', adres: ''})
  var model = new model_class(data.vals)
  var self = this

  var tpl = data.tpl
    //  if (this.root_field) {
    //    tpl = '<form class="ist-data-block'
    //    if (this.look === 'inline') tpl += ' form-inline'
    //    tpl += '">' + data.tpl + '</form>'
    //  } else tpl = '<div class="ist-data-block">' + data.tpl + '</div>'

  if (this.modal && this.root_field)
    tpl = '<div id="' + this.id + '_modal" class="modal" tabindex="-1" role="dialog">' +
    '<div class="modal-dialog modal-sm">' +
    '<div class="modal-content">' + tpl +
    '</div></div></div>'
  else if (this.width)
    tpl = '<div class="row"><div class="' + this.width + '">' + tpl +
    '</div></div>'
    //    tpl = '<div class="modal bs-example-modal-sm" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
  var template = _.template(tpl)
  var view_options = {
      //    tagName: this.root_field ? 'form' : 'div',
      //    className: 'ist-data-block',
      //    className: this.root_field ? 'ist-data-block' : 'ist-data-block',
      template: template,
      templateHelpers: data.helpers,
      events: data.dom_events,
    }
    //  if (this.look === 'inline') view_options.className +=' form-inline'
  if (this.exist_complex_fields) {

    for (var i in this.complex_fields)
      this.fields[this.complex_fields[i]].init_show_objs(for_edit)

    var view_class = marionette.LayoutView.extend(_.extend(view_options, {
      regions: data.regions,
      initialize: function () {
        if (options.view_initialize) options.view_initialize.call(this)
        this.on("show", function () {
          for (var i in data.regions) {
            //            console.log('show...', i, this.model.toJSON(),data.regions)
            this[i].show(self.fields[i.substr(i.indexOf('_') + 1)].view)
          }
        })
      }
    }))
  } else var view_class = marionette.ItemView.extend(view_options)
  this.view_class = view_class

  if (options.not_make_view === undefined || !options.not_make_view) {
    this.view = new view_class({
      model: model
    })
    this.make_view_behaviour()
  }
  //  if (this.exist_complex_fields) {
  //    for (var i in this.complex_fields)
  //      this.fields[this.complex_fields[i]].init_show_objs(for_edit)
  //  }
}


object_class.prototype.get_start_focus_field = function () {
  var f, focus_field_name = ''
  for (var i in this.fields) {
    f = this.fields[i]
    if (f.focus_on_start && (f.field_kind === field_kinds.plane ||
      f.field_kind === field_kinds.control)) {
      focus_field_name = i
      break
    }
  }
  if (focus_field_name === '' && this.complex_fields) {
    var s
    for (var i in this.complex_fields) {
      f = this.fields[this.complex_fields[i]]
      if (f.get_start_focus_field) {
        s = f.get_start_focus_field()
        if (!values_lib.is_empty(s)) {
          focus_field_name = s
          break
        }
      }
    }
  }
  if (focus_field_name === '' && this.root_field)
    for (var i in this.fields) {
      f = this.fields[i]
      if (f.field_kind === field_kinds.plane || f.field_kind === field_kinds.control) {
        focus_field_name = i
        break
      }
    }
  return focus_field_name
}


object_class.prototype.make_view_behaviour = function () {
  if (!this.view) return

  var self = this,
    focus_field_name

  if (this.modal && this.root_field) {
    this.view.on('show', function () {
      var elem = this.$el.find('#' + self.id + '_modal')
      if (elem.length > 0) {
        elem.modal('show');
        elem.on('hidden.bs.modal', function (e) {
          self.trigger('fields:cancel')
        })
      }
    })
    this.view.on('before:destroy', function () {
      this.$el.find('#' + self.id + '_modal').modal('hide')
    })
  }

  this.view.on('show', function () {
    this.$el.find('[data-toggle="tooltip"]').tooltip({
      delay: {
        "hide": 1000
      }
      //      delay: { "show": 500, "hide": 100 }
    }).on('shown.bs.tooltip', function (e) {
      setTimeout(function () {
        self.view.$el.find('#' + e.currentTarget.id).tooltip('hide');
      }, 3000);
    })
  })

  // фокус на поле при запуске
  focus_field_name = this.get_start_focus_field()
  if (!values_lib.is_empty(focus_field_name))
    this.view.on('show', function () {
      this.$el.find(self.fields[focus_field_name].ui_selector()).focus()
    })
}


//--------------------------------------------------------------------------------

// options:
//   no_add_edit_buttons: true в случае если не нужны кнопки для изменения и 
//     удаления записей

var object_array_class = function (options) {
  var ok
    // добавить кнопки  
  if (options.no_add_edit_buttons === undefined) ok = false
  else ok = options.no_add_edit_buttons
  if (!ok) this.add_edit_buttons(options.fields)

  this.initial_options = options
  //  field_class.call(this, options);
  object_class.call(this, options);
  this.field_kind = field_kinds.complex
}

exports.field_classes.object_array_class = object_array_class;

values_lib.inherit(object_array_class, object_class);


object_array_class.prototype.type = 'object_array';


object_array_class.prototype.add_edit_buttons = function (fields) {
  if (fields) {
    var a = [{
      type: 'decor',
      role: 'corner_top_panel_begin',
      value: 'border'
    }, {
      name: 'edit_btn',
      type: 'button',
      role: 'edit',
      size: 'micro',
      icon: 'edit',
    }, {
      name: 'delete_btn',
      type: 'button',
      role: 'delete',
      size: 'micro',
      icon: 'delete',
    }, {
      type: 'decor',
      role: 'corner_top_panel_end',
    }]
    for (var i = a.length - 1; i >= 0; i--)
      fields.unshift(a[i])
  }
}

object_array_class.prototype.get_values = function () {
  var fld
  if (this.view) {
    var a = []
    this.view.children.each(function (view) {
      fld = view.model.my_datas.field
      fld.view = view
      a.push(fld.get_values())
    })
    return a
  } else if (this.values) return this.values
  else return []
}

object_array_class.prototype.verify = function () {
  var fld, ok = true
  if (this.view) {
    var a = []
    this.view.children.each(function (view) {
      fld = view.model.my_datas.field
      fld.view = view
      a.push(fld.get_values())
    })
    return a
  } else if (this.values) return this.values
  else return []
}


object_array_class.prototype.make_array_template_html = function () {
  var s = ''
  if (this.has_access('c') || this.has_access('w')) 
    s += '<div class="ist-rigthted ist-top-radius-corners">' +
    '<button type="button" id="collection_' + this.name + '_add_button" '+
      'class="btn btn-primary ist-top-panel-button">' +
//      '<span class="glyphicon glyphicon-plus"></span>&nbsp;Добавить' +
      'Добавить' +
    '</button></div>'
  
  return s + '<div id="collection_' + this.name + '"></div>'
}

object_array_class.prototype.make_array_events = function(){
  var o = {}
  o['click #collection_' + this.name + '_add_button'] = function(){
    this.trigger('fields:new')
  }
  return o
}

object_array_class.prototype.init_show_objs = function (for_edit) {
  var data = this.get_fields_lib_aux_datas(this.fields, undefined, for_edit)
  var fld, i
  var self = this

  var collection_class = backbone.Collection.extend({
    model: backbone.Model.extend({
      defaults: data.defs
    })
  })

  var child_view_class = marionette.ItemView.extend({
    template: _.template(data.tpl),
    events: data.dom_events
  });

  var field = this

  //  var view_class = marionette.CollectionView.extend({
  //  var view_class = marionette.LayoutView.extend({
  //  

  var view_class = marionette.CompositeView.extend({
    template: _.template(this.make_array_template_html()),
    childViewContainer: '#collection_' + this.name,
    //    childViewContainer: 'div',
    childView: child_view_class,
    className: 'ist-data-block ist-object-array',
    emptyView: no_data_view,
    events: this.make_array_events(),

    getChildView: function (model) {
      if (field.exist_complex_fields) {
        field.initial_options.id_postfix = model.cid
        field.initial_options.type = 'object'
        field.initial_options.values = undefined
        var fld = get_field(field.initial_options, field)
        fld.init_value(model.toJSON())
        fld.init_show_objs(for_edit, {
          not_make_view: true,
          view_initialize: function () {
            fld.view = this
          }
        })
        model.my_datas = {}
        model.my_datas.field = fld
        return fld.view_class
      } else return child_view_class
    }

    //    onBeforeAddChild: function(childView){
    //      console.log('onBeforeAddChild...', childView.model.toJSON())
    //    }
  })

  this.collection = new collection_class(this.values)

  this.view = new view_class({
    collection: this.collection
  })

  //  this.view.on("all", function(event_name, view, p3){
  //    cl('-all event -', child_view, model, p3)
  //  })

  for (i in this.fields) {
    fld = this.fields[i]
    if (fld.type === 'button' && fld.array_field_roles(fld.role))
      (function (btn_role) {
        self.view.on("childview:fields:" + btn_role, function (child_view) {
          //cl('-array event -', btn_role, child_view, self.view)
          if (btn_role === 'delete') self.remove_model(child_view.model)
        })
      })(fld.role)

    //  icon (string): edit / new / delete / show
  }
  //  cl(data)
}

object_array_class.prototype.remove_model = function (model) {
  this.view.collection.remove(model)
}


object_array_class.prototype.init_or_set_value = function (how, value) {
  var i, j
  if (!_.isArray(value)) {
    this.logError('function init_or_set_value(' + how + '): при присвоении ' +
      'значения полю ' + this.id + ' (тип ' + this.type + ') параметр value ' +
      'не массив - ' + JSON.stringify(value))
    return
  }
  for (j in value)
    for (i in value[j])
      if (this.fields[i] === undefined)
        this.logError('function init_or_set_value(' + how + '): при присвоении ' +
          'значения ' + value[j][i] + ' полю ' + this.id +
          ' (тип ' + this.type + ') не найдено внутр.поле - ' + i)
  if (how === 'init') this.initial_values = value
  this.values = value
  if (this.collection) this.collection.reset(value)
}


//      initialize: function() {
//        this.on("show", function(){
//          for (var i in data.regions)
//            this[i].show(self.fields[i.substr(i.indexOf('_') + 1)].view)
//        })
//      }

//else 
//    var view_class = marionette.ItemView.extend({
//      template: template
//    }) 
//  if (this.exist_complex_fields) {
//    for (var i in this.complex_fields)
//      this.fields[this.complex_fields[i]].init_show_objs(for_edit)
//  }


//--------------------------------------------------------------------------------

var diff_object_class = function (options) {
  var i, fld

  field_class.call(this, options)
  this.field_kind = field_kinds.complex
  var err_place = 'constructor diff_object_class, поле: ' + this.name
  if (!options.parent || options.parent.type != 'object')
    this.logError(err_place +
      ' отсутствует поле-родитель parent или тип поля-родителя не object')
  if (!options.base_field)
    this.logError(err_place + ' отсутствует наименование базового поля base_field')
  else this.base_field = options.base_field
  this.fields_groups = {}
  if (!options.fields_groups)
    this.logError(err_place +
      ' отсутствует определение наборов полей fields_groups')
  else
    for (i in options.fields_groups) {
      fld = _.clone(options.fields_groups[i])
      this.fields_groups[fld.base_value] = fld
    }
  if (options.values) this.init_value(options.values)
  this.is_editing = true
}


exports.field_classes.diff_object_class = diff_object_class

values_lib.inherit(diff_object_class, object_class);

diff_object_class.prototype.type = 'diff_object';


diff_object_class.prototype.init_or_set_value = function (how, value) {
  var i
  if (!values_lib.is_object(value)) {
    this.logError('function init_or_set_value(' + how + '): при присвоении значения ' +
      'полю ' + this.id + ' (тип diff_object) параметр value не {} - ' +
      JSON.stringify(value))
    return
  }
  if (!this.initial_values) this.initial_values = {}
  if (!this.values) this.values = {}
  if (how === 'init') _.extend(this.initial_values, value)
  _.extend(this.values, value)
}

diff_object_class.prototype.get_values = function () {
  if (this.current_field) return this.current_field.get_values()
  else if (this.values) return this.values
  else return {}
}

diff_object_class.prototype.dom_events = function () {
  var o = {}
  if (!this.parent || !this.parent.fields[this.base_field]) return
  o['change #' + this.parent.fields[this.base_field].id] =
    _.bind(this.base_field_changed, this)
  return o
}

diff_object_class.prototype.base_field_changed = function (e) {
  this.init_show_objs(this.is_editing)
  this.parent.repaint_complex_field(this.name)
}


diff_object_class.prototype.init_show_objs = function (for_edit) {
  this.is_editing = for_edit
  if (!this.parent) return
  var cur_value = this.parent.get_value(this.base_field)
  if (!this.fields_groups[cur_value]) return

  var fld_opts = this.fields_groups[cur_value]
  fld_opts.type = 'object'
  fld_opts.name = this.name + '_' + cur_value
  var fld = get_field(fld_opts, this.parent)
  fld.not_check_fields_existency = true

  fld.init_value(this.get_values())

  fld.init_show_objs(for_edit)
  this.current_field = fld
  this.view = fld.view
}


diff_object_class.prototype.verify = function (show_errors) {
  if (this.current_field) return this.current_field.verify(show_errors)
  else return true
}

//diff_object_class.prototype.get_base_field_value = function () {
//  if (this.parent.model)
//    return this.parent.model.get(this.base_field)
//  else if (this.parent.fields[this.base_field])
//    return this.parent.fields[this.base_field].value
//}
//
//
//diff_object_class.prototype.get_current_group = function () {
//  return this.fields_groups[this.get_base_field_value()]
//}


//--------------------------------------------------------------------------------

var diff_object_array_class = function (options) {
  this.field_kind = field_kinds.complex
}


var create_classes = {
  string: string_class,
  number: number_class,
  select: select_class,
  password: password_class,
  button: button_class,
  object: object_class,
  decor: decor_class,
  diff_object: diff_object_class,
  object_array: object_array_class
}