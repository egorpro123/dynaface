var cl = require('../utils/console_log').client_log;

var _ = require('underscore');
var backbone = require('backbone');
var $ = jQuery = require('jquery');
backbone.$ = $;
//cl('backbone setted')
var marionette = require('backbone.marionette');
var bootstrap = require('bootstrap')

var forms = require('./forms')
var security = require('./web_sec')
var pagination = require('./pagination')
var defs_set = require('./defs_set')
var net = require('./web_net')



var app = new marionette.Application();

app.on("before:start", function(options){
//  console.log('app.on("before:start", function(options) >>>> ', options)
  _.templateSettings = {
    interpolate: /\{\{=(.+?)\}\}/g,
    escape: /\{\{-(.+?)\}\}/g,
    evaluate: /\{\{(.+?)\}\}/g
  };  
});
//app.start({a:1,b: 2});

app.addRegions({
  content_region: '#content_region',
  modal_region: '#modal_region'
});


app.on("start", function(options){

  if (backbone.history){
    backbone.history.start();

// sample code    
//    if(Backbone.history.fragment === ""){
//      Backbone.history.navigate("contacts");
//      ContactManager.ContactsApp.List.Controller.listContacts();
//   или, но не рекомендуется
//    Backbone.history.navigate("contacts", {trigger: true});
//   или 
//    if(this.getCurrentRoute() === ""){
//      ContactManager.trigger("contacts:list");
//    }
    
//    }
  }  
  forms.set_app_regions({
    content_region: app.content_region,
    modal_region: app.modal_region
  })

  net.post_json('/commodity', {a:1}, function(obj){
    cl(JSON.stringify(obj));
  })
  
//  defs_set.show()
  pagination.test_pagi()
  
//    forms.show_sample_list()
//  forms.show_sample_fields()
  
//  security.log_user(app.content_region)
//  security.reg_user(app.content_region)

//  security.test_form(app.content_region, function(data){
//    cl('TEST RESULT:', data)
//    forms.show_sample_fields()
//  })
  
//  forms.confirm_dialog('Выйти из программы?')
  
});

app.start();


//exports.app = app

//show_form(sample_def, false, app.main_region) 


//------------------------------------------------------------------------------------


// sample code    
//ContactManager.module("ContactsApp", function (ContactsApp, ContactManager,
//  Backbone, Marionette, $, _) {
//  
//  ContactsApp.Router = Marionette.AppRouter.extend({
//    appRoutes: {
//      "contacts": "listContacts",
//      "contacts/:id": "showContact"
//    }
//  });
//  var API = {
//    listContacts: function () {
//      ContactsApp.List.Controller.listContacts();
//    },
//    showContact: function(id){
//      ContactsApp.Show.Controller.showContact(id);
//    }
//  };

//  ContactManager.on("contacts:list", function(){
//    ContactManager.navigate("contacts");
//    API.listContacts();
//  });
//  ContactManager.on("contact:show", function(id){
//    ContactManager.navigate("contacts/" + id);
//    API.showContact(id);
//  });

//  ContactManager.addInitializer(function () {
//    new ContactsApp.Router({
//      controller: API
//    });
//  });
//});


//ContactManager.navigate = function (route, options) {
//  options || (options = {});
//  Backbone.history.navigate(route, options);
//};
//ContactManager.getCurrentRoute = function () {
//  return Backbone.history.fragment
//};


//--- regres


// - promise

//getContactEntity: function (contactId) {
//  var contact = new Entities.Contact({
//    id: contactId
//  });
//  var defer = $.Deferred();
//  setTimeout(function () {
//    contact.fetch({
//      success: function (data) {
//        defer.resolve(data);
//      },
//      error: function(data){
//        defer.resolve(undefined);
//      }
//    });
//  }, 2000);
//  return defer.promise();
//}
//
//Show.Controller = {
//  showContact: function (id) {
//    var fetchingContact = ContactManager.request("contact:entity", id);
//    $.when(fetchingContact).done(function (contact) {
//      var contactView;
//      if (contact !== undefined) {
//        contactView = new Show.Contact({
//          model: contact
//        });
//      } else {
//        contactView = new Show.MissingContact();
//      }
//      ContactManager.mainRegion.show(contactView);
//    });
//  }
//}


//----------------------------------------------------------------------

//
//var get_tpl_text = function () {
//  var s = '<select>'
//  s = s + ' {{ _.each(items(), function(item){ }}'
////  s = s +   ' {{ var selected = item[0] === "{{-what}}" ? "selected" : ""; }}'
////  s = s +   ' {{ var selected = item[0] === "b" ? "selected" : ""; }}'
//  s = s +   ' <option value="{{- item[0] }}" {{=selected(item[0])}}>{{- item[1] }}</option>'
////  s = s +   ' <option value="{{- item[0] }}">{{- item[1] }}</option>'
////  s = s +   ' <option value="{{- items[0].val }}">{{- items[0].caption }}</option>'
////  s = s +   ' <option value="{{- val }}">{{- caption }}</option>'
//  s = s + ' {{ }); }}'
//  s = s + '</select><p>{{-what}}</p><p>{{-where}}</p>'
////  console.log(s)
//  return s
//}
//
//var try_view_class = marionette.ItemView.extend({
//  tagName: 'div',
////  className: 'row',
////  template: _.template(get_tpl_text()),
//  template: 'select',
//  templateHelpers: {
////    console.log('this.model>',this.model)
////    return {
//      items: function(){
//        console.log('this.what>',this.what)
//        return [['a', 'первый'], ['b', 'второй']]
//      },
//      selected: function(val){
//        return val.toUpperCase() === this.what.toUpperCase() ? "selected" : ""
//      }
////    }
////  templateHelpers: function() {
////    console.log('this.model>',this.model)
////    return {
////      items: function(){
////        console.log('this.what>',this.what)
////        return [['a', 'первый'], ['b', 'второй']]
////      },
////      selected: function(val){
////        return val.toUpperCase() === this.what.toUpperCase() ? "selected" : ""
////      }
////    }
//  }
//});
//
//
//
//var templates = {
//  static: "<p>This is text that was rendered by our ISTINOID app.</p>",
//  
//  contact: [
//    "contact<h1>{{- title }}</h1>",
//    "<p>{{- message }}</p>",
//    "<p>{{- phoneNumber }}</p>",
//    "<div id='spinner'></div>"
//  ].join("\n"),
//  
//  contact2: [
//    "contact2<h2>{{- title }}</h2>",
//    "{{- message }}",
//    "{{- phoneNumber }}",
//    "<div id='spinner'></div>"
//  ].join("\n"),
//  
//  select: get_tpl_text()
//};
//
//marionette.TemplateCache.prototype.original_loadTemplate =
//  marionette.TemplateCache.prototype.loadTemplate;
//
//marionette.TemplateCache.prototype.loadTemplate = function (id) {
//  var tpl;
//  
//  if (id.charAt(0) == "#") {
//    tpl = marionette.TemplateCache.prototype.original_loadTemplate(id);
//  } else {
//    tpl = _.result(templates, id);
//  }
//  if (!tpl || tpl.length === 0){
//    face_utils.handle_error('Не указано имя шаблона');
////    errors_lib.throw_error("Could not find template: '" + tpl + "'", "NoTemplateError");
//  }
//  return tpl;
//};
//
//
//var view_class = marionette.ItemView.extend({
//  template: "contact",
//  model: new backbone.Model({
//    title: "title Alice",
//    message: "hello Arten",
//    phoneNumber: "555-0184"
//  })
//});
//
//var static_view_class = marionette.ItemView.extend({
//  template: "static"
//});
//
//var tpl = _.template('<div class="col-xs-6">Населенный пункт</div><div class="col-xs-6">красноярск city</div>')
//
//
////var tpl = _.template('<div class="row"><div class="com-xs-6">Населенный пункт</div><div class="com-xs-6">красноярск city</div></div>')
//
////  serializeData: function(){
////    var data = {};
////    data.items = [['a', 'первый'], ['b', 'второй']];
//////    data.items = [{val:'a', caption: 'первый'}, {val:'b', caption: 'второй'}];
//////    data.val = 'a'
//////    data.caption = 'первый'
////    console.log(data)
////    return data;
////  }
//
//
//var collection_class = backbone.Collection.extend({
//  model: backbone.Model.extend({})
//});
//
//var row_view_class = marionette.ItemView.extend({
//  tagName: "li",
//  template: "contact",
//  getTemplate: function(){
//    if (this.model.get("title").charAt(0)==='A'){
//      return "contact";
//    } else {
//      return "contact2";
//    }
//  }
//
////  template: function() {
////    console.log('this.model>', this.model);
////    if (this.model.get(title) === 'Bob') return "contact";
////    else return "contact2";
////  }
//});
//
//var collection_view_class = marionette.CollectionView.extend({
//  tagName: "ul",
//  childView: row_view_class
////  childView: function() {
////    console.log(this.model, this.collection);
////    return row_view_class;
////  }
//});
//
//var contacts = new collection_class([
//  {
//    title: "Bob",
//    message: "Brigham",
//    phoneNumber: "555-0163"
//  },
//  {
//    title: "Alice",
//    message: "Arten",
//    phoneNumber: "555-0184"
//  },
//  {
//    title: "Charlie",
//    message: "Campbell",
//    phoneNumber: "555-0129"
//  }
//]);
//
//var contacts_view = new collection_view_class({
//  collection: contacts
//});
//
//
