'use strict';

// 编辑项目控制器
angular.module('projects').controller('EditProjectController', ['$scope', '$stateParams', '$location', 'Authentication', 'Projects',
  function ($scope, $stateParams, $location, Authentication, Projects) {
    $scope.authentication = Authentication;

    // 更新存在的项目
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {

        //metodo articleForm
        $scope.$broadcast('show-errors-check-validity', 'articleForm');

        return false;
      }

      var project = $scope.project;

      project.$update(function () {
        $location.path('projects/' + project._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // 查询存在的项目
    $scope.findOne = function () {
      $scope.project = Projects.get({
        projectId: $stateParams.projectId
      });
    };
  }
]);
