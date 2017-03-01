var backbone = require('backbone');
var marionette = require('backbone.marionette');
var paginator = require('backbone.paginator');
var net = require('./web_net')
var forms = require('./forms')
var _ = require('underscore')
var $ = require('jquery')

var cl = require('../utils/console_log').client_log


var make_pages_html = function(params){
  var a = []
  
  var li_dis = function(text, active){
    if (active) a.push('<li class="active disabled"><a href="#">' + text + '</a></li>')
    else a.push('<li class="disabled"><a href="#">' + text + '</a></li>')
  }
  
  var li_nav = function(url, page, text){
    a.push('<li><a href="#' + page + '" class="navigatable" '+
           'data-page="' + page + '">' + text + '</a></li>')
  }

  with (params)
    if (!last_page || last_page > 1) {
//      a.push('<ul>')
      if (current_page > 1) { 
        li_nav(url + 1, '1', '&laquo;')
        li_nav(url + previous, previous, '&lsaquo;')
      } else {
        li_dis('&laquo;')
        li_dis('&lsaquo;')
      }

      if (page_set[0] > 1) li_dis('...')
      
      for (var i in page_set) {
        var page = page_set[i]
        if (page === current_page) li_dis(page, true)
        else li_nav(url + page, page, page)
      }
      if (!last_page || page_set[page_set.length - 1] !== last_page) {
        li_dis('...')
        if (last_page) li_nav(url + last_page, last_page, last_page)
      }
        
      if (!last_page ||current_page !== last_page)
        li_nav(url + next, next, '&rsaquo;')
      else li_dis('&rsaquo;')
      if (last_page && current_page !== last_page)
        li_nav(url + last_page, last_page, '&raquo;')
      else li_dis('&raquo;')
//      a.push('/<ul>')
    }
  return a.join('')
}


var pagination_controls_view_class = backbone.View.extend({
//  template: "#pagination-controls",
  tagName: 'ul',
//  className: "pagination pagination-sm",
  className: "pagination",

  initialize: function(options){
    this.pages_state = options.pages_state;
    this.listenTo(this.pages_state, "page:change:after", this.render);
  },

  events: {
    "click a[class=navigatable]": "navigateToPage"
  },
  
  render: function(){
    this.$el.html(make_pages_html(this.pages_state));
  },
  
  navigateToPage: function(e){
    e.preventDefault();
    var page = parseInt($(e.target).data("page"), 10);
//    this.paginated_collection.parameters.set("page", page);
    this.trigger("page:change", page);
  },
});



//-------------------------------------------------------------------------

var pagination_state_class = function(options){
  _.extend(this, backbone.Events)
  this.url = options.url
  this.init()
//  this.working = true
}

pagination_state_class.prototype.init = function(){
  this.current_page = null
  this.pages_button_amount = 7
  this.page_set = []
  this.last_page = null
  this.set_current_page(1)
}

pagination_state_class.prototype.recalc = function(){
  var page = this.current_page
  var half = this.pages_button_amount / 2 | 0, start, i, j, max

  if (!this.last_page || this.pages_button_amount < this.last_page) {
    if (page - half < 1) start = 1
    else start = page - half
    max = this.pages_button_amount
  } else {
    start = 1
    max = this.last_page
  }
  this.page_set = []
  j = start
  for (i = 0; i < max; i++) {
    this.page_set[i] = j
    j++
  }
  if (this.current_page > 1) this.previous = this.current_page - 1
  else this.previous = 1
  if (!this.last_page || this.current_page > this.last_page) 
    this.next = this.current_page + 1
  else this.next = this.last_page
}


pagination_state_class.prototype.set_current_page = function(page){
  var candidate
  if (this.last_page !== null && page > this.last_page)
    candidate = this.last_page
  else candidate = page
    
  if (candidate !== this.current_page) {
    this.current_page = candidate
    this.recalc()
    return true
  }
  return false
}

pagination_state_class.prototype.set_last_page = function(page){
  if (this.last_page !== page) {
    this.last_page = page
    if (this.current_page > page) this.current_page = page
    this.recalc()
    return true
  }
  return false
}


//----------------------------------------------------------


var pagination_form_class = exports.form_class = function(options) {
  this.tab = options.tab
  this.per_page = 25
  this.list_fields = options.list_fields
  this.sort_fields = options.sort_fields
  this.filter_fields = options.filter_fields
  _.extend(this, backbone.Events)
  this.pagination_state = new pagination_state_class({url: this.url})
  var opts = {
    pages_state: this.pagination_state
  }
  this.top_pages_view = new pagination_controls_view_class(opts)
  this.bottom_pages_view = new pagination_controls_view_class(opts)
  this.list_form = forms.create_form({
    type: 'object_array',
    fields: this.list_fields
  }, true)
  this.list_view = this.list_form.view
//  region.show(form.view)
  
//  this.collection = new backbone.Collection([])
  this.make_paginated_view()
  this.make_event_handling()
}

pagination_form_class.prototype.make_event_handling = function() {
  var self = this
  this.on("page:change", function(page){
    if (this.pagination_state.set_current_page(page))
      this.load_page(function(){
        self.pagination_state.trigger('page:change:after')
      })
  }, this)

  this.list_view.on("childview:fields:edit", function(e){
    cl('childview:fields:edit', e)
  })

  this.list_view.on("fields:new", function(e){
    cl('fields:new...',e)
  })
  
//  this.view.on('all',function(ev_name){
//    cl('event...',ev_name)
//  })
}

pagination_form_class.prototype.make_query_params = function(){
  var o = {
    tab: this.tab,
    page: this.pagination_state.current_page,
    per_page: this.per_page,
  } 
  return o
}

pagination_form_class.prototype.load_page = function(cb){
  var self = this
  net.post_json('/list', this.make_query_params(), function(res){
//cl('post...')
    if (res.ok) {
      if (res.pages_amount) self.pagination_state.set_last_page(res.pages_amount)
      self.list_form.set_value(res.recs)
      if (cb) cb()
      
//      self.top_pages_view.trigger('page:change:after')
//      self.bottom_pages_view.trigger('page:change:after')
//      this.collection.reset(res.recs)
    }
  })
}

/*
* tab - имя таблицы
* page - номер страницы (по умолчанию 1)
* per_page - количество записей на странице (по умолчанию 25)
* fields - перечисление полей
* filter - фильтрация результатов в виде [{
*   name: 'имя_поля',
*   exact: true, // точное соответствие иначе like для строковых значений
*   val: 'значение' | ['значение_от','значение_до']
* },...]
* sort - сортировка в виде {
*   name: 'имя_поля',
*   order: 1|-1 // по умочанию 1
* }
* возвращает результат в виде: {
*   ok: true | false, 
*   pages_amount: number, // количество страниц, если достигнут конец 
*   recs: Object[] // массив записей
* }
*/


pagination_form_class.prototype.make_paginated_view = function(){
  var opts = {}
  var regs = ['top_pages', 'main_list', 'bottom_pages']
  var i, s = ''
  var views = [this.top_pages_view, this.list_view, this.bottom_pages_view]
  var self = this
  
  for (i in regs) s += '<div id="js_' +  regs[i] + '"></div>'
  opts.template = _.template(s)
  opts.regions = {}
  for (i in regs) opts.regions[regs[i] + '_region'] = '#js_' +  regs[i]
  
  opts.initialize = function(options) {
    this.on("show", function(){
//cl('show...')
      for (var i in regs) this[regs[i] + '_region'].show(views[i])
    });
    
    this.listenTo(self.top_pages_view, "page:change", function(page){
      self.trigger("page:change", page);
    });
    
    this.listenTo(self.bottom_pages_view, "page:change", function(page){
      self.trigger("page:change", page);
    });    
  }
  
  this.paginated_view_class = marionette.LayoutView.extend(opts)
  this.view = new this.paginated_view_class()
//  this.view = new marionette.LayoutView(opts)
}

pagination_form_class.prototype.show = function(){
  var self = this
  this.load_page(function(){
    forms.content_region.show(self.view)
  })
}

//------------------------------------------------------------------------

exports.test_pagi = function(){
  var pagi_form = new pagination_form_class({
    tab: 'cars',
    list_fields: [{
      name: 'id',
      caption: 'Код'
    }, {
      name: 'name',
      caption: 'Наименование'
    }]
  }) 
  pagi_form.show()
}

//------------------------------------------------------------------------


//var paginated_view_class = marionette.LayoutView.extend({
//
//  initialize: function(options){
//    this.collection = options.collection;
////    var eventsToPropagate = options.propagatedEvents || [];
//
//    var top_controls = new pagination_controls_class({
//      paginated_collection: this.collection,
//      url_base: options.paginatedurl_base
//    });
//    
//    
//    
//    var listView = new options.mainView({
//      collection: this.collection
//    });
//
//    var self = this;
//    
//    _.each(eventsToPropagate, function(evt){
//      self.listenTo(listView, evt, function(view, model){
//        self.trigger(evt, view, model);
//      });
//    });
//
//  }
//
//})

// ------------------------



//var collection = paginator.requestPager.extend({
//  model: Entities.Contact,
//
//  initialize: function(models, options){
//    options || (options = {});
//
//    var params = options.parameters || { page: 1 };
//    this.parameters = new backbone.Model(params);
//
//    this.paginator_core = {
//      dataType: "json",
//      url: "contacts_paginated?"
//    };
//    this.paginator_ui = {
//      firstPage: 1,
//      currentPage: 1,
//      perPage: 10,
//      pagesInRange: 2
//    };
//    this.server_api = {
//      count: function() { return this.perPage },
//      offset: function() { return ((this.parameters.get("page") || 1) - 1) * this.perPage },
//      filter: function() { return this.parameters.get("criterion"); }
//    };
//
//    var self = this;
//    this.listenTo(this.parameters, "change", function(model){
//      if(_.has(model.changed, "criterion")){
//        self.server_api.filter = self.parameters.get("criterion");
//      }
//      $.when(this.pager()).done(function(){
//        self.trigger("page:change:after");
//      });
//    });
//
//    this.on("sync", function(){
//      this.sort({silent: true});
//      this.trigger("reset");
//    });
//  },
//
//  comparator: "firstName"
//});
//
//_.extend(Entities.ContactCollection.prototype, {
//  parse: function (response) {
//    var data = response.results;
//    this.totalRecords = response.resultCount;
//    this.totalPages = Math.ceil(this.totalRecords / this.perPage);
//    this.currentPage = this.parameters.get("page");
//    return data;
//  }
//});
//



//-------------------------------------------------------------------

//var pagination_controls_class = marionette.ItemView.extend({
//  template: "#pagination-controls",
//  className: "pagination",
//
//  initialize: function(options){
//    this.paginated_collection = options.paginated_collection;
//    this.url_base = options.url_base;
//    this.listenTo(this.paginated_collection, "page:change:after", this.render);
//  },
//
//  events: {
//    "click a[class=navigatable]": "navigateToPage"
//  }
//});
//
//_.extend(pagination_controls_class.prototype, {
//  navigateToPage: function(e){
//    e.preventDefault();
//    var page = parseInt($(e.target).data("page"), 10);
//    this.paginated_collection.parameters.set("page", page);
//    this.trigger("page:change", page);
//  },
//
//  serializeData: function(){
//    var data = this.paginated_collection.info(),
//        url = this.url_base,
//        criterion = this.paginated_collection.parameters.get("criterion");
//    if(url){
//      if(criterion){
//        url += "criterion:" + criterion + "+";
//      }
//      url += "page:";
//    }
//    data.url_base = url;
//
//    return data;
//  }
//});
//


//------------------------------------------------------------------------

//var paginated_view_class = Marionette.LayoutView.extend({
//  template: "#paginated-view",
//
//  regions: {
//    paginationControlsRegion: ".js-pagination-controls",
//    paginationMainRegion: ".js-pagination-main"
//  },
//
//  initialize: function(options){
//    this.collection = options.collection;
//    var eventsToPropagate = options.propagatedEvents || [];
//
//    var controls = new pagination_controls_class({
//      paginated_collection: this.collection,
//      url_base: options.paginatedurl_base
//    });
//    var listView = new options.mainView({
//      collection: this.collection
//    });
//
//    var self = this;
//    this.listenTo(controls, "page:change", function(page){
//      self.trigger("page:change", page);
//    });
//    
//    _.each(eventsToPropagate, function(evt){
//      self.listenTo(listView, evt, function(view, model){
//        self.trigger(evt, view, model);
//      });
//    });
//
//    this.on("show", function(){
//      this.paginationControlsRegion.show(controls);
//      this.paginationMainRegion.show(listView);
//    });
//  }
//});


