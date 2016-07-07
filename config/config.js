'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'), //工具库，类似underscore
  chalk = require('chalk'),//控制台各种颜色的输出
  glob = require('glob'), //使用 minimatch 库来实现匹配
  fs = require('fs'),
  path = require('path');

/**
 * 使用glob匹配来获取文件
 */
var getGlobbedPaths = function (globPatterns, excludes) {
  // URL paths regex
  var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

  // The output array
  var output = [];

  // If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
  if (_.isArray(globPatterns)) {
    globPatterns.forEach(function (globPattern) {
      output = _.union(output, getGlobbedPaths(globPattern, excludes));
    });
  } else if (_.isString(globPatterns)) {
    if (urlRegex.test(globPatterns)) {
      output.push(globPatterns);
    } else {
      var files = glob.sync(globPatterns);
      if (excludes) {
        files = files.map(function (file) {
          if (_.isArray(excludes)) {
            for (var i in excludes) {
              file = file.replace(excludes[i], '');
            }
          } else {
            file = file.replace(excludes, '');
          }
          return file;
        });
      }
      output = _.union(output, files);
    }
  }

  return output;
};

/**
 * 验证环境变量 NODE_ENV 是否存在
 */
var validateEnvironmentVariable = function () {

  //根据当前的NODE_ENV获取相对应的环境配置文件
  var environmentFiles = glob.sync('./config/env/' + process.env.NODE_ENV + '.js');
  console.log();

  //如果没有找到与之对应的环境配置文件
  if (!environmentFiles.length) {
    if (process.env.NODE_ENV) {
      console.error(chalk.red('+ Error: No configuration file found for "' + process.env.NODE_ENV + '" environment using development instead'));
    } else {
      console.error(chalk.red('+ Error: NODE_ENV is not defined! Using default development environment'));
    }

    //不管是没有找到环境配置文件还是没有环境参数，默认使用development做为启动环境
    process.env.NODE_ENV = 'development';
  }
  // 重置控制台颜色
  console.log(chalk.white(''));
};

/**
 *  验证 Secure = true 参数是否能够正确的启动，因为这个要有证书和key才可用
 */
var validateSecureMode = function (config) {

  if (!config.secure || config.secure.ssl !== true) {
    return true;
  }

  var privateKey = fs.existsSync(path.resolve(config.secure.privateKey));
  var certificate = fs.existsSync(path.resolve(config.secure.certificate));

  if (!privateKey || !certificate) {
    console.log(chalk.red('+ Error: Certificate file or key file is missing, falling back to non-SSL mode'));
    console.log(chalk.red('  To create them, simply run the following from your shell: sh ./scripts/generate-ssl-certs.sh'));
    console.log();
    config.secure.ssl = false;
  }
};

/**
 *  验证在生产环境中Session Secret参数没有被设置为默认值
 */
var validateSessionSecret = function (config, testing) {

  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (config.sessionSecret === 'MEAN') {
    if (!testing) {
      console.log(chalk.red('+ WARNING: It is strongly recommended that you change sessionSecret config while running in production!'));
      console.log(chalk.red('  Please add `sessionSecret: process.env.SESSION_SECRET || \'super amazing secret\'` to '));
      console.log(chalk.red('  `config/env/production.js` or `config/env/local.js`'));
      console.log();
    }
    return false;
  } else {
    return true;
  }
};

/**
 * 初始化全局的配置文件夹
 */
var initGlobalConfigFolders = function (config, assets) {
  config.folders = {
    server: {},
    client: {}
  };

  // 所有的前台的文件夹
  config.folders.client = getGlobbedPaths(path.join(process.cwd(), 'modules/*/client/'), process.cwd().replace(new RegExp(/\\/g), '/'));
};

/**
 * 初始化全局配置文件
 */
var initGlobalConfigFiles = function (config, assets) {
  // 初始化
  config.files = {
    server: {},
    client: {}
  };

  // 设置全局的数据模型对象
  config.files.server.models = getGlobbedPaths(assets.server.models);

  // 设置全局的后台路由
  config.files.server.routes = getGlobbedPaths(assets.server.routes);

  // 设置后台的配置文件
  config.files.server.configs = getGlobbedPaths(assets.server.config);

  // 设置全部的sockets文件
  config.files.server.sockets = getGlobbedPaths(assets.server.sockets);

  // 设置全局的策略
  config.files.server.policies = getGlobbedPaths(assets.server.policies);

  // 设置全局的前台Js
  config.files.client.js = getGlobbedPaths(assets.client.lib.js, 'public/').concat(getGlobbedPaths(assets.client.js, ['public/']));

  // 设置全局的前台css
  config.files.client.css = getGlobbedPaths(assets.client.lib.css, 'public/').concat(getGlobbedPaths(assets.client.css, ['public/']));

  // 设置全局的测试
  config.files.client.tests = getGlobbedPaths(assets.client.tests);
};

/**
 * 初始化全局配置
 */
var initGlobalConfig = function () {
  // 验证环境变量 NODE_ENV 的存在
  validateEnvironmentVariable();

  // 获取默认的资源文件 其中process.cwd()：获取当前进程工作的文件路径
  var defaultAssets = require(path.join(process.cwd(), 'config/assets/default'));

  // 根据NODE_ENV获取当前环境的资源文件
  var environmentAssets = require(path.join(process.cwd(), 'config/assets/', process.env.NODE_ENV)) || {};

  // 合并资源文件
  var assets = _.merge(defaultAssets, environmentAssets);

  // 获取环境默认的配置
  var defaultConfig = require(path.join(process.cwd(), 'config/env/default'));

  // 获取当前环境的配置
  var environmentConfig = require(path.join(process.cwd(), 'config/env/', process.env.NODE_ENV)) || {};

  // 合并配置
  var config = _.merge(defaultConfig, environmentConfig);

  // 读取package.json的配置，使用config.meanjs存起来
  var pkg = require(path.resolve('./package.json'));
  config.meanjs = pkg;

  // 只有在开发或者生产环境的时候才使用loacl.js来覆盖配置，在测试的时候不，为的是避免在生产或者开发环境中
  // 跑测试用例带来数据改变
  if (process.env.NODE_ENV !== 'test') {
    config = _.merge(config, (fs.existsSync(path.join(process.cwd(), 'config/env/local.js')) && require(path.join(process.cwd(), 'config/env/local.js'))) || {});
  }

  // 初始化全局配置文件
  initGlobalConfigFiles(config, assets);

  // 设置全局的文件夹
  initGlobalConfigFolders(config, assets);

  // 验证使用安全的SSL模式
  validateSecureMode(config);

  // 验证Sessionq安全
  validateSessionSecret(config);

  // 暴露配置工具方法
  config.utils = {
    getGlobbedPaths: getGlobbedPaths,
    validateSessionSecret: validateSessionSecret
  };

  return config;
};

/**
 * 设置配置对象
 */
module.exports = initGlobalConfig();
