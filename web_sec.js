var forms = require('./forms')
var $ = require('jquery');
var net = require('./web_net');

var cl = require('../utils/console_log').client_log;



// вход пользователя
// exports.log_user = function(region) {


// добавление нового пользователя
// exports.reg_user = function(region)


// текущий вошедший пользователь
// user.access [{
//   role:
//   till: datetime
//   prohib: true/false
// },...] 
var current_user = exports.current_user = {}

/**
Устанавливает текущего авторизовавшегося в системе пользователя
@function
*/
exports.set_current_user = function(user){
  current_user = exports.current_user = user
}


var enter_user_datas = function(region, callback) {
  var def = {
    look: 'plane',
    width: 'col-sm-4',
    fields: [{
      name: 'name',
      caption: 'Имя пользователя',
      type: 'string',
      len: 20,
      not_null: true,
      fit_pattern: /^[\u00BF-\u1FFF\u2C00-\uD7FF\w]+$/
    }, {
      name: 'pass',
      caption: 'Пароль',
      type: 'password',
      len: 20,
      not_null: true,
      min_len: 6,
      fit_pattern: /^[\u00BF-\u1FFF\u2C00-\uD7FF\w]+$/
    }, {
      name: 'pass_again',
      caption: 'Повтор пароля',
      type: 'password',
      len: 20,
      not_null: true,      
      fit_pattern: /^[\u00BF-\u1FFF\u2C00-\uD7FF\w]+$/,
      check_sync: function(v, vals){
        if (v === vals.pass) return {ok: true}
        else  
          return {
            ok: false,
            msg: 'Пароли не совпадают'
          }
      }
    }, {
      name: 'email',
      caption: 'Электронная почта',
      type: 'string',
      len: 100,
//      not_null: true,
      fit_pattern: /^\S+@\S+\.\S+$/
    }]
  }
  var form
  
  forms.add_buttons(def.fields, ['cancel', {
    name: 'ok_button',
    role: 'ok',
    caption: 'Войти'
  }])
  form = forms.create_form(def, {look: 'plane'})
  forms.add_standart_reaction(form, callback)

  region.show(form.view)
}


var enter_credentials = function(region, callback) {
  var def = {
    look: 'plane',
    width: 'col-sm-4',
    fields: [{
        type: 'decor',
        role: 'text',
        value: 'Вход'
//      value: 'Remove the default list-style and left margin on list items (immediate children only). This only applies to immediate children list items, meaning you will need to add the class for any nested lists as well.'
      }, {
        type: 'decor',
        role: 'hline',
      }, {
        name: 'username',
        caption: 'Имя пользователя',
        type: 'string',
        len: 20,
        not_null: true,
        fit_pattern: /^[\u00BF-\u1FFF\u2C00-\uD7FF\w]+$/
      }, {
        name: 'password',
        caption: 'Пароль',
        type: 'password',
        len: 20,
        not_null: true,
        fit_pattern: /^[\u00BF-\u1FFF\u2C00-\uD7FF\w]+$/
      }
    ]
  }
  var form
  
  forms.add_buttons(def.fields, ['cancel', {
    name: 'ok_button',
    role: 'ok',
    caption: 'Войти'
  }])
  form = forms.create_form(def, true)
  forms.add_standart_reaction(form, callback)
  
  region.show(form.view)
  
  
//  var defer = $.Deferred();
//  fields.on('ok', function(data){
//    defer.resolve(data);
//  })
//  fields.on('cancel', defer.reject)
//  return defer.promise();
}

exports.log_user = function(region) {
  enter_credentials(region, function(data){
//cl('in log_user data', data)
    if (data !== null) {
      net.post_json('/login', data, function(res){
        if (res.ok === null) cl('AAA ERROR!!!', res.msg)
        else if (res.ok) cl('Great LOGIN!!!', res.user)
        else cl('NO LOGIN!!!', res.msg)
      })
    }
  })
}



exports.reg_user = function(region) {
  enter_user_datas(region, function(data){
    if (data !== null) {
      if (data.pass_again) delete data.pass_again
      net.post_json('/reg', data, function(res){
        if (res != null) cl('CREAT SUCCESS!!!', res)
      })
    }
  })
}

// user.access [{
//   role:
//   till: datetime // дата до которой роль дейтвительноста или до которой отключена
//   off: true/false
// },...] 

// options.access - доступы в виде [{
//   role: 'наименование_роли', 
// не учитывается field, т.е.должно рассчитываться для каждого поля отдельно
//   act: 'crudw', // где act: c-создание, r-чтение, u-изменение, d-удаление,
//                 // w-запись в общем (включает в себя c,u,d)
//   off: true/false // true - доступ отключен, по умочанию false
//   prohib: true/false // true - доступ запрещен (запретительная роль), по умочанию false
//   till: datetime // дата до которой роль дейтвительноста или до которой отключена
// },...]

/**
Осуществляет разбор списка доступов и проверяет их по доступам текущего пользователя
(web_sec.current_user)

@function
@param {Object[]} access доступы для проверки
@returns {Object} объект с полями granted (разрешенные доступы), 
fields (доступы к внутренним полям)
*/


exports.resolve_access = function(access) {
  var avail = {}, a, cur_date = new Date(), i
  var res = {granted: {}}
  
  function set_act(fld, act, prohib){
    var level = res, f
//cl(fld, act, prohib)
    if (fld) {
      var flds = fld.split('.')
//cl(fld,flds)
      for (i in flds) {
        f = flds[i]
        if (!level.fields) level.fields = {}
        if (!level.fields[f]) level.fields[f] = {granted: {}}
        level = level.fields[f]
      }
    }
    if (prohib) {
      if (!level.prohibited) level.prohibited = {}
      level = level.prohibited
    }
    else level = level.granted
    for (var i = 0; i < act.length; i++) 
      level[act[i]] = true
  }
  
  function role_active(role, till, off){
    if (off) {
      if (!till || till >= cur_date) return false
      else return true
    }
    else if (!till || till >= cur_date) return true
    else return false
  }
  
  function fix_act(level) {
    var i
    if (level.prohibited) {
      if (level.granted) 
        for (i in level.prohibited) {
//cl('loop by',i, level.prohibited[i])
          if (level.granted[i]) delete level.granted[i]
        }
      delete level.prohibited
    }
    if (level.fields)
      for (i in level.fields)
        fix_act(level.fields[i])
  }
  
  if (current_user && current_user.access) {
    for (i in current_user.access) {
      a = current_user.access[i]
      if (a.role && role_active(a.role, a.till, a.off))
        avail[a.role] = true
    }
  }
  else avail = false
//cl(avail)
  
  for (var i in access) {
    a = access[i]
    if (!a.role || !role_active(a.role, a.till, a.off)) continue
    if (a.role === 'all') set_act(a.field, a.act, a.prohib)
    else if (avail[a.role]) set_act(a.field, a.act, a.prohib)
  }
//cl(res)  
  fix_act(res)
//cl(res)  
  
  return res
}




//exports.test_form = function(region, callback) {
//  var def = {
//    look: 'plane',
//    width: 'col-sm-4',
//    modal: true,
//    fields: [{
//        type: 'decor',
//        role: 'corner_top_panel_begin',
//        value: 'border'
//      }, {
//        name: 'corner_close_btn',
//        type: 'button',
//        role: 'cancel',
//        size: 'micro',
//        icon: 'delete',
////        caption: '&times'
//      }, {
//        type: 'decor',
//        role: 'corner_top_panel_end'
//      }, {
//        type: 'decor',
//        role: 'text',
//        value: 'Вход'
//      }, {
//        type: 'decor',
//        role: 'hline',
//      }, {
//        name: 'username',
//        caption: 'Имя пользователя',
//        type: 'string',
//        len: 20,
//        not_null: true
//      }, {
//        name: 'password',
//        caption: 'Пароль',
//        type: 'password',
//        len: 20,
//        not_null: true,
//        fit_pattern: /^[\u00BF-\u1FFF\u2C00-\uD7FF\w]+$/
//      }
//    ]
//  }
//  var form
//  
//  forms.add_buttons(def.fields, ['cancel', {
//    name: 'ok_button',
//    role: 'ok',
//    caption: 'Войти'
//  }])
//  form = forms.create_form(def, true)
//  forms.add_standart_reaction(form, callback)
//  
//  region.show(form.view)
//}

