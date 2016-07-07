'use strict';

/**
 * 模块依赖
 */
var config = require('../config'), //通过依赖调用config.js里面的方法，得到几个配置文件的最终结合体
  chalk = require('chalk'),
  path = require('path'),
  mongoose = require('mongoose');

//加载mongoose的模型
module.exports.loadModels = function (callback) {
  
  // Globbing 查找所有的模型文件
  config.files.server.models.forEach(function (modelPath) {
    
    //加载所有的模型
    require(path.resolve(modelPath));
  });

  if (callback) callback();
};

// 初始化Mongoose
module.exports.connect = function (cb) {
  var _this = this;

  //连接mongodb
  var db = mongoose.connect(config.db.uri, config.db.options, function (err) {
    // 打印错误日志
    if (err) {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.log(err);
    } else {

      // 按需启动调试模式
      mongoose.set('debug', config.db.debug);

      // 回调
      if (cb) cb(db);
    }
  });
};

module.exports.disconnect = function (cb) {
  mongoose.disconnect(function (err) {
    console.info(chalk.yellow('Disconnected from MongoDB.'));
    cb(err);
  });
};
