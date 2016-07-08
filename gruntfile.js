'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  defaultAssets = require('./config/assets/default'),
  testAssets = require('./config/assets/test'),
  testConfig = require('./config/env/test'),
  fs = require('fs'),
  path = require('path');

module.exports = function (grunt) {
  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    env: {
      test: {
        NODE_ENV: 'test'
      },
      dev: {
        NODE_ENV: 'development'
      },
      prod: {
        NODE_ENV: 'production'
      }
    },
    watch: {

      //监听所有后台视图并重载
      serverViews: {
        files: defaultAssets.server.views,
        options: {
          livereload: true
        }
      },

      //监听gruntfile.js和所有后台的js并执行检查后重载
      serverJS: {
        files: _.union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS),
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      },

      //对静态页面视图（前台）文件监控并重载
      clientViews: {
        files: defaultAssets.client.views,
        options: {
          livereload: true
        }
      },

      //对所有前台的js执行检查，并自动重载
      clientJS: {
        files: defaultAssets.client.js,
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      },


      //对所有的css执行检查，并自动重载
      clientCSS: {
        files: defaultAssets.client.css,
        tasks: ['csslint'],
        options: {
          livereload: true
        }
      },
      
      //先执行所有文件的less的编译，再执行css检查，并自动重载
      clientLESS: {
        files: defaultAssets.client.less,
        tasks: ['less', 'csslint'],
        options: {
          livereload: true
        }
      }
    },

    /*监听指定文件：1.gruntfile.js; 2.所有后台页面变动；3.所有后台js变动; 4.后台模块初始化配置文件
    * 启动文件为根目录下的server.js文件，并传递debug参数给nodejs，启动debugging server，
    * 指定听的文件为js,html
    */
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          nodeArgs: ['--debug'],
          ext: 'js,html',
          watch: _.union(defaultAssets.server.gruntConfig, defaultAssets.server.views,
            defaultAssets.server.allJS, defaultAssets.server.config)
        }
      }
    },

    //默认并发的跑nodemon和watch。调试模式还启动node-inspector,并记录日志
    concurrent: {
      default: ['nodemon', 'watch'],
      debug: ['nodemon', 'watch', 'node-inspector'],
      options: {
        logConcurrentOutput: true
      }
    },


    //检查1.gruntfile.js, 2.后台js; 3.客户端js；3.测试的所有js
    //jshintrc：true，代表不需要传递任何的参数给jshint，它会自己去找.jshintrc文件来配置
    jshint: {
      all: {
        src: _.union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS, defaultAssets.client.js, 
          testAssets.tests.server, testAssets.tests.client, testAssets.tests.e2e),
        options: {
          jshintrc: true,
          node: true,
          mocha: true,
          jasmine: true
        }
      }
    },

    //执行eslint检查
    eslint: {
      options: {},
      target: _.union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS, defaultAssets.client.js,
        testAssets.tests.server, testAssets.tests.client, testAssets.tests.e2e)
    },


    //对所有的css执行csslint检查，并使用根目录下的.csslint文件
    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      all: {
        src: defaultAssets.client.css
      }
    },

    //生产模式将所有的客户端.js合并为一个application.js文件
    ngAnnotate: {
      production: {
        files: {
          'public/dist/application.js': defaultAssets.client.js
        }
      }
    },


    //生产模式下将application.js压缩
    uglify: {
      production: {
        options: {
          mangle: false
        },
        files: {
          'public/dist/application.min.js': 'public/dist/application.js'
        }
      }
    },

    //将所有的css压缩，并合并为一个application.min.css文件
    cssmin: {
      combine: {
        files: {
          'public/dist/application.min.css': defaultAssets.client.css
        }
      }
    },
    
    //ext:'.css'对所有的文件以.css重命名
    less: {
      dist: {
        files: [{
          expand: true,
          src: defaultAssets.client.less,
          ext: '.css',
          rename: function (base, src) {
            return src.replace('/less/', '/css/');
          }
        }]
      }
    },

    //node调试插件
    'node-inspector': {
      custom: {
        options: {
          'web-port': 1337, //Port to host the inspector. Type: Number Default: 8080
          'web-host': 'localhost', //Host to listen on. Type: String Default: '0.0.0.0'
          'debug-port': 5858, //Port to connect to the debugging app. Type: Number Default: 5858
          'save-live-edit': true, //Save live edit changes to disk. Type: Boolean Default: false
          'preload': true, //no preload code
          'stack-trace-limit': 50, //Number of stack frames to show on a breakpoint. Type: Number Default: 50
          'hidden': [] //Array of files to hide from the UI (breakpoints in these files will be ignored).
        }
      }
    },

    //mocha测试
    mochaTest: {
      src: testAssets.tests.server,
      options: {
        reporter: 'spec',
        timeout: 10000
      }
    },

    //然而mocha 伊斯坦布尔。。。。。。。。。。。。
    mocha_istanbul: {
      coverage: {
        src: testAssets.tests.server,
        options: {
          print: 'detail',
          coverage: true,
          require: 'test.js',
          coverageFolder: 'coverage/server',
          reportFormats: ['cobertura','lcovonly'],
          check: {
            lines: 40,
            statements: 40
          }
        }
      }
    },

    //karma测试
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    //度量测试？？
    protractor: {
      options: {
        configFile: 'protractor.conf.js',
        noColor: false,
        webdriverManagerUpdate: true
      },
      e2e: {
        options: {
          args: {} // Target-specific arguments
        }
      }
    },

    //在config/env/目录下没有local.js的情况下，才拷贝config/env/local.example.js到config/env/local.example.js
    copy: {
      localConfig: {
        src: 'config/env/local.example.js',
        dest: 'config/env/local.example.js',
        filter: function () {
          return !fs.existsSync('config/env/local.js');
        }
      }
    }
  });
  
  grunt.event.on('coverage', function(lcovFileContents, done) {
    // Set coverage config so karma-coverage knows to run coverage
    testConfig.coverage = true;
    require('coveralls').handleInput(lcovFileContents, function(err) {
      if (err) {
        return done(err);
      }
      done();
    });
  });

  //加载package.json中的所有的grunt插件
  require('load-grunt-tasks')(grunt);

  //加载grunt执行时间记录插件，执行完grunt任务之后可以看到每个任务的执行时间汇总
  require('time-grunt')(grunt);

  //加载度量覆盖测试任务？？
  grunt.loadNpmTasks('grunt-protractor-coverage');

  //注册一个任务,创建upload文件夹
  grunt.task.registerTask('mkdir:upload', 'Task that makes sure upload directory exists.', function () {
    // Get the callback 使任务异步执行
    var done = this.async();

    grunt.file.mkdir(path.normalize(__dirname + '/modules/users/client/img/profile/uploads'));

    done();
  });

  //尝试连接mongodb数据库，并加载应用的所有模型
  grunt.task.registerTask('mongoose', 'Task that connects to the MongoDB instance and loads the application models.', function () {
    var done = this.async();

    //获取mongoose的配置
    var mongoose = require('./config/lib/mongoose.js');

    // 连接数据库
    mongoose.connect(function (db) {
      done();
    });
  });

  // 在e2e测试中的删除数据库
  grunt.task.registerTask('dropdb', 'drop the database', function () {
    
    var done = this.async();
    var mongoose = require('./config/lib/mongoose.js');

    mongoose.connect(function (db) {
      db.connection.db.dropDatabase(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully dropped db: ', db.connection.db.databaseName);
        }
        db.connection.db.close(done);
      });
    });
  });

  //仅仅启动服务
  grunt.task.registerTask('server', 'Starting the server', function () {
    var done = this.async();

    var path = require('path');
    var app = require(path.resolve('./config/lib/app'));
    var server = app.start(function () {
      done();
    });
  });

  // 1.执行Lsss编译；2.执行jshint; 3.执行eslint; 4.执行csslint
  grunt.registerTask('lint', ['less', 'jshint', 'eslint', 'csslint']);

  //构建任务：1.设置环境为开发环境；2.执行静态代码检查；3.合并前台业务代码；4.压缩前台js文件；5.压缩css
  grunt.registerTask('build', ['env:dev', 'lint', 'ngAnnotate', 'uglify', 'cssmin']);

  //测试
  grunt.registerTask('test', ['env:test', 'lint', 'mkdir:upload', 'copy:localConfig', 'server', 'mochaTest', 'karma:unit', 'protractor']);
  grunt.registerTask('test:server', ['env:test', 'lint', 'server', 'mochaTest']);
  grunt.registerTask('test:client', ['env:test', 'lint', 'karma:unit']);
  grunt.registerTask('test:e2e', ['env:test', 'lint', 'dropdb', 'server', 'protractor']);
  grunt.registerTask('coverage', ['env:test', 'lint', 'mocha_istanbul:coverage', 'karma:unit']);

  // 1.设置环境为开发环境； 2.执行代码检查； 3.创建上传目录； 4.拷贝本地配置; 5.
  grunt.registerTask('default', ['env:dev', 'lint', 'mkdir:upload', 'copy:localConfig', 'concurrent:default']);

  // 调试模式启动
  grunt.registerTask('debug', ['env:dev', 'lint', 'mkdir:upload', 'copy:localConfig', 'concurrent:debug']);

  // 生产环境启动
  grunt.registerTask('prod', ['build', 'env:prod', 'mkdir:upload', 'copy:localConfig', 'concurrent:default']);
};
