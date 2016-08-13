'use strict';

/**
 * 模块依赖
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * 项目 Schema
 */
var ProjectSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    default: '',
    trim: true,
    required: '名称不能为空'
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Project', ProjectSchema);
