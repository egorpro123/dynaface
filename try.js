var j = $('<script type="text/template" id="loading-view">      <h1>{{- title }}</h1>      <p>{{- message }}</p>      <div id="spinner">/div>    </script>');



var templates = {
  static: "<p>This is text that was rendered by our ISTINOID app.</p>",
  
  contact: [
    "contact<p><h1>{{- title }}</h1></p>",
    "<p>{{- message }}</p>",
    "<p>{{- phoneNumber }}</p>",
    "<div id='spinner'></div>"
  ].join("\n"),
  
  contact2: [
    "contact2<p>{{- title }}</p>",
    "{{- message }}",
    "{{- phoneNumber }}",
    "<div id='spinner'></div>"
  ].join("\n")
};

/*
defs {
  _id: ,
  fields: [
    {
	  name: '',
	  short: '',
	  len: 0,
	  type: fk,
	  type_copy,
	  value: '',
	},
	...
  ],
}
*/
var tab_templates = {};

/*
  name: ''
  fields: [
    {
      name: '' // 
      type: типы контролов: t-текстовое поле
      len: 0
      value: ''
      option: {}
      classes: '' // классы оформления
      def: ''
    },
    ...
  ]
*/
var show_tab = function(def) {
  if (!def) {
    handle_error('function show_tab - не определен обязательный параметр def');
    return;
  }
  
  var k, fields = def.fields, f;
  for (var k in fields) {
    f = fields[k];
    
    
  }  
}


//var check_def = function (def, callback) {
//  var f;
//  for (var k in flds) {
//    f = flds[k];
//    if (MAIN_TYPES.indexOf(f.type) = 0 &&
//      (!f.type_copy || f.type_copy.id !== f.type))
//    else 
//  }
//}
//
//var show_tab = function (def) {
//  check_def(def, function(){
//    do_show_tab(def);
//  })
//}






Backbone.Marionette.TemplateCache.prototype.original_loadTemplate =
  Backbone.Marionette.TemplateCache.prototype.loadTemplate;

Backbone.Marionette.TemplateCache.prototype.loadTemplate = function (id) {
  var tpl;
  
  if (id.charAt(0) == "#") {
    tpl = Backbone.Marionette.TemplateCache.prototype.original_loadTemplate(id);
  } else {
    tpl = _.result(templates, id);
  }
  if (!tpl || tpl.length === 0){
    throwError("Could not find template: '" + tpl + "'", "NoTemplateError");
  }
  return tpl;
};


var view_class = Marionette.ItemView.extend({
  template: "contact",
  model: new Backbone.Model({
    title: "title Alice",
    message: "hello Arten",
    phoneNumber: "555-0184"
  })
});

var static_view_class = Marionette.ItemView.extend({
  template: "static"
});

var collection_class = Backbone.Collection.extend({
  model: Backbone.Model.extend({})
});

var row_view_class = Marionette.ItemView.extend({
  tagName: "li",
  template: "contact",
  getTemplate: function(){
    if (this.model.get("title").charAt(0)==='B'){
      return "contact";
    } else {
      return "contact2";
    }
  }

//  template: function() {
//    console.log('this.model>', this.model);
//    if (this.model.get(title) === 'Bob') return "contact";
//    else return "contact2";
//  }
});

var collection_view_class = Marionette.CollectionView.extend({
  tagName: "ul",
  childView: row_view_class
//  childView: function() {
//    console.log(this.model, this.collection);
//    return row_view_class;
//  }
});

var contacts = new collection_class([
  {
    title: "Bob",
    message: "Brigham",
    phoneNumber: "555-0163"
  },
  {
    title: "Alice",
    message: "Arten",
    phoneNumber: "555-0184"
  },
  {
    title: "Charlie",
    message: "Campbell",
    phoneNumber: "555-0129"
  }
]);

var contacts_view = new collection_view_class({
  collection: contacts
});


// ---

var app = new Marionette.Application();

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
  main_region: "#region",
});


app.start();

app.main_region.show(contacts_view);
//app.main_region.show(new view_class);
//app.main_region.show(new static_view_class);











