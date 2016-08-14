'use strict';

// 新建项目控制器
angular.module('projects').controller('CreateProjectController', ['$scope', '$stateParams', '$location', 'Authentication', 'Projects',
  function ($scope, $stateParams, $location, Authentication, Projects) {
    $scope.authentication = Authentication;

    // 新建项目
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'cerateProjectForm');

        return false;
      }

      // 创建一个新的项目 metodo 项目字段
      var project = new Projects({
        name: this.name,
        description: this.description
      });

      // 保存之后重定向到项目详情
      project.$save(function (response) {
        $location.path('projects/' + response._id);

        // 清空表单字段 metodo 项目字段
        $scope.name = '';
        $scope.description = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);
