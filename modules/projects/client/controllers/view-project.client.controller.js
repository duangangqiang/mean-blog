'use strict';

// 新建项目控制器
angular.module('projects').controller('ViewProjectController', ['$scope', '$stateParams', '$location', 'Authentication', 'Projects',
  function ($scope, $stateParams, $location, Authentication, Projects) {
    $scope.authentication = Authentication;
    
    // 查询存在的项目
    $scope.findOne = function () {
      $scope.project = Projects.get({
        projectId: $stateParams.projectId
      });
    };

    // 移除存在的项目
    $scope.remove = function (project) {
      if (project) {
        project.$remove();

        for (var i in $scope.articles) {
          if ($scope.projects[i] === project) {
            $scope.projects.splice(i, 1);
          }
        }
      } else {
        $scope.project.$remove(function () {
          $location.path('projects');
        });
      }
    };
  }
]);
  