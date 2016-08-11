'use strict';

// 配置项目模块
angular.module('projects').run(['Menus',
  function (Menus) {
    
    // 添加一个菜单项
    Menus.addMenuItem('topbar', {
      title: '项目',
      state: 'projects',
      type: 'dropdown',
      roles: ['user','admin']
    });

    // 所有项目二级菜单项
    Menus.addSubMenuItem('topbar', 'projects', {
      title: '所有项目',
      state: 'projects.list',
      roles: ['user']
    });

    // 添加项目耳机菜单项
    Menus.addSubMenuItem('topbar', 'projects', {
      title: '创建博客',
      state: 'projects.create',
      roles: ['admin']
    });
  }
]);
