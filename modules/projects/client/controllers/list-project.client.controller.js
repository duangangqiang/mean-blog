'use strict';

// 所有项目控制器
angular.module('projects').controller('ListProjectsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Projects',
  function ($scope, $stateParams, $location, Authentication, Projects) {
    $scope.authentication = Authentication;

    // 查询所有项目
    $scope.find = function () {
      $scope.projects = Projects.query();
    };
  }
]);
