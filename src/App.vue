<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  errorCaptured(err, vm, info) {
    console.error('错误被捕获:', err, vm, info)
    return false
  }
}
</script>

<style>
#app {
  font-family: 'Microsoft YaHei', 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* 全局样式调整 */
body {
  font-size: 13px;
}

/* 表格字体调小 */
.ant-table {
  font-size: 12px;
}

/* 表格单元格字体调小 - 更具体的选择器确保覆盖默认样式 */
.ant-table-cell,
.ant-table-thead > tr > th,
.ant-table-tbody > tr > td,
.ant-table-column-title,
.ant-table-column-sorter-up,
.ant-table-column-sorter-down {
  font-size: 12px !important;
}

/* 表格内部链接和按钮文本 */
.ant-table-tbody a,
.ant-table-tbody button,
.ant-table-tbody .ant-btn {
  font-size: 12px !important;
}

/* 表格内部标签 */
.ant-table .ant-tag {
  font-size: 11px !important;
  line-height: 18px;
  height: 20px;
  padding: 0 6px;
}

/* 表格内部图标 */
.ant-table .anticon {
  font-size: 12px;
}

/* 表单元素字体调小 */
.ant-form, .ant-input, .ant-select, .ant-btn, .ant-radio, .ant-checkbox {
  font-size: 13px;
}

/* 筛选组件相关字体调小 */
.search-card .ant-form-item-label > label {
  font-size: 12px;
}

.search-card .ant-input, 
.search-card .ant-select-selection-selected-value,
.search-card .ant-btn {
  font-size: 12px;
}

/* 搜索区域表单项更紧凑 */
.search-card .ant-form-item {
  margin-bottom: 12px;
  margin-right: 12px;
}

/* 搜索区域输入框大小调整 */
.search-card .ant-input,
.search-card .ant-select {
  height: 28px;
  line-height: 28px;
}

.search-card .ant-select-selection--single {
  height: 28px;
}

.search-card .ant-select-selection__rendered {
  line-height: 28px;
}

.search-card .ant-form-item-label {
  line-height: 28px;
}

.ant-select-dropdown-menu-item,
.ant-select-dropdown-menu {
  font-size: 12px;
}

/* 搜索区按钮文字调小 */
.search-card .ant-btn {
  font-size: 12px;
  height: 28px;
  padding: 0 8px;
}

/* 操作按钮间距缩小 */
.action-buttons {
  display: flex;
  justify-content: space-around;
  flex-wrap: nowrap;
}

.action-buttons button {
  padding: 0 4px;
  margin-right: 2px;
  font-size: 12px;
}

/* 表格中的按钮特别调整 */
.ant-table .ant-btn-link {
  height: 22px;
  line-height: 22px;
  padding: 0 4px;
  font-size: 12px !important;
}

.ant-table .ant-btn-link .anticon {
  font-size: 12px;
  margin-right: 2px;
}

/* 确保按钮不换行 */
.ant-table .ant-btn-link span {
  white-space: nowrap;
}

/* 弹窗内容字体调小 */
.ant-modal-body {
  font-size: 13px;
}

/* 标签字体调小 */
.ant-tag {
  font-size: 11px;
}

/* 下拉菜单字体调小 */
.ant-dropdown-menu-item, 
.ant-dropdown-menu-submenu-title {
  font-size: 12px;
}

/* 分页组件字体和大小调整 */
.ant-pagination {
  font-size: 12px;
}

.ant-pagination-item,
.ant-pagination-prev .ant-pagination-item-link,
.ant-pagination-next .ant-pagination-item-link {
  min-width: 28px;
  height: 28px;
  line-height: 28px;
}

.ant-pagination-options-quick-jumper input {
  height: 28px;
  font-size: 12px;
}

/* 页头和标签页调整 */
.ant-page-header-heading-title {
  font-size: 16px;
}

.ant-tabs-tab {
  font-size: 13px;
  padding: 8px 12px;
}

/* 导航菜单紧凑 */
.ant-menu-item {
  height: 36px;
  line-height: 36px;
  font-size: 13px;
}

/* 面包屑导航 */
.ant-breadcrumb {
  font-size: 12px;
}

/* 描述列表 */
.ant-descriptions-item-label,
.ant-descriptions-item-content {
  font-size: 12px;
  padding: 8px 12px;
}

/* 表格单元格紧凑显示 */
.ant-table-thead > tr > th,
.ant-table-tbody > tr > td,
.ant-table-cell {
  padding: 6px 8px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 表格行高调整 */
.ant-table-tbody > tr,
.ant-table-thead > tr {
  height: 40px;
  line-height: 1.2;
}

/* 表格标题字体 */
.ant-table-title {
  font-size: 13px;
  padding: 8px;
}
</style>
