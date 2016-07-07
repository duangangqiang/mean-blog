'use strict';

/**
 * Module dependencies.
 */


//此处依赖的时候已经执行了app.js中的一些默认执行的方法，如：mongoose.loadModels(seedDB);
var app = require('./config/lib/app');

//启动APP
var server = app.start();
