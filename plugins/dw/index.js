/**
 * 默认生成的插件模板
 */
module.exports = {
  /**
   * 初始化插件
   * @param {Object} config - 插件配置
   * @param {Object} context - 上下文对象，包含有用的工具和API
   */
  initialize: function(config, context) {
    console.log('插件已初始化，配置:', config);
    return Promise.resolve();
  },
  
  /**
   * 销毁插件
   */
  destroy: function() {
    console.log('插件已销毁');
    return Promise.resolve();
  },
  
  /**
   * 示例方法 - 可以通过 hooks 配置映射到钩子
   */
  onSomeEvent: function(ctx) {
    console.log('钩子事件触发');
    return ctx;
  }
};
