// API 配置
export const API_BASE_URL = 'http://127.0.0.1:10201/annotation';

export default {
  // 登录相关
  LOGIN: {
    GET_VERIFICATION_CODE: `${API_BASE_URL}/login/getVerificationCode`,
    LOGIN: `${API_BASE_URL}/login/login`,
  },
  // 菜单相关
  MENU: {
    GET_LIST: `${API_BASE_URL}/menu/getList`,
  },
  // 班级管理相关
  CLASS: {
    PAGE: `${API_BASE_URL}/class_info/page`,
  },
  // 用户相关
  USER: {
    // 预留用户相关接口
  }
}; 