'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  express = require('express'),
  morgan = require('morgan'), //HTTP request logger middleware
  logger = require('./logger'), //日志配置
  bodyParser = require('body-parser'),
  session = require('express-session'),
  MongoStore = require('connect-mongo')(session),
  favicon = require('serve-favicon'),
  compress = require('compression'), //压缩
  methodOverride = require('method-override'),
  cookieParser = require('cookie-parser'),
  helmet = require('helmet'),
  flash = require('connect-flash'),
  consolidate = require('consolidate'),
  path = require('path');

/**
 * 初始化本地变量
 */
module.exports.initLocalVariables = function (app) {
  // 设置项目的本地变量
  app.locals.title = config.app.title; //页面的title
  app.locals.description = config.app.description; //页面的description
  if (config.secure && config.secure.ssl === true) {
    app.locals.secure = config.secure.ssl;
  }
  app.locals.keywords = config.app.keywords; //关键字

  //各个登陆的id
  app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;
  app.locals.facebookAppId = config.facebook.clientID;
  
  //用于页面中迭代加载的js和css
  app.locals.jsFiles = config.files.client.js;
  app.locals.cssFiles = config.files.client.css;
  
  //自动重载
  app.locals.livereload = config.livereload;
  app.locals.logo = config.logo;
  app.locals.favicon = config.favicon;

  // Passing the request url to environment locals
  app.use(function (req, res, next) {
    res.locals.host = req.protocol + '://' + req.hostname;
    res.locals.url = req.protocol + '://' + req.headers.host + req.originalUrl;
    next();
  });
};

/**
 * 初始化中间件
 */
module.exports.initMiddleware = function (app) {
  // 显示堆栈错误
  app.set('showStackError', true);

  // 启动jsonp
  app.enable('jsonp callback');

  // 必须放在 express.static 之前
  app.use(compress({

    //过滤出需要压缩的请求， level:9 代表最高压缩模式 Best compression (also zlib.Z_BEST_COMPRESSION).
    filter: function (req, res) {
      return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  // 初始化 favicon 中间件
  app.use(favicon(app.locals.favicon));

  // 启动日志记录工具 (morgan)
  app.use(morgan(logger.getFormat(), logger.getOptions()));

  // 环境依赖中间件
  if (process.env.NODE_ENV === 'development') {
    // 禁用视图缓存
    app.set('view cache', false);
  } else if (process.env.NODE_ENV === 'production') {
    app.locals.cache = 'memory';
  }

  // 请求体解析中间件必须在 methodOverride 之前
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  // cookie解析器和flash输出
  app.use(cookieParser());
  app.use(flash());
};

/**
 * 配置视图引擎
 */
module.exports.initViewEngine = function (app) {
  // 设置 swig 作为视图引擎
  app.engine('server.view.html', consolidate[config.templateEngine]);

  // Set views path and view engine
  app.set('view engine', 'server.view.html');
  app.set('views', './');
};

/**
 * 配置Express session
 */
module.exports.initSession = function (app, db) {
  // Express MongoDB session storage
  app.use(session({
    saveUninitialized: true,
    resave: true,
    secret: config.sessionSecret,
    cookie: {
      maxAge: config.sessionCookie.maxAge,
      httpOnly: config.sessionCookie.httpOnly,
      secure: config.sessionCookie.secure && config.secure.ssl
    },
    key: config.sessionKey,
    store: new MongoStore({
      mongooseConnection: db.connection,
      collection: config.sessionCollection
    })
  }));
};

/**
 * 调用各个模块的服务配置 如core articles server下的config
 */
module.exports.initModulesConfiguration = function (app, db) {
  config.files.server.configs.forEach(function (configPath) {
    require(path.resolve(configPath))(app, db);
  });
};

/**
 * Configure Helmet headers configuration
 */
module.exports.initHelmetHeaders = function (app) {
  // Use helmet to secure Express headers
  // Helmet helps you secure your Express apps by setting various HTTP headers
  var SIX_MONTHS = 15778476000;
  app.use(helmet.xframe());
  app.use(helmet.xssFilter());
  app.use(helmet.nosniff());
  app.use(helmet.ienoopen());
  app.use(helmet.hsts({
    maxAge: SIX_MONTHS,
    includeSubdomains: true,
    force: true
  }));
  app.disable('x-powered-by');
};

/**
 * 配置模块的静态资源路由
 */
module.exports.initModulesClientRoutes = function (app) {
  // 设置app的路由和静态文件路径
  app.use('/', express.static(path.resolve('./public')));

  // 各个模块的静态文件路由
  config.folders.client.forEach(function (staticPath) {
    app.use(staticPath, express.static(path.resolve('./' + staticPath)));
  });
};

/**
 *  配置模块的路由的权限策略
 */
module.exports.initModulesServerPolicies = function (app) {
  // 全局抓取的ACL 策略文件
  config.files.server.policies.forEach(function (policyPath) {
    require(path.resolve(policyPath)).invokeRolesPolicies();
  });
};

/**
 * 配置模块的后台路由
 */
module.exports.initModulesServerRoutes = function (app) {
  config.files.server.routes.forEach(function (routePath) {
    require(path.resolve(routePath))(app);
  });
};

/**
 * 配置错误处理路由
 */
module.exports.initErrorRoutes = function (app) {
  app.use(function (err, req, res, next) {
    // If the error object doesn't exists
    if (!err) {
      return next();
    }

    // Log it
    console.error(err.stack);

    // Redirect to error page
    res.redirect('/server-error');
  });
};

/**
 * 配置Socket.io
 */
module.exports.configureSocketIO = function (app, db) {
  // Load the Socket.io configuration
  var server = require('./socket.io')(app, db);

  // Return server object
  return server;
};

/**
 * 初始化Express应用
 */
module.exports.init = function (db) {
  var app = express();

  // Initialize local variables
  this.initLocalVariables(app);

  // Initialize Express middleware
  this.initMiddleware(app);

  // Initialize Express view engine
  this.initViewEngine(app);

  // Initialize Express session
  this.initSession(app, db);

  // Initialize Modules configuration
  this.initModulesConfiguration(app);

  // Initialize Helmet security headers
  this.initHelmetHeaders(app);

  // Initialize modules static client routes
  this.initModulesClientRoutes(app);

  // Initialize modules server authorization policies
  this.initModulesServerPolicies(app);

  // Initialize modules server routes
  this.initModulesServerRoutes(app);

  // Initialize error routes
  this.initErrorRoutes(app);

  // Configure Socket.io
  app = this.configureSocketIO(app, db);

  return app;
};
