import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import UserManagement from '../views/UserManagement.vue'
import ClassManagement from '../views/ClassManagement.vue'
import Annotation2D from '../views/Annotation2D.vue'
import Annotation3D from '../views/Annotation3D.vue'
import AudioAnnotation from '../views/AudioAnnotation.vue'

Vue.use(VueRouter)

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
      }
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