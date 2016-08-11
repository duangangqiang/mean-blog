'use strict';

// 新建项目控制器
angular.module('projects').controller('CreateProjectController', ['$scope', '$stateParams', '$location', 'Authentication', 'Projects',
  function ($scope, $stateParams, $location, Authentication, Projects) {
    $scope.authentication = Authentication;

    // 新建项目
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {

        //metodo articleForm要添加
        $scope.$broadcast('show-errors-check-validity', 'articleForm');

        return false;
      }

      // 创建一个新的项目 metodo 项目字段
      var project = new Projects({
        title: this.title,
        content: this.content
      });

      // 保存之后重定向到项目详情
      project.$save(function (response) {
        $location.path('projects/' + response._id);

        // 清空表单字段 metodo 项目字段
        $scope.title = '';
        $scope.content = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);
