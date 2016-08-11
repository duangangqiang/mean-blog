'use strict';

//用来与后台REST接口交换数据的项目服务
angular.module('projects').factory('Projects', ['$resource',
  function ($resource) {
    return $resource('api/projects/:projectId', {
      projectId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
