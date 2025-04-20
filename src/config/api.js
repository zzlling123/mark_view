// API 配置
export const API_BASE_URL = 'http://192.168.3.19:10201/annotation';

export default {
  // 登录相关
  LOGIN: {
    GET_VERIFICATION_CODE: `${API_BASE_URL}/login/getVerificationCode`,
    LOGIN: `${API_BASE_URL}/login/login`,
  },
  // 菜单相关
  MENU: {
    GET_LIST: `${API_BASE_URL}/menu/getList`,
    SAVE: `${API_BASE_URL}/menu/save`,
    UPDATE: `${API_BASE_URL}/menu/update`,
    DELETE: `${API_BASE_URL}/menu/del`,
    GET_ALL_LIST: `${API_BASE_URL}/menu/getAllList`,
  },
  // 班级管理相关
  CLASS: {
    PAGE: `${API_BASE_URL}/class_info/page`,
    SAVE: `${API_BASE_URL}/class_info/save`,
    UPDATE: `${API_BASE_URL}/class_info/update`,
    DELETE: `${API_BASE_URL}/class_info/delete/`,
    GET_LIST: `${API_BASE_URL}/class_info/getList`,
    GET_CLASS_LIST_FORTEACHER: `${API_BASE_URL}/class_info/getListForTea`,
  },
  // 用户相关
  USER: {
    PAGE: `${API_BASE_URL}/user/page`,
    SAVE: `${API_BASE_URL}/user/save`,
    UPDATE: `${API_BASE_URL}/user/update`,
    DELETE: `${API_BASE_URL}/user/del`,
    UPDATE_STATE: `${API_BASE_URL}/user/updateState`,
    RESET_PASSWORD: `${API_BASE_URL}/user/resetPassword`,
    GET_USER_LIST: `${API_BASE_URL}/user/getList`,
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
    GET_LIST: `${API_BASE_URL}/question/getLabelList`,
  },
  // 考试管理相关
  EXAM: {
    PAGE: `${API_BASE_URL}/exam/page`,
    DETAIL: `${API_BASE_URL}/exam/detail/`,
    SAVE: `${API_BASE_URL}/exam/save`,
    UPDATE: `${API_BASE_URL}/exam/update`,
    EXAM_TYPE_SET_TEMPLATE: `${API_BASE_URL}/exam/examTypeSetTemplate`,
    IMPORT_EXAM_PAGE_SET_POINT: `${API_BASE_URL}/exam/importExamPageSetPoint`,
    GET_ERROR_EXAM_PAGE_SET_POINT: `${API_BASE_URL}/exam/getErrorExamPageSetPoint`,
    ROLL_MAKING: `${API_BASE_URL}/exam-page-user-question/rollMaking`,
    GET_PROGRESS: `${API_BASE_URL}/exam-page-user-question/getProgress`,
  },
  // 课程相关
  COURSE: {
    PAGE: `${API_BASE_URL}/course/page`,
    SAVE: `${API_BASE_URL}/course/save`,
    UPDATE: `${API_BASE_URL}/course/update`,
    DELETE: `${API_BASE_URL}/course/delete/`,
    UPDATE_STATE: `${API_BASE_URL}/course/updateState`,
  },
  //章节相关
  CHAPTER: {
    PAGE: `${API_BASE_URL}/course-chapter/page`,
    SAVE: `${API_BASE_URL}/course-chapter/save`,
    UPDATE: `${API_BASE_URL}/course-chapter/update`,
    DELETE: `${API_BASE_URL}/course-chapter/delete/`,
  },
  //章节资源
  RESOURCE: {
    PAGE: `${API_BASE_URL}/course-resource/page`,
    DELETE: `${API_BASE_URL}/course-resource/delete/`,
    UPLOAD: `${API_BASE_URL}/course-resource/upload/file`,
  },
  //教师批改相关
  TEACHER_CORRECT: {
    PAGE: `${API_BASE_URL}/exam-page-teacher/page`,
    EXAM_STUDENG_LIST: `${API_BASE_URL}/exam-page-teacher/getExamUserListForExamId`,
    STUDENT_ANSWER_DETAIL: `${API_BASE_URL}/exam-page-teacher/getExamUserInfo/`,
    CORRECT: `${API_BASE_URL}/exam-page-teacher/correct`,
  },
  //字典管理
  DICT: {
    PAGE: `${API_BASE_URL}/sys-dict/page`,
    SAVE: `${API_BASE_URL}/sys-dict/saveBy`,
    UPDATE: `${API_BASE_URL}/sys-dict/setDictBy`,
    DELETE: `${API_BASE_URL}/sys-dict/deleteByIds`,
    UPDATE_STATE: `${API_BASE_URL}/sys-dict/updateState`,
  },
};
