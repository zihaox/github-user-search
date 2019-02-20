/*
|--------------------------------------------------------------------------
| 翻页插件
|--------------------------------------------------------------------------
*/

;
(function () {
  'use strict';
  // 默认设置
  const DEFAULT_CONFIG = {
    limit: 10,
    currentPage: 1,
  };

  // 暴露接口
  window.biaoPage = {
    boot,
    render,
  };

  /**
   * 启动
   * @param {Object} settings
   *    selector 选择器
   *    amount 总条目数（不是页数）
   *    limit 每页条目数（最终的页数可以通过 amount / limit 算出来）
   *    currentPage 当前页
   *    onChange() 翻页时的回调函数
   */
  function boot(settings) {
    // 合并默认设置和用户设置
    let config = {
      ...DEFAULT_CONFIG,
      ...settings
    };

    // 将插件的所有状态存在此对象中，这样就可以通过函数传递
    // 从而做到多个插件并行运行
    // 其中的状态可以在翻页时打印查看
    let state = {
      config
    };

    // 代理用户设置，方便后续调用
    state.currentPage = config.currentPage;

    prepare(state);
    render(state);
    bindEvents(state);
  }

  /**
   * 准备初始插件结构
   * @param state
   */
  function prepare(state) {
    let el = document.createElement('div');

    el.classList.add('biao-page');

    el.innerHTML = /*html*/ `
    <span class="shortcuts">
      <button class="first">首页</button>
      <button class="prev">上一页</button>
    </span>

    <span class="page-list"></span>

    <span class="shortcuts">
      <button class="next">下一页</button>
      <button class="last">尾页</button>
    </span>`;

    // 代理一些常用元素，方便后续使用
    state.root = document.querySelector(state.config.selector);
    state.el = el;
    state.pageList = el.querySelector('.page-list');
    state.root.innerHTML = '';
    state.root.appendChild(el);
  }

  /**
   * 渲染页码
   * @param state
   */
  function render(state) {
    // 页码总数 = 向上取整(条目总数 / 每页条目数)
    let pageAmount =
      state.pageCount =
      Math.ceil(state.config.amount / state.config.limit);

    // 拿到数字页码容器
    let list = state.pageList;

    // 清空上次渲染的内容
    list.innerHTML = '';

    // 起始页码和结束页码
    let start = state.currentPage - 4;
    let end = state.currentPage + 4;

    // 如果起始页码小于1
    // 比如说当前页是1，起始页就是1 - 2 => -1，
    // [-1 0 1 2 3] 4 5 6 7 8 9
    if (start < 1) {
      // 强行将起始设为1
      // [1 2 3] 4 5 6 7 8 9
      start = 1;
      // 强行将结束设为起始加直径（重新拉伸）
      // [1 2 3 4 5] 6 7 8 9
      end = start + 8;
    }

    // 如果结束页码大于最大页码
    // 比如说当前页是9，结束页就是9 + 2 => 11，
    // 1 2 3 4 5 6 [7 8 9 10 11]
    if (end > pageAmount) {
      // 强行将结束设为9
      // 1 2 3 4 5 6 [7 8 9]
      end = pageAmount;
      // 强行将开始设为结束减直径（重新拉伸）
      // 1 2 3 4 [5 6 7 8 9]
      start = end - 8;
    }

    // 如果页面总数达不到显示范围，就将显示范围设为总数
    // 比如说显示范围有5页，但数据太少只能显示3页，
    // 那么就强行把显示显示范围设为3
    if (pageAmount < 9) {
      start = 1;
      end = pageAmount;
    }

    // 基于页码总数创造按钮
    for (let i = start; i <= end; i++) {
      let page = i;

      let button = document.createElement('button');

      button.classList.add('biao-page-item');

      // 如果刚好等于当前页就直接高亮
      if (state.currentPage === page)
        button.classList.add('active');
      button.innerText = page;
      // 直接在按钮对象上记录当前页的页码
      button.$page = page;
      state.pageList.appendChild(button);
    }

    // 代理所有按钮，方便后续使用
    state.buttons = state.pageList.querySelectorAll('.biao-page-item');
  }

  /**
   * 绑定必要初始事件
   * @param state
   */
  function bindEvents(state) {
    // 代理事件
    state.el.addEventListener('click', e => {
      let target = e.target;
      let page = target.$page;
      let klass = target.classList;

      if (page)
        setCurrentPage(state, page);

      if (klass.contains('next'))
        setCurrentPage(state, state.currentPage + 1);

      if (klass.contains('prev'))
        setCurrentPage(state, state.currentPage - 1);

      if (klass.contains('first'))
        setCurrentPage(state, 1);

      if (klass.contains('last'))
        setCurrentPage(state, state.pageCount);
    });
  }

  /**
   * 切换页面
   * @param state
   * @param {number} page 切换到哪一页
   */
  function setCurrentPage(state, page) {
    // 如果小于最小页，就去第一页
    if (page < 1)
      return setCurrentPage(state, 1);

    // 如果大于最大页，就去最后一页
    if (page > state.pageCount)
      return setCurrentPage(state, state.pageCount);

    // 记录当前页
    state.currentPage = page;

    // 如果下游传了回调函数，就触发；
    // 通知下游页面改变了
    let onChange = state.config.onChange;
    onChange && onChange(page, state);
  }
})();