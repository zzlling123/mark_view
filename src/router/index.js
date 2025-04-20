import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import UserManagement from '../views/UserManagement.vue'
import ClassManagement from '../views/ClassManagement.vue'
import Annotation2D from '../views/Annotation2D.vue'
import Annotation3D from '../views/Annotation3D.vue'
import AudioAnnotation from '../views/AudioAnnotation.vue'
import RoleManagement from '../views/RoleManagement.vue'
import QuestionTypeManagement from '../views/QuestionTypeManagement.vue'
import QuestionManagement from '../views/QuestionManagement.vue'
import LabelManagement from '../views/LabelManagement.vue'
import ExamManagement from '../views/ExamManagement.vue'
import ExamList from '../views/ExamList.vue'
import ExamPage from '../views/ExamPage.vue'
import CourseList from '../views/Course/CourseList.vue'
import ChapterList from '../views/Course/ChapterList.vue'
import ResourceList from '../views/Course/ResourceList.vue'
import MyCorrect from '../views/Exam/MyCorrect.vue'
import StudentList from '../views/Exam/StudentList.vue'
import AnswerDetails from '../views/Exam/AnswerDetails.vue'
import DictList from '../views/System/DictList.vue'
import MenuList from '../views/System/MenuList.vue'

Vue.use(VueRouter)

// 修复NavigationDuplicated错误
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') throw err
  })
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: Layout,
    redirect: '/user-management',
    children: [
      {
        path: 'user-management',
        name: 'UserManagement',
        component: UserManagement,
        meta: { title: '用户管理' }
      },
      {
        path: 'class-management',
        name: 'ClassManagement',
        component: ClassManagement,
        meta: { title: '班级管理' }
      },
      {
        path: 'task/2d-annotation',
        name: 'Annotation2D',
        component: Annotation2D,
        meta: { title: '2D标注' }
      },
      {
        path: 'task/3d-annotation',
        name: 'Annotation3D',
        component: Annotation3D,
        meta: { title: '3D标注' }
      },
      {
        path: 'task/audio-annotation',
        name: 'AudioAnnotation',
        component: AudioAnnotation,
        meta: { title: '音频标注' }
      },
      {
        path: 'role-management',
        name: 'RoleManagement',
        component: RoleManagement,
        meta: { title: '角色管理' }
      },
      {
        path: 'question-type-management',
        name: 'QuestionTypeManagement',
        component: QuestionTypeManagement,
        meta: { title: '题库分类' }
      },
      {
        path: 'question-management',
        name: 'QuestionManagement',
        component: QuestionManagement,
        meta: { title: '题库管理' }
      },
      {
        path: 'label-management',
        name: 'LabelManagement',
        component: LabelManagement,
        meta: { title: '标签管理' }
      },
      {
        path: 'exam-management',
        name: 'ExamManagement',
        component: ExamManagement,
        meta: { title: '考试管理' }
      },
      {
        path: 'exam-list',
        name: 'ExamList',
        component: ExamList,
        meta: { title: '考试列表' }
      },
      {
        path: 'exam-page/:examId',
        name: 'ExamPage',
        component: ExamPage,
        meta: { title: '答题页面' }
      },
      {
        path: 'course-list',
        name: 'CourseList',
        component: CourseList,
        meta: { title: '课程管理' }
      },
      {
        path: 'chapter-list/:courseId',
        name: 'ChapterList',
        component: ChapterList,
        meta: { title: '章节信息' }
      },
      {
        path: 'resource-list/:chapterId',
        name: 'ResourceList',
        component: ResourceList,
        meta: { title: '章节资源' }
      },{
        path: 'my-correct',
        name: 'MyCorrect',
        component: MyCorrect,
        meta: { title: '我的批改' }
      },{
        path: 'student-list/:examId&:classId',
        name: 'StudentList',
        component: StudentList,
        meta: { title: '考试学生' }
      },{
        path: 'answer_details/:examPageUserId',
        name: 'AnswerDetails',
        component: AnswerDetails,
        meta: { title: '批改' }
      },{
        path: 'dict-list',
        name: 'DictList',
        component: DictList,
        meta: { title: '字典管理' }
      },{
        path: 'menu-list',
        name: 'MenuList',
        component: MenuList,
        meta: { title: '菜单管理' }
      },
    ]
  },
  {
    path: '*',
    redirect: '/login'
  }
]

const router = new VueRouter({
  mode: 'history', // 使用 history 模式移除 URL 中的 #
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否已登录
  const isAuthenticated = localStorage.getItem('token')

  // 如果未登录且不是去登录页，则重定向到登录页
  if (to.path !== '/login' && !isAuthenticated) {
    next('/login')
  }
  // 如果已登录且要去登录页，则重定向到首页
  else if (to.path === '/login' && isAuthenticated) {
    next('/user-management')
  }
  else {
    next()
  }
})

export default router
