'use strict';

/**
 * 模块依赖
 */
var acl = require('acl');

// 使用内存后端
acl = new acl(new acl.memoryBackend());

/**
 * 调用项目的权限
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/projects',
      permissions: '*'
    }, {
      resources: '/api/projects/:projectId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/projects',
      permissions: ['get', 'post']
    }, {
      resources: '/api/projects/:projectId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/projects',
      permissions: ['get']
    }, {
      resources: '/api/projects/:projectId',
      permissions: ['get']
    }]
  }]);
};

/**
 * 检查项目权限
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // 如果一个项目正在处理中，且当前用户又是项目创建者，就直接允许
  if (req.project && req.user && req.project.user.id === req.user.id) {
    return next();
  }

  // 检查用户的角色
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // 发生认证错误
      return res.status(500).send('未知认证错误');
    } else {
      if (isAllowed) {
        // 授予访问授权，并触发中间件
        return next();
      } else {
        return res.status(403).json({
          message: '认证失败'
        });
      }
    }
  });
};
