'use strict';

// 初始化Angularjs的模块配置， 直接这样写会将整个返回对象附着在window上
var ApplicationConfiguration = (function () {
  // 模块名和模块依赖
  var applicationModuleName = 'blog';
  var applicationModuleVendorDependencies = ['ngResource', 'ngAnimate', 'ngMessages', 'ui.router', 'ui.bootstrap', 'ui.utils', 'angularFileUpload'];

  // 添加一个竖向模块，或者说是独立的模块
  var registerModule = function (moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // 把模块添加的angularjs的配置中 
    angular.module(applicationModuleName).requires.push(moduleName);
  };

  return {
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: applicationModuleVendorDependencies,
    registerModule: registerModule
  };
})();
