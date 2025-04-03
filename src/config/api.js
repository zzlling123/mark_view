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
    SAVE: `${API_BASE_URL}/class_info/save`,
    UPDATE: `${API_BASE_URL}/class_info/update`,
    DELETE: `${API_BASE_URL}/class_info/delete/`,
  },
  // 用户相关
  USER: {
    PAGE: `${API_BASE_URL}/user/page`,
    SAVE: `${API_BASE_URL}/user/save`,
    UPDATE: `${API_BASE_URL}/user/update`,
    DELETE: `${API_BASE_URL}/user/del`,
    UPDATE_STATE: `${API_BASE_URL}/user/updateState`,
    RESET_PASSWORD: `${API_BASE_URL}/user/resetPassword`
  },
  // 角色相关
  ROLE: {
    GET_LIST: `${API_BASE_URL}/role/getList`,
    PAGE: `${API_BASE_URL}/role/page`,
    GET_ROLE_MENU_LIST: `${API_BASE_URL}/role/getRoleMenuList`,
    SAVE: `${API_BASE_URL}/role/save`,
    UPDATE: `${API_BASE_URL}/role/update`,
    DELETE: `${API_BASE_URL}/role/del`
  },
  // 题库分类相关
  QUESTION_TYPE: {
    GET_LIST: `${API_BASE_URL}/question/getQuestionType`,
  },
  // 题库管理相关
  QUESTION: {
    PAGE: `${API_BASE_URL}/question/page`,
    DETAIL: `${API_BASE_URL}/question/detail/`,
    SAVE: `${API_BASE_URL}/question/save`,
    UPDATE: `${API_BASE_URL}/question/update`,
    DELETE: `${API_BASE_URL}/question/del`,
  },
  // 标签管理相关
  LABEL: {
    SAVE: `${API_BASE_URL}/question/saveQuestionLabel`,
  }
}; 